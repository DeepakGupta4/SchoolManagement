/**
 * An error that is safe to show the client, carrying the status to send.
 *
 * Anything thrown that is NOT an ApiError is treated as unexpected by the
 * error handler and reported as a generic 500 — internal messages and stack
 * traces must never reach the client.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }

  static badRequest(message: string, details?: unknown) {
    return new ApiError(400, message, details);
  }
  static unauthorized(message = "Authentication required.") {
    return new ApiError(401, message);
  }
  static forbidden(message = "You do not have permission to do that.") {
    return new ApiError(403, message);
  }
  static notFound(message = "Not found.") {
    return new ApiError(404, message);
  }
  static conflict(message: string) {
    return new ApiError(409, message);
  }
}
