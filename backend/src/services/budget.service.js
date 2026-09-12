import mongoose from "mongoose";

import { EXPENSE } from "../constants/enums.js";
import Budget from "../models/Budget.js";
import Expense from "../models/Expense.js";
import ApiError from "../utils/apiError.js";

const periodKey = ({ year, month, category }) => `${year}-${month}-${category}`;

/**
 * The month as a half-open UTC range. Built from Date.UTC so it cannot drift
 * with the server's timezone, and half-open so an expense dated midnight on the
 * last day of the month falls in this month rather than being counted twice or
 * missed entirely.
 */
function monthRange(year, month) {
  return {
    date: {
      $gte: new Date(Date.UTC(year, month - 1, 1)),
      $lt: new Date(Date.UTC(year, month, 1)),
    },
  };
}

/**
 * Totals expense spend per category for every period the given budgets cover,
 * in a single aggregation. Spend is never stored: a stored column would have to
 * be corrected on every expense create, update, delete and category change, and
 * a figure that drifts is wrong silently until someone adds it up by hand.
 */
async function spendByPeriod(userId, budgets) {
  if (budgets.length === 0) return new Map();

  const periods = [...new Set(budgets.map((budget) => `${budget.year}-${budget.month}`))];
  const ranges = periods.map((period) => {
    const [year, month] = period.split("-").map(Number);

    return monthRange(year, month);
  });

  const totals = await Expense.aggregate([
    {
      // The aggregation pipeline does no casting of its own, so the owner has
      // to be an ObjectId here; a string would match nothing at all.
      $match: {
        user: new mongoose.Types.ObjectId(userId),
        type: EXPENSE,
        $or: ranges,
      },
    },
    {
      $group: {
        _id: {
          year: { $year: { date: "$date", timezone: "UTC" } },
          month: { $month: { date: "$date", timezone: "UTC" } },
          category: "$category",
        },
        spent: { $sum: "$amount" },
      },
    },
  ]);

  return new Map(totals.map((total) => [periodKey(total._id), total.spent]));
}

function toPublicBudget(budget, spent) {
  return {
    _id: budget._id,
    category: budget.category,
    amount: budget.amount,
    // Zero-padded on the way out because the month select compares by value: a
    // plain 9 leaves the field blank when a budget is opened for editing.
    month: String(budget.month).padStart(2, "0"),
    year: budget.year,
    spent,
    // Both deliberately unclamped. Remaining goes negative and percentage past
    // 100 when a budget is overspent, which is the fact the card needs; it
    // limits its own progress bar.
    remaining: budget.amount - spent,
    percentage: Math.round((spent / budget.amount) * 10000) / 100,
    isOverBudget: spent > budget.amount,
  };
}

async function withSpend(userId, budget) {
  const spend = await spendByPeriod(userId, [budget]);

  return toPublicBudget(budget, spend.get(periodKey(budget)) ?? 0);
}

async function findOwned(userId, id) {
  const budget = await Budget.findOne({ _id: id, user: userId });

  if (!budget) {
    throw new ApiError(404, "Budget not found");
  }

  return budget;
}

async function assertNotDuplicate(userId, { category, month, year }, excludeId) {
  const filter = { user: userId, category, month, year };

  if (excludeId) filter._id = { $ne: excludeId };

  if (await Budget.exists(filter)) {
    throw new ApiError(409, "A budget for that category and month already exists");
  }
}

export async function listBudgets(userId) {
  const budgets = await Budget.find({ user: userId })
    .sort({ year: -1, month: -1, category: 1 })
    .lean();
  const spend = await spendByPeriod(userId, budgets);

  return budgets.map((budget) => toPublicBudget(budget, spend.get(periodKey(budget)) ?? 0));
}

export async function getBudget(userId, id) {
  return withSpend(userId, await findOwned(userId, id));
}

export async function createBudget(userId, { category, amount, month, year }) {
  await assertNotDuplicate(userId, { category, month, year });

  const budget = await Budget.create({ user: userId, category, amount, month, year });

  return withSpend(userId, budget);
}

export async function updateBudget(userId, id, { category, amount, month, year }) {
  const budget = await findOwned(userId, id);

  await assertNotDuplicate(userId, { category, month, year }, budget._id);

  Object.assign(budget, { category, amount, month, year });
  await budget.save();

  return withSpend(userId, budget);
}

export async function deleteBudget(userId, id) {
  const budget = await findOwned(userId, id);

  await budget.deleteOne();
}
