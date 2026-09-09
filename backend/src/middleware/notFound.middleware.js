import ApiError from "../utils/apiError.js";

export default function notFoundMiddleware(req, _res, next) {
  next(new ApiError(404, `Route ${req.method} ${req.originalUrl} not found`));
}
