import { and, eq, gt } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { redefinirSenha } from "@/actions/conta";
import { BotaoEnviar, Formulario } from "@/components/formulario";
import { db, t } from "@/lib/db";
import { hashToken } from "@/lib/token-senha";

export const metadata: Metadata = { title: "Definir senha" };

export default async function RedefinirSenha({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  if (!token) redirect("/esqueci-senha");

  const registro = await db.query.tokensSenha.findFirst({
    where: and(eq(t.tokensSenha.tokenHash, hashToken(token)), gt(t.tokensSenha.expiraEm, new Date())),
  });
  const usuario = registro
    ? await db.query.usuarios.findFirst({ where: eq(t.usuarios.id, registro.usuarioId) })
    : null;

  if (!usuario) {
    return (
      <div className="tela-entrada">
        <div>
          <h1>Link expirado</h1>
          <p>Este link não vale mais. Peça um novo para definir sua senha.</p>
          <Link href="/esqueci-senha" className="botao botao-principal">
            Pedir um novo link
          </Link>
        </div>
      </div>
    );
  }

  const convite = usuario.tipo === "Professor" && usuario.primeiroAcesso;

  return (
    <div className="tela-entrada">
      <div>
        <h1>{convite ? `Bem-vindo(a), ${usuario.nomeCompleto}` : "Redefinir senha"}</h1>
        <p>
          {convite && (
            <>
              Crie a senha que você vai usar com o e-mail <strong>{usuario.login}</strong>.{" "}
            </>
          )}
          Mínimo de 8 caracteres, com maiúscula, minúscula, número e caractere especial.
        </p>
        <div className="vidro">
          <Formulario action={redefinirSenha}>
            <input type="hidden" name="token" value={token} />
            <div className="campo">
              <label htmlFor="senha">{convite ? "Senha" : "Nova senha"}</label>
              <input id="senha" name="senha" type="password" required minLength={8} autoComplete="new-password" />
            </div>
            <div className="campo">
              <label htmlFor="confirmarSenha">Confirmar senha</label>
              <input id="confirmarSenha" name="confirmarSenha" type="password" required autoComplete="new-password" />
            </div>
            <BotaoEnviar>{convite ? "Criar senha" : "Salvar nova senha"}</BotaoEnviar>
          </Formulario>
        </div>
      </div>
    </div>
  );
}
