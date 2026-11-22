import { create } from "zustand";

import {
  createRecurring,
  deleteRecurring,
  getRecurring,
  updateRecurring,
} from "../services/recurringService";
import { toErrorMessage } from "../utils/errorMessage";

const useRecurringStore = create((set) => ({
  rules: { expense: [], income: [] },
  loading: false,
  error: null,

  fetchRules: async () => {
    set({ loading: true, error: null });

    try {
      const [expense, income] = await Promise.all([
        getRecurring("expense"),
        getRecurring("income"),
      ]);

      set({
        rules: { expense: expense.data.items, income: income.data.items },
        loading: false,
      });
    } catch (error) {
      set({ loading: false, error: toErrorMessage(error) });
    }
  },

  addRule: async (type, ruleData) => {
    set({ loading: true, error: null });

    try {
      const { data } = await createRecurring(type, ruleData);

      set((state) => ({
        rules: { ...state.rules, [type]: [data.recurring, ...state.rules[type]] },
        loading: false,
      }));

      return data.recurring;
    } catch (error) {
      // Shown by the form that submitted it, not as a page-level error.
      set({ loading: false });

      throw new Error(toErrorMessage(error));
    }
  },

  editRule: async (type, id, ruleData) => {
    set({ loading: true, error: null });

    try {
      const { data } = await updateRecurring(type, id, ruleData);

      set((state) => ({
        rules: {
          ...state.rules,
          [type]: state.rules[type].map((rule) => (rule._id === id ? data.recurring : rule)),
        },
        loading: false,
      }));

      return data.recurring;
    } catch (error) {
      set({ loading: false });

      throw new Error(toErrorMessage(error));
    }
  },

  removeRule: async (type, id) => {
    try {
      await deleteRecurring(type, id);

      set((state) => ({
        rules: { ...state.rules, [type]: state.rules[type].filter((rule) => rule._id !== id) },
      }));
    } catch (error) {
      set({ error: toErrorMessage(error) });
    }
  },
}));

export default useRecurringStore;
