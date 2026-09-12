import { create } from "zustand";

import {
  createBudget,
  deleteBudget,
  getBudgets,
  updateBudget,
} from "../services/budgetService";
import { toErrorMessage } from "../utils/errorMessage";

const useBudgetStore = create((set, get) => ({
  // Each budget arrives with spent, remaining, percentage and isOverBudget
  // already computed by the API, so nothing here derives them.
  budgets: [],
  loading: false,
  error: null,

  fetchBudgets: async () => {
    set({ loading: true, error: null });

    try {
      const { data } = await getBudgets();

      set({ budgets: data.budgets, loading: false, error: null });

      return data.budgets;
    } catch (error) {
      set({ budgets: [], loading: false, error: toErrorMessage(error) });

      return [];
    }
  },

  addBudget: async (budgetData) => {
    set({ loading: true, error: null });

    try {
      const { data } = await createBudget(budgetData);

      set((state) => ({ budgets: [data.budget, ...state.budgets], loading: false, error: null }));

      return data.budget;
    } catch (error) {
      const message = toErrorMessage(error);

      // Not stored as a page-level error: the form that submitted this shows
      // the thrown message, and setting both renders it twice.
      set({ loading: false });

      throw new Error(message);
    }
  },

  editBudget: async (id, budgetData) => {
    set({ loading: true, error: null });

    try {
      const { data } = await updateBudget(id, budgetData);

      set((state) => ({
        budgets: state.budgets.map((budget) => (budget._id === id ? data.budget : budget)),
        loading: false,
        error: null,
      }));

      return data.budget;
    } catch (error) {
      const message = toErrorMessage(error);

      // Not stored as a page-level error: the form that submitted this shows
      // the thrown message, and setting both renders it twice.
      set({ loading: false });

      throw new Error(message);
    }
  },

  removeBudget: async (id) => {
    const previous = get().budgets;

    set((state) => ({
      budgets: state.budgets.filter((budget) => budget._id !== id),
      error: null,
    }));

    try {
      await deleteBudget(id);
    } catch (error) {
      const message = toErrorMessage(error);

      set({ budgets: previous, error: message });

      throw new Error(message);
    }
  },

  clearError: () => set({ error: null }),
}));

export default useBudgetStore;
