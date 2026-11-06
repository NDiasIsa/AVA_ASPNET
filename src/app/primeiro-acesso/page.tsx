import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { concluirPrimeiroAcesso } from "@/actions/conta";
import { BotaoEnviar, Formulario } from "@/components/formulario";
import { db, t } from "@/lib/db";
import { nomeTurma } from "@/lib/formatos";
import { obterUsuario } from "@/lib/sessao";

export const metadata: Metadata = { title: "Primeiro acesso" };

export default async function PrimeiroAcesso() {
  const usuario = await obterUsuario();
  if (!usuario) redirect("/login");
  if (!usuario.primeiroAcesso) redirect("/");

  const turma = usuario.turmaId ? await db.query.turmas.findFirst({ where: eq(t.turmas.id, usuario.turmaId) }) : null;
  const aluno = usuario.tipo === "Aluno";

  return (
    <div className="tela-entrada" style={{ maxWidth: "32rem" }}>
      <div>
        <h1>Bem-vindo(a), {usuario.nomeCompleto}</h1>
        <p>Este é seu primeiro acesso. Defina uma senha para continuar.</p>
        <div className="vidro">
          <Formulario action={concluirPrimeiroAcesso}>
            {aluno && (
              <div className="grade-2">
                <div>
                  <span className="rotulo">Matrícula</span>
                  <p>{usuario.matricula}</p>
                </div>
                <div>
                  <span className="rotulo">Sua turma</span>
                  <p>{turma ? nomeTurma(turma) : "Sem turma"}</p>
                </div>
              </div>
            )}
            <div className="campo">
              <label htmlFor="emailPessoal">E-mail pessoal{aluno ? "" : " (opcional)"}</label>
              <input id="emailPessoal" name="emailPessoal" type="email" required={aluno} autoComplete="email" placeholder="seu@email.com" />
              <p className="ajuda">Usado para recuperar sua senha.</p>
            </div>
            <div className="campo">
              <label htmlFor="senha">Nova senha</label>
              <input id="senha" name="senha" type="password" required minLength={8} autoComplete="new-password" />
              <p className="ajuda">Mínimo de 8 caracteres, com maiúscula, minúscula, número e caractere especial.</p>
            </div>
            <div className="campo">
              <label htmlFor="confirmarSenha">Confirmar senha</label>
              <input id="confirmarSenha" name="confirmarSenha" type="password" required autoComplete="new-password" />
            </div>
            <BotaoEnviar>Salvar senha e continuar</BotaoEnviar>
          </Formulario>
        </div>
      </div>
    </div>
  );
}
