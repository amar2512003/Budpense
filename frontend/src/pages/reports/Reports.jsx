import { useMemo } from "react";

import Card from "../../components/ui/Card";
import CategoryChart from "../../components/charts/CategoryChart";
import ExpenseChart from "../../components/charts/ExpenseChart";
import IncomeExpenseChart from "../../components/charts/IncomeExpenseChart";
import useExpenseStore from "../../store/expenseStore";
import useIncomeStore from "../../store/incomeStore";
import {
  categoryTotals,
  dailyExpenseTotals,
  monthlyIncomeExpenseTotals,
  totalAmount,
} from "../../utils/finance";
import { formatCurrency } from "../../utils/formatCurrency";

const Reports = () => {
  const expenses = useExpenseStore((state) => state.expenses);
  const income = useIncomeStore((state) => state.income);

  const report = useMemo(() => {
    const totalIncome = totalAmount(income);
    const totalExpense = totalAmount(expenses);
    const categoryData = categoryTotals(expenses);

    return {
      totalIncome,
      totalExpense,
      savings: totalIncome - totalExpense,
      categoryData,
      expenseData: dailyExpenseTotals(expenses),
      incomeExpenseData: monthlyIncomeExpenseTotals(income, expenses),
      highestCategory: categoryData[0] || null,
    };
  }, [expenses, income]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <p className="mt-1 text-sm text-gray-500">
          Analyze your income, expenses and spending habits.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <p className="text-sm text-gray-500">Total Income</p>
          <p className="mt-2 text-2xl font-bold text-green-600">
            {formatCurrency(report.totalIncome)}
          </p>
        </Card>

        <Card>
          <p className="text-sm text-gray-500">Total Expenses</p>
          <p className="mt-2 text-2xl font-bold text-red-600">
            {formatCurrency(report.totalExpense)}
          </p>
        </Card>

        <Card>
          <p className="text-sm text-gray-500">Savings</p>
          <p className="mt-2 text-2xl font-bold text-indigo-600">
            {formatCurrency(report.savings)}
          </p>
        </Card>
      </div>

      <Card
        title="Income vs Expenses"
        description="Monthly comparison based on your entries."
      >
        <IncomeExpenseChart data={report.incomeExpenseData} />
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Spending by Category" description="Where your money is going.">
          <CategoryChart data={report.categoryData} />
        </Card>

        <Card title="Expense Trend" description="Your spending over time.">
          <ExpenseChart data={report.expenseData} />
        </Card>
      </div>

      <Card
        title="Financial Insights"
        description="Observations based on your recorded transactions."
      >
        <div className="space-y-4">
          <div className="rounded-lg bg-gray-50 p-4">
            <p className="text-sm font-medium text-gray-900">
              Highest spending category
            </p>
            <p className="mt-1 text-sm text-gray-500">
              {report.highestCategory
                ? `${report.highestCategory.name} is your largest expense category at ${formatCurrency(
                    report.highestCategory.value
                  )}.`
                : "Add expenses to see your highest spending category."}
            </p>
          </div>

          <div className="rounded-lg bg-gray-50 p-4">
            <p className="text-sm font-medium text-gray-900">Savings</p>
            <p className="mt-1 text-sm text-gray-500">
              {report.totalIncome === 0 && report.totalExpense === 0
                ? "Add income and expenses to see your savings summary."
                : report.savings >= 0
                  ? `Your recorded income is ${formatCurrency(
                      report.savings
                    )} higher than your expenses.`
                  : `Your expenses are ${formatCurrency(
                      Math.abs(report.savings)
                    )} higher than your income.`}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Reports;
