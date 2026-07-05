import express from "express";
import { createServer } from "http";
import { WebSocketServer } from "ws";

const app = express();
const PORT = process.env.PORT || 4003;

app.get("/health", (_req, res) => {
  res.json({ service: "ws-gateway", status: "ok", uptime: process.uptime() });
});

const server = createServer(app);
const wss = new WebSocketServer({ server, path: "/ws" });

// Sprint 4 will replace this echo behavior with real dashboard update pushes,
// and Sprint 6 will make this gateway stateless by moving fan-out through Redis pub/sub.
wss.on("connection", (socket) => {
  socket.send(JSON.stringify({ type: "welcome", message: "ws-gateway skeleton connected" }));
  socket.on("message", (data) => {
    socket.send(data.toString());
  });
});

server.listen(PORT, () => {
  console.log(`[ws-gateway] listening on port ${PORT} (HTTP + WS on /ws)`);
});
