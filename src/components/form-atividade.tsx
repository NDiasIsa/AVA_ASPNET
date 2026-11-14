"use client";

import Link from "next/link";
import { useState } from "react";
import { criarAtividade } from "@/actions/turma";
import { CampoArquivo } from "./campo-arquivo";
import { CampoTex, CampoTitulo } from "./campo-tex";
import { EditorQuestoes } from "./editor-questoes";
import { BotaoEnviar, Formulario } from "./formulario";

export function FormAtividade({
  secaoId,
  turmaId,
  usuarioId,
  prazoPadrao,
}: {
  secaoId: number;
  turmaId: number;
  usuarioId: number;
  prazoPadrao: string;
}) {
  const [tipo, setTipo] = useState<"Entrega" | "Avaliativa">("Entrega");

  return (
    <div className="vidro">
      <Formulario action={criarAtividade}>
        <input type="hidden" name="secaoId" value={secaoId} />
        <CampoTitulo placeholder="Título da atividade" />
        <div className="campo">
          <label htmlFor="tipo">Tipo de atividade</label>
          <select id="tipo" name="tipo" value={tipo} onChange={(e) => setTipo(e.target.value as typeof tipo)}>
            <option value="Entrega">Entrega de arquivo ou texto</option>
            <option value="Avaliativa">Questões de alternativas</option>
          </select>
        </div>
        <CampoTex nome="descricao" rotulo="Descrição ou enunciado" linhas={4} placeholder="Calcule $\vec{F} = m\vec{a}$ para..." />
        {tipo === "Entrega" && (
          <CampoArquivo nome="arquivo" rotulo="Anexo (opcional)" pasta="atividades" usuarioId={usuarioId} ajuda="PDF, imagem etc., até 50 MB." />
        )}
        <div className="grade-2">
          <div className="campo">
            <label htmlFor="prazo">Prazo de entrega</label>
            <input id="prazo" name="prazo" type="datetime-local" defaultValue={prazoPadrao} />
          </div>
          <div className="campo">
            <label htmlFor="valorMaximo">Valor máximo</label>
            <input id="valorMaximo" name="valorMaximo" type="number" min="0" max="10" step="0.5" defaultValue="10" required />
          </div>
        </div>
        {tipo === "Avaliativa" && <EditorQuestoes pasta="atividades" usuarioId={usuarioId} />}
        <div className="acoes">
          <BotaoEnviar enviando="Publicando…">Publicar atividade</BotaoEnviar>
          <Link href={`/turmas/${turmaId}#conteudo`} className="botao botao-secundario">
            Cancelar
          </Link>
        </div>
      </Formulario>
    </div>
  );
}
