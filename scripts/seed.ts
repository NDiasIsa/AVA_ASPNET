import { drizzle } from "drizzle-orm/node-postgres";
import { eq } from "drizzle-orm";
import { Pool } from "pg";
import * as schema from "../src/lib/db/schema";
import { gerarHash, validarPoliticaSenha } from "../src/lib/senha";

const connectionString = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const senha = process.env.ADMIN_SENHA;
if (!connectionString) throw new Error("Configure DATABASE_URL em .env.local.");
if (!email || !senha) throw new Error("Configure ADMIN_EMAIL e ADMIN_SENHA em .env.local.");
const erroSenha = validarPoliticaSenha(senha);
if (erroSenha) throw new Error(`ADMIN_SENHA inválida: ${erroSenha}`);

const pool = new Pool({ connectionString, max: 1 });
const db = drizzle(pool, { schema });

const existente = await db.query.usuarios.findFirst({ where: eq(schema.usuarios.login, email) });
if (!existente) {
  await db.insert(schema.usuarios).values({
    login: email,
    email,
    senhaHash: await gerarHash(senha),
    tipo: "Admin",
    nomeCompleto: "Administrador",
    primeiroAcesso: false,
  });
  console.log("Administrador criado.");
} else {
  console.log("Administrador já existe; nada alterado.");
}

if (!(await db.query.anosLetivos.findFirst())) {
  await db.insert(schema.anosLetivos).values({ ano: new Date().getFullYear(), ativo: true });
  console.log("Ano letivo inicial criado.");
}

await pool.end();
