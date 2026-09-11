import { body } from "express-validator";

import { emailRule, nameRule, newPasswordRule } from "./fields.js";

export const registerRules = [nameRule(), emailRule(), newPasswordRule()];

export const loginRules = [
  emailRule(),
  // Only presence. Enforcing the registration rules here would tell a guesser
  // which passwords are worth trying.
  body("password", "Password is required").isString().bail().notEmpty(),
];

export const forgotPasswordRules = [emailRule()];

// The token itself is not checked here: a malformed one fails the lookup like
// any other, and the service's message is the one the user should read.
export const resetPasswordRules = [newPasswordRule()];
