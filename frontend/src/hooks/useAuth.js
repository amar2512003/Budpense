// src/hooks/useAuth.js

import { useEffect } from "react";

import useAuthStore from "../store/authStore";

const useAuth = () => {
  const user = useAuthStore(
    (state) => state.user
  );

  const isAuthenticated =
    useAuthStore(
      (state) => state.isAuthenticated
    );

  const isLoading = useAuthStore(
    (state) => state.isLoading
  );

  const error = useAuthStore(
    (state) => state.error
  );

  const login = useAuthStore(
    (state) => state.login
  );

  const register = useAuthStore(
    (state) => state.register
  );

  const logout = useAuthStore(
    (state) => state.logout
  );

  const checkAuth = useAuthStore(
    (state) => state.checkAuth
  );

  const clearError = useAuthStore(
    (state) => state.clearError
  );

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return {
    user,
    isAuthenticated,
    isLoading,
    error,

    login,
    register,
    logout,
    checkAuth,
    clearError,
  };
};

export default useAuth;