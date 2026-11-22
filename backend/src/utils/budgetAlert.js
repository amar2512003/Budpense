import toMoney from "./money.js";

const WARNING_PERCENT = 80;

/**
 * "over" at or past 100% of what the budget can absorb, "warning" from 80%,
 * otherwise null. Compared on the raw figures rather than the rounded
 * percentage, so 79.996% is not reported as 80%.
 */
export function alertLevel(spent, available) {
  if (spent >= available) return "over";
  if (spent * 100 >= available * WARNING_PERCENT) return "warning";
  return null;
}

/** The alert for a budget as the budget service returns it, or null. */
export function toAlert(budget) {
  const level = alertLevel(budget.spent, budget.totalAvailable);

  if (!level) return null;

  return {
    category: budget.category,
    month: budget.month,
    year: budget.year,
    level,
    percentage: budget.percentage,
    spent: budget.spent,
    totalAvailable: budget.totalAvailable,
    overspent: toMoney(Math.max(0, budget.spent - budget.totalAvailable)),
  };
}
