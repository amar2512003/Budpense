// src/store/uiStore.js

import { create } from "zustand";

const getStoredDarkMode = () => {
  try {
    return typeof window !== "undefined" &&
      window.localStorage.getItem("budpense-dark-mode") === "true";
  } catch {
    return false;
  }
};

const applyDarkMode = (enabled) => {
  if (typeof document !== "undefined") {
    document.documentElement.classList.toggle("dark", enabled);
  }
};

const initialDarkMode = getStoredDarkMode();
applyDarkMode(initialDarkMode);

const useUIStore = create((set) => ({
  darkMode: initialDarkMode,

  toggleDarkMode: () => {
    set((state) => {
      const darkMode = !state.darkMode;

      try {
        window.localStorage.setItem("budpense-dark-mode", String(darkMode));
      } catch {
        // The theme still applies for this session when storage is unavailable.
      }

      applyDarkMode(darkMode);

      return { darkMode };
    });
  },

  // ==========================================
  // SIDEBAR
  // ==========================================

  sidebarOpen: false,

  openSidebar: () => {
    set({
      sidebarOpen: true,
    });
  },

  closeSidebar: () => {
    set({
      sidebarOpen: false,
    });
  },

  toggleSidebar: () => {
    set((state) => ({
      sidebarOpen: !state.sidebarOpen,
    }));
  },

  // ==========================================
  // MODAL
  // ==========================================

  modal: {
    isOpen: false,
    type: null,
    data: null,
  },

  openModal: (type, data = null) => {
    set({
      modal: {
        isOpen: true,
        type,
        data,
      },
    });
  },

  closeModal: () => {
    set({
      modal: {
        isOpen: false,
        type: null,
        data: null,
      },
    });
  },

  // ==========================================
  // NOTIFICATION / TOAST
  // ==========================================

  notification: {
    visible: false,
    type: "info",
    message: "",
  },

  showNotification: (
    message,
    type = "info"
  ) => {
    set({
      notification: {
        visible: true,
        type,
        message,
      },
    });
  },

  hideNotification: () => {
    set({
      notification: {
        visible: false,
        type: "info",
        message: "",
      },
    });
  },

  // ==========================================
  // LOADING OVERLAY
  // ==========================================

  globalLoading: false,

  setGlobalLoading: (loading) => {
    set({
      globalLoading: loading,
    });
  },

  // ==========================================
  // MOBILE MENU
  // ==========================================

  mobileMenuOpen: false,

  openMobileMenu: () => {
    set({
      mobileMenuOpen: true,
    });
  },

  closeMobileMenu: () => {
    set({
      mobileMenuOpen: false,
    });
  },

  toggleMobileMenu: () => {
    set((state) => ({
      mobileMenuOpen:
        !state.mobileMenuOpen,
    }));
  },

  // ==========================================
  // RESET UI
  // ==========================================

  resetUI: () => {
    set({
      sidebarOpen: false,

      modal: {
        isOpen: false,
        type: null,
        data: null,
      },

      notification: {
        visible: false,
        type: "info",
        message: "",
      },

      globalLoading: false,
      mobileMenuOpen: false,
    });
  },
}));

export default useUIStore;
