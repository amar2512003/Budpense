import jwt from "jsonwebtoken";

import env from "../config/env.js";

/**
 * Signs the session token. The payload carries the user id and nothing else —
 * a JWT is signed, not encrypted, so anything put in it is readable by anyone
 * holding the cookie, and anything cached in it goes stale the moment the
 * record changes.
 */
export default function generateToken(userId) {
  return jwt.sign({ id: String(userId) }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });
}
