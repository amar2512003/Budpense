const DAY_MONTH = new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short" });
const MONTH = new Intl.DateTimeFormat("en-IN", { month: "short" });

/**
 * The API returns ISO dates and leaves presentation to the client, so these
 * turn them into the short axis labels the charts read.
 */
export const toDailySeries = (dailyExpense = []) =>
  dailyExpense.map(({ date, amount }) => ({
    date: DAY_MONTH.format(new Date(`${date}T00:00:00`)),
    amount,
  }));

export const toMonthlySeries = (monthlyTrend = []) =>
  monthlyTrend.map(({ month, income, expense }) => ({
    month: MONTH.format(new Date(`${month}-01T00:00:00`)),
    income,
    expense,
  }));
