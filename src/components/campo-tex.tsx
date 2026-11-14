"use client";

import { useId, useRef, useState } from "react";
import { Tex } from "./tex";

const ATALHOS = [
  { rotulo: "Fórmula", antes: "$", depois: "$", titulo: "Fórmula na linha" },
  { rotulo: "Bloco", antes: "$$", depois: "$$", titulo: "Fórmula em destaque" },
  { rotulo: "a/b", antes: "$\\frac{", depois: "}{b}$", titulo: "Fração" },
  { rotulo: "x²", antes: "$x^{", depois: "}$", titulo: "Potência" },
  { rotulo: "√", antes: "$\\sqrt{", depois: "}$", titulo: "Raiz" },
  { rotulo: "Vetor", antes: "$\\vec{", depois: "}$", titulo: "Vetor" },
  { rotulo: "∫", antes: "$\\int_{a}^{b} ", depois: "\\,dx$", titulo: "Integral" },
  { rotulo: "Δ", antes: "$\\Delta ", depois: "$", titulo: "Delta" },
];

const temFormula = (texto: string) => /[$]|\\\(|\\\[/.test(texto);

/** Área de texto com atalhos de LaTeX e pré-visualização enquanto a pessoa digita. */
export function CampoTex({
  nome,
  rotulo,
  valorInicial = "",
  linhas = 4,
  placeholder,
  obrigatorio,
  aoMudar,
  ajuda,
}: {
  nome?: string;
  rotulo: string;
  valorInicial?: string;
  linhas?: number;
  placeholder?: string;
  obrigatorio?: boolean;
  aoMudar?: (valor: string) => void;
  ajuda?: string;
}) {
  const id = useId();
  const [valor, setValor] = useState(valorInicial);
  const ref = useRef<HTMLTextAreaElement>(null);

  const atualizar = (novo: string) => {
    setValor(novo);
    aoMudar?.(novo);
  };

  const inserir = (antes: string, depois: string) => {
    const area = ref.current;
    if (!area) return;
    const { selectionStart: inicio, selectionEnd: fim } = area;
    const selecionado = valor.slice(inicio, fim);
    atualizar(valor.slice(0, inicio) + antes + selecionado + depois + valor.slice(fim));
    requestAnimationFrame(() => {
      area.focus();
      const cursor = inicio + antes.length + selecionado.length;
      area.setSelectionRange(cursor, cursor);
    });
  };

  return (
    <div className="campo">
      <label htmlFor={id}>{rotulo}</label>
      <div className="tex-barra" role="toolbar" aria-label={`Inserir LaTeX em ${rotulo}`}>
        {ATALHOS.map((a) => (
          <button key={a.titulo} type="button" title={a.titulo} aria-label={a.titulo} onClick={() => inserir(a.antes, a.depois)}>
            {a.rotulo}
          </button>
        ))}
      </div>
      <textarea
        id={id}
        ref={ref}
        name={nome}
        rows={linhas}
        value={valor}
        required={obrigatorio}
        placeholder={placeholder}
        onChange={(e) => atualizar(e.target.value)}
      />
      {ajuda && <p className="ajuda">{ajuda}</p>}
      {temFormula(valor) && (
        <div className="tex-previa" aria-live="polite">
          <span className="tex-previa-rotulo">Como vai aparecer</span>
          <Tex texto={valor} />
        </div>
      )}
    </div>
  );
}

/** Campo de uma linha para títulos, com pré-visualização quando há fórmula. */
export function CampoTitulo({
  rotulo = "Título",
  valorInicial = "",
  placeholder,
  maximo = 200,
}: {
  rotulo?: string;
  valorInicial?: string;
  placeholder?: string;
  maximo?: number;
}) {
  const id = useId();
  const [valor, setValor] = useState(valorInicial);
  return (
    <div className="campo">
      <label htmlFor={id}>{rotulo}</label>
      <input
        id={id}
        name="titulo"
        required
        maxLength={maximo}
        value={valor}
        placeholder={placeholder}
        onChange={(e) => setValor(e.target.value)}
      />
      {temFormula(valor) && (
        <div className="tex-previa" aria-live="polite">
          <span className="tex-previa-rotulo">Como vai aparecer</span>
          <Tex texto={valor} />
        </div>
      )}
    </div>
  );
}
