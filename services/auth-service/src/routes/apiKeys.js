import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { requireAdmin } from "../middleware/requireAdmin.js";
import { generateApiKey, apiKeyCacheKey } from "../auth/apiKey.js";
import { createApiKey, listApiKeys, findApiKeyById, revokeApiKey } from "../models/apiKey.js";
import { redis } from "../redis.js";

export function validateApiKeyInput({ name } = {}) {
  const errors = [];
  const trimmedName = typeof name === "string" ? name.trim() : name;
  if (!trimmedName) {
    errors.push("name is required.");
  }
  return { errors, name: trimmedName };
}

function toPublicApiKey(apiKey) {
  return {
    id: apiKey.id,
    name: apiKey.name,
    prefix: apiKey.key_prefix,
    createdAt: apiKey.created_at,
    revokedAt: apiKey.revoked_at,
  };
}

export const apiKeysRouter = Router();

apiKeysRouter.use(requireAuth, requireAdmin);

apiKeysRouter.post("/api-keys", async (req, res, next) => {
  try {
    const { errors, name } = validateApiKeyInput(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    const { raw, hash, prefix } = generateApiKey();
    const apiKey = await createApiKey({ name, keyHash: hash, keyPrefix: prefix });

    // Write-through so ingestion-service's hot path never has to hit Postgres
    // (see docs/sprint2-design.md #1). No TTL: presence/absence in Redis IS the
    // source of truth here, not an expiring cache.
    await redis.set(
      apiKeyCacheKey(hash),
      JSON.stringify({ valid: true, name: apiKey.name, keyId: apiKey.id })
    );

    // The raw key is returned exactly once, here, and is never persisted or
    // retrievable again — only its hash and display prefix are stored.
    res.status(201).json({ apiKey: toPublicApiKey(apiKey), key: raw });
  } catch (err) {
    next(err);
  }
});

apiKeysRouter.get("/api-keys", async (req, res, next) => {
  try {
    const apiKeys = await listApiKeys();
    res.json({ apiKeys: apiKeys.map(toPublicApiKey) });
  } catch (err) {
    next(err);
  }
});

apiKeysRouter.delete("/api-keys/:id", async (req, res, next) => {
  try {
    const existing = await findApiKeyById(req.params.id);
    if (!existing) {
      return res.status(404).json({ errors: ["API key not found."] });
    }

    await revokeApiKey(req.params.id);
    // Always delete regardless of whether the DB row was already revoked, so a
    // prior crash between the DB write and this delete can't leave a revoked
    // key still resolving to valid:true in Redis.
    await redis.del(apiKeyCacheKey(existing.key_hash));
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});
