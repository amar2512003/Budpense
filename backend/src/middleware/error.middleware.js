import mongoose from "mongoose";

import env from "../config/env.js";
import ApiError from "../utils/apiError.js";

// Converting Mongoose errors here is what keeps controllers free of try/catch.
const normalise = (error) => {
  if (error instanceof ApiError) {
    return error;
  }

  if (error instanceof mongoose.Error.ValidationError) {
    const errors = Object.fromEntries(
      Object.entries(error.errors).map(([field, detail]) => [
        field,
        detail.message,
      ])
    );

    return new ApiError(400, "Validation failed", errors);
  }

  if (error instanceof mongoose.Error.CastError) {
    return new ApiError(400, `Invalid value for ${error.path}`);
  }

  if (error.code === 11000) {
    const field = Object.keys(error.keyValue || {}).join(", ");

    return new ApiError(
      409,
      field ? `A record with this ${field} already exists` : "Duplicate record"
    );
  }

  return null;
};

const errorMiddleware = (error, req, res, next) => {
  const known = normalise(error);

  if (!known) {
    if (!env.isProduction) {
      console.error(error);
    }

    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }

  const body = {
    success: false,
    message: known.message,
  };

  if (known.errors) {
    body.errors = known.errors;
  }

  return res.status(known.statusCode).json(body);
};

export default errorMiddleware;
