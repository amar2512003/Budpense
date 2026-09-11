import * as authService from "../services/auth.service.js";
import { clearAuthCookie, setAuthCookie } from "../utils/authCookie.js";
import generateToken from "../utils/generateToken.js";

// Express 5 forwards a rejected promise to error.middleware on its own, so
// these read straight through with no try/catch and no wrapper.

export async function register(req, res) {
  const { name, email, password } = req.body;
  const user = await authService.registerUser({ name, email, password });

  setAuthCookie(res, generateToken(user.id));
  res.status(201).json({ success: true, data: { user } });
}

export async function login(req, res) {
  const { email, password } = req.body;
  const user = await authService.loginUser({ email, password });

  setAuthCookie(res, generateToken(user.id));
  res.json({ success: true, data: { user } });
}

export function logout(_req, res) {
  clearAuthCookie(res);
  res.json({ success: true, data: { message: "Logged out" } });
}

// Answers "is this session still valid"; protect has already loaded the user.
export function me(req, res) {
  res.json({ success: true, data: { user: req.user } });
}
