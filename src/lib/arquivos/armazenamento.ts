import "server-only";
import { mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { del, get } from "@vercel/blob";
import { assinaturaValida, caminhoPertenceAo, type Pasta } from "./regras";
import type { Usuario } from "../sessao";

/**
 * Em produção os arquivos ficam no Vercel Blob privado. Sem BLOB_READ_WRITE_TOKEN, e fora de
 * produção, usa a pasta .data/uploads para permitir desenvolver sem uma conta na Vercel.
 */
const PASTA_LOCAL = path.join(process.cwd(), ".data", "uploads");

export const usaArmazenamentoLocal = () =>
  process.env.NODE_ENV !== "production" && !process.env.BLOB_READ_WRITE_TOKEN && !process.env.BLOB_STORE_ID;

function caminhoLocal(caminho: string) {
  const completo = path.resolve(PASTA_LOCAL, caminho);
  if (!completo.startsWith(PASTA_LOCAL + path.sep)) throw new Error("Caminho inválido.");
  return completo;
}

export async function salvarLocal(caminho: string, conteudo: Uint8Array) {
  const destino = caminhoLocal(caminho);
  await mkdir(path.dirname(destino), { recursive: true });
  await writeFile(destino, conteudo);
}

export type Leitura = { corpo: ReadableStream<Uint8Array> | Uint8Array; etag?: string } | { naoModificado: true; etag: string } | null;

export async function lerArquivo(caminho: string, ifNoneMatch?: string): Promise<Leitura> {
  if (usaArmazenamentoLocal()) {
    try {
      await stat(caminhoLocal(caminho));
      return { corpo: new Uint8Array(await readFile(caminhoLocal(caminho))) };
    } catch {
      return null;
    }
  }
  const r = await get(caminho, { access: "private", ifNoneMatch });
  if (!r) return null;
  if (r.statusCode === 304) return { naoModificado: true, etag: r.blob.etag };
  return { corpo: r.stream, etag: r.blob.etag };
}

export async function removerArquivo(caminho: string | null | undefined) {
  if (!caminho) return;
  try {
    if (usaArmazenamentoLocal()) await rm(caminhoLocal(caminho), { force: true });
    else await del(caminho);
  } catch (erro) {
    // Um arquivo órfão não deve impedir a exclusão do registro.
    console.error("Falha ao remover arquivo", caminho, erro);
  }
}

async function lerInicio(caminho: string): Promise<Uint8Array | null> {
  const r = await lerArquivo(caminho);
  if (!r || "naoModificado" in r) return null;
  if (r.corpo instanceof Uint8Array) return r.corpo.slice(0, 16);
  const leitor = r.corpo.getReader();
  const { value } = await leitor.read();
  await leitor.cancel();
  return value ?? new Uint8Array();
}

export type ArquivoEnviado = { caminho: string; nome: string };

/**
 * Lê do formulário um arquivo enviado pelo CampoArquivo e valida posse e conteúdo.
 * O navegador envia direto ao armazenamento, então esta é a primeira vez que o servidor vê o arquivo.
 * Retorna null se o campo estava vazio; lança ErroArquivo se o arquivo não puder ser aceito.
 */
export async function receberArquivo(
  formulario: FormData,
  campo: string,
  pasta: Pasta,
  usuario: Usuario,
  opcoes: { somenteImagem?: boolean } = {},
): Promise<ArquivoEnviado | null> {
  const caminho = String(formulario.get(`${campo}Caminho`) ?? "");
  const nome = String(formulario.get(`${campo}Nome`) ?? "");
  return validarEnvio(caminho, nome, pasta, usuario, opcoes);
}

export async function validarEnvio(
  caminho: string,
  nome: string,
  pasta: Pasta,
  usuario: Usuario,
  opcoes: { somenteImagem?: boolean } = {},
): Promise<ArquivoEnviado | null> {
  if (!caminho) return null;
  if (!caminhoPertenceAo(caminho, pasta, usuario.id)) throw new ErroArquivo("Arquivo inválido. Envie novamente.");
  const inicio = await lerInicio(caminho);
  if (!inicio) throw new ErroArquivo("O arquivo enviado não foi encontrado. Envie novamente.");
  if (!assinaturaValida(nome, inicio, opcoes.somenteImagem)) {
    await removerArquivo(caminho);
    throw new ErroArquivo(
      opcoes.somenteImagem
        ? `"${nome}" não é uma imagem válida. Use PNG, JPG, GIF ou WebP.`
        : `"${nome}" está corrompido ou não corresponde à extensão.`,
    );
  }
  return { caminho, nome: nome || "arquivo" };
}

export class ErroArquivo extends Error {}
