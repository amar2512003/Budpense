import { createHash, randomBytes } from "node:crypto";

import bcrypt from "bcryptjs";

import env from "../config/env.js";
import User, { BCRYPT_COST } from "../models/User.js";
import ApiError from "../utils/apiError.js";

// One message for both failure branches, so a caller cannot tell a registered
// email from an unregistered one.
const INVALID_CREDENTIALS = "Incorrect email or password";

// Short enough that a link left in a console or a browser history is not a
// standing key to the account.
const RESET_TOKEN_TTL_MS = 15 * 60 * 1000;

// One condition, one message, wherever it is detected.
export const SESSION_INVALID = "Session is no longer valid, please sign in again";

// Nobody can supply the plaintext behind this hash. Comparing against it when
// the email is unknown keeps that path on the same bcrypt cost as a wrong
// password, so response time doesn't answer the question the message refuses to.
const ABSENT_USER_HASH = bcrypt.hashSync(randomBytes(32).toString("hex"), BCRYPT_COST);

// A reset token is 256 bits of randomness, so a single SHA-256 is enough to
// make the stored value useless to a reader of the database. bcrypt's cost
// exists to slow down guessing, and there is nothing here worth guessing at.
function hashResetToken(rawToken) {
  return createHash("sha256").update(rawToken).digest("hex");
}

/** The only shape of a user that leaves the server: no password, no internals. */
export function toPublicUser(user) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    currency: user.currency,
    createdAt: user.createdAt,
  };
}

export async function registerUser({ name, email, password }) {
  const existing = await User.exists({ email });

  if (existing) {
    throw new ApiError(409, "An account with this email already exists");
  }

  // Two simultaneous registrations can both pass the check above; the unique
  // index is what actually decides it, and error.middleware answers 409.
  const user = await User.create({ name, email, password });

  return toPublicUser(user);
}

export async function loginUser({ email, password }) {
  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    await bcrypt.compare(password, ABSENT_USER_HASH);
    throw new ApiError(401, INVALID_CREDENTIALS);
  }

  if (!(await user.matchPassword(password))) {
    throw new ApiError(401, INVALID_CREDENTIALS);
  }

  return toPublicUser(user);
}

/**
 * Resolves the session's user. Read on every protected request rather than
 * trusted from the token, so a deleted account stops working immediately
 * instead of at the end of its seven days.
 */
export async function getUserById(id) {
  const user = await User.findById(id);

  if (!user) {
    throw new ApiError(401, SESSION_INVALID);
  }

  return toPublicUser(user);
}

/**
 * Issues a reset link for an address, if it belongs to an account. Says nothing
 * about whether it did: the caller answers identically either way, which is the
 * whole reason this returns nothing.
 */
export async function requestPasswordReset(email) {
  const user = await User.findOne({ email });

  if (!user) return;

  const rawToken = randomBytes(32).toString("hex");

  user.resetToken = hashResetToken(rawToken);
  user.resetTokenExp = new Date(Date.now() + RESET_TOKEN_TTL_MS);
  // The password is untouched, so the pre-save hook returns early and the
  // stored hash is left exactly as it was.
  await user.save();

  // There is no mail service in this project: the link goes to the server
  // console. It is written here rather than returned, so no handler upstream
  // can put the raw token in a response by accident.
  console.log(`Password reset link for ${user.email}: ${env.clientUrl}/reset-password/${rawToken}`);
}

/**
 * Consumes a reset link. The token is matched by its hash and its expiry in one
 * query, so an expired link is as unusable as a forged one, and the same
 * message covers both — neither tells the caller which it was.
 */
export async function resetPassword({ token, password }) {
  const user = await User.findOne({
    resetToken: hashResetToken(token),
    resetTokenExp: { $gt: new Date() },
  }).select("+resetToken +resetTokenExp");

  if (!user) {
    throw new ApiError(400, "This password reset link is invalid or has expired");
  }

  user.password = password;
  // Cleared in the same save, so a link works exactly once.
  user.resetToken = undefined;
  user.resetTokenExp = undefined;
  await user.save();
}
