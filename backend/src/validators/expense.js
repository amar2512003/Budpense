import { body, param, query } from "express-validator";

import {
  CATEGORIES,
  EXPENSE,
  INCOME_SOURCES,
  PAYMENT_METHODS,
} from "../constants/enums.js";
import { inList } from "./fields.js";

const SORTS = ["newest", "oldest", "highest", "lowest"];
const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

// The forms submit every field, blank ones included, so an optional field has
// to treat "" as absent rather than as a value that fails its enum check.
const optional = (chain) => chain.optional({ values: "falsy" });

// The filter belonging to the other type is refused rather than ignored: a
// request that filtered on nothing would hand back every record as though it
// had, which is a wrong answer wearing a 200.
const notApplicable = (field, advice) => query(field).not().exists().withMessage(advice);

export const idRule = [param("id").isMongoId().withMessage("Invalid record id")];

/** Same rules on create and update: both send the whole record. */
export const recordRules = (type) => [
  body("amount")
    .isFloat({ gt: 0 })
    .withMessage("Amount must be greater than 0")
    .toFloat(),
  body("date").isISO8601().withMessage("Enter a valid date").toDate(),
  optional(body("description").trim().isLength({ max: 500 }))
    .withMessage("Description must be at most 500 characters"),
  ...(type === EXPENSE
    ? [
        body("category").isIn(CATEGORIES).withMessage(inList(CATEGORIES)),
        optional(body("title").trim().isLength({ max: 100 }))
          .withMessage("Title must be at most 100 characters"),
        optional(body("paymentMethod").isIn(PAYMENT_METHODS))
          .withMessage(inList(PAYMENT_METHODS)),
      ]
    : [body("source").isIn(INCOME_SOURCES).withMessage(inList(INCOME_SOURCES))]),
];

export const listRules = (type) => [
  // Escaping makes a search safe to run; the length cap keeps it cheap.
  optional(query("search").trim().isLength({ max: 100 }))
    .withMessage("Search must be at most 100 characters"),
  optional(query("startDate").isISO8601()).withMessage("Enter a valid start date").toDate(),
  optional(query("endDate").isISO8601()).withMessage("Enter a valid end date").toDate(),
  optional(query("month").matches(MONTH_PATTERN)).withMessage("Month must look like 2026-09"),
  optional(query("sort").isIn(SORTS)).withMessage(inList(SORTS)),
  optional(query("page").isInt({ min: 1 })).withMessage("Page must be 1 or more").toInt(),
  // Not rejected when too large, just capped in the service — a client asking
  // for more than the maximum gets the maximum.
  optional(query("limit").isInt({ min: 1 })).withMessage("Limit must be 1 or more").toInt(),
  ...(type === EXPENSE
    ? [
        optional(query("category").isIn(CATEGORIES)).withMessage(inList(CATEGORIES)),
        notApplicable("source", "Expenses are filtered by category, not source"),
      ]
    : [
        optional(query("source").isIn(INCOME_SOURCES)).withMessage(inList(INCOME_SOURCES)),
        notApplicable("category", "Income is filtered by source, not category"),
      ]),
];
