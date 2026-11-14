"use client";

import Link from "next/link";
import { useState } from "react";
import { salvarPublicacao } from "@/actions/turma";
import { CampoArquivo } from "./campo-arquivo";
import { CampoTex, CampoTitulo } from "./campo-tex";
import { BotaoEnviar, Formulario } from "./formulario";

type Publicacao = {
  id: number;
  titulo: string;
  descricao: string | null;
  tipo: "Arquivo" | "Link";
  url: string | null;
  nomeArquivo: string | null;
};

export function FormPublicacao({
  secaoId,
  turmaId,
  usuarioId,
  publicacao,
}: {
  secaoId: number;
  turmaId: number;
  usuarioId: number;
  publicacao?: Publicacao;
}) {
  const [tipo, setTipo] = useState(publicacao?.tipo ?? "Arquivo");

  return (
    <div className="vidro">
      <Formulario action={salvarPublicacao}>
        <input type="hidden" name="secaoId" value={secaoId} />
        {publicacao && <input type="hidden" name="id" value={publicacao.id} />}
        <CampoTitulo valorInicial={publicacao?.titulo} placeholder="Título do material" />
        <CampoTex
          nome="descricao"
          rotulo="Descrição (opcional)"
          linhas={3}
          valorInicial={publicacao?.descricao ?? ""}
          placeholder="Instruções ou resumo. Fórmulas: $F = ma$"
        />
        <div className="campo">
          <label htmlFor="tipo">Tipo de material</label>
          <select id="tipo" name="tipo" value={tipo} onChange={(e) => setTipo(e.target.value as "Arquivo" | "Link")}>
            <option value="Arquivo">Arquivo</option>
            <option value="Link">Link</option>
          </select>
        </div>
        {tipo === "Arquivo" ? (
          <CampoArquivo
            nome="arquivo"
            rotulo={publicacao?.nomeArquivo ? "Trocar arquivo" : "Arquivo"}
            pasta="materiais"
            usuarioId={usuarioId}
            obrigatorio={!publicacao || publicacao.tipo !== "Arquivo"}
            ajuda={publicacao?.nomeArquivo ? `Arquivo atual: ${publicacao.nomeArquivo}` : "PDF, Word, imagem, vídeo etc., até 50 MB."}
          />
        ) : (
          <div className="campo">
            <label htmlFor="link">Link</label>
            <input
              id="link"
              name="link"
              type="url"
              required
              defaultValue={publicacao?.tipo === "Link" ? (publicacao.url ?? "") : ""}
              placeholder="https://youtube.com/..."
            />
          </div>
        )}
        <div className="acoes">
          <BotaoEnviar>{publicacao ? "Salvar material" : "Publicar material"}</BotaoEnviar>
          <Link href={`/turmas/${turmaId}#conteudo`} className="botao botao-secundario">
            Cancelar
          </Link>
        </div>
      </Formulario>
    </div>
  );
}
