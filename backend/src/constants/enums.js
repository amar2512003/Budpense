// The single source for every value the client may submit. Lowercase slugs,
// because that is what both forms send and what the frontend's categoryLabel()
// expects to prettify back into a display name.

export const RECORD_TYPES = ["expense", "income"];

export const EXPENSE = "expense";
export const INCOME = "income";

// Shared by expenses and budgets: a budget for a category no expense can use
// would silently never fill up.
export const CATEGORIES = [
  "food",
  "transport",
  "shopping",
  "bills",
  "entertainment",
  "health",
  "education",
  "travel",
  "other",
];

export const PAYMENT_METHODS = ["cash", "upi", "card", "bank"];

export const INCOME_SOURCES = ["salary", "freelancing", "business", "investment", "other"];
