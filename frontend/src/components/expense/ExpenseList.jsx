import ExpenseCard from "./ExpenseCard";
import Loader from "../ui/Loader";

const ExpenseList = ({
  expenses = [],
  loading = false,
  onEdit,
  onDelete,
}) => {
  if (loading) {
    return <Loader />;
  }

  if (!expenses.length) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
          ₹
        </div>

        <h3 className="font-medium text-gray-900">
          No expenses found
        </h3>

        <p className="mt-1 text-sm text-gray-500">
          Add your first expense to start tracking your spending.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {expenses.map((expense) => (
        <ExpenseCard
          key={expense._id || expense.id}
          expense={expense}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};

export default ExpenseList;