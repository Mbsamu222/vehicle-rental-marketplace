import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import cookieParser from "cookie-parser";
import { env } from "./config/env";
import routes from "./routes";
import { apiLimiter } from "./middleware/rateLimit";
import { notFoundHandler, errorHandler } from "./middleware/errorHandler";

export function createApp() {
  const app = express();

  app.set("trust proxy", 1);

  app.use(helmet());
  app.use(
    cors({
      origin: env.corsOrigin.split(",").map((origin) => origin.trim()),
      credentials: true,
    }),
  );
  app.use(compression());
  app.use(express.json({ limit: "2mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(morgan(env.isProduction ? "combined" : "dev"));
  app.use("/api", apiLimiter);

  app.get("/health", (_req, res) => {
    res.json({ success: true, status: "ok", timestamp: new Date().toISOString() });
  });

  app.use("/api/v1", routes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
