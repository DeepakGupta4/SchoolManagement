import type { RequestHandler } from "express";
import type { ZodType } from "zod";
import { ApiError } from "../utils/ApiError.js";

type Source = "body" | "query" | "params";

/**
 * Validates and REPLACES the given request part with the parsed result, so
 * handlers work with typed, coerced data instead of raw strings. Rejecting
 * here means no controller has to defend against malformed input.
 */
export function validate(schema: ZodType, source: Source = "body"): RequestHandler {
  return (req, _res, next) => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      next(
        ApiError.badRequest(
          "Validation failed.",
          result.error.issues.map((i) => ({
            path: i.path.join("."),
            message: i.message,
          }))
        )
      );
      return;
    }

    // `query` and `params` are getter-only in Express 5, so the parsed value is
    // stashed rather than assigned back over the original object.
    if (source === "body") req.body = result.data;
    else res_locals(req)[source] = result.data;

    next();
  };
}

/** Typed accessor for the per-request bag holding parsed query/params. */
function res_locals(req: { parsed?: Record<string, unknown> }): Record<string, unknown> {
  if (!req.parsed) req.parsed = {};
  return req.parsed;
}

/** Reads a validated query/params object set by `validate`. */
export function parsed<T>(req: { parsed?: Record<string, unknown> }, source: Source): T {
  return (req.parsed?.[source] ?? {}) as T;
}
