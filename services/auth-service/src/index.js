import express from "express";
import { runMigrations } from "./db.js";
import { authRouter } from "./routes/auth.js";
import { dashboardsRouter } from "./routes/dashboards.js";
import { apiKeysRouter } from "./routes/apiKeys.js";
import { internalRouter } from "./routes/internal.js";
import { requireAuth } from "./middleware/requireAuth.js";

const app = express();
const PORT = process.env.PORT || 4001;

app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ service: "auth-service", status: "ok", uptime: process.uptime() });
});

// Mounted first and path-scoped: dashboardsRouter/apiKeysRouter apply their
// JWT requireAuth at the router level (matches every path that reaches them,
// not just their own routes), so /internal/* must be dispatched to
// internalRouter before it can ever reach those routers.
app.use("/internal", internalRouter);

app.use(authRouter);
app.use(dashboardsRouter);
app.use(apiKeysRouter);

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
  if (!process.env.INTERNAL_API_SECRET) {
    console.error("[auth-service] INTERNAL_API_SECRET is not set. Refusing to start.");
    process.exit(1);
  }

  await runMigrations();

  app.listen(PORT, () => {
    console.log(`[auth-service] listening on port ${PORT}`);
  });
}

start();
