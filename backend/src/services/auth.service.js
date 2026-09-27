import { createHash, randomBytes, randomInt } from "node:crypto";

import bcrypt from "bcryptjs";

import User, { BCRYPT_COST } from "../models/User.js";
import ApiError from "../utils/apiError.js";
import { sendResetOtpEmail } from "../utils/mailer.js";

// One message for both failure branches, so a caller cannot tell a registered
// email from an unregistered one.
const INVALID_CREDENTIALS = "Incorrect email or password";

// Long enough to read off an inbox and type in, short enough that a code
// sitting unread in someone's mail isn't a standing key to the account.
const OTP_TTL_MS = 10 * 60 * 1000;
// Every wrong guess costs one of these; once they're gone the code is dead
// even if the ten minutes haven't passed, so a 6-digit space can't be brute
// forced within its own window.
const MAX_OTP_ATTEMPTS = 5;
const INVALID_OTP = "Invalid or expired code";

// The session issued once an OTP is verified, letting the client set a new
// password without the OTP itself being replayable. Same lifetime as the OTP
// step so the whole flow stays inside one sitting at the keyboard.
const RESET_SESSION_TTL_MS = 10 * 60 * 1000;
const INVALID_RESET_SESSION = "This reset session is invalid or has expired, please start again";

// One condition, one message, wherever it is detected.
export const SESSION_INVALID = "Session is no longer valid, please sign in again";

// Nobody can supply the plaintext behind this hash. Comparing against it when
// the email is unknown keeps that path on the same bcrypt cost as a wrong
// password, so response time doesn't answer the question the message refuses to.
const ABSENT_USER_HASH = bcrypt.hashSync(randomBytes(32).toString("hex"), BCRYPT_COST);

// Shared by the OTP and the reset-session token. The reset token is 256 bits
// of randomness, so a single SHA-256 makes the stored value useless to a
// reader of the database. The OTP is only 6 digits — hashing it doesn't add
// entropy, it just keeps a leaked database from handing over a live code
// verbatim; MAX_OTP_ATTEMPTS is what actually makes it hard to guess.
function hashToken(raw) {
  return createHash("sha256").update(raw).digest("hex");
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
 * Emails an OTP to an address, if it belongs to an account. Says nothing about
 * whether it did: the caller answers identically either way, which is the
 * whole reason this returns nothing. A mail failure is swallowed for the same
 * reason — surfacing it would tell an attacker the address exists but sending
 * failed, which is still information the account holder alone should have.
 */
export async function requestPasswordReset(email) {
  const user = await User.findOne({ email });

  if (!user) return;

  const otp = randomInt(100000, 1000000).toString();

  user.resetOtp = hashToken(otp);
  user.resetOtpExp = new Date(Date.now() + OTP_TTL_MS);
  user.resetOtpAttempts = 0;
  // A fresh OTP request retires any reset session left over from a previous
  // attempt, so a stale one can't be used once a new code has been issued.
  user.resetToken = undefined;
  user.resetTokenExp = undefined;
  // The password is untouched, so the pre-save hook returns early and the
  // stored hash is left exactly as it was.
  await user.save();

  try {
    await sendResetOtpEmail(user.email, user.name, otp);
  } catch (error) {
    console.error(`Failed to send reset OTP to ${user.email}:`, error.message);
  }
}

/**
 * Checks an OTP and, if it matches, trades it for a short-lived reset session
 * token. The OTP is consumed either way it succeeds or exhausts its attempts —
 * this function's job is that a code can only ever authorize one reset.
 */
export async function verifyResetOtp({ email, otp }) {
  const user = await User.findOne({ email }).select(
    "+resetOtp +resetOtpExp +resetOtpAttempts",
  );

  if (!user || !user.resetOtp || user.resetOtpExp < new Date()) {
    throw new ApiError(400, INVALID_OTP);
  }

  if (user.resetOtpAttempts >= MAX_OTP_ATTEMPTS) {
    throw new ApiError(400, INVALID_OTP);
  }

  if (hashToken(otp) !== user.resetOtp) {
    user.resetOtpAttempts += 1;
    await user.save();
    throw new ApiError(400, INVALID_OTP);
  }

  const rawResetToken = randomBytes(32).toString("hex");

  user.resetToken = hashToken(rawResetToken);
  user.resetTokenExp = new Date(Date.now() + RESET_SESSION_TTL_MS);
  // Cleared in the same save the session token is issued in, so the OTP
  // cannot be replayed even if the reset session that follows is never used.
  user.resetOtp = undefined;
  user.resetOtpExp = undefined;
  user.resetOtpAttempts = 0;
  await user.save();

  return rawResetToken;
}

/**
 * Consumes a reset session. The token is matched by its hash and its expiry in
 * one query, so an expired session is as unusable as a forged one, and the
 * same message covers both — neither tells the caller which it was.
 */
export async function resetPassword({ email, resetToken, password }) {
  const user = await User.findOne({
    email,
    resetToken: hashToken(resetToken),
    resetTokenExp: { $gt: new Date() },
  }).select("+resetToken +resetTokenExp");

  if (!user) {
    throw new ApiError(400, INVALID_RESET_SESSION);
  }

  user.password = password;
  // Cleared in the same save, so a reset session works exactly once.
  user.resetToken = undefined;
  user.resetTokenExp = undefined;
  await user.save();
}
