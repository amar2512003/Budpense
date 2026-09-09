// src/services/authService.js

import api from "./api";

// ==========================================
// REGISTER
// ==========================================

export const registerUser = async (userData) => {
  const response = await api.post(
    "/auth/register",
    userData
  );

  return response.data;
};

// ==========================================
// LOGIN
// ==========================================

export const loginUser = async (credentials) => {
  const response = await api.post(
    "/auth/login",
    credentials
  );

  return response.data;
};

// ==========================================
// GET CURRENT USER
// ==========================================

export const getCurrentUser = async () => {
  const response = await api.get(
    "/auth/me"
  );

  return response.data;
};

// ==========================================
// LOGOUT
// ==========================================

export const logoutUser = async () => {
  const response = await api.post(
    "/auth/logout"
  );

  return response.data;
};

// ==========================================
// FORGOT PASSWORD
// ==========================================

export const forgotPassword = async (email) => {
  const response = await api.post(
    "/auth/forgot-password",
    { email }
  );

  return response.data;
};

// ==========================================
// RESET PASSWORD
// ==========================================

export const resetPassword = async (
  token,
  password
) => {
  const response = await api.post(
    `/auth/reset-password/${token}`,
    { password }
  );

  return response.data;
};

// ==========================================
// UPDATE PROFILE
// ==========================================

export const updateProfile = async (
  userData
) => {
  const response = await api.put(
    "/auth/profile",
    userData
  );

  return response.data;
};

// ==========================================
// CHANGE PASSWORD
// ==========================================

export const changePassword = async (
  passwordData
) => {
  const response = await api.put(
    "/auth/change-password",
    passwordData
  );

  return response.data;
};