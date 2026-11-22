import { CATEGORIES, EXPENSE, INCOME_SOURCES, PAYMENT_METHODS } from "../constants/enums.js";

// The fields an entry carries, shared by Expense and Recurring so a recurring
// rule can never hold a value its generated entries would fail to save with.
// Both schemas need a `type` path for the required rules below.
const entryFields = {
  amount: {
    type: Number,
    required: [true, "Amount is required"],
    // Not min: 0, which would accept a zero-rupee expense.
    validate: {
      validator: (value) => value > 0,
      message: "Amount must be greater than 0",
    },
  },
  category: {
    type: String,
    enum: CATEGORIES,
    required: [
      function isExpense() {
        return this.type === EXPENSE;
      },
      "Category is required",
    ],
  },
  source: {
    type: String,
    enum: INCOME_SOURCES,
    required: [
      function isIncome() {
        return this.type !== EXPENSE;
      },
      "Source is required",
    ],
  },
  title: {
    type: String,
    trim: true,
    maxlength: [100, "Title must be at most 100 characters"],
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, "Description must be at most 500 characters"],
  },
  paymentMethod: {
    type: String,
    enum: PAYMENT_METHODS,
  },
};

export default entryFields;
