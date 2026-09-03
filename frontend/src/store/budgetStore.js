import { create } from "zustand";

import {
  createLocalId,
  readStoredValue,
  writeStoredValue,
} from "../utils/localStorage";

const BUDGETS_STORAGE_KEY = "budpense-budgets";

const getStoredBudgets = () => {
  const budgets = readStoredValue(BUDGETS_STORAGE_KEY, []);

  return Array.isArray(budgets) ? budgets : [];
};

const saveBudgets = (budgets) => {
  writeStoredValue(BUDGETS_STORAGE_KEY, budgets);
};

const useBudgetStore = create((set, get) => ({
  budgets: getStoredBudgets(),
  selectedBudget: null,
  loading: false,
  error: null,

  fetchBudgets: async () => {
    const budgets = getStoredBudgets();

    set({ budgets, loading: false, error: null });

    return budgets;
  },

  fetchBudgetById: async (id) => {
    const budgets = getStoredBudgets();
    const selectedBudget = budgets.find(
      (budget) => budget._id === id || budget.id === id
    );

    set({
      budgets,
      selectedBudget: selectedBudget || null,
      loading: false,
      error: null,
    });

    return selectedBudget || null;
  },

  addBudget: async (budgetData) => {
    const newBudget = {
      ...budgetData,
      _id: createLocalId(),
    };
    const budgets = [newBudget, ...get().budgets];

    saveBudgets(budgets);
    set({ budgets, loading: false, error: null });

    return newBudget;
  },

  editBudget: async (id, budgetData) => {
    const budgets = get().budgets.map((budget) =>
      budget._id === id || budget.id === id
        ? { ...budget, ...budgetData, _id: budget._id || id }
        : budget
    );
    const updatedBudget = budgets.find(
      (budget) => budget._id === id || budget.id === id
    );

    saveBudgets(budgets);
    set({
      budgets,
      selectedBudget: updatedBudget || null,
      loading: false,
      error: null,
    });

    return updatedBudget || null;
  },

  removeBudget: async (id) => {
    const budgets = get().budgets.filter(
      (budget) => budget._id !== id && budget.id !== id
    );

    saveBudgets(budgets);
    set({ budgets, loading: false, error: null });
  },

  clearError: () => set({ error: null }),
  clearSelectedBudget: () => set({ selectedBudget: null }),
  resetBudgetStore: () =>
    set({
      budgets: [],
      selectedBudget: null,
      loading: false,
      error: null,
    }),
}));

export default useBudgetStore;
