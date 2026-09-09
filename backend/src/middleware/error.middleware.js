import mongoose from "mongoose";

import env from "../config/env.js";
import ApiError from "../utils/apiError.js";

const DUPLICATE_KEY = 11000;

// Registered last: Express only reaches it if nothing has already responded.
// The four-argument signature is what marks it as error-handling middleware.
// eslint-disable-next-line no-unused-vars
export default function errorMiddleware(err, req, res, next) {
  let status = 500;
  let message = "Something went wrong";
  let errors;

  if (err instanceof ApiError) {
    status = err.status;
    message = err.message;
    errors = err.errors;
  } else if (err instanceof mongoose.Error.ValidationError) {
    status = 400;
    message = "Validation failed";
    errors = Object.fromEntries(
      Object.values(err.errors).map((field) => [field.path, field.message]),
    );
  } else if (err instanceof mongoose.Error.CastError) {
    status = 400;
    message = `Invalid value for ${err.path}`;
  } else if (err?.code === DUPLICATE_KEY) {
    status = 409;
    message = "That record already exists";
  } else if (err?.type === "entity.parse.failed") {
    // express.json() rejecting a malformed body is the client's mistake, not ours.
    status = 400;
    message = "Malformed JSON body";
  } else if (err?.type === "entity.too.large") {
    status = 413;
    message = "Request body is too large";
  }

  if (env.isProduction) {
    // No stack in production logs; an unexpected 500 still needs a trace of itself.
    if (status === 500) console.error(`[500] ${req.method} ${req.originalUrl} — ${err?.message}`);
  } else {
    console.error(err);
  }

  const body = { success: false, message };
  if (errors) body.errors = errors;

  res.status(status).json(body);
}
