import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { entrar } from "@/actions/conta";
import { BotaoEnviar, Formulario } from "@/components/formulario";
import { obterUsuario } from "@/lib/sessao";

export const metadata: Metadata = { title: "Entrar" };

export default async function Login() {
  if (await obterUsuario()) redirect("/");

  return (
    <div className="tela-entrada">
      <div>
        <h1>Entrar</h1>
        <p>Alunos usam a matrícula. Professores usam o e-mail.</p>
        <div className="vidro">
          <Formulario action={entrar}>
            <div className="campo">
              <label htmlFor="identificador">Matrícula ou e-mail</label>
              <input id="identificador" name="identificador" required autoComplete="username" autoFocus />
            </div>
            <div className="campo">
              <label htmlFor="senha">Senha</label>
              <input id="senha" name="senha" type="password" required autoComplete="current-password" />
            </div>
            <label className="marcacao">
              <input type="checkbox" name="lembrar" /> Continuar conectado
            </label>
            <BotaoEnviar enviando="Entrando…">Entrar</BotaoEnviar>
            <div className="entrada-links">
              <Link href="/esqueci-senha">Esqueci minha senha</Link>
            </div>
          </Formulario>
        </div>
      </div>
    </div>
  );
}
