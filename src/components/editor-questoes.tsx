"use client";

import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import type { Pasta } from "@/lib/arquivos/regras";
import { CampoArquivo } from "./campo-arquivo";
import { CampoTex } from "./campo-tex";

type Questao = {
  chave: number;
  enunciado: string;
  imagemCaminho: string;
  imagemNome: string;
  alternativas: string[];
  correta: number | null;
  tipoExplicacao: "Texto" | "Imagem" | "Video";
  explicacao: string;
  explicacaoImagemCaminho: string;
  explicacaoImagemNome: string;
  explicacaoVideo: string;
};

const nova = (chave: number): Questao => ({
  chave,
  enunciado: "",
  imagemCaminho: "",
  imagemNome: "",
  alternativas: ["", "", "", ""],
  correta: null,
  tipoExplicacao: "Texto",
  explicacao: "",
  explicacaoImagemCaminho: "",
  explicacaoImagemNome: "",
  explicacaoVideo: "",
});

const LETRAS = ["A", "B", "C", "D"];

/** Monta as questões de um quiz ou atividade. O formulário recebe tudo no campo "questoes". */
export function EditorQuestoes({
  pasta,
  usuarioId,
  comExplicacao,
}: {
  pasta: Pasta;
  usuarioId: number;
  comExplicacao?: boolean;
}) {
  const [questoes, setQuestoes] = useState<Questao[]>(() => [nova(0)]);

  const alterar = (chave: number, mudanca: Partial<Questao>) =>
    setQuestoes((lista) => lista.map((q) => (q.chave === chave ? { ...q, ...mudanca } : q)));

  return (
    <fieldset className="questoes">
      <legend>Questões</legend>
      <input type="hidden" name="questoes" value={JSON.stringify(questoes)} />

      {questoes.map((q, i) => (
        <section key={q.chave} className="questao-editor" aria-label={`Questão ${i + 1}`}>
          <header>
            <h3>Questão {i + 1}</h3>
            {questoes.length > 1 && (
              <button
                type="button"
                className="botao-icone botao-perigo"
                aria-label={`Remover questão ${i + 1}`}
                title="Remover questão"
                onClick={() => setQuestoes((lista) => lista.filter((x) => x.chave !== q.chave))}
              >
                <Trash2 size={16} aria-hidden="true" />
              </button>
            )}
          </header>

          <CampoTex
            rotulo="Enunciado"
            linhas={3}
            obrigatorio
            placeholder="Um corpo de massa $m$ cai de uma altura $h$..."
            aoMudar={(enunciado) => alterar(q.chave, { enunciado })}
          />

          <CampoArquivo
            rotulo="Imagem do enunciado (opcional)"
            pasta={pasta}
            usuarioId={usuarioId}
            somenteImagem
            aoEnviar={(e) => alterar(q.chave, { imagemCaminho: e?.caminho ?? "", imagemNome: e?.nome ?? "" })}
          />

          <div className="campo" role="group" aria-label={`Alternativas da questão ${i + 1}`}>
            <span className="rotulo">Alternativas (marque a correta)</span>
            {q.alternativas.map((texto, ai) => (
              <div className="alternativa-editor" key={ai}>
                <label>
                  <input
                    type="radio"
                    name={`correta-${q.chave}`}
                    checked={q.correta === ai}
                    onChange={() => alterar(q.chave, { correta: ai })}
                    aria-label={`Alternativa ${LETRAS[ai]} é a correta`}
                  />
                  <span aria-hidden="true">{LETRAS[ai]}</span>
                </label>
                <input
                  type="text"
                  value={texto}
                  maxLength={500}
                  aria-label={`Texto da alternativa ${LETRAS[ai]}`}
                  placeholder="Aceita fórmulas: $v = 10\,m/s$"
                  onChange={(e) =>
                    alterar(q.chave, { alternativas: q.alternativas.map((a, x) => (x === ai ? e.target.value : a)) })
                  }
                />
              </div>
            ))}
          </div>

          {comExplicacao && (
            <div className="explicacao-editor">
              <div className="campo">
                <label htmlFor={`exp-${q.chave}`}>Explicação no gabarito</label>
                <select
                  id={`exp-${q.chave}`}
                  value={q.tipoExplicacao}
                  onChange={(e) => alterar(q.chave, { tipoExplicacao: e.target.value as Questao["tipoExplicacao"] })}
                >
                  <option value="Texto">Texto</option>
                  <option value="Imagem">Imagem</option>
                  <option value="Video">Vídeo do YouTube</option>
                </select>
              </div>
              {q.tipoExplicacao === "Texto" && (
                <CampoTex
                  rotulo="Texto da explicação"
                  linhas={3}
                  placeholder="Explique o raciocínio..."
                  valorInicial={q.explicacao}
                  aoMudar={(explicacao) => alterar(q.chave, { explicacao })}
                />
              )}
              {q.tipoExplicacao === "Imagem" && (
                <CampoArquivo
                  rotulo="Imagem da explicação"
                  pasta={pasta}
                  usuarioId={usuarioId}
                  somenteImagem
                  aoEnviar={(e) =>
                    alterar(q.chave, { explicacaoImagemCaminho: e?.caminho ?? "", explicacaoImagemNome: e?.nome ?? "" })
                  }
                />
              )}
              {q.tipoExplicacao === "Video" && (
                <div className="campo">
                  <label htmlFor={`video-${q.chave}`}>Link do vídeo</label>
                  <input
                    id={`video-${q.chave}`}
                    type="url"
                    value={q.explicacaoVideo}
                    placeholder="https://youtube.com/watch?v=..."
                    onChange={(e) => alterar(q.chave, { explicacaoVideo: e.target.value })}
                  />
                </div>
              )}
            </div>
          )}
        </section>
      ))}

      <button type="button" className="botao botao-secundario" onClick={() => setQuestoes((l) => [...l, nova(l.reduce((m, q) => Math.max(m, q.chave), 0) + 1)])}>
        <Plus size={16} aria-hidden="true" /> Adicionar questão
      </button>
    </fieldset>
  );
}
