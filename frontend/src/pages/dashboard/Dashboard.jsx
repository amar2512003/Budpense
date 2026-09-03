import { useMemo } from "react";
import { useNavigate } from "react-router-dom";

import Card from "../../components/ui/Card";
import CategoryChart from "../../components/charts/CategoryChart";
import ExpenseChart from "../../components/charts/ExpenseChart";
import IncomeExpenseChart from "../../components/charts/IncomeExpenseChart";
import ExpenseCard from "../../components/expense/ExpenseCard";
import useExpenseStore from "../../store/expenseStore";
import useIncomeStore from "../../store/incomeStore";
import {
  categoryTotals,
  dailyExpenseTotals,
  entriesForMonth,
  getCurrentMonthKey,
  monthlyIncomeExpenseTotals,
  sortByNewestDate,
  totalAmount,
} from "../../utils/finance";
import { formatCurrency } from "../../utils/formatCurrency";

const Dashboard = () => {
  const navigate = useNavigate();
  const expenses = useExpenseStore((state) => state.expenses);
  const income = useIncomeStore((state) => state.income);

  const summary = useMemo(() => {
    const currentMonth = getCurrentMonthKey();
    const currentMonthIncome = entriesForMonth(income, currentMonth);
    const currentMonthExpenses = entriesForMonth(expenses, currentMonth);
    const totalIncome = totalAmount(currentMonthIncome);
    const totalExpense = totalAmount(currentMonthExpenses);

    return {
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
      categoryData: categoryTotals(currentMonthExpenses),
      expenseData: dailyExpenseTotals(currentMonthExpenses),
      incomeExpenseData: monthlyIncomeExpenseTotals(income, expenses),
      recentExpenses: sortByNewestDate(expenses).slice(0, 4),
    };
  }, [expenses, income]);

  const savingsRate =
    summary.totalIncome > 0
      ? Math.round((summary.balance / summary.totalIncome) * 100)
      : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Here&apos;s an overview of your finances.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <p className="text-sm text-gray-500">Total Balance</p>
          <p className="mt-2 text-2xl font-bold text-indigo-600">
            {formatCurrency(summary.balance)}
          </p>
          <p className="mt-1 text-xs text-gray-500">This month</p>
        </Card>

        <Card>
          <p className="text-sm text-gray-500">Total Income</p>
          <p className="mt-2 text-2xl font-bold text-green-600">
            {formatCurrency(summary.totalIncome)}
          </p>
          <p className="mt-1 text-xs text-gray-500">This month</p>
        </Card>

        <Card>
          <p className="text-sm text-gray-500">Total Expenses</p>
          <p className="mt-2 text-2xl font-bold text-red-600">
            {formatCurrency(summary.totalExpense)}
          </p>
          <p className="mt-1 text-xs text-gray-500">This month</p>
        </Card>

        <Card>
          <p className="text-sm text-gray-500">Savings Rate</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">
            {savingsRate}%
          </p>
          <p className="mt-1 text-xs text-gray-500">Of your income</p>
        </Card>
      </div>

      <Card
        title="Income vs Expenses"
        description="Your financial activity over the last six months."
      >
        <IncomeExpenseChart data={summary.incomeExpenseData} />
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card
          title="Spending by Category"
          description="Your expense categories for this month."
        >
          <CategoryChart data={summary.categoryData} />
        </Card>

        <Card
          title="Expense Trend"
          description="Your daily spending this month."
        >
          <ExpenseChart data={summary.expenseData} />
        </Card>
      </div>

      <Card title="Recent Expenses" description="Your latest transactions.">
        {summary.recentExpenses.length === 0 ? (
          <p className="py-6 text-center text-sm text-gray-500">
            Add an expense to see it here.
          </p>
        ) : (
          <div className="space-y-3">
            {summary.recentExpenses.map((expense) => (
              <ExpenseCard
                key={expense._id || expense.id}
                expense={expense}
                onEdit={(entry) =>
                  navigate(`/app/expenses/${entry._id || entry.id}/edit`)
                }
              />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default Dashboard;
