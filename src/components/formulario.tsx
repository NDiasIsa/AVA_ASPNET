"use client";

import { TriangleAlert } from "lucide-react";
import { createContext, type ReactNode, startTransition, useActionState, useContext, useRef } from "react";
import type { EstadoForm } from "@/actions/util";

const Enviando = createContext(false);

export function MensagemErro({ erro }: { erro?: string }) {
  if (!erro) return null;
  return (
    <div className="aviso aviso-erro" role="alert">
      <TriangleAlert size={18} aria-hidden="true" />
      <span>{erro}</span>
    </div>
  );
}

/**
 * Formulário ligado a uma ação do servidor que devolve erros. O envio é manual porque
 * o React limpa os campos após uma action de <form>, o que apagaria o que a pessoa digitou.
 */
export function Formulario({
  action,
  children,
  className,
}: {
  action: (estado: EstadoForm, dados: FormData) => Promise<EstadoForm>;
  children: ReactNode;
  className?: string;
}) {
  const [estado, despachar, pendente] = useActionState(action, undefined);
  const ref = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={ref}
      className={className}
      onSubmit={(e) => {
        e.preventDefault();
        const dados = new FormData(e.currentTarget);
        startTransition(() => despachar(dados));
      }}
    >
      <Enviando.Provider value={pendente}>
        <MensagemErro erro={estado?.erro} />
        {children}
      </Enviando.Provider>
    </form>
  );
}

export function BotaoEnviar({
  children,
  enviando = "Salvando…",
  className = "botao botao-principal",
}: {
  children: ReactNode;
  enviando?: string;
  className?: string;
}) {
  const pendente = useContext(Enviando);
  return (
    <button type="submit" className={className} disabled={pendente}>
      {pendente ? enviando : children}
    </button>
  );
}
