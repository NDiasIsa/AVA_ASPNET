import "katex/dist/katex.min.css";
import "./globals.css";
import { LogIn, LogOut, Menu } from "lucide-react";
import type { Metadata } from "next";
import { Atkinson_Hyperlegible_Next, Bricolage_Grotesque } from "next/font/google";
import Link from "next/link";
import type { ReactNode } from "react";
import { sair } from "@/actions/conta";
import { Flash } from "@/components/flash";
import { Marca } from "@/components/marca";
import { ehEquipe, obterUsuario } from "@/lib/sessao";

const corpo = Atkinson_Hyperlegible_Next({ subsets: ["latin"], variable: "--fonte-corpo", display: "swap", adjustFontFallback: false });
const titulo = Bricolage_Grotesque({ subsets: ["latin"], variable: "--fonte-titulo", display: "swap" });

export const metadata: Metadata = {
  title: { default: "QuantumPinheiral", template: "%s | QuantumPinheiral" },
  description: "Ambiente virtual de aprendizagem do IFRJ, Campus Pinheiral.",
};

async function Navegacao() {
  const usuario = await obterUsuario();
  const liberado = usuario && !usuario.primeiroAcesso;

  const links = (
    <>
      <Link href="/">Início</Link>
      {liberado && ehEquipe(usuario) && <Link href="/turmas">Turmas</Link>}
      {liberado && usuario.tipo === "Aluno" && <Link href="/minha-turma">Minha turma</Link>}
      {liberado && usuario.tipo === "Admin" && <Link href="/admin">Administração</Link>}
    </>
  );

  const conta = usuario ? (
    <form action={sair} className="nav-conta">
      <span className="nav-nome">{usuario.nomeCompleto}</span>
      <button type="submit" className="botao-icone" aria-label="Sair" title="Sair">
        <LogOut size={16} aria-hidden="true" />
      </button>
    </form>
  ) : (
    <Link href="/login" className="botao botao-secundario botao-pequeno">
      <LogIn size={15} aria-hidden="true" /> Entrar
    </Link>
  );

  return (
    <nav className="nav" aria-label="Principal">
      <Marca />
      <div className="nav-links nav-desktop">{links}</div>
      <div className="nav-desktop">{conta}</div>
      <details className="nav-movel">
        <summary aria-label="Abrir menu">
          <Menu size={22} aria-hidden="true" />
        </summary>
        <div className="nav-gaveta">
          <div className="nav-links">{links}</div>
          {conta}
        </div>
      </details>
    </nav>
  );
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" className={`${corpo.variable} ${titulo.variable}`}>
      <body>
        <Navegacao />
        <Flash />
        <main>{children}</main>
        <footer className="rodape">©IFRJ, Campus Pinheiral, {new Date().getFullYear()}</footer>
      </body>
    </html>
  );
}
