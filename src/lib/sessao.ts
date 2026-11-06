import "server-only";
import { eq } from "drizzle-orm";
import { jwtVerify, SignJWT } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { db, t } from "./db";
import type { TipoUsuario } from "./db/schema";

const COOKIE = "qp_sessao";
const HORAS_8 = 8 * 60 * 60;
const DIAS_30 = 30 * 24 * 60 * 60;

function chave() {
  const segredo = process.env.AUTH_SECRET;
  if (!segredo || segredo.length < 32) throw new Error("AUTH_SECRET precisa ter pelo menos 32 caracteres.");
  return new TextEncoder().encode(segredo);
}

export async function iniciarSessao(usuario: { id: number; sessaoVersao: number }, lembrar: boolean) {
  const duracao = lembrar ? DIAS_30 : HORAS_8;
  const token = await new SignJWT({ v: usuario.sessaoVersao })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(usuario.id))
    .setIssuedAt()
    .setExpirationTime(`${duracao}s`)
    .sign(chave());

  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    ...(lembrar ? { maxAge: duracao } : {}),
  });
}

export async function encerrarSessao() {
  (await cookies()).delete(COOKIE);
}

/** Usuário logado na requisição atual, ou null. Conta inativa perde a sessão. */
export const obterUsuario = cache(async () => {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, chave(), { algorithms: ["HS256"] });
    const usuario = await db.query.usuarios.findFirst({ where: eq(t.usuarios.id, Number(payload.sub)) });
    if (!usuario || !usuario.ativo || usuario.sessaoVersao !== payload.v) return null;
    return usuario;
  } catch {
    return null;
  }
});

export type Usuario = NonNullable<Awaited<ReturnType<typeof obterUsuario>>>;

/** Exige login e, opcionalmente, um dos perfis informados. */
export async function exigirUsuario(...tipos: TipoUsuario[]): Promise<Usuario> {
  const usuario = await obterUsuario();
  if (!usuario) redirect("/login");
  if (usuario.primeiroAcesso) redirect("/primeiro-acesso");
  if (tipos.length > 0 && !tipos.includes(usuario.tipo)) redirect("/acesso-negado");
  return usuario;
}

export const ehEquipe = (u: Pick<Usuario, "tipo">) => u.tipo === "Admin" || u.tipo === "Professor";

export type TurmaDono = { id: number; professorId: number };

export const podeGerir = (u: Usuario, turma: TurmaDono) =>
  u.tipo === "Admin" || (u.tipo === "Professor" && turma.professorId === u.id);

export const podeVer = (u: Usuario, turma: TurmaDono) =>
  podeGerir(u, turma) || (u.tipo === "Aluno" && u.turmaId === turma.id);

/** Admin ou professor responsável pela turma. */
export async function exigirGestao(turmaId: number) {
  const usuario = await exigirUsuario("Admin", "Professor");
  const turma = await db.query.turmas.findFirst({ where: eq(t.turmas.id, turmaId) });
  if (!turma) redirect("/acesso-negado");
  if (!podeGerir(usuario, turma)) redirect("/acesso-negado");
  return { usuario, turma };
}
