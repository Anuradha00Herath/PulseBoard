import Redis from "ioredis";

// lazyConnect: importing this module (e.g. transitively in tests) must not
// open a socket — the connection is established on first command instead.
export const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
  lazyConnect: true,
});
