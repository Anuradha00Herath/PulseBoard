// aggregation-service — background worker, no HTTP port.
// Sprint 0: heartbeat only, proves the container boots and can see its env config.
// Sprint 3 will add: Kafka consumer group, idempotent event processing,
//                     windowed aggregation, writes to Timescale + Redis.

console.log("[aggregation-service] starting up (Sprint 0 skeleton)");
console.log(`[aggregation-service] KAFKA_BROKER=${process.env.KAFKA_BROKER}`);
console.log(`[aggregation-service] DATABASE_URL=${process.env.DATABASE_URL ? "set" : "unset"}`);
console.log(`[aggregation-service] REDIS_URL=${process.env.REDIS_URL}`);

setInterval(() => {
  console.log(`[aggregation-service] heartbeat — uptime ${Math.round(process.uptime())}s`);
}, 15000);
