import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import Navbar from "../layout/Navbar";
import useAuthStore from "../../store/authStore";

vi.mock("../../services/authService", () => ({
  getCurrentUser: vi.fn(), loginUser: vi.fn(), registerUser: vi.fn(),
  logoutUser: vi.fn(), updateProfile: vi.fn(), changePassword: vi.fn(),
}));

const service = await import("../../services/authService");

const USER = { id: "u1", name: "Priya Sharma", email: "priya@example.com" };

beforeEach(() => {
  useAuthStore.setState({ user: USER, isAuthenticated: true, isLoading: false, error: null });
});

describe("Navbar", () => {
  it("shows who is signed in", () => {
    render(<MemoryRouter><Navbar user={USER} /></MemoryRouter>);

    expect(screen.getByText("Priya Sharma")).toBeInTheDocument();
    expect(screen.getByText("priya@example.com")).toBeInTheDocument();
  });

  it("offers a way out, which the app previously had nowhere", async () => {
    const user = userEvent.setup();
    service.logoutUser.mockResolvedValue({ data: {} });
    render(<MemoryRouter><Navbar user={USER} /></MemoryRouter>);

    await user.click(screen.getByRole("button", { name: /log out/i }));

    await waitFor(() => expect(service.logoutUser).toHaveBeenCalled());
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  it("still signs the user out when the request fails", async () => {
    const user = userEvent.setup();
    service.logoutUser.mockRejectedValue({ response: { status: 500, data: { message: "Something went wrong" } } });
    render(<MemoryRouter><Navbar user={USER} /></MemoryRouter>);

    await user.click(screen.getByRole("button", { name: /log out/i }));

    await waitFor(() => expect(useAuthStore.getState().isAuthenticated).toBe(false));
  });
});
