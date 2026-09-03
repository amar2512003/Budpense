// src/services/budgetService.js

import api from "./api";

// ==========================================
// GET ALL BUDGETS
// ==========================================

export const getBudgets = async (params = {}) => {
  const response = await api.get(
    "/budgets",
    {
      params,
    }
  );

  return response.data;
};

// ==========================================
// GET SINGLE BUDGET
// ==========================================

export const getBudgetById = async (id) => {
  const response = await api.get(
    `/budgets/${id}`
  );

  return response.data;
};

// ==========================================
// CREATE BUDGET
// ==========================================

export const createBudget = async (
  budgetData
) => {
  const response = await api.post(
    "/budgets",
    budgetData
  );

  return response.data;
};

// ==========================================
// UPDATE BUDGET
// ==========================================

export const updateBudget = async (
  id,
  budgetData
) => {
  const response = await api.put(
    `/budgets/${id}`,
    budgetData
  );

  return response.data;
};

// ==========================================
// DELETE BUDGET
// ==========================================

export const deleteBudget = async (id) => {
  const response = await api.delete(
    `/budgets/${id}`
  );

  return response.data;
};