import { body, param } from "express-validator";

import { CATEGORIES } from "../constants/enums.js";

import { inList } from "./fields.js";

export const idRule = [param("id").isMongoId().withMessage("Invalid budget id")];

export const budgetRules = [
  body("category").isIn(CATEGORIES).withMessage(inList(CATEGORIES)),
  body("amount").isFloat({ gt: 0 }).withMessage("Amount must be greater than 0").toFloat(),
  // The form sends a zero-padded "09" and a stored budget sends 9 back; both
  // are accepted and both end up as the number 9.
  body("month")
    .isInt({ min: 1, max: 12 })
    .withMessage("Month must be between 1 and 12")
    .toInt(),
  body("year")
    .isInt({ min: 2020, max: 2100 })
    .withMessage("Year must be between 2020 and 2100")
    .toInt(),
];
