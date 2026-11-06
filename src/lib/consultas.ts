import "server-only";
import { and, asc, eq, ne } from "drizzle-orm";
import { db, t } from "./db";

/** Turmas e seções para onde o usuário pode copiar conteúdo. */
export function destinosDeCopia(turmaAtual: number, usuario: { id: number; tipo: string }) {
  return db.query.turmas.findMany({
    where:
      usuario.tipo === "Admin"
        ? ne(t.turmas.id, turmaAtual)
        : and(eq(t.turmas.professorId, usuario.id), ne(t.turmas.id, turmaAtual)),
    with: { secoes: { orderBy: asc(t.secoes.ordem) } },
    orderBy: [asc(t.turmas.ano), asc(t.turmas.codigo)],
  });
}
