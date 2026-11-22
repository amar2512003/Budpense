import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

import Card from "../../components/ui/Card";
import Loader from "../../components/ui/Loader";
import ExpenseForm from "../../components/expense/ExpenseForm";

import useExpenseStore from "../../store/expenseStore";

const EditExpense = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const selectedExpense = useExpenseStore(
    (state) => state.selectedExpense
  );

  const loading = useExpenseStore(
    (state) => state.loading
  );

  const fetchExpenseById = useExpenseStore(
    (state) => state.fetchExpenseById
  );

  const editExpense = useExpenseStore(
    (state) => state.editExpense
  );

  useEffect(() => {
    fetchExpenseById(id);

    return () => {
      useExpenseStore
        .getState()
        .clearSelectedExpense();
    };
  }, [id, fetchExpenseById]);

  const handleSubmit = async (data) => {
    await editExpense(id, data);

    navigate("/app/expenses");
  };

  if (loading && !selectedExpense) {
    return <Loader />;
  }

  if (!selectedExpense) {
    return (
      <div className="rounded-xl bg-white dark:bg-gray-900 p-8 text-center">
        <h2 className="font-semibold text-gray-900 dark:text-gray-100">
          Expense not found
        </h2>

        <button
          onClick={() => navigate("/app/expenses")}
          className="mt-3 text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
        >
          Back to expenses
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Edit Expense
        </h1>

        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Update your expense information.
        </p>
      </div>

      <Card>
        <ExpenseForm
          initialData={selectedExpense}
          onSubmit={handleSubmit}
          loading={loading}
          onCancel={() => navigate("/app/expenses")}
        />
      </Card>
    </div>
  );
};

export default EditExpense;