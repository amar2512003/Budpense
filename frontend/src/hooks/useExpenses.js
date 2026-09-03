// src/hooks/useExpenses.js

import { useEffect } from "react";
import useExpenseStore from "../store/expenseStore";

const useExpenses = (params = {}) => {
  const expenses = useExpenseStore(
    (state) => state.expenses
  );

  const loading = useExpenseStore(
    (state) => state.loading
  );

  const error = useExpenseStore(
    (state) => state.error
  );

  const fetchExpenses = useExpenseStore(
    (state) => state.fetchExpenses
  );

  const addExpense = useExpenseStore(
    (state) => state.addExpense
  );

  const editExpense = useExpenseStore(
    (state) => state.editExpense
  );

  const removeExpense = useExpenseStore(
    (state) => state.removeExpense
  );

  useEffect(() => {
    fetchExpenses(params);
  }, []);

  return {
    expenses,
    loading,
    error,
    fetchExpenses,
    addExpense,
    editExpense,
    removeExpense,
  };
};

export default useExpenses;