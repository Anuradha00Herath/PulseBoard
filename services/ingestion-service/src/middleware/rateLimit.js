import { redis } from "../redis.js";

// FR20 acceptance criterion is exactly "429 above 100 req/sec from a single API
// key" — a per-second fixed-window counter in Redis satisfies that directly and
// is far simpler than a true refilling token bucket, at the cost of allowing a
// short burst right at a window boundary. Good enough for this sprint; revisit
// under Sprint 9 load testing if that boundary burst matters in practice.
export const RATE_LIMIT_PER_SECOND = 100;

export async function rateLimit(req, res, next) {
  try {
    const windowSeconds = Math.floor(Date.now() / 1000);
    const redisKey = `ratelimit:${req.apiKey.keyId}:${windowSeconds}`;

    const count = await redis.incr(redisKey);
    if (count === 1) {
      await redis.expire(redisKey, 2);
    }

    if (count > RATE_LIMIT_PER_SECOND) {
      return res.status(429).json({ errors: ["Rate limit exceeded."] });
    }
    next();
  } catch (err) {
    next(err);
  }
}
