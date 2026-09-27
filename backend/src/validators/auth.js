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

export const verifyOtpRules = [
  emailRule(),
  body("otp", "Enter the 6-digit code")
    .isString()
    .bail()
    .trim()
    .isLength({ min: 6, max: 6 })
    .withMessage("Enter the 6-digit code")
    .bail()
    .isNumeric()
    .withMessage("Enter the 6-digit code"),
];

// The reset token itself is not checked here: a malformed one fails the
// lookup like any other, and the service's message is the one the user
// should read.
export const resetPasswordRules = [
  emailRule(),
  body("resetToken", "Reset session is missing").isString().bail().notEmpty(),
  newPasswordRule(),
  body("confirmPassword", "Passwords do not match").custom(
    (value, { req }) => value === req.body.password,
  ),
];
