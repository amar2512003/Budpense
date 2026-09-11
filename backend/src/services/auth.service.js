import { randomBytes } from "node:crypto";

import bcrypt from "bcryptjs";

import User, { BCRYPT_COST } from "../models/User.js";
import ApiError from "../utils/apiError.js";

// One message for both failure branches, so a caller cannot tell a registered
// email from an unregistered one.
const INVALID_CREDENTIALS = "Incorrect email or password";

// Nobody can supply the plaintext behind this hash. Comparing against it when
// the email is unknown keeps that path on the same bcrypt cost as a wrong
// password, so response time doesn't answer the question the message refuses to.
const ABSENT_USER_HASH = bcrypt.hashSync(randomBytes(32).toString("hex"), BCRYPT_COST);

/** The only shape of a user that leaves the server: no password, no internals. */
function toPublicUser(user) {
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
    throw new ApiError(401, "Session is no longer valid, please sign in again");
  }

  return toPublicUser(user);
}
