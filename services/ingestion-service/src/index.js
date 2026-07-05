import express from "express";
import { eventsRouter } from "./routes/events.js";
import { ensureTopic, connectProducer } from "./kafka.js";

const app = express();
const PORT = process.env.PORT || 4002;

app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ service: "ingestion-service", status: "ok", uptime: process.uptime() });
});

app.use(eventsRouter);

app.use((err, _req, res, _next) => {
  console.error("[ingestion-service] unhandled error:", err);
  res.status(500).json({ errors: ["Internal server error."] });
});

async function start() {
  if (!process.env.INTERNAL_API_SECRET) {
    console.error("[ingestion-service] INTERNAL_API_SECRET is not set. Refusing to start.");
    process.exit(1);
  }

  await ensureTopic();
  await connectProducer();

  app.listen(PORT, () => {
    console.log(`[ingestion-service] listening on port ${PORT}`);
  });
}

start();
