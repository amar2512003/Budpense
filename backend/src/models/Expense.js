import mongoose from "mongoose";

import {
  CATEGORIES,
  EXPENSE,
  INCOME_SOURCES,
  PAYMENT_METHODS,
  RECORD_TYPES,
} from "../constants/enums.js";

// One collection holds both sides of the ledger, separated by type. Income has
// a source where an expense has a category, and carries neither a title nor a
// payment method — the income form asks for neither.
const expenseSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: RECORD_TYPES,
      default: EXPENSE,
      required: true,
    },
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
    date: {
      type: Date,
      required: [true, "Date is required"],
    },
    paymentMethod: {
      type: String,
      enum: PAYMENT_METHODS,
    },
  },
  { timestamps: true },
);

// Every list query filters by user and type and sorts by date descending, so
// this covers the common read end to end without touching the documents.
expenseSchema.index({ user: 1, type: 1, date: -1 });

export default mongoose.model("Expense", expenseSchema);
