import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import ExpenseFilters from "../../components/expense/ExpenseFilters";
import ExpenseList from "../../components/expense/ExpenseList";

import useDebounce from "../../hooks/useDebounce";
import useExpenseStore from "../../store/expenseStore";

const Expenses = () => {
  const navigate = useNavigate();

  const expenses = useExpenseStore((state) => state.expenses);
  const total = useExpenseStore((state) => state.total);
  const pages = useExpenseStore((state) => state.pages);
  const loading = useExpenseStore((state) => state.loading);
  const error = useExpenseStore((state) => state.error);
  const fetchExpenses = useExpenseStore((state) => state.fetchExpenses);
  const removeExpense = useExpenseStore((state) => state.removeExpense);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);

  // The search box fires on every keystroke; the request should not.
  const debouncedSearch = useDebounce(search, 400);

  // Filtering and sorting happen in the request, so they cover every expense
  // on the account rather than only the page already loaded.
  useEffect(() => {
    fetchExpenses({ search: debouncedSearch || undefined, category: category || undefined, sort, page });
  }, [fetchExpenses, debouncedSearch, category, sort, page]);

  // A narrower filter can leave the current page past the end of the results.
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, category, sort]);

  const handleDelete = async (expense) => {
    const confirmed = window.confirm(`Delete "${expense.title || "this expense"}"?`);

    if (!confirmed) return;

    try {
      await removeExpense(expense._id);
    } catch {
      // The store has put the row back and holds the message.
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Expenses</h1>

          <p className="mt-1 text-sm text-gray-500">Track and manage your spending.</p>
        </div>

        <Button onClick={() => navigate("/app/expenses/add")}>+ Add Expense</Button>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600" role="alert">
          {error}
        </div>
      )}

      <ExpenseFilters
        search={search}
        setSearch={setSearch}
        category={category}
        setCategory={setCategory}
        sort={sort}
        setSort={setSort}
      />

      <Card title={`${total} ${total === 1 ? "Expense" : "Expenses"}`}>
        <ExpenseList
          expenses={expenses}
          loading={loading}
          onEdit={(expense) => navigate(`/app/expenses/${expense._id}/edit`)}
          onDelete={handleDelete}
        />

        {pages > 1 && (
          <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">
            <Button
              variant="secondary"
              disabled={page <= 1 || loading}
              onClick={() => setPage((current) => current - 1)}
            >
              Previous
            </Button>

            <span className="text-sm text-gray-500">
              Page {page} of {pages}
            </span>

            <Button
              variant="secondary"
              disabled={page >= pages || loading}
              onClick={() => setPage((current) => current + 1)}
            >
              Next
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
};

export default Expenses;
