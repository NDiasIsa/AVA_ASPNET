"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useRef } from "react";
import { Tex } from "./tex";

type Destaque = { id: number; titulo: string; corTitulo: string; temImagem: boolean };

/** Destaques em faixa com rolagem; sem troca automática para não competir com a leitura. */
export function Destaques({ itens }: { itens: Destaque[] }) {
  const faixa = useRef<HTMLDivElement>(null);
  const mover = (direcao: number) => {
    const el = faixa.current;
    el?.scrollBy({ left: direcao * el.clientWidth, behavior: "smooth" });
  };

  return (
    <div className="destaques">
      <div className="destaques-faixa" ref={faixa} tabIndex={0} aria-label="Notícias em destaque" role="region">
        {itens.map((n) => (
          <Link key={n.id} href={`/noticias/${n.id}`} className="destaque">
            {n.temImagem && <img src={`/api/arquivos/noticia-capa/${n.id}`} alt="" />}
            <span className="destaque-titulo" style={{ color: n.corTitulo }}>
              <Tex texto={n.titulo} />
            </span>
          </Link>
        ))}
      </div>
      {itens.length > 1 && (
        <div className="destaques-controles">
          <button type="button" className="botao-icone" onClick={() => mover(-1)} aria-label="Destaque anterior">
            <ChevronLeft size={18} aria-hidden="true" />
          </button>
          <button type="button" className="botao-icone" onClick={() => mover(1)} aria-label="Próximo destaque">
            <ChevronRight size={18} aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  );
}
