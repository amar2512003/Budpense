// Errors the client is allowed to see. Anything else becomes a generic 500.
class ApiError extends Error {
  constructor(statusCode, message, errors = null) {
    super(message);

    this.statusCode = statusCode;
    this.errors = errors;

    Error.captureStackTrace(this, this.constructor);
  }
}

export default ApiError;
