import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import ExpenseFilters from "../../components/expense/ExpenseFilters";
import ExpenseList from "../../components/expense/ExpenseList";

import useExpenses from "../../hooks/useExpenses";

const Expenses = () => {
  const navigate = useNavigate();

  const {
    expenses,
    loading,
    error,
    removeExpense,
  } = useExpenses();

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState("newest");

  const filteredExpenses = useMemo(() => {
    let result = [...expenses];

    if (search.trim()) {
      const searchValue = search.toLowerCase();

      result = result.filter((expense) =>
        `${expense.title || ""} ${
          expense.description || ""
        }`
          .toLowerCase()
          .includes(searchValue)
      );
    }

    if (category) {
      result = result.filter(
        (expense) => expense.category === category
      );
    }

    result.sort((a, b) => {
      switch (sort) {
        case "oldest":
          return new Date(a.date) - new Date(b.date);

        case "highest":
          return Number(b.amount) - Number(a.amount);

        case "lowest":
          return Number(a.amount) - Number(b.amount);

        case "newest":
        default:
          return new Date(b.date) - new Date(a.date);
      }
    });

    return result;
  }, [expenses, search, category, sort]);

  const handleDelete = async (expense) => {
    const confirmed = window.confirm(
      `Delete "${expense.title || "this expense"}"?`
    );

    if (!confirmed) return;

    try {
      await removeExpense(expense._id);
    } catch {
      // Store handles the error.
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Expenses
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Track and manage your spending.
          </p>
        </div>

        <Button onClick={() => navigate("/app/expenses/add")}>
          + Add Expense
        </Button>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Filters */}
      <ExpenseFilters
        search={search}
        setSearch={setSearch}
        category={category}
        setCategory={setCategory}
        sort={sort}
        setSort={setSort}
      />

      {/* Results */}
      <Card
        title={`${filteredExpenses.length} ${
          filteredExpenses.length === 1
            ? "Expense"
            : "Expenses"
        }`}
      >
        <ExpenseList
          expenses={filteredExpenses}
          loading={loading}
          onEdit={(expense) =>
            navigate(`/app/expenses/${expense._id}/edit`)
          }
          onDelete={handleDelete}
        />
      </Card>
    </div>
  );
};

export default Expenses;