import { formatCurrency } from "../../utils/formatCurrency";
import { formatDate } from "../../utils/formatDate";

const ExpenseCard = ({
  expense,
  onEdit,
  onDelete,
}) => {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 transition hover:shadow-sm">
      <div className="flex min-w-0 items-center gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400">
          ₹
        </div>

        <div className="min-w-0">
          <h3 className="truncate font-medium text-gray-900 dark:text-gray-100">
            {expense.title || expense.description || "Expense"}
          </h3>

          <div className="mt-1 flex flex-wrap gap-2 text-xs text-gray-500 dark:text-gray-400">
            <span>{expense.category}</span>
            <span>•</span>
            <span>{formatDate(expense.date)}</span>
          </div>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-4">
        <p className="font-semibold text-red-600 dark:text-red-400">
          - {formatCurrency(expense.amount)}
        </p>

        {(onEdit || onDelete) && (
          <div className="hidden gap-1 sm:flex">
            {onEdit && (
              <button
                type="button"
                onClick={() => onEdit(expense)}
                className="rounded-md px-2 py-1 text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Edit
              </button>
            )}

            {onDelete && (
              <button
                type="button"
                onClick={() => onDelete(expense)}
                className="rounded-md px-2 py-1 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950"
              >
                Delete
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExpenseCard;
