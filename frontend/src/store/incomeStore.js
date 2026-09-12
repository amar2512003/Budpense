import { create } from "zustand";

import {
  createIncome,
  deleteIncome,
  getIncome,
  updateIncome,
} from "../services/incomeService";
import { toErrorMessage } from "../utils/errorMessage";

export const PAGE_SIZE = 20;

const useIncomeStore = create((set, get) => ({
  income: [],
  total: 0,
  page: 1,
  pages: 1,
  loading: false,
  error: null,

  fetchIncome: async (params = {}) => {
    set({ loading: true, error: null });

    try {
      const { data } = await getIncome({ limit: PAGE_SIZE, ...params });

      set({
        income: data.items,
        total: data.total,
        page: data.page,
        pages: data.pages,
        loading: false,
        error: null,
      });

      return data.items;
    } catch (error) {
      set({ income: [], loading: false, error: toErrorMessage(error) });

      return [];
    }
  },

  addIncome: async (incomeData) => {
    set({ loading: true, error: null });

    try {
      const { data } = await createIncome(incomeData);

      set((state) => ({
        income: [data.income, ...state.income],
        total: state.total + 1,
        loading: false,
        error: null,
      }));

      return data.income;
    } catch (error) {
      const message = toErrorMessage(error);

      // Not stored as a page-level error: the form that submitted this shows
      // the thrown message, and setting both renders it twice.
      set({ loading: false });

      throw new Error(message);
    }
  },

  editIncome: async (id, incomeData) => {
    set({ loading: true, error: null });

    try {
      const { data } = await updateIncome(id, incomeData);

      set((state) => ({
        income: state.income.map((entry) => (entry._id === id ? data.income : entry)),
        loading: false,
        error: null,
      }));

      return data.income;
    } catch (error) {
      const message = toErrorMessage(error);

      // Not stored as a page-level error: the form that submitted this shows
      // the thrown message, and setting both renders it twice.
      set({ loading: false });

      throw new Error(message);
    }
  },

  removeIncome: async (id) => {
    const previous = get().income;

    set((state) => ({
      income: state.income.filter((entry) => entry._id !== id),
      total: Math.max(0, state.total - 1),
      error: null,
    }));

    try {
      await deleteIncome(id);
    } catch (error) {
      const message = toErrorMessage(error);

      set({ income: previous, total: previous.length, error: message });

      throw new Error(message);
    }
  },

  clearError: () => set({ error: null }),
}));

export default useIncomeStore;
