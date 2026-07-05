import pg from "pg";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const { Pool } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function runMigrations() {
  const schema = readFileSync(path.join(__dirname, "db", "schema.sql"), "utf8");
  await pool.query(schema);
}
