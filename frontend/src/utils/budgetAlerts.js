import { CATEGORIES } from "../constants/enums";
import { formatCurrency } from "./formatCurrency";

// Per user, so on a shared browser one account's dismissals don't hide
// another's alerts.
const storageKey = (userId) => `budpense-dismissed-alerts:${userId}`;

export const ALERT_STYLES = {
  over: "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300",
  warning: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300",
};

const labelFor = (category) =>
  CATEGORIES.find((option) => option.value === category)?.label || category;

// A toast can be about another month's budget when the expense was dated
// there; without the month it would read as this month's.
const monthSuffix = ({ month, year }) => {
  const now = new Date();

  // UTC, as the API counts months.
  if (Number(month) === now.getUTCMonth() + 1 && year === now.getUTCFullYear()) return "";

  const name = new Intl.DateTimeFormat("en-IN", { month: "short", timeZone: "UTC" })
    .format(new Date(Date.UTC(year, month - 1, 1)));

  return ` (${name} ${year})`;
};

/** "Food: 85% of ₹5,000.00 used", or how far over for an overspent budget. */
export const alertMessage = (alert) => {
  const label = labelFor(alert.category) + monthSuffix(alert);
  const available = formatCurrency(alert.totalAvailable);

  if (alert.level === "over" && alert.overspent > 0) {
    return `${label}: ${formatCurrency(alert.overspent)} over your ${available} budget`;
  }

  if (alert.level === "over") {
    return `${label}: all of your ${available} budget is used`;
  }

  // Floored, so 99.6% doesn't read as 100% on a warning.
  return `${label}: ${Math.floor(alert.percentage)}% of ${available} used`;
};

// The month and level are part of the key, so a dismissed warning comes back
// once the category goes over, and every alert comes back next month.
export const alertKey = (alert) => `${alert.year}-${alert.month}:${alert.category}:${alert.level}`;

export const readDismissed = (userId) => {
  try {
    return JSON.parse(window.localStorage.getItem(storageKey(userId))) || [];
  } catch {
    return [];
  }
};

export const saveDismissed = (userId, keys) => {
  try {
    window.localStorage.setItem(storageKey(userId), JSON.stringify(keys));
  } catch {
    // Dismissal then lasts only until the page reloads.
  }
};
