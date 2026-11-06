import { existsSync } from "node:fs";
import { connect } from "node:net";
import path from "node:path";

/**
 * PostgreSQL só para desenvolvimento, com os dados em .data/postgres.
 * Deixe este comando rodando em um terminal enquanto usa o site.
 */
const PORTA = 54329;

const portaOcupada = () =>
  new Promise<boolean>((resolve) => {
    const socket = connect(PORTA, "127.0.0.1");
    socket.once("connect", () => {
      socket.destroy();
      resolve(true);
    });
    socket.once("error", () => resolve(false));
  });

// Fechar a janela pode deixar o banco rodando; nesse caso, basta continuar usando.
if (await portaOcupada()) {
  console.log(`O banco local já está ligado na porta ${PORTA}. Pode rodar npm run dev.`);
  process.exit(0);
}

// Importado só aqui: a biblioteca imprime um aviso ao sair, que confundiria a mensagem acima.
const { default: EmbeddedPostgres } = await import("embedded-postgres");

const databaseDir = path.join(process.cwd(), ".data", "postgres");
const novo = !existsSync(path.join(databaseDir, "PG_VERSION"));

const pg = new EmbeddedPostgres({
  databaseDir,
  user: "local",
  password: "local",
  port: PORTA,
  persistent: true,
});

if (novo) await pg.initialise();
await pg.start();
if (novo) await pg.createDatabase("quantum");

console.log(`Banco local pronto na porta ${PORTA}. Deixe este terminal aberto; Ctrl+C encerra.`);

const encerrar = async () => {
  await pg.stop();
  process.exit(0);
};
process.on("SIGINT", encerrar);
process.on("SIGTERM", encerrar);
