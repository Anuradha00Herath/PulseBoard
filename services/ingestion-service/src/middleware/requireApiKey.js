import { hashApiKey, apiKeyCacheKey } from "../auth/apiKey.js";
import { redis } from "../redis.js";

async function verifyViaAuthService(hash) {
  const authServiceUrl = process.env.AUTH_SERVICE_URL || "http://localhost:4001";
  const response = await fetch(`${authServiceUrl}/internal/api-keys/verify`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Internal-Secret": process.env.INTERNAL_API_SECRET,
    },
    body: JSON.stringify({ hash }),
  });

  if (!response.ok) {
    throw new Error(`auth-service verify responded with ${response.status}`);
  }

  return response.json();
}

export async function requireApiKey(req, res, next) {
  const rawKey = req.headers["x-api-key"];
  if (typeof rawKey !== "string" || rawKey.length === 0) {
    return res.status(401).json({ errors: ["Missing X-API-Key header."] });
  }

  const hash = hashApiKey(rawKey);
  const cacheKey = apiKeyCacheKey(hash);

  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      const { keyId, name } = JSON.parse(cached);
      req.apiKey = { keyId, name };
      return next();
    }

    // Cold-start fallback: Redis has no entry (fresh deploy or cache flush).
    // Fall back to auth-service's source of truth instead of silently
    // accepting the request — see docs/sprint2-design.md #1.
    const result = await verifyViaAuthService(hash);
    if (!result.valid) {
      return res.status(401).json({ errors: ["Invalid API key."] });
    }

    await redis.set(
      cacheKey,
      JSON.stringify({ valid: true, keyId: result.keyId, name: result.name })
    );
    req.apiKey = { keyId: result.keyId, name: result.name };
    next();
  } catch (err) {
    console.error("[ingestion-service] API key verification failed:", err);
    res.status(401).json({ errors: ["Invalid API key."] });
  }
}
