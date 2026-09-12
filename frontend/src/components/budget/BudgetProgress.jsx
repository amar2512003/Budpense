// src/components/budget/BudgetProgress.jsx

import { formatCurrency } from "../../utils/formatCurrency";

const BudgetProgress = ({
  category,
  spent = 0,
  limit = 0,
}) => {
  const numericSpent = Number(spent) || 0;
  const numericLimit = Number(limit) || 0;

  const percentage =
    numericLimit > 0
      ? (numericSpent / numericLimit) * 100
      : 0;

  const isOverBudget =
    numericSpent > numericLimit;

  const displayPercentage = Math.round(
    percentage
  );

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">
          {category}
        </span>

        <span
          className={`text-sm font-semibold ${
            isOverBudget
              ? "text-red-600"
              : "text-gray-700"
          }`}
        >
          {formatCurrency(numericSpent)} /{" "}
          {formatCurrency(numericLimit)}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-2.5 overflow-hidden rounded-full bg-gray-100">
        <div
          className={`h-full rounded-full transition-all ${
            isOverBudget
              ? "bg-red-500"
              : "bg-indigo-600"
          }`}
          style={{
            width: `${Math.min(percentage, 100)}%`,
          }}
        />
      </div>

      {/* Percentage */}
      <div className="flex justify-between">
        <span className="text-xs text-gray-500">
          {isOverBudget
            ? "Budget exceeded"
            : `${100 - displayPercentage}% remaining`}
        </span>

        <span
          className={`text-xs font-medium ${
            isOverBudget
              ? "text-red-600"
              : "text-gray-500"
          }`}
        >
          {displayPercentage}%
        </span>
      </div>
    </div>
  );
};

export default BudgetProgress;