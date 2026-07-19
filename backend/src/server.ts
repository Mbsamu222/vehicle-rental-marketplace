import http from "node:http";
import { Server as SocketIOServer } from "socket.io";
import jwt from "jsonwebtoken";
import { createApp } from "./app";
import { env } from "./config/env";
import { prisma } from "./config/prisma";

const app = createApp();
const httpServer = http.createServer(app);

export const io = new SocketIOServer(httpServer, {
  cors: { origin: env.corsOrigin.split(",").map((o) => o.trim()), credentials: true },
});

// Clients authenticate the socket with the same JWT access token used for REST calls,
// then join a per-user room so booking/notification events can be pushed to them directly.
io.use((socket, next) => {
  const token = socket.handshake.auth?.token as string | undefined;
  if (!token) return next(new Error("Authentication required"));
  try {
    const payload = jwt.verify(token, env.jwt.accessSecret) as { sub: string };
    socket.data.userId = payload.sub;
    return next();
  } catch {
    return next(new Error("Invalid or expired token"));
  }
});

io.on("connection", (socket) => {
  socket.join(`user:${socket.data.userId}`);
});

httpServer.listen(env.port, () => {
  // eslint-disable-next-line no-console
  console.log(`API server listening on port ${env.port} [${env.nodeEnv}]`);
});

async function shutdown() {
  // eslint-disable-next-line no-console
  console.log("Shutting down gracefully...");
  await prisma.$disconnect();
  httpServer.close(() => process.exit(0));
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
