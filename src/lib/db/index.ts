import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

function criarDb() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL não configurada.");
  // Em serverless cada instância atende uma requisição por vez, e o pooler do Neon
  // multiplexa as conexões: um pool pequeno por instância é suficiente.
  return drizzle(new Pool({ connectionString, max: 3, idleTimeoutMillis: 10_000 }), { schema });
}

type Db = ReturnType<typeof criarDb>;

const global_ = globalThis as unknown as { __db?: Db };

/** Inicialização preguiçosa: o build da Vercel não precisa acessar o banco. */
export const db = new Proxy({} as Db, {
  get(_alvo, prop) {
    global_.__db ??= criarDb();
    const valor = Reflect.get(global_.__db, prop);
    return typeof valor === "function" ? valor.bind(global_.__db) : valor;
  },
});

export * as t from "./schema";

/**
 * Registro ainda referenciado por outra tabela. O Postgres 18 usa 23001 para RESTRICT;
 * versões anteriores usam 23503, então os dois são aceitos.
 */
export function ehErroEmUso(erro: unknown): boolean {
  let atual = erro as { code?: string; cause?: unknown } | undefined;
  while (atual) {
    if (atual.code === "23503" || atual.code === "23001") return true;
    atual = atual.cause as typeof atual;
  }
  return false;
}
