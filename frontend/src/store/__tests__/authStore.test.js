import { beforeEach, describe, expect, it, vi } from "vitest";

import useAuthStore from "../authStore";

vi.mock("../../services/authService", () => ({
  loginUser: vi.fn(),
  registerUser: vi.fn(),
  logoutUser: vi.fn(),
  getCurrentUser: vi.fn(),
  updateProfile: vi.fn(),
  changePassword: vi.fn(),
}));

const service = await import("../../services/authService");

const USER = { id: "u1", name: "Ada", email: "ada@example.com", currency: "INR" };
const envelope = (user) => ({ data: { user } });
const rejection = (status, data) => Object.assign(new Error("Request failed"), { response: { status, data } });

beforeEach(() => {
  useAuthStore.setState({ user: null, isAuthenticated: false, isLoading: true, error: null });
});

describe("authStore", () => {
  it("starts loading, so a refresh does not bounce a signed-in user to login", () => {
    expect(useAuthStore.getState().isLoading).toBe(true);
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  it("keeps no user in browser storage", async () => {
    service.loginUser.mockResolvedValue(envelope(USER));

    await useAuthStore.getState().login({ email: USER.email, password: "a long password" });

    expect(window.localStorage.length).toBe(0);
  });

  describe("checkAuth", () => {
    it("adopts the session the API reports", async () => {
      service.getCurrentUser.mockResolvedValue(envelope(USER));

      await useAuthStore.getState().checkAuth();

      expect(useAuthStore.getState()).toMatchObject({ user: USER, isAuthenticated: true, isLoading: false });
    });

    it("clears loading on the failure path too", async () => {
      service.getCurrentUser.mockRejectedValue(rejection(401, { message: "Not authorised" }));

      await useAuthStore.getState().checkAuth();

      expect(useAuthStore.getState()).toMatchObject({ user: null, isAuthenticated: false, isLoading: false });
    });

    it("does not treat a missing session as an error worth showing", async () => {
      service.getCurrentUser.mockRejectedValue(rejection(401, { message: "Not authorised" }));

      await useAuthStore.getState().checkAuth();

      expect(useAuthStore.getState().error).toBeNull();
    });
  });

  describe("login", () => {
    it("stores the user the API returns", async () => {
      service.loginUser.mockResolvedValue(envelope(USER));

      const result = await useAuthStore.getState().login({ email: USER.email, password: "a long password" });

      expect(result).toEqual(USER);
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
    });

    it("sends the credentials through unchanged", async () => {
      service.loginUser.mockResolvedValue(envelope(USER));

      await useAuthStore.getState().login({ email: "ADA@example.com", password: " spaced " });

      expect(service.loginUser).toHaveBeenCalledWith({ email: "ADA@example.com", password: " spaced " });
    });

    it("shows the API's own message on a bad password", async () => {
      service.loginUser.mockRejectedValue(rejection(401, { message: "Incorrect email or password" }));

      await expect(useAuthStore.getState().login({ email: "x@y.z", password: "nope" })).rejects.toThrow();
      expect(useAuthStore.getState().error).toBe("Incorrect email or password");
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });

    it("reads out field errors rather than the generic validation message", async () => {
      service.loginUser.mockRejectedValue(
        rejection(400, { message: "Validation failed", errors: { email: "Enter a valid email address" } }),
      );

      await expect(useAuthStore.getState().login({ email: "nope", password: "x" })).rejects.toThrow();
      expect(useAuthStore.getState().error).toBe("Enter a valid email address");
    });

    it("says so plainly when the API cannot be reached", async () => {
      service.loginUser.mockRejectedValue(Object.assign(new Error("Network Error"), { response: undefined }));

      await expect(useAuthStore.getState().login({ email: "x@y.z", password: "x" })).rejects.toThrow();
      expect(useAuthStore.getState().error).toMatch(/cannot reach the server/i);
    });

    it("leaves loading false after a failure", async () => {
      service.loginUser.mockRejectedValue(rejection(401, { message: "Incorrect email or password" }));

      await expect(useAuthStore.getState().login({ email: "x@y.z", password: "x" })).rejects.toThrow();
      expect(useAuthStore.getState().isLoading).toBe(false);
    });
  });

  describe("register", () => {
    it("signs the new account straight in", async () => {
      service.registerUser.mockResolvedValue(envelope(USER));

      await useAuthStore.getState().register({ name: "Ada", email: USER.email, password: "a long password" });

      expect(useAuthStore.getState()).toMatchObject({ user: USER, isAuthenticated: true });
    });

    it("surfaces a taken email", async () => {
      service.registerUser.mockRejectedValue(rejection(409, { message: "An account with this email already exists" }));

      await expect(
        useAuthStore.getState().register({ name: "Ada", email: USER.email, password: "a long password" }),
      ).rejects.toThrow();
      expect(useAuthStore.getState().error).toBe("An account with this email already exists");
    });
  });

  describe("logout", () => {
    it("clears the session", async () => {
      service.logoutUser.mockResolvedValue({ data: {} });
      useAuthStore.setState({ user: USER, isAuthenticated: true, isLoading: false });

      await useAuthStore.getState().logout();

      expect(useAuthStore.getState()).toMatchObject({ user: null, isAuthenticated: false });
    });

    it("still signs the user out when the request fails", async () => {
      service.logoutUser.mockRejectedValue(rejection(500, { message: "Something went wrong" }));
      useAuthStore.setState({ user: USER, isAuthenticated: true, isLoading: false });

      await useAuthStore.getState().logout();

      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });
  });

  describe("profile", () => {
    it("replaces the stored user after an update", async () => {
      const updated = { ...USER, name: "Ada Lovelace" };
      service.updateProfile.mockResolvedValue(envelope(updated));
      useAuthStore.setState({ user: USER, isAuthenticated: true, isLoading: false });

      await useAuthStore.getState().updateProfile({ name: "Ada Lovelace", email: USER.email });

      expect(useAuthStore.getState().user).toEqual(updated);
    });

    it("throws a readable message when the email is taken", async () => {
      service.updateProfile.mockRejectedValue(rejection(409, { message: "An account with this email already exists" }));

      await expect(
        useAuthStore.getState().updateProfile({ name: "Ada", email: "taken@example.com" }),
      ).rejects.toThrow("An account with this email already exists");
    });

    it("throws a readable message when the current password is wrong", async () => {
      service.changePassword.mockRejectedValue(rejection(401, { message: "Your current password is incorrect" }));

      await expect(
        useAuthStore.getState().changePassword({ currentPassword: "wrong", password: "a long password" }),
      ).rejects.toThrow("Your current password is incorrect");
    });

    it("resolves quietly when the password change succeeds", async () => {
      service.changePassword.mockResolvedValue({ data: { message: "Password updated" } });

      await expect(
        useAuthStore.getState().changePassword({ currentPassword: "old password", password: "a long password" }),
      ).resolves.toBeUndefined();
    });
  });

  it("clears an error on demand", () => {
    useAuthStore.setState({ error: "something" });

    useAuthStore.getState().clearError();

    expect(useAuthStore.getState().error).toBeNull();
  });
});
