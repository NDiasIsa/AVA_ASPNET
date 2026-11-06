"use client";

import { CheckCircle2, TriangleAlert, X } from "lucide-react";
import { useEffect, useState } from "react";

type Mensagem = { tipo: "sucesso" | "erro"; mensagem: string };

function lerCookie(): Mensagem | null {
  const par = document.cookie.split("; ").find((c) => c.startsWith("qp_flash="));
  if (!par) return null;
  document.cookie = "qp_flash=; path=/; max-age=0";
  try {
    return JSON.parse(decodeURIComponent(par.slice("qp_flash=".length)));
  } catch {
    return null;
  }
}

/**
 * Mostra a mensagem deixada por uma ação do servidor. O layout não é remontado entre
 * navegações, e o cookie pode chegar sem troca de rota, por isso a verificação periódica.
 */
export function Flash() {
  const [mensagem, setMensagem] = useState<Mensagem | null>(null);

  useEffect(() => {
    const verificar = () => {
      const nova = lerCookie();
      if (nova) setMensagem(nova);
    };
    verificar();
    const intervalo = setInterval(verificar, 400);
    return () => clearInterval(intervalo);
  }, []);

  useEffect(() => {
    if (mensagem?.tipo !== "sucesso") return;
    const prazo = setTimeout(() => setMensagem(null), 6000);
    return () => clearTimeout(prazo);
  }, [mensagem]);

  if (!mensagem) return null;
  const Icone = mensagem.tipo === "sucesso" ? CheckCircle2 : TriangleAlert;

  return (
    <div className={`flash flash-${mensagem.tipo}`} role={mensagem.tipo === "erro" ? "alert" : "status"}>
      <Icone size={18} aria-hidden="true" />
      <span>{mensagem.mensagem}</span>
      <button type="button" onClick={() => setMensagem(null)} aria-label="Fechar mensagem">
        <X size={16} />
      </button>
    </div>
  );
}
