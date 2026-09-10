const amountOf = (item) => Number(item?.amount) || 0;

const monthKeyFor = (date) => {
  if (typeof date === "string" && /^\d{4}-\d{2}/.test(date)) {
    return date.slice(0, 7);
  }

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "";
  }

  return `${parsedDate.getFullYear()}-${String(
    parsedDate.getMonth() + 1
  ).padStart(2, "0")}`;
};

const dateKeyFor = (date) => {
  if (typeof date === "string" && /^\d{4}-\d{2}-\d{2}/.test(date)) {
    return date.slice(0, 10);
  }

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "";
  }

  return [
    parsedDate.getFullYear(),
    String(parsedDate.getMonth() + 1).padStart(2, "0"),
    String(parsedDate.getDate()).padStart(2, "0"),
  ].join("-");
};

const categoryLabel = (category) => {
  if (!category) {
    return "Uncategorised";
  }

  return category
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

export const totalAmount = (entries = []) =>
  entries.reduce((total, entry) => total + amountOf(entry), 0);

export const entriesForMonth = (entries = [], monthKey) =>
  entries.filter((entry) => monthKeyFor(entry.date) === monthKey);

export const getCurrentMonthKey = () => monthKeyFor(new Date());

export const categoryTotals = (expenses = []) => {
  const totals = expenses.reduce((result, expense) => {
    const name = categoryLabel(expense.category);
    result[name] = (result[name] || 0) + amountOf(expense);

    return result;
  }, {});

  return Object.entries(totals)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
};

export const dailyExpenseTotals = (expenses = []) => {
  const totals = expenses.reduce((result, expense) => {
    const dateKey = dateKeyFor(expense.date);

    if (!dateKey) {
      return result;
    }

    result[dateKey] = (result[dateKey] || 0) + amountOf(expense);

    return result;
  }, {});

  return Object.entries(totals)
    .sort(([firstDate], [secondDate]) =>
      firstDate.localeCompare(secondDate)
    )
    .map(([date, amount]) => ({
      date: new Intl.DateTimeFormat("en-IN", {
        day: "2-digit",
        month: "short",
      }).format(new Date(`${date}T00:00:00`)),
      amount,
    }));
};

export const monthlyIncomeExpenseTotals = (
  income = [],
  expenses = [],
  months = 6
) => {
  const today = new Date();

  return Array.from({ length: months }, (_, index) => {
    const date = new Date(
      today.getFullYear(),
      today.getMonth() - (months - index - 1),
      1
    );
    const monthKey = `${date.getFullYear()}-${String(
      date.getMonth() + 1
    ).padStart(2, "0")}`;

    return {
      month: new Intl.DateTimeFormat("en-IN", {
        month: "short",
      }).format(date),
      income: totalAmount(entriesForMonth(income, monthKey)),
      expense: totalAmount(entriesForMonth(expenses, monthKey)),
    };
  });
};

export const sortByNewestDate = (entries = []) =>
  [...entries].sort((first, second) => {
    const firstDate = dateKeyFor(first.date);
    const secondDate = dateKeyFor(second.date);

    return secondDate.localeCompare(firstDate);
  });
