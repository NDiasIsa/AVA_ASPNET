import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { db, t } from "@/lib/db";

export const VALIDADE_RECUPERACAO_MS = 24 * 60 * 60 * 1000;
export const VALIDADE_CONVITE_MS = 15 * 24 * 60 * 60 * 1000;

export const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

/**
 * Cria um link para o usuário definir a senha, substituindo qualquer link anterior dele.
 * Só o hash fica no banco; o token aparece apenas no link enviado por e-mail.
 */
export async function criarLinkSenha(usuarioId: number, validadeMs: number): Promise<string> {
  const token = randomBytes(32).toString("base64url");
  await db.delete(t.tokensSenha).where(eq(t.tokensSenha.usuarioId, usuarioId));
  await db.insert(t.tokensSenha).values({
    tokenHash: hashToken(token),
    usuarioId,
    expiraEm: new Date(Date.now() + validadeMs),
  });

  const h = await headers();
  const origem = `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host")}`;
  return `${origem}/redefinir-senha?token=${token}`;
}

/** Hash de uma senha aleatória que ninguém conhece: a conta só entra depois de definir a senha pelo link. */
export const senhaInutilizavel = () => randomBytes(32).toString("base64url");
