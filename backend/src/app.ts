import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import mongoose from "mongoose";
import { env } from "./config/env.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import authRoutes from "./modules/auth/auth.routes.js";
import studentRoutes from "./modules/students/student.routes.js";
import teacherRoutes from "./modules/teachers/teacher.routes.js";
import feeRoutes from "./modules/fees/fee.routes.js";

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: env.corsOrigins,
      credentials: true,
    })
  );
  // Photos arrive as data URLs, so the default 100kb body cap is too small.
  app.use(express.json({ limit: "5mb" }));
  app.use(morgan(env.isProduction ? "combined" : "dev"));

  /** Liveness + database state, for uptime checks and deploy smoke tests. */
  app.get("/health", (_req, res) => {
    const states: Record<number, string> = {
      0: "disconnected",
      1: "connected",
      2: "connecting",
      3: "disconnecting",
    };
    res.json({
      status: "ok",
      database: states[mongoose.connection.readyState] ?? "unknown",
      environment: env.NODE_ENV,
    });
  });

  app.use("/api/auth", authRoutes);
  app.use("/api/students", studentRoutes);
  app.use("/api/teachers", teacherRoutes);
  app.use("/api/fees", feeRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
