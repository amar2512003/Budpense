import { create } from "zustand";

import {
  createExpense,
  deleteExpense,
  getExpenseById,
  getExpenses,
  updateExpense,
} from "../services/expenseService";
import { toErrorMessage } from "../utils/errorMessage";

// The API caps a page at 100. Filtering and sorting are sent with the request
// rather than applied here, so a filter searches everything the account holds
// and not just the page that happens to be loaded.
export const PAGE_SIZE = 20;

const useExpenseStore = create((set, get) => ({
  expenses: [],
  selectedExpense: null,
  total: 0,
  page: 1,
  pages: 1,
  loading: false,
  error: null,

  fetchExpenses: async (params = {}) => {
    set({ loading: true, error: null });

    try {
      const { data } = await getExpenses({ limit: PAGE_SIZE, ...params });

      set({
        expenses: data.items,
        total: data.total,
        page: data.page,
        pages: data.pages,
        loading: false,
        error: null,
      });

      return data.items;
    } catch (error) {
      set({ expenses: [], loading: false, error: toErrorMessage(error) });

      return [];
    }
  },

  fetchExpenseById: async (id) => {
    set({ loading: true, error: null, selectedExpense: null });

    try {
      const { data } = await getExpenseById(id);

      set({ selectedExpense: data.expense, loading: false, error: null });

      return data.expense;
    } catch (error) {
      set({ selectedExpense: null, loading: false, error: toErrorMessage(error) });

      return null;
    }
  },

  addExpense: async (expenseData) => {
    set({ loading: true, error: null });

    try {
      const { data } = await createExpense(expenseData);

      // Put it straight into the list so the page reflects the new record
      // without a second request.
      set((state) => ({
        expenses: [data.expense, ...state.expenses],
        total: state.total + 1,
        loading: false,
        error: null,
      }));

      return data.expense;
    } catch (error) {
      const message = toErrorMessage(error);

      // Not stored as a page-level error: the form that submitted this shows
      // the thrown message, and setting both renders it twice.
      set({ loading: false });

      throw new Error(message);
    }
  },

  editExpense: async (id, expenseData) => {
    set({ loading: true, error: null });

    try {
      const { data } = await updateExpense(id, expenseData);

      set((state) => ({
        expenses: state.expenses.map((expense) =>
          expense._id === id ? data.expense : expense,
        ),
        selectedExpense: data.expense,
        loading: false,
        error: null,
      }));

      return data.expense;
    } catch (error) {
      const message = toErrorMessage(error);

      // Not stored as a page-level error: the form that submitted this shows
      // the thrown message, and setting both renders it twice.
      set({ loading: false });

      throw new Error(message);
    }
  },

  removeExpense: async (id) => {
    const previous = get().expenses;

    // Removed from the list first so the row disappears at once; put back if
    // the request turns out to have failed.
    set((state) => ({
      expenses: state.expenses.filter((expense) => expense._id !== id),
      total: Math.max(0, state.total - 1),
      error: null,
    }));

    try {
      await deleteExpense(id);
    } catch (error) {
      const message = toErrorMessage(error);

      set({ expenses: previous, total: previous.length, error: message });

      throw new Error(message);
    }
  },

  clearError: () => set({ error: null }),
  clearSelectedExpense: () => set({ selectedExpense: null }),
}));

export default useExpenseStore;
