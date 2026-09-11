import { body } from "express-validator";

// Register and login must normalise the email the same way, or an address
// typed with different case or padding on the two forms never matches the one
// row in the database.
const emailRule = () =>
  body("email")
    .trim()
    .customSanitizer((value) => value.toLowerCase())
    .notEmpty()
    .withMessage("Email is required")
    .bail()
    .isEmail()
    .withMessage("Enter a valid email address");

export const registerRules = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .bail()
    .isLength({ min: 2, max: 50 })
    .withMessage("Name must be between 2 and 50 characters"),
  emailRule(),
  // Not trimmed: leading and trailing spaces are legitimate password
  // characters, and trimming them here would silently change what was typed.
  // The second argument is the fallback message, so a missing or non-string
  // password reads as "required" rather than express-validator's "Invalid value".
  body("password", "Password is required")
    .isString()
    .bail()
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters"),
];

export const loginRules = [
  emailRule(),
  // Only presence. Enforcing the registration rules here would tell a guesser
  // which passwords are worth trying.
  body("password", "Password is required").isString().bail().notEmpty(),
];
