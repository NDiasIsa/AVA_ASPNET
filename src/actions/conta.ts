"use server";

import { and, eq, gt, sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db, t } from "@/lib/db";
import { enviarEmail } from "@/lib/email";
import { flash } from "@/lib/flash";
import { conferirSenha, gerarHash, validarPoliticaSenha } from "@/lib/senha";
import { encerrarSessao, iniciarSessao, obterUsuario } from "@/lib/sessao";
import { criarLinkSenha, hashToken, VALIDADE_RECUPERACAO_MS } from "@/lib/token-senha";
import { emailValido, type EstadoForm, marcado, texto } from "./util";

const CREDENCIAIS_INVALIDAS = "Matrícula, e-mail ou senha incorretos.";
const AVISO_RECUPERACAO = "Se encontrarmos sua conta, enviaremos um e-mail com instruções.";

export async function entrar(_: EstadoForm, fd: FormData): Promise<EstadoForm> {
  const login = texto(fd, "identificador").toLowerCase();
  const senha = String(fd.get("senha") ?? "");
  if (!login || !senha) return { erro: "Informe sua matrícula ou e-mail e a senha." };

  const usuario = await db.query.usuarios.findFirst({ where: eq(t.usuarios.login, login) });
  if (!usuario || !(await conferirSenha(senha, usuario.senhaHash))) return { erro: CREDENCIAIS_INVALIDAS };
  if (!usuario.ativo) return { erro: "Sua conta está inativa. Fale com o administrador." };

  await iniciarSessao(usuario, marcado(fd, "lembrar"));
  redirect(usuario.primeiroAcesso ? "/primeiro-acesso" : "/");
}

export async function sair() {
  await encerrarSessao();
  redirect("/login");
}

export async function concluirPrimeiroAcesso(_: EstadoForm, fd: FormData): Promise<EstadoForm> {
  const usuario = await obterUsuario();
  if (!usuario) redirect("/login");

  const senha = String(fd.get("senha") ?? "");
  const emailPessoal = texto(fd, "emailPessoal").toLowerCase() || null;

  if (usuario.tipo === "Aluno" && !emailPessoal) return { erro: "Informe um e-mail pessoal para recuperar sua senha." };
  if (emailPessoal && !emailValido(emailPessoal)) return { erro: "O e-mail pessoal não parece válido." };
  if (senha !== fd.get("confirmarSenha")) return { erro: "As senhas não coincidem." };
  const erroSenha = validarPoliticaSenha(senha);
  if (erroSenha) return { erro: erroSenha };
  if (await conferirSenha(senha, usuario.senhaHash)) return { erro: "Escolha uma senha diferente da senha temporária." };

  const novaVersao = usuario.sessaoVersao + 1;
  await db
    .update(t.usuarios)
    .set({ senhaHash: await gerarHash(senha), primeiroAcesso: false, emailPessoal, sessaoVersao: novaVersao })
    .where(eq(t.usuarios.id, usuario.id));

  await iniciarSessao({ id: usuario.id, sessaoVersao: novaVersao }, false);
  await flash("sucesso", `Bem-vindo(a), ${usuario.nomeCompleto}!`);
  redirect("/");
}

export async function solicitarRecuperacao(_: EstadoForm, fd: FormData): Promise<EstadoForm> {
  const identificador = texto(fd, "identificador").toLowerCase();
  if (!identificador) return { erro: "Digite sua matrícula ou e-mail." };

  const usuario = await db.query.usuarios.findFirst({ where: eq(t.usuarios.login, identificador) });
  const destino = usuario?.emailPessoal ?? usuario?.email;

  if (usuario && destino) {
    const link = await criarLinkSenha(usuario.id, VALIDADE_RECUPERACAO_MS);
    await enviarEmail(
      destino,
      "Redefinição de senha: QuantumPinheiral",
      `<p>Recebemos um pedido para redefinir sua senha no QuantumPinheiral.</p>
       <p><a href="${link}">Redefinir minha senha</a></p>
       <p>Se não foi você, ignore este e-mail. O link expira em 24 horas.</p>`,
    );
  }

  await flash("sucesso", AVISO_RECUPERACAO);
  redirect("/login");
}

export async function redefinirSenha(_: EstadoForm, fd: FormData): Promise<EstadoForm> {
  const token = texto(fd, "token");
  const senha = String(fd.get("senha") ?? "");
  if (senha !== fd.get("confirmarSenha")) return { erro: "As senhas não coincidem." };
  const erroSenha = validarPoliticaSenha(senha);
  if (erroSenha) return { erro: erroSenha };

  const registro = await db.query.tokensSenha.findFirst({
    where: and(eq(t.tokensSenha.tokenHash, hashToken(token)), gt(t.tokensSenha.expiraEm, new Date())),
  });
  if (!registro) {
    await flash("erro", "Este link é inválido ou expirou. Peça um novo.");
    redirect("/esqueci-senha");
  }

  await db
    .update(t.usuarios)
    .set({
      senhaHash: await gerarHash(senha),
      primeiroAcesso: false,
      sessaoVersao: sql`${t.usuarios.sessaoVersao} + 1`,
    })
    .where(eq(t.usuarios.id, registro.usuarioId));
  await db.delete(t.tokensSenha).where(eq(t.tokensSenha.usuarioId, registro.usuarioId));

  await flash("sucesso", "Senha salva. Entre com ela agora.");
  redirect("/login");
}
