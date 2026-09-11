import env from "../config/env.js";

export const AUTH_COOKIE = "token";

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

// In production the SPA and the API sit on different sites, so the cookie only
// survives with sameSite "none" — which browsers accept only alongside secure.
// Locally :5173 and :5001 are same-site, where "lax" works and "none" would be
// dropped for want of HTTPS.
const cookieOptions = {
  httpOnly: true,
  secure: env.isProduction,
  sameSite: env.isProduction ? "none" : "lax",
  path: "/",
};

export function setAuthCookie(res, token) {
  res.cookie(AUTH_COOKIE, token, { ...cookieOptions, maxAge: SEVEN_DAYS_MS });
}

export function clearAuthCookie(res) {
  // The browser matches the removal against name, path, domain and sameSite,
  // so this must reuse the very options the cookie was set with — a mismatched
  // path or sameSite leaves the live cookie exactly where it was.
  res.clearCookie(AUTH_COOKIE, cookieOptions);
}
