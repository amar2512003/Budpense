import { create } from "zustand";

import {
  createLocalId,
  readStoredValue,
  writeStoredValue,
} from "../utils/localStorage";

const EXPENSES_STORAGE_KEY = "budpense-expenses";

const getStoredExpenses = () => {
  const expenses = readStoredValue(EXPENSES_STORAGE_KEY, []);

  return Array.isArray(expenses) ? expenses : [];
};

const saveExpenses = (expenses) => {
  writeStoredValue(EXPENSES_STORAGE_KEY, expenses);
};

const useExpenseStore = create((set, get) => ({
  expenses: getStoredExpenses(),
  selectedExpense: null,
  loading: false,
  error: null,

  fetchExpenses: async () => {
    const expenses = getStoredExpenses();

    set({ expenses, loading: false, error: null });

    return expenses;
  },

  fetchExpenseById: async (id) => {
    const expenses = getStoredExpenses();
    const selectedExpense = expenses.find(
      (expense) => expense._id === id || expense.id === id
    );

    set({
      expenses,
      selectedExpense: selectedExpense || null,
      loading: false,
      error: null,
    });

    return selectedExpense || null;
  },

  addExpense: async (expenseData) => {
    const newExpense = {
      ...expenseData,
      _id: createLocalId(),
    };
    const expenses = [newExpense, ...get().expenses];

    saveExpenses(expenses);
    set({ expenses, loading: false, error: null });

    return newExpense;
  },

  editExpense: async (id, expenseData) => {
    const expenses = get().expenses.map((expense) =>
      expense._id === id || expense.id === id
        ? { ...expense, ...expenseData, _id: expense._id || id }
        : expense
    );
    const updatedExpense = expenses.find(
      (expense) => expense._id === id || expense.id === id
    );

    saveExpenses(expenses);
    set({
      expenses,
      selectedExpense: updatedExpense || null,
      loading: false,
      error: null,
    });

    return updatedExpense || null;
  },

  removeExpense: async (id) => {
    const expenses = get().expenses.filter(
      (expense) => expense._id !== id && expense.id !== id
    );

    saveExpenses(expenses);
    set({ expenses, loading: false, error: null });
  },

  clearError: () => set({ error: null }),
  clearSelectedExpense: () => set({ selectedExpense: null }),
}));

export default useExpenseStore;
