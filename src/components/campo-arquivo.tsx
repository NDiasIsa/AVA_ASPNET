"use client";

import { upload } from "@vercel/blob/client";
import { CheckCircle2 } from "lucide-react";
import { useId, useRef, useState } from "react";
import { nomeSeguro, type Pasta, TAMANHO_MAXIMO } from "@/lib/arquivos/regras";

export type Enviado = { caminho: string; nome: string };

async function enviar(arquivo: File, caminho: string, aoProgredir: (p: number) => void): Promise<string> {
  if (process.env.NEXT_PUBLIC_UPLOAD_LOCAL === "1") {
    const r = await fetch(`/api/upload/local?caminho=${encodeURIComponent(caminho)}`, { method: "POST", body: arquivo });
    if (!r.ok) throw new Error(await r.text());
    return caminho;
  }
  const blob = await upload(caminho, arquivo, {
    access: "private",
    handleUploadUrl: "/api/upload",
    multipart: arquivo.size > 5 * 1024 * 1024,
    onUploadProgress: ({ percentage }) => aoProgredir(percentage),
  });
  return blob.pathname;
}

/**
 * Envia o arquivo direto do navegador para o armazenamento assim que é escolhido, porque
 * as funções da Vercel não aceitam requisições acima de 4,5 MB. O formulário recebe só o caminho.
 */
export function CampoArquivo({
  nome,
  rotulo,
  pasta,
  usuarioId,
  somenteImagem,
  ajuda,
  obrigatorio,
  aoEnviar,
}: {
  nome?: string;
  rotulo: string;
  pasta: Pasta;
  usuarioId: number;
  somenteImagem?: boolean;
  ajuda?: string;
  obrigatorio?: boolean;
  aoEnviar?: (enviado: Enviado | null) => void;
}) {
  const id = useId();
  const entrada = useRef<HTMLInputElement>(null);
  const [enviado, setEnviado] = useState<Enviado | null>(null);
  const [progresso, setProgresso] = useState<number | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const aoEscolher = async (arquivo: File | undefined) => {
    setEnviado(null);
    setErro(null);
    aoEnviar?.(null);
    if (!arquivo) return;

    if (arquivo.size > TAMANHO_MAXIMO) {
      setErro("Este arquivo passa do limite de 50 MB.");
      if (entrada.current) entrada.current.value = "";
      return;
    }

    // Enquanto o envio não termina, a validação nativa impede enviar o formulário.
    entrada.current?.setCustomValidity("Aguarde o fim do envio do arquivo.");
    setProgresso(0);
    try {
      const caminho = `${pasta}/${usuarioId}/${crypto.randomUUID()}-${nomeSeguro(arquivo.name)}`;
      const final = await enviar(arquivo, caminho, setProgresso);
      const resultado = { caminho: final, nome: arquivo.name };
      setEnviado(resultado);
      aoEnviar?.(resultado);
    } catch (e) {
      setErro(e instanceof Error && e.message ? e.message : "Não foi possível enviar o arquivo.");
      if (entrada.current) entrada.current.value = "";
    } finally {
      entrada.current?.setCustomValidity("");
      setProgresso(null);
    }
  };

  return (
    <div className="campo">
      <label htmlFor={id}>{rotulo}</label>
      <input
        id={id}
        ref={entrada}
        type="file"
        required={obrigatorio}
        accept={somenteImagem ? "image/png,image/jpeg,image/gif,image/webp" : undefined}
        onChange={(e) => void aoEscolher(e.target.files?.[0])}
      />
      {nome && enviado && (
        <>
          <input type="hidden" name={`${nome}Caminho`} value={enviado.caminho} />
          <input type="hidden" name={`${nome}Nome`} value={enviado.nome} />
        </>
      )}
      {progresso !== null && (
        <p className="ajuda" role="status">
          Enviando… {Math.round(progresso)}%
        </p>
      )}
      {enviado && (
        <p className="ajuda ajuda-ok" role="status">
          <CheckCircle2 size={14} aria-hidden="true" /> Arquivo pronto para salvar.
        </p>
      )}
      {erro && (
        <p className="ajuda ajuda-erro" role="alert">
          {erro}
        </p>
      )}
      {ajuda && !erro && <p className="ajuda">{ajuda}</p>}
    </div>
  );
}
