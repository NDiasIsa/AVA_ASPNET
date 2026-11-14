import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Acesso negado" };

export default function AcessoNegado() {
  return (
    <div className="pagina pagina-estreita pilha">
      <h1>Você não tem acesso a esta página</h1>
      <p>Ela é restrita a outro perfil de usuário ou a outra turma.</p>
      <div>
        <Link href="/" className="botao botao-secundario">
          Voltar ao início
        </Link>
      </div>
    </div>
  );
}
