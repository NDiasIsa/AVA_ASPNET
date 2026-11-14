"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";

/** Avisa que há notícias abaixo da abertura e some quando a pessoa começa a rolar. */
export function AvisoRolagem({ alvo, rotulo }: { alvo: string; rotulo: string }) {
  const [oculto, setOculto] = useState(false);

  useEffect(() => {
    const atualizar = () => setOculto(window.scrollY > 120);
    atualizar();
    window.addEventListener("scroll", atualizar, { passive: true });
    return () => window.removeEventListener("scroll", atualizar);
  }, []);

  return (
    <a href={`#${alvo}`} className="aviso-rolagem" data-oculto={oculto || undefined} tabIndex={oculto ? -1 : undefined}>
      <span>{rotulo}</span>
      <ChevronDown size={22} aria-hidden="true" />
    </a>
  );
}
