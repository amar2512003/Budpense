import { useNavigate } from "react-router-dom";

import Card from "../../components/ui/Card";
import Loader from "../../components/ui/Loader";
import ExpenseCard from "../../components/expense/ExpenseCard";
import CategoryChart from "../../components/charts/CategoryChart";
import ExpenseChart from "../../components/charts/ExpenseChart";
import IncomeExpenseChart from "../../components/charts/IncomeExpenseChart";

import useDashboard from "../../hooks/useDashboard";
import { toDailySeries, toMonthlySeries } from "../../utils/chartData";
import { formatCurrency } from "../../utils/formatCurrency";

const Dashboard = () => {
  const navigate = useNavigate();

  // One request for the whole page: the figures are computed by the API, over
  // every record on the account rather than the page of expenses in the store.
  const { summary, loading, error } = useDashboard();

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Here&apos;s an overview of your finances.
        </p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600" role="alert">
          {error}
        </div>
      )}

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
            {summary.savingsRate}%
          </p>
          <p className="mt-1 text-xs text-gray-500">Of your income</p>
        </Card>
      </div>

      <Card
        title="Income vs Expenses"
        description="Your financial activity over the last six months."
      >
        <IncomeExpenseChart data={toMonthlySeries(summary.monthlyTrend)} />
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card
          title="Spending by Category"
          description="Your expense categories for this month."
        >
          <CategoryChart data={summary.categoryBreakdown} />
        </Card>

        <Card
          title="Expense Trend"
          description="Your daily spending this month."
        >
          <ExpenseChart data={toDailySeries(summary.dailyExpense)} />
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
