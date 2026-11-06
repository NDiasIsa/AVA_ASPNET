import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { redefinirSenha } from "@/actions/conta";
import { BotaoEnviar, Formulario } from "@/components/formulario";

export const metadata: Metadata = { title: "Redefinir senha" };

export default async function RedefinirSenha({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  if (!token) redirect("/esqueci-senha");

  return (
    <div className="tela-entrada">
      <div>
        <h1>Redefinir senha</h1>
        <p>Mínimo de 8 caracteres, com maiúscula, minúscula, número e caractere especial.</p>
        <div className="vidro">
          <Formulario action={redefinirSenha}>
            <input type="hidden" name="token" value={token} />
            <div className="campo">
              <label htmlFor="senha">Nova senha</label>
              <input id="senha" name="senha" type="password" required minLength={8} autoComplete="new-password" />
            </div>
            <div className="campo">
              <label htmlFor="confirmarSenha">Confirmar nova senha</label>
              <input id="confirmarSenha" name="confirmarSenha" type="password" required autoComplete="new-password" />
            </div>
            <BotaoEnviar>Salvar nova senha</BotaoEnviar>
          </Formulario>
        </div>
      </div>
    </div>
  );
}
