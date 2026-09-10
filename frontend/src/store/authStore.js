import { create } from "zustand";

import {
  readStoredValue,
  removeStoredValue,
  writeStoredValue,
} from "../utils/localStorage";

const ACCOUNTS_STORAGE_KEY = "budpense-accounts";
const CURRENT_USER_STORAGE_KEY = "budpense-current-user";

const getAccounts = () => {
  const accounts = readStoredValue(ACCOUNTS_STORAGE_KEY, []);

  return Array.isArray(accounts) ? accounts : [];
};

const getCurrentUser = () =>
  readStoredValue(CURRENT_USER_STORAGE_KEY, null);

const normalizeEmail = (email) => email.trim().toLowerCase();

const createAuthError = (message) => {
  const error = new Error(message);
  error.response = { data: { message } };

  return error;
};

const useAuthStore = create((set, get) => {
  const storedUser = getCurrentUser();

  return {
    user: storedUser,
    isAuthenticated: Boolean(storedUser),
    isLoading: false,
    error: null,

    checkAuth: async () => {
      const user = getCurrentUser();

      set({
        user,
        isAuthenticated: Boolean(user),
        isLoading: false,
        error: null,
      });

      return user;
    },

    login: async ({ email, password }) => {
      set({ isLoading: true, error: null });

      const account = getAccounts().find(
        (entry) => entry.email === normalizeEmail(email)
      );

      if (!account || account.password !== password) {
        const error = createAuthError("Incorrect email or password.");

        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: error.message,
        });

        throw error;
      }

      const user = { name: account.name, email: account.email };

      writeStoredValue(CURRENT_USER_STORAGE_KEY, user);
      set({
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      return { user };
    },

    register: async ({ name, email, password }) => {
      set({ isLoading: true, error: null });

      const normalizedEmail = normalizeEmail(email);
      const accounts = getAccounts();

      if (accounts.some((account) => account.email === normalizedEmail)) {
        const error = createAuthError("An account with this email already exists.");

        set({ isLoading: false, error: error.message });

        throw error;
      }

      const account = {
        name: name.trim(),
        email: normalizedEmail,
        password,
      };
      const user = { name: account.name, email: account.email };

      writeStoredValue(ACCOUNTS_STORAGE_KEY, [...accounts, account]);
      writeStoredValue(CURRENT_USER_STORAGE_KEY, user);
      set({
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      return { user };
    },

    updateProfile: async ({ name, email }) => {
      const currentUser = get().user;

      if (!currentUser) {
        throw createAuthError("Please sign in before updating your profile.");
      }

      const normalizedEmail = normalizeEmail(email);
      const accounts = getAccounts();
      const emailTaken = accounts.some(
        (account) =>
          account.email === normalizedEmail &&
          account.email !== currentUser.email
      );

      if (emailTaken) {
        throw createAuthError("An account with this email already exists.");
      }

      const user = { name: name.trim(), email: normalizedEmail };
      const updatedAccounts = accounts.map((account) =>
        account.email === currentUser.email
          ? { ...account, ...user }
          : account
      );

      writeStoredValue(ACCOUNTS_STORAGE_KEY, updatedAccounts);
      writeStoredValue(CURRENT_USER_STORAGE_KEY, user);
      set({ user, error: null });

      return user;
    },

    changePassword: async ({ currentPassword, password }) => {
      const currentUser = get().user;
      const accounts = getAccounts();
      const account = accounts.find(
        (entry) => entry.email === currentUser?.email
      );

      if (!account || account.password !== currentPassword) {
        throw createAuthError("Your current password is incorrect.");
      }

      writeStoredValue(
        ACCOUNTS_STORAGE_KEY,
        accounts.map((entry) =>
          entry.email === account.email ? { ...entry, password } : entry
        )
      );
    },

    logout: async () => {
      removeStoredValue(CURRENT_USER_STORAGE_KEY);
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    },

    clearError: () => set({ error: null }),
  };
});

export default useAuthStore;
