// The values the API accepts, in one place. Three components used to keep their
// own copy of this list and had drifted apart: a budget could be set for a
// category the expense form could not file against.

export const CATEGORIES = [
  { value: "food", label: "Food" },
  { value: "transport", label: "Transport" },
  { value: "shopping", label: "Shopping" },
  { value: "bills", label: "Bills" },
  { value: "entertainment", label: "Entertainment" },
  { value: "health", label: "Health" },
  { value: "education", label: "Education" },
  { value: "travel", label: "Travel" },
  { value: "other", label: "Other" },
];

export const PAYMENT_METHODS = [
  { value: "cash", label: "Cash" },
  { value: "upi", label: "UPI" },
  { value: "card", label: "Card" },
  { value: "bank", label: "Bank Transfer" },
];

export const INCOME_SOURCES = [
  { value: "salary", label: "Salary" },
  { value: "freelancing", label: "Freelancing" },
  { value: "business", label: "Business" },
  { value: "investment", label: "Investment" },
  { value: "other", label: "Other" },
];

export const SORT_OPTIONS = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "highest", label: "Highest amount" },
  { value: "lowest", label: "Lowest amount" },
];
