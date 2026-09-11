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

export async function forgotPassword(req, res) {
  await authService.requestPasswordReset(req.body.email);

  // The same answer whether or not the address is registered. Anything that
  // varied here would turn the endpoint into a directory of who has an account.
  res.json({
    success: true,
    data: { message: "If that account exists, a reset link has been sent" },
  });
}

export async function resetPassword(req, res) {
  await authService.resetPassword({ token: req.params.token, password: req.body.password });

  // Deliberately no cookie: resetting a password is not a sign-in, and the
  // client sends the user to the login form afterwards.
  res.json({ success: true, data: { message: "Password reset successfully" } });
}
