import { body } from "express-validator";

// The field rules shared by the auth and user validators. Registration and
// login must normalise an email identically or an address typed with different
// case never matches the row it created; the same is true of a profile update
// and a reset request, so the rule lives in one place for all of them.

/** The message every enum-backed field uses when it is given something else. */
export const inList = (list) => `Choose one of: ${list.join(", ")}`;

export const nameRule = () =>
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .bail()
    .isLength({ min: 2, max: 50 })
    .withMessage("Name must be between 2 and 50 characters");

export const emailRule = () =>
  body("email")
    .trim()
    .customSanitizer((value) => value.toLowerCase())
    .notEmpty()
    .withMessage("Email is required")
    .bail()
    .isEmail()
    .withMessage("Enter a valid email address");

// Not trimmed: leading and trailing spaces are legitimate password characters,
// and trimming them here would silently change what was typed. The second
// argument is the fallback message, so a missing or non-string password reads
// as "required" rather than express-validator's "Invalid value".
export const newPasswordRule = () =>
  body("password", "Password is required")
    .isString()
    .bail()
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters");
