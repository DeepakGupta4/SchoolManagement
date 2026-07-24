import type { ErrorRequestHandler, RequestHandler } from "express";
import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { env } from "../config/env.js";

export const notFoundHandler: RequestHandler = (req, _res, next) => {
  next(ApiError.notFound(`Route ${req.method} ${req.originalUrl} does not exist.`));
};

/**
 * Single place every error funnels through, so no route has to remember to
 * shape its own response. Known errors keep their message; anything else is
 * logged server-side and reported as a generic 500.
 */
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ApiError) {
    res.status(err.status).json({ error: err.message, details: err.details });
    return;
  }

  // Duplicate key on a unique index — surface which field clashed.
  if (
    err instanceof mongoose.mongo.MongoServerError &&
    err.code === 11000 &&
    err.keyValue
  ) {
    const field = Object.keys(err.keyValue)[0] ?? "value";
    const value = String(Object.values(err.keyValue)[0] ?? "");
    res.status(409).json({ error: `${field} "${value}" is already in use.` });
    return;
  }

  if (err instanceof mongoose.Error.ValidationError) {
    res.status(400).json({
      error: "Validation failed.",
      details: Object.values(err.errors).map((e) => ({ path: e.path, message: e.message })),
    });
    return;
  }

  if (err instanceof mongoose.Error.CastError) {
    res.status(400).json({ error: `Invalid ${err.path}: "${String(err.value)}".` });
    return;
  }

  console.error("Unhandled error:", err);
  res.status(500).json({
    error: "Something went wrong.",
    // Stacks are useful locally and dangerous in production.
    ...(env.isProduction ? {} : { debug: err instanceof Error ? err.message : String(err) }),
  });
};
