import { create } from "zustand";

import {
  changePassword as changePasswordRequest,
  getCurrentUser,
  loginUser,
  logoutUser,
  registerUser,
  updateProfile as updateProfileRequest,
} from "../services/authService";
import { toErrorMessage } from "../utils/errorMessage";

const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  // True until the first /auth/me answers. Starting false would let
  // ProtectedRoute see "not authenticated" on the first render of a hard
  // refresh and redirect a signed-in user to the login page.
  isLoading: true,
  error: null,

  checkAuth: async () => {
    try {
      const { data } = await getCurrentUser();

      set({ user: data.user, isAuthenticated: true, isLoading: false, error: null });

      return data.user;
    } catch {
      // No session is the normal answer here, not an error worth showing.
      set({ user: null, isAuthenticated: false, isLoading: false, error: null });

      return null;
    }
  },

  login: async (credentials) => {
    set({ isLoading: true, error: null });

    try {
      const { data } = await loginUser(credentials);

      set({ user: data.user, isAuthenticated: true, isLoading: false, error: null });

      return data.user;
    } catch (error) {
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: toErrorMessage(error),
      });

      throw error;
    }
  },

  register: async (details) => {
    set({ isLoading: true, error: null });

    try {
      const { data } = await registerUser(details);

      set({ user: data.user, isAuthenticated: true, isLoading: false, error: null });

      return data.user;
    } catch (error) {
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: toErrorMessage(error),
      });

      throw error;
    }
  },

  logout: async () => {
    try {
      await logoutUser();
    } catch {
      // Never rethrown: the caller navigates away on the next line, and the
      // alternative is someone who pressed log out, saw an error, and is still
      // looking at their own data. The session is cleared locally either way.
    } finally {
      set({ user: null, isAuthenticated: false, isLoading: false, error: null });
    }
  },

  updateProfile: async (details) => {
    try {
      const { data } = await updateProfileRequest(details);

      set({ user: data.user, error: null });

      return data.user;
    } catch (error) {
      throw new Error(toErrorMessage(error));
    }
  },

  changePassword: async (passwords) => {
    try {
      await changePasswordRequest(passwords);
    } catch (error) {
      throw new Error(toErrorMessage(error));
    }
  },

  clearError: () => set({ error: null }),
}));

export default useAuthStore;
