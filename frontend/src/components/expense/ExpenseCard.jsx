import { formatCurrency } from "../../utils/formatCurrency";
import { formatDate } from "../../utils/formatDate";

const ExpenseCard = ({
  expense,
  onEdit,
  onDelete,
}) => {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-gray-200 bg-white p-4 transition hover:shadow-sm">
      <div className="flex min-w-0 items-center gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
          ₹
        </div>

        <div className="min-w-0">
          <h3 className="truncate font-medium text-gray-900">
            {expense.title || expense.description || "Expense"}
          </h3>

          <div className="mt-1 flex flex-wrap gap-2 text-xs text-gray-500">
            <span>{expense.category}</span>
            <span>•</span>
            <span>{formatDate(expense.date)}</span>
          </div>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-4">
        <p className="font-semibold text-red-600">
          - {formatCurrency(expense.amount)}
        </p>

        <div className="hidden gap-1 sm:flex">
          <button
            onClick={() => onEdit?.(expense)}
            className="rounded-md px-2 py-1 text-xs text-gray-600 hover:bg-gray-100"
          >
            Edit
          </button>

          <button
            onClick={() => onDelete?.(expense)}
            className="rounded-md px-2 py-1 text-xs text-red-600 hover:bg-red-50"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExpenseCard;