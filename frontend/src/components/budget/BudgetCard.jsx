// src/components/budget/BudgetCard.jsx

import { formatCurrency } from "../../utils/formatCurrency";

const BudgetCard = ({
  budget,
  onEdit,
  onDelete,
}) => {
  const amount = Number(budget.amount) || 0;
  const spent = Number(budget.spent) || 0;

  const percentage =
    amount > 0
      ? Math.min((spent / amount) * 100, 100)
      : 0;

  const isOverBudget = spent > amount;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-gray-900">
            {budget.category || "Budget"}
          </h3>

          <p className="mt-1 text-xs text-gray-500">
            {budget.month || "Monthly Budget"}
          </p>
        </div>

        <div className="flex gap-1">
          <button
            onClick={() => onEdit?.(budget)}
            className="rounded-md px-2 py-1 text-xs text-gray-600 hover:bg-gray-100"
          >
            Edit
          </button>

          <button
            onClick={() => onDelete?.(budget)}
            className="rounded-md px-2 py-1 text-xs text-red-600 hover:bg-red-50"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Amount */}
      <div className="mt-5 flex items-end justify-between">
        <div>
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrency(spent)}
          </p>

          <p className="mt-1 text-xs text-gray-500">
            spent of {formatCurrency(amount)}
          </p>
        </div>

        <span
          className={`text-sm font-semibold ${
            isOverBudget
              ? "text-red-600"
              : "text-indigo-600"
          }`}
        >
          {Math.round(
            amount > 0 ? (spent / amount) * 100 : 0
          )}
          %
        </span>
      </div>

      {/* Progress */}
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-gray-100">
        <div
          className={`h-full rounded-full transition-all ${
            isOverBudget
              ? "bg-red-500"
              : "bg-indigo-600"
          }`}
          style={{
            width: `${percentage}%`,
          }}
        />
      </div>

      {/* Remaining / exceeded */}
      <div className="mt-3 flex justify-between text-xs">
        <span className="text-gray-500">
          {isOverBudget ? "Exceeded by" : "Remaining"}
        </span>

        <span
          className={`font-medium ${
            isOverBudget
              ? "text-red-600"
              : "text-gray-700"
          }`}
        >
          {formatCurrency(
            Math.abs(amount - spent)
          )}
        </span>
      </div>
    </div>
  );
};

export default BudgetCard;