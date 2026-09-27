import mongoose from "mongoose";

import { EXPENSE } from "../constants/enums.js";
import Budget from "../models/Budget.js";
import Expense from "../models/Expense.js";
import ApiError from "../utils/apiError.js";
import toMoney from "../utils/money.js";
import monthRange from "../utils/monthRange.js";

const periodKey = ({ year, month, category }) => `${year}-${month}-${category}`;

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
    const { start, end } = monthRange(year, month);

    return { date: { $gte: start, $lt: end } };
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

function toPublicBudget(budget, rawSpent, rawRolloverIn = 0) {
  const spent = toMoney(rawSpent);
  const rolloverAmount = toMoney(rawRolloverIn);
  // What this budget can actually absorb this month: its own amount plus
  // whatever rolled in. Spend and progress are measured against this, not
  // against the configured amount alone.
  const totalAvailable = toMoney(budget.amount + rolloverAmount);

  return {
    _id: budget._id,
    category: budget.category,
    amount: budget.amount,
    // Zero-padded on the way out because the month select compares by value: a
    // plain 9 leaves the field blank when a budget is opened for editing.
    month: String(budget.month).padStart(2, "0"),
    year: budget.year,
    rollover: Boolean(budget.rollover),
    rolloverAmount,
    totalAvailable,
    spent,
    // Both deliberately unclamped. Remaining goes negative and percentage past
    // 100 when a budget is overspent, which is the fact the card needs; it
    // limits its own progress bar.
    remaining: toMoney(totalAvailable - spent),
    percentage: Math.round((spent / totalAvailable) * 10000) / 100,
    isOverBudget: spent > totalAvailable,
  };
}

/**
 * The unspent amount, if any, that rolls from the previous month's budget for
 * the same category into this one — zero unless this budget opted in. Walks
 * backward one month at a time, since a chain of rollover-enabled budgets
 * carries whatever earlier months never used; a missing or rollover-off
 * predecessor stops the chain there. depth guards against an unbroken chain
 * running away on a very old account.
 */
async function computeRolloverIn(userId, budget, cache = new Map(), depth = 0) {
  if (!budget.rollover || depth >= 24) return 0;

  const prevMonth = budget.month === 1 ? 12 : budget.month - 1;
  const prevYear = budget.month === 1 ? budget.year - 1 : budget.year;
  const prevKey = periodKey({ year: prevYear, month: prevMonth, category: budget.category });

  if (cache.has(prevKey)) return cache.get(prevKey);

  const prevBudget = await Budget.findOne({
    user: userId,
    category: budget.category,
    month: prevMonth,
    year: prevYear,
  }).lean();

  if (!prevBudget) {
    cache.set(prevKey, 0);
    return 0;
  }

  const prevSpendMap = await spendByPeriod(userId, [prevBudget]);
  const prevSpent = prevSpendMap.get(periodKey(prevBudget)) ?? 0;
  const prevRolloverIn = await computeRolloverIn(userId, prevBudget, cache, depth + 1);
  const prevAvailable = prevBudget.amount + prevRolloverIn;
  // Only a genuine leftover carries forward; an overspent month never turns
  // into a debt against the next one.
  const leftover = Math.max(0, toMoney(prevAvailable - prevSpent));

  cache.set(prevKey, leftover);
  return leftover;
}

async function withSpend(userId, budget) {
  const spend = await spendByPeriod(userId, [budget]);
  const rolloverIn = await computeRolloverIn(userId, budget);

  return toPublicBudget(budget, spend.get(periodKey(budget)) ?? 0, rolloverIn);
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
  const cache = new Map();
  const results = [];

  // Sequential, not Promise.all: computeRolloverIn shares and fills the same
  // cache across budgets, which only helps if one call finishes before the
  // next starts reading it.
  for (const budget of budgets) {
    const rolloverIn = await computeRolloverIn(userId, budget, cache);

    results.push(toPublicBudget(budget, spend.get(periodKey(budget)) ?? 0, rolloverIn));
  }

  return results;
}

export async function getBudget(userId, id) {
  return withSpend(userId, await findOwned(userId, id));
}

export async function createBudget(userId, { category, amount, month, year, rollover }) {
  await assertNotDuplicate(userId, { category, month, year });

  const budget = await Budget.create({ user: userId, category, amount, month, year, rollover });

  return withSpend(userId, budget);
}

export async function updateBudget(userId, id, { category, amount, month, year, rollover }) {
  const budget = await findOwned(userId, id);

  await assertNotDuplicate(userId, { category, month, year }, budget._id);

  Object.assign(budget, { category, amount, month, year, rollover: Boolean(rollover) });
  await budget.save();

  return withSpend(userId, budget);
}

export async function deleteBudget(userId, id) {
  const budget = await findOwned(userId, id);

  await budget.deleteOne();
}
