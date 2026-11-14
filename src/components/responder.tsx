"use client";

import { Lightbulb } from "lucide-react";
import Link from "next/link";
import { startTransition, useActionState } from "react";
import { type EstadoQuiz, responderQuiz } from "@/actions/quiz";
import { type EstadoAvaliativa, responderAtividade } from "@/actions/turma";
import { MensagemErro } from "./formulario";
import { Tex } from "./tex";

export type QuestaoParaResponder = {
  id: number;
  enunciado: string;
  imagem: string | null;
  alternativas: { id: number; texto: string }[];
};

function Questoes({ questoes }: { questoes: QuestaoParaResponder[] }) {
  return (
    <>
      {questoes.map((q, i) => (
        <fieldset key={q.id} className="questao-resposta">
          <legend>
            {i + 1}. <Tex texto={q.enunciado} />
          </legend>
          {q.imagem && <img src={q.imagem} alt={`Imagem da questão ${i + 1}`} />}
          {q.alternativas.map((a) => (
            <label key={a.id} className="alternativa">
              <input type="radio" name={`q${q.id}`} value={a.id} required />
              <Tex texto={a.texto} />
            </label>
          ))}
        </fieldset>
      ))}
    </>
  );
}

const enviarSem = (despachar: (d: FormData) => void) => (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  const dados = new FormData(e.currentTarget);
  startTransition(() => despachar(dados));
};

export function ResponderAtividade({
  atividadeId,
  turmaId,
  questoes,
}: {
  atividadeId: number;
  turmaId: number;
  questoes: QuestaoParaResponder[];
}) {
  const [estado, despachar, pendente] = useActionState<EstadoAvaliativa, FormData>(responderAtividade, undefined);

  if (estado?.resultado) {
    const r = estado.resultado;
    return (
      <div className="pilha">
        <div className={`placar ${r.nota >= r.valorMaximo * 0.6 ? "placar-bom" : "placar-baixo"}`}>
          <strong>{r.nota.toLocaleString("pt-BR")}</strong>
          <p>
            de {r.valorMaximo.toLocaleString("pt-BR")} pontos.
            <br />
            {r.acertos} de {r.total} questões corretas.
          </p>
        </div>
        {r.questoes.map((q) => (
          <div key={q.id} className={`gabarito ${q.acertou ? "gabarito-certo" : ""}`}>
            <strong>
              <Tex texto={q.enunciado} />
            </strong>
            <span>
              Sua resposta: <Tex texto={q.escolhida} />
            </span>
            {!q.acertou && (
              <span className="gabarito-correta">
                Correta: <Tex texto={q.correta} />
              </span>
            )}
          </div>
        ))}
        <div>
          <Link href={`/turmas/${turmaId}#conteudo`} className="botao botao-secundario">
            Voltar à turma
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form className="pilha" onSubmit={enviarSem(despachar)}>
      <input type="hidden" name="atividadeId" value={atividadeId} />
      <MensagemErro erro={estado?.erro} />
      <Questoes questoes={questoes} />
      <div className="acoes">
        <button type="submit" className="botao botao-principal" disabled={pendente}>
          {pendente ? "Enviando…" : "Enviar respostas"}
        </button>
        <Link href={`/turmas/${turmaId}#conteudo`} className="botao botao-secundario">
          Cancelar
        </Link>
      </div>
      <p className="ajuda">Você só pode responder esta atividade uma vez.</p>
    </form>
  );
}

export function ResponderQuiz({
  quizId,
  turmaId,
  questoes,
}: {
  quizId: number;
  turmaId: number;
  questoes: QuestaoParaResponder[];
}) {
  const [estado, despachar, pendente] = useActionState<EstadoQuiz, FormData>(responderQuiz, undefined);

  if (estado?.resultado) {
    const r = estado.resultado;
    const bom = r.pontuacao >= 60;
    return (
      <div className="pilha">
        <div className={`placar ${bom ? "placar-bom" : "placar-baixo"}`}>
          <strong>{r.pontuacao.toLocaleString("pt-BR")}%</strong>
          <p>
            {r.acertos} de {r.total} questões corretas.
            <br />
            {bom ? "Parabéns, você foi bem!" : "Continue praticando: você pode tentar de novo."}
          </p>
        </div>
        <h2>Gabarito</h2>
        {r.questoes.map((q) => {
          const temExplicacao = q.tipoExplicacao === "Texto" ? Boolean(q.explicacao) : Boolean(q.midia);
          return (
            <div key={q.id} className={`gabarito ${q.acertou ? "gabarito-certo" : ""}`}>
              <strong>
                <Tex texto={q.enunciado} />
              </strong>
              <span>
                Sua resposta: <Tex texto={q.escolhida} />
              </span>
              {!q.acertou && (
                <span className="gabarito-correta">
                  Correta: <Tex texto={q.correta} />
                </span>
              )}
              {temExplicacao && (
                <details>
                  <summary>
                    <Lightbulb size={14} aria-hidden="true" style={{ verticalAlign: -2, marginRight: 4 }} />
                    Ver explicação
                  </summary>
                  {q.tipoExplicacao === "Texto" && q.explicacao && <Tex texto={q.explicacao} />}
                  {q.tipoExplicacao === "Imagem" && q.midia && <img src={q.midia} alt="Explicação da questão" style={{ maxHeight: 340 }} />}
                  {q.tipoExplicacao === "Video" && q.midia && <iframe src={q.midia} title="Vídeo com a explicação" allowFullScreen />}
                </details>
              )}
            </div>
          );
        })}
        <div className="acoes">
          <a href={`/turmas/${turmaId}/quizzes/${quizId}/responder`} className="botao botao-principal">
            Tentar de novo
          </a>
          <Link href={`/turmas/${turmaId}#quiz`} className="botao botao-secundario">
            Voltar à turma
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form className="pilha" onSubmit={enviarSem(despachar)}>
      <input type="hidden" name="quizId" value={quizId} />
      <MensagemErro erro={estado?.erro} />
      <Questoes questoes={questoes} />
      <div className="acoes">
        <button type="submit" className="botao botao-principal" disabled={pendente}>
          {pendente ? "Enviando…" : "Enviar respostas"}
        </button>
        <Link href={`/turmas/${turmaId}#quiz`} className="botao botao-secundario">
          Cancelar
        </Link>
      </div>
    </form>
  );
}
