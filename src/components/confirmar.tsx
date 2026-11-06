"use client";

import { Trash2 } from "lucide-react";
import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";

/** Botão de <form action> que pede confirmação antes de uma ação irreversível. */
export function BotaoConfirmar({
  mensagem,
  rotulo,
  children,
  className = "botao-icone botao-perigo",
}: {
  mensagem: string;
  rotulo: string;
  children?: ReactNode;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className={className}
      disabled={pending}
      aria-label={rotulo}
      title={rotulo}
      onClick={(e) => {
        if (!window.confirm(mensagem)) e.preventDefault();
      }}
    >
      {children ?? <Trash2 size={16} aria-hidden="true" />}
    </button>
  );
}
