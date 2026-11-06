import { existsSync } from "node:fs";
import path from "node:path";
import EmbeddedPostgres from "embedded-postgres";

/**
 * PostgreSQL só para desenvolvimento, com os dados em .data/postgres.
 * Deixe este comando rodando em um terminal enquanto usa o site.
 */
const databaseDir = path.join(process.cwd(), ".data", "postgres");
const novo = !existsSync(path.join(databaseDir, "PG_VERSION"));

const pg = new EmbeddedPostgres({
  databaseDir,
  user: "local",
  password: "local",
  port: 54329,
  persistent: true,
});

if (novo) await pg.initialise();
await pg.start();
if (novo) await pg.createDatabase("quantum");

console.log("Banco local pronto na porta 54329. Deixe este terminal aberto; Ctrl+C encerra.");

const encerrar = async () => {
  await pg.stop();
  process.exit(0);
};
process.on("SIGINT", encerrar);
process.on("SIGTERM", encerrar);
