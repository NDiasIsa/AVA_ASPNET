import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { caminhoPertenceAo, type Pasta, pastasPermitidas, TAMANHO_MAXIMO } from "@/lib/arquivos/regras";
import { obterUsuario } from "@/lib/sessao";

/** Autoriza o envio direto do navegador para o Vercel Blob, contornando o limite de 4,5 MB das funções. */
export async function POST(request: Request) {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const resposta = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (caminho) => {
        const usuario = await obterUsuario();
        if (!usuario || usuario.primeiroAcesso) throw new Error("Entre na sua conta para enviar arquivos.");

        const pasta = caminho.split("/")[0] as Pasta;
        if (!pastasPermitidas(usuario.tipo).includes(pasta) || !caminhoPertenceAo(caminho, pasta, usuario.id)) {
          throw new Error("Você não pode enviar arquivos para este local.");
        }
        return { maximumSizeInBytes: TAMANHO_MAXIMO, addRandomSuffix: false };
      },
    });
    return NextResponse.json(resposta);
  } catch (erro) {
    return NextResponse.json({ error: (erro as Error).message }, { status: 400 });
  }
}
