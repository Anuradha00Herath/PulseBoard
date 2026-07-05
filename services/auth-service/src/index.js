import express from "express";

const app = express();
const PORT = process.env.PORT || 4001;

app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ service: "auth-service", status: "ok", uptime: process.uptime() });
});

// Sprint 1 will add: POST /signup, POST /login, JWT issuance, role model
app.listen(PORT, () => {
  console.log(`[auth-service] listening on port ${PORT}`);
});
