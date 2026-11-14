import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";

// O Neon recomenda rodar migrations pela conexão direta, sem o pooler.
const connectionString = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
if (!connectionString) throw new Error("Configure DATABASE_URL em .env.local.");

const pool = new Pool({ connectionString, max: 1 });
await migrate(drizzle(pool), { migrationsFolder: "./drizzle" });
await pool.end();
console.log("Migrations aplicadas.");
