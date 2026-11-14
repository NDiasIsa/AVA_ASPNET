"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";

export type Aba = { id: string; rotulo: string; contagem?: number; conteudo: ReactNode };

/** Abas com o endereço (#mural, #conteudo...) para sobreviver a recargas e redirecionamentos. */
export function Abas({ abas, extra }: { abas: Aba[]; extra?: ReactNode }) {
  const [ativa, setAtiva] = useState(abas[0].id);
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});

  useEffect(() => {
    const sincronizar = () => {
      const hash = window.location.hash.slice(1);
      if (abas.some((a) => a.id === hash)) setAtiva(hash);
    };
    sincronizar();
    window.addEventListener("hashchange", sincronizar);
    return () => window.removeEventListener("hashchange", sincronizar);
  }, [abas]);

  const selecionar = (id: string, focar = false) => {
    setAtiva(id);
    window.history.replaceState(null, "", `#${id}`);
    if (focar) refs.current[id]?.focus();
  };

  return (
    <>
      <div className="abas">
        <div
          role="tablist"
          aria-label="Áreas da turma"
          className="abas-lista"
          onKeyDown={(e) => {
            if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
            const i = abas.findIndex((a) => a.id === ativa);
            const passo = e.key === "ArrowRight" ? 1 : -1;
            selecionar(abas[(i + passo + abas.length) % abas.length].id, true);
          }}
        >
          {abas.map((a) => (
            <button
              key={a.id}
              ref={(el) => {
                refs.current[a.id] = el;
              }}
              type="button"
              role="tab"
              id={`aba-${a.id}`}
              aria-selected={a.id === ativa}
              aria-controls={`painel-${a.id}`}
              tabIndex={a.id === ativa ? 0 : -1}
              onClick={() => selecionar(a.id)}
            >
              {a.rotulo}
              {a.contagem !== undefined && <span className="abas-contagem">{a.contagem}</span>}
            </button>
          ))}
          {extra}
        </div>
      </div>
      {abas.map((a) => (
        <div key={a.id} role="tabpanel" id={`painel-${a.id}`} aria-labelledby={`aba-${a.id}`} hidden={a.id !== ativa}>
          {a.conteudo}
        </div>
      ))}
    </>
  );
}
