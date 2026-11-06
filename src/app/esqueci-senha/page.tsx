import type { Metadata } from "next";
import Link from "next/link";
import { solicitarRecuperacao } from "@/actions/conta";
import { BotaoEnviar, Formulario } from "@/components/formulario";

export const metadata: Metadata = { title: "Recuperar senha" };

export default function EsqueciSenha() {
  return (
    <div className="tela-entrada">
      <div>
        <h1>Recuperar senha</h1>
        <p>Enviaremos um link para o e-mail cadastrado na sua conta.</p>
        <div className="vidro">
          <Formulario action={solicitarRecuperacao}>
            <div className="campo">
              <label htmlFor="identificador">Matrícula ou e-mail</label>
              <input id="identificador" name="identificador" required autoComplete="username" />
            </div>
            <BotaoEnviar enviando="Enviando…">Enviar link</BotaoEnviar>
            <div className="entrada-links">
              <Link href="/login">Voltar para entrar</Link>
            </div>
          </Formulario>
        </div>
      </div>
    </div>
  );
}
