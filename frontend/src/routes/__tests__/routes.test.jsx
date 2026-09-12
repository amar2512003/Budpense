import { render, screen, waitFor } from "@testing-library/react";
import { useEffect } from "react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ProtectedRoute from "../ProtectedRoute";
import PublicRoute from "../PublicRoute";
import useAuthStore from "../../store/authStore";

vi.mock("../../services/authService", () => ({
  getCurrentUser: vi.fn(), loginUser: vi.fn(), registerUser: vi.fn(),
  logoutUser: vi.fn(), updateProfile: vi.fn(), changePassword: vi.fn(),
}));

const service = await import("../../services/authService");

const USER = { id: "u1", name: "Ada", email: "ada@example.com" };

// Stands in for App, which runs the session check once for the whole app.
const Shell = ({ children }) => {
  const checkAuth = useAuthStore((state) => state.checkAuth);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return children;
};

// The same shape as AppRoutes: guarded pages inside the guard, the login form
// outside it. Nesting login inside ProtectedRoute would send its own redirect
// straight back into the guard that issued it.
const shell = (path = "/app") => render(
  <Shell>
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route element={<ProtectedRoute />}>
          <Route path="/app" element={<p>Private page</p>} />
        </Route>
        <Route path="/login" element={<p>Login form</p>} />
      </Routes>
    </MemoryRouter>
  </Shell>,
);

const publicShell = (path = "/login") => render(
  <Shell>
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route element={<PublicRoute />}>
          <Route path="/login" element={<p>Login form</p>} />
        </Route>
        <Route path="/app/dashboard" element={<p>Dashboard page</p>} />
      </Routes>
    </MemoryRouter>
  </Shell>,
);

beforeEach(() => {
  useAuthStore.setState({ user: null, isAuthenticated: false, isLoading: true, error: null });
});

describe("ProtectedRoute", () => {
  it("waits for the session check instead of redirecting on the first render", async () => {
    let release;
    service.getCurrentUser.mockReturnValue(new Promise((resolve) => {
      release = () => resolve({ data: { user: USER } });
    }));

    shell();

    expect(screen.getByText(/checking authentication/i)).toBeInTheDocument();
    expect(screen.queryByText("Login form")).not.toBeInTheDocument();

    release();
    expect(await screen.findByText("Private page")).toBeInTheDocument();
  });

  it("shows the page to a signed-in user", async () => {
    service.getCurrentUser.mockResolvedValue({ data: { user: USER } });

    shell();

    expect(await screen.findByText("Private page")).toBeInTheDocument();
  });

  it("sends an unauthenticated visitor to the login form", async () => {
    service.getCurrentUser.mockRejectedValue({ response: { status: 401, data: { message: "Not authorised" } } });

    shell();

    expect(await screen.findByText("Login form")).toBeInTheDocument();
  });
});

describe("PublicRoute", () => {
  it("resolves to the login form for a signed-out visitor, rather than spinning", async () => {
    service.getCurrentUser.mockRejectedValue({ response: { status: 401, data: { message: "Not authorised" } } });

    publicShell();

    expect(await screen.findByText("Login form")).toBeInTheDocument();
  });

  it("moves a signed-in visitor away from the login form", async () => {
    service.getCurrentUser.mockResolvedValue({ data: { user: USER } });

    publicShell();

    expect(await screen.findByText("Dashboard page")).toBeInTheDocument();
  });
});

describe("the session check", () => {
  it("runs once for the whole app, not once per page that reads auth state", async () => {
    service.getCurrentUser.mockResolvedValue({ data: { user: USER } });

    shell();

    await screen.findByText("Private page");
    expect(service.getCurrentUser).toHaveBeenCalledTimes(1);
  });
});
