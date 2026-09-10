import { create } from "zustand";

import {
  createLocalId,
  readStoredValue,
  writeStoredValue,
} from "../utils/localStorage";

const INCOME_STORAGE_KEY = "budpense-income";

const getStoredIncome = () => {
  const income = readStoredValue(INCOME_STORAGE_KEY, []);

  return Array.isArray(income) ? income : [];
};

const saveIncome = (income) => {
  writeStoredValue(INCOME_STORAGE_KEY, income);
};

const useIncomeStore = create((set, get) => ({
  income: getStoredIncome(),
  loading: false,
  error: null,

  addIncome: async (incomeData) => {
    const newIncome = {
      ...incomeData,
      _id: createLocalId(),
    };
    const income = [newIncome, ...get().income];

    saveIncome(income);
    set({ income, loading: false, error: null });

    return newIncome;
  },

  editIncome: async (id, incomeData) => {
    const income = get().income.map((entry) =>
      entry._id === id || entry.id === id
        ? { ...entry, ...incomeData, _id: entry._id || id }
        : entry
    );

    saveIncome(income);
    set({ income, loading: false, error: null });
  },

  removeIncome: async (id) => {
    const income = get().income.filter(
      (entry) => entry._id !== id && entry.id !== id
    );

    saveIncome(income);
    set({ income, loading: false, error: null });
  },
}));

export default useIncomeStore;
