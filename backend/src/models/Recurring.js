import mongoose from "mongoose";

import { FREQUENCIES, RECORD_TYPES } from "../constants/enums.js";
import entryFields from "./entryFields.js";

const recurringSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: RECORD_TYPES,
      required: true,
    },
    ...entryFields,
    frequency: {
      type: String,
      enum: FREQUENCIES,
      required: [true, "Frequency is required"],
    },
    // Occurrence n falls n periods after startDate. Counting from a fixed
    // anchor keeps a rule on the 31st from sliding to the 28th for good after
    // one February.
    startDate: {
      type: Date,
      required: true,
    },
    occurrences: {
      type: Number,
      default: 0,
    },
    // Null once the rule has passed its end date.
    nextDate: Date,
    endDate: Date,
  },
  // The hourly run and a user's edit can both save the same rule. Without a
  // version check the later save silently overwrites the earlier one.
  { timestamps: true, optimisticConcurrency: true },
);

recurringSchema.index({ nextDate: 1 });
recurringSchema.index({ user: 1, type: 1 });

export default mongoose.model("Recurring", recurringSchema);
