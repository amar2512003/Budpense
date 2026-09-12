import { beforeEach, describe, expect, it, vi } from "vitest";

import api from "../api";

// The interceptor is registered on the shared instance; this reaches it the way
// axios does, without a network round trip.
const rejectionHandler = api.interceptors.response.handlers[0].rejected;
const failure = (status, url) => ({ config: { url }, response: { status, data: { message: "no" } } });

describe("api client", () => {
  // jsdom's window.location is read-only, so it is replaced wholesale.
  const setLocation = (pathname) => {
    delete window.location;
    window.location = { pathname, assign: vi.fn() };
  };

  beforeEach(() => {
    setLocation("/app/expenses");
  });

  it("points at the port the API actually listens on", () => {
    expect(api.defaults.baseURL).toMatch(/5001\/api$/);
  });

  it("sends the session cookie with every request", () => {
    expect(api.defaults.withCredentials).toBe(true);
  });

  it("sends an expired session back to the login form", async () => {
    await expect(rejectionHandler(failure(401, "/expenses"))).rejects.toBeTruthy();

    expect(window.location.assign).toHaveBeenCalledWith("/login");
  });

  it("leaves a wrong password on the login form", async () => {
    await expect(rejectionHandler(failure(401, "/auth/login"))).rejects.toBeTruthy();

    expect(window.location.assign).not.toHaveBeenCalled();
  });

  it("does not log someone out for mistyping their current password", async () => {
    await expect(rejectionHandler(failure(401, "/users/change-password"))).rejects.toBeTruthy();

    expect(window.location.assign).not.toHaveBeenCalled();
  });

  it("treats a failed session check as ordinary, since it runs on every page", async () => {
    await expect(rejectionHandler(failure(401, "/auth/me"))).rejects.toBeTruthy();

    expect(window.location.assign).not.toHaveBeenCalled();
  });

  it("leaves other failures to the caller", async () => {
    await expect(rejectionHandler(failure(404, "/expenses/abc"))).rejects.toBeTruthy();
    await expect(rejectionHandler(failure(409, "/budgets"))).rejects.toBeTruthy();
    await expect(rejectionHandler(failure(400, "/expenses"))).rejects.toBeTruthy();

    expect(window.location.assign).not.toHaveBeenCalled();
  });

  it("does not redirect when the user is already on the login page", async () => {
    setLocation("/login");

    await expect(rejectionHandler(failure(401, "/dashboard"))).rejects.toBeTruthy();

    expect(window.location.assign).not.toHaveBeenCalled();
  });
});
