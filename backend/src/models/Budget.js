import mongoose from "mongoose";

import { CATEGORIES } from "../constants/enums.js";

const budgetSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    category: {
      type: String,
      enum: CATEGORIES,
      required: [true, "Category is required"],
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      validate: {
        validator: (value) => value > 0,
        message: "Amount must be greater than 0",
      },
    },
    // Stored as a number even though the form sends "09": a zero-padded string
    // cannot be compared or ranged over. It is padded again on the way out.
    month: {
      type: Number,
      required: [true, "Month is required"],
      min: [1, "Month must be between 1 and 12"],
      max: [12, "Month must be between 1 and 12"],
    },
    year: {
      type: Number,
      required: [true, "Year is required"],
      min: [2020, "Year must be between 2020 and 2100"],
      max: [2100, "Year must be between 2020 and 2100"],
    },
  },
  { timestamps: true },
);

// One budget per category per month. The index is what actually enforces it —
// the service's check can be raced, this cannot.
budgetSchema.index({ user: 1, category: 1, month: 1, year: 1 }, { unique: true });

export default mongoose.model("Budget", budgetSchema);
