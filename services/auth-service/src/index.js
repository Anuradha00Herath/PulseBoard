import express from "express";
import { runMigrations } from "./db.js";
import { authRouter } from "./routes/auth.js";
import { dashboardsRouter } from "./routes/dashboards.js";
import { requireAuth } from "./middleware/requireAuth.js";

const app = express();
const PORT = process.env.PORT || 4001;

app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ service: "auth-service", status: "ok", uptime: process.uptime() });
});

app.use(authRouter);
app.use(dashboardsRouter);

app.get("/me", requireAuth, (req, res) => {
  res.json({ user: req.user });
});

app.use((err, _req, res, _next) => {
  console.error("[auth-service] unhandled error:", err);
  res.status(500).json({ errors: ["Internal server error."] });
});

async function start() {
  if (!process.env.JWT_SECRET) {
    console.error("[auth-service] JWT_SECRET is not set. Refusing to start.");
    process.exit(1);
  }

  await runMigrations();

  app.listen(PORT, () => {
    console.log(`[auth-service] listening on port ${PORT}`);
  });
}

start();
