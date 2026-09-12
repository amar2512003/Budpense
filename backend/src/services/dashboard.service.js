import mongoose from "mongoose";

import { EXPENSE, INCOME } from "../constants/enums.js";
import Budget from "../models/Budget.js";
import Expense from "../models/Expense.js";
import toMoney from "../utils/money.js";
import monthRange from "../utils/monthRange.js";

import { toPublicRecord } from "./expense.service.js";

const TREND_MONTHS = 6;
const RECENT_EXPENSES = 4;

const monthKey = (year, month) => `${year}-${String(month).padStart(2, "0")}`;

/**
 * The display name for a category slug, matching the frontend's categoryLabel()
 * so the chart reads the same whether the data came from here or was derived in
 * the browser. A record with no category is not possible through the API, but
 * the chart still needs a name for one if it ever appears.
 */
function toDisplayLabel(category) {
  if (!category) return "Uncategorised";

  return category.replace(/[-_]/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

/** The last six months ending with the current one, oldest first. */
function trendMonths(year, month) {
  return Array.from({ length: TREND_MONTHS }, (_, index) => {
    const date = new Date(Date.UTC(year, month - 1 - (TREND_MONTHS - 1 - index), 1));

    return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1 };
  });
}

export async function getDashboard(userId) {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth() + 1;

  const current = monthRange(year, month);
  const months = trendMonths(year, month);
  const windowStart = monthRange(months[0].year, months[0].month).start;

  // Everything the charts need from the ledger in one pass: the outer match
  // narrows to the six-month window once, and each facet slices that stream.
  const [facets] = await Expense.aggregate([
    {
      // The pipeline does no casting of its own, so the owner must already be
      // an ObjectId here or it would match nothing at all.
      $match: {
        user: new mongoose.Types.ObjectId(userId),
        date: { $gte: windowStart, $lt: current.end },
      },
    },
    {
      $facet: {
        byMonth: [
          {
            $group: {
              _id: {
                year: { $year: { date: "$date", timezone: "UTC" } },
                month: { $month: { date: "$date", timezone: "UTC" } },
                type: "$type",
              },
              total: { $sum: "$amount" },
            },
          },
        ],
        byCategory: [
          { $match: { type: EXPENSE, date: { $gte: current.start } } },
          { $group: { _id: "$category", value: { $sum: "$amount" } } },
          // Name breaks ties, so two equal categories keep a stable order
          // instead of swapping places between requests.
          { $sort: { value: -1, _id: 1 } },
        ],
        byDay: [
          { $match: { type: EXPENSE, date: { $gte: current.start } } },
          {
            $group: {
              // ISO, and in UTC to agree with the month boundaries above. The
              // chart does its own formatting.
              _id: { $dateToString: { format: "%Y-%m-%d", date: "$date", timezone: "UTC" } },
              amount: { $sum: "$amount" },
            },
          },
          { $sort: { _id: 1 } },
        ],
      },
    },
  ]);

  const totals = new Map(
    facets.byMonth.map((entry) => [`${monthKey(entry._id.year, entry._id.month)}-${entry._id.type}`, entry.total]),
  );
  const totalFor = (period, type) => toMoney(totals.get(`${monthKey(period.year, period.month)}-${type}`) ?? 0);

  const totalIncome = totalFor({ year, month }, INCOME);
  const totalExpense = totalFor({ year, month }, EXPENSE);
  const balance = toMoney(totalIncome - totalExpense);

  const [budgets, recentExpenses] = await Promise.all([
    Budget.find({ user: userId, month, year }).select("amount").lean(),
    Expense.find({ user: userId, type: EXPENSE })
      .sort({ date: -1, _id: -1 })
      .limit(RECENT_EXPENSES)
      .lean(),
  ]);

  const budgeted = budgets.reduce((sum, budget) => sum + budget.amount, 0);

  return {
    totalIncome,
    totalExpense,
    balance,
    // Zero rather than a division by zero: with no income the card would
    // otherwise render NaN%.
    savingsRate: totalIncome > 0 ? Math.round((balance / totalIncome) * 100) : 0,
    budgetUsed: budgeted > 0 ? Math.round((totalExpense / budgeted) * 100) : 0,
    categoryBreakdown: facets.byCategory.map((entry) => ({
      name: toDisplayLabel(entry._id),
      value: toMoney(entry.value),
    })),
    dailyExpense: facets.byDay.map((entry) => ({ date: entry._id, amount: toMoney(entry.amount) })),
    // Built from the month list rather than from the grouped result, so a month
    // with no activity still appears as a zero instead of being dropped and
    // compressing the chart's axis.
    monthlyTrend: months.map((period) => ({
      month: monthKey(period.year, period.month),
      income: totalFor(period, INCOME),
      expense: totalFor(period, EXPENSE),
    })),
    recentExpenses: recentExpenses.map(toPublicRecord),
  };
}
