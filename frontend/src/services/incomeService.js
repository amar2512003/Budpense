// src/services/incomeService.js

import api from "./api";

// ==========================================
// GET ALL INCOME
// ==========================================

export const getIncome = async (params = {}) => {
  const response = await api.get(
    "/income",
    {
      params,
    }
  );

  return response.data;
};

// ==========================================
// GET SINGLE INCOME
// ==========================================

export const getIncomeById = async (id) => {
  const response = await api.get(
    `/income/${id}`
  );

  return response.data;
};

// ==========================================
// CREATE INCOME
// ==========================================

export const createIncome = async (
  incomeData
) => {
  const response = await api.post(
    "/income",
    incomeData
  );

  return response.data;
};

// ==========================================
// UPDATE INCOME
// ==========================================

export const updateIncome = async (
  id,
  incomeData
) => {
  const response = await api.put(
    `/income/${id}`,
    incomeData
  );

  return response.data;
};

// ==========================================
// DELETE INCOME
// ==========================================

export const deleteIncome = async (id) => {
  const response = await api.delete(
    `/income/${id}`
  );

  return response.data;
};