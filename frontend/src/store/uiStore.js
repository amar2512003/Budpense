// src/store/uiStore.js

import { create } from "zustand";

const useUIStore = create((set) => ({
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