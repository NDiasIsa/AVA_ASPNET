import { NextResponse } from "next/server";
import { salvarLocal, usaArmazenamentoLocal } from "@/lib/arquivos/armazenamento";
import { caminhoPertenceAo, type Pasta, pastasPermitidas, TAMANHO_MAXIMO } from "@/lib/arquivos/regras";
import { obterUsuario } from "@/lib/sessao";

/** Substitui o Vercel Blob em desenvolvimento. Desativado em produção. */
export async function POST(request: Request) {
  if (!usaArmazenamentoLocal()) return new NextResponse(null, { status: 404 });

  const usuario = await obterUsuario();
  if (!usuario || usuario.primeiroAcesso) return new NextResponse("Entre na sua conta para enviar arquivos.", { status: 401 });

  const caminho = new URL(request.url).searchParams.get("caminho") ?? "";
  const pasta = caminho.split("/")[0] as Pasta;
  if (!pastasPermitidas(usuario.tipo).includes(pasta) || !caminhoPertenceAo(caminho, pasta, usuario.id)) {
    return new NextResponse("Você não pode enviar arquivos para este local.", { status: 403 });
  }

  const conteudo = new Uint8Array(await request.arrayBuffer());
  if (conteudo.length > TAMANHO_MAXIMO) return new NextResponse("Arquivo grande demais.", { status: 413 });

  await salvarLocal(caminho, conteudo);
  return NextResponse.json({ pathname: caminho });
}
