import jwt from "jsonwebtoken";

import env from "../config/env.js";
import { getUserById } from "../services/auth.service.js";
import ApiError from "../utils/apiError.js";
import { AUTH_COOKIE } from "../utils/authCookie.js";

const NOT_AUTHORISED = "Not authorised, please sign in";

/**
 * Gate for every protected route. Identity comes from the signed cookie and
 * nowhere else — never from a body, query or param — so a handler downstream
 * can treat req.user.id as fact.
 */
export default async function protect(req, _res, next) {
  const token = req.cookies?.[AUTH_COOKIE];

  if (!token) {
    throw new ApiError(401, NOT_AUTHORISED);
  }

  let payload;

  try {
    payload = jwt.verify(token, env.jwtSecret);
  } catch {
    // Expired, tampered with or signed by someone else — one answer for all
    // three, and no detail about which.
    throw new ApiError(401, "Session expired, please sign in again");
  }

  req.user = await getUserById(payload.id);
  next();
}
