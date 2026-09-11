import User from "../models/User.js";
import ApiError from "../utils/apiError.js";

import { SESSION_INVALID, toPublicUser } from "./auth.service.js";

/**
 * Loads the signed-in user's own document. protect has already proved the id
 * resolves, so a miss here means the account was deleted between that lookup
 * and this one.
 */
async function loadAccount(id, { withPassword = false } = {}) {
  const query = User.findById(id);
  const user = await (withPassword ? query.select("+password") : query);

  if (!user) {
    throw new ApiError(401, SESSION_INVALID);
  }

  return user;
}

export async function updateProfile(id, { name, email }) {
  const user = await loadAccount(id);
  const taken = await User.exists({ email, _id: { $ne: user._id } });

  if (taken) {
    throw new ApiError(409, "An account with this email already exists");
  }

  user.name = name;
  user.email = email;
  // The pre-save hook's isModified guard is what keeps this from re-hashing
  // the stored password hash and locking the user out of their own account.
  await user.save();

  return toPublicUser(user);
}

export async function changePassword(id, { currentPassword, password }) {
  const user = await loadAccount(id, { withPassword: true });

  // Proof the session belongs to the person who knows the password, not just
  // to whoever is holding the cookie.
  if (!(await user.matchPassword(currentPassword))) {
    throw new ApiError(401, "Your current password is incorrect");
  }

  user.password = password;
  await user.save();
}
