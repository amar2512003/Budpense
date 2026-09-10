// src/pages/budgets/Budgets.jsx

import { useEffect, useMemo, useState } from "react";

import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";
import Loader from "../../components/ui/Loader";

import BudgetCard from "../../components/budget/BudgetCard";
import BudgetForm from "../../components/budget/BudgetForm";

import useBudgetStore from "../../store/budgetStore";
import useExpenseStore from "../../store/expenseStore";
import { entriesForMonth, totalAmount } from "../../utils/finance";

const Budgets = () => {
  const budgets = useBudgetStore(
    (state) => state.budgets
  );

  const expenses = useExpenseStore(
    (state) => state.expenses
  );

  const loading = useBudgetStore(
    (state) => state.loading
  );

  const error = useBudgetStore(
    (state) => state.error
  );

  const fetchBudgets = useBudgetStore(
    (state) => state.fetchBudgets
  );

  const addBudget = useBudgetStore(
    (state) => state.addBudget
  );

  const editBudget = useBudgetStore(
    (state) => state.editBudget
  );

  const removeBudget = useBudgetStore(
    (state) => state.removeBudget
  );

  const [isModalOpen, setIsModalOpen] =
    useState(false);

  const [editingBudget, setEditingBudget] =
    useState(null);

  const budgetsWithSpending = useMemo(
    () =>
      budgets.map((budget) => {
        const month = String(budget.month || "").padStart(2, "0");
        const monthKey = `${budget.year}-${month}`;
        const categoryExpenses = entriesForMonth(
          expenses,
          monthKey
        ).filter(
          (expense) => expense.category === budget.category
        );

        return {
          ...budget,
          spent: totalAmount(categoryExpenses),
        };
      }),
    [budgets, expenses]
  );

  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets]);

  const handleAdd = () => {
    setEditingBudget(null);
    setIsModalOpen(true);
  };

  const handleEdit = (budget) => {
    setEditingBudget(budget);
    setIsModalOpen(true);
  };

  const handleDelete = async (budget) => {
    const confirmed = window.confirm(
      `Delete ${budget.category} budget?`
    );

    if (!confirmed) return;

    try {
      await removeBudget(budget._id);
    } catch {
      // Store handles the error.
    }
  };

  const handleSubmit = async (data) => {
    try {
      if (editingBudget) {
        await editBudget(
          editingBudget._id,
          data
        );
      } else {
        await addBudget(data);
      }

      setIsModalOpen(false);
      setEditingBudget(null);
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
            Budgets
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Set spending limits and stay on track.
          </p>
        </div>

        <Button onClick={handleAdd}>
          + Create Budget
        </Button>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Budget List */}
      <Card
        title="Your Budgets"
        description="Monitor your spending against your limits."
      >
        {loading && !budgetsWithSpending.length ? (
          <Loader />
        ) : budgetsWithSpending.length === 0 ? (
          <div className="py-12 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-xl">
              ₹
            </div>

            <h3 className="mt-4 font-semibold text-gray-900">
              No budgets yet
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              Create your first budget to start
              controlling your spending.
            </p>

            <div className="mt-5">
              <Button onClick={handleAdd}>
                Create Your First Budget
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {budgetsWithSpending.map((budget) => (
              <BudgetCard
                key={
                  budget._id || budget.id
                }
                budget={budget}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingBudget(null);
        }}
        title={
          editingBudget
            ? "Edit Budget"
            : "Create Budget"
        }
      >
        <BudgetForm
          initialData={
            editingBudget || {}
          }
          onSubmit={handleSubmit}
          onCancel={() => {
            setIsModalOpen(false);
            setEditingBudget(null);
          }}
          loading={loading}
        />
      </Modal>
    </div>
  );
};

export default Budgets;
