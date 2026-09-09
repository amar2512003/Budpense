/**
 * Error carrying the status and message the client should see.
 *
 * Anything thrown that is not an ApiError is treated as unexpected by
 * error.middleware and answered with a generic 500, so use this whenever the
 * message is safe to show a user.
 */
export default class ApiError extends Error {
  constructor(status, message, errors) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    if (errors) this.errors = errors;
    Error.captureStackTrace?.(this, ApiError);
  }
}
