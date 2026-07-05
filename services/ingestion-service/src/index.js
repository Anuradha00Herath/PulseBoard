import express from "express";

const app = express();
const PORT = process.env.PORT || 4002;

app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ service: "ingestion-service", status: "ok", uptime: process.uptime() });
});

// Sprint 2 will add: POST /events -> validate -> publish to Kafka topic "events"
// Sprint 2 will also add: rate limiting per API key (FR20)
app.listen(PORT, () => {
  console.log(`[ingestion-service] listening on port ${PORT}`);
});
