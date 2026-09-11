import { validationResult } from "express-validator";

import ApiError from "../utils/apiError.js";

/**
 * Runs after a validator chain and turns its result into the documented
 * failure shape: { success: false, message: "Validation failed", errors }.
 * One message per field — the forms render a single error under each input.
 */
export default function validate(req, _res, next) {
  const result = validationResult(req);

  if (result.isEmpty()) return next();

  const errors = Object.fromEntries(
    result.array({ onlyFirstError: true }).map((error) => [error.path, error.msg]),
  );

  next(new ApiError(400, "Validation failed", errors));
}
