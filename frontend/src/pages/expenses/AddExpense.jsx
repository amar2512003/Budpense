import { useNavigate } from "react-router-dom";

import Card from "../../components/ui/Card";
import ExpenseForm from "../../components/expense/ExpenseForm";

import useExpenseStore from "../../store/expenseStore";

const AddExpense = () => {
  const navigate = useNavigate();

  const addExpense = useExpenseStore(
    (state) => state.addExpense
  );

  const loading = useExpenseStore(
    (state) => state.loading
  );

  const handleSubmit = async (data) => {
    await addExpense(data);

    navigate("/app/expenses");
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Add Expense
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Record a new expense.
        </p>
      </div>

      <Card>
        <ExpenseForm
          onSubmit={handleSubmit}
          loading={loading}
          onCancel={() => navigate("/app/expenses")}
        />
      </Card>
    </div>
  );
};

export default AddExpense;