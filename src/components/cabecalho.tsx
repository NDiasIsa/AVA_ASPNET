import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { Tex } from "./tex";

/** Título de página com link de retorno e ações. O título aceita fórmulas. */
export function Cabecalho({
  titulo,
  sub,
  voltar,
  acoes,
}: {
  titulo: string;
  sub?: ReactNode;
  voltar?: { href: string; rotulo: string };
  acoes?: ReactNode;
}) {
  return (
    <header className="cabecalho">
      {voltar && (
        <Link href={voltar.href} className="voltar">
          <ArrowLeft size={15} aria-hidden="true" /> {voltar.rotulo}
        </Link>
      )}
      <div className="cabecalho-linha">
        <div>
          <h1>
            <Tex texto={titulo} />
          </h1>
          {sub && <div className="cabecalho-sub">{sub}</div>}
        </div>
        {acoes && <div className="acoes">{acoes}</div>}
      </div>
    </header>
  );
}

export function Vazio({ children, acao }: { children: ReactNode; acao?: ReactNode }) {
  return (
    <div className="vazio">
      <p>{children}</p>
      {acao}
    </div>
  );
}
