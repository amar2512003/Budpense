import { body } from "express-validator";

import { emailRule, nameRule, newPasswordRule } from "./fields.js";

export const updateProfileRules = [nameRule(), emailRule()];

export const changePasswordRules = [
  body("currentPassword", "Your current password is required").isString().bail().notEmpty(),
  newPasswordRule(),
];
