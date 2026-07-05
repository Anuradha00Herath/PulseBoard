import { pool } from "../db.js";

export async function createApiKey({ name, keyHash, keyPrefix }) {
  const { rows } = await pool.query(
    `INSERT INTO api_keys (name, key_prefix, key_hash)
     VALUES ($1, $2, $3)
     RETURNING id, name, key_prefix, created_at, revoked_at`,
    [name, keyPrefix, keyHash]
  );
  return rows[0];
}

export async function listApiKeys() {
  const { rows } = await pool.query(
    `SELECT id, name, key_prefix, created_at, revoked_at
     FROM api_keys ORDER BY created_at DESC`
  );
  return rows;
}

export async function findApiKeyById(id) {
  const { rows } = await pool.query(
    `SELECT id, name, key_prefix, key_hash, created_at, revoked_at FROM api_keys WHERE id = $1`,
    [id]
  );
  return rows[0] ?? null;
}

export async function findApiKeyByHash(hash) {
  const { rows } = await pool.query(
    `SELECT id, name FROM api_keys WHERE key_hash = $1 AND revoked_at IS NULL`,
    [hash]
  );
  return rows[0] ?? null;
}

export async function revokeApiKey(id) {
  const { rows } = await pool.query(
    `UPDATE api_keys SET revoked_at = now() WHERE id = $1 AND revoked_at IS NULL
     RETURNING id, name, key_prefix, created_at, revoked_at`,
    [id]
  );
  return rows[0] ?? null;
}
