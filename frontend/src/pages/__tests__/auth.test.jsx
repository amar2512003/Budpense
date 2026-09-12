import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import Login from "../auth/Login";
import Register from "../auth/Register";
import Profile from "../profile/Profile";
import useAuthStore from "../../store/authStore";

vi.mock("../../services/authService", () => ({
  getCurrentUser: vi.fn(), loginUser: vi.fn(), registerUser: vi.fn(),
  logoutUser: vi.fn(), updateProfile: vi.fn(), changePassword: vi.fn(),
  forgotPassword: vi.fn(), resetPassword: vi.fn(),
}));

const service = await import("../../services/authService");

const USER = { id: "u1", name: "Ada", email: "ada@example.com", currency: "INR" };
const show = (page) => render(<MemoryRouter>{page}</MemoryRouter>);

beforeEach(() => {
  useAuthStore.setState({ user: null, isAuthenticated: false, isLoading: false, error: null });
});

describe("Login", () => {
  it("signs in through the API", async () => {
    const user = userEvent.setup();
    service.loginUser.mockResolvedValue({ data: { user: USER } });
    show(<Login />);

    await user.type(screen.getByLabelText(/email/i), "ada@example.com");
    await user.type(screen.getByLabelText(/password/i), "a long password");
    await user.click(screen.getByRole("button", { name: /sign in|log in|login/i }));

    await waitFor(() => expect(service.loginUser).toHaveBeenCalledWith({
      email: "ada@example.com", password: "a long password",
    }));
  });

  it("shows the backend's message for a wrong password", async () => {
    const user = userEvent.setup();
    service.loginUser.mockRejectedValue({ response: { data: { message: "Incorrect email or password" } } });
    show(<Login />);

    await user.type(screen.getByLabelText(/email/i), "ada@example.com");
    await user.type(screen.getByLabelText(/password/i), "wrong password");
    await user.click(screen.getByRole("button", { name: /sign in|log in|login/i }));

    expect(await screen.findByText("Incorrect email or password")).toBeInTheDocument();
  });

  it("does not call the API for an obviously invalid email", async () => {
    const user = userEvent.setup();
    show(<Login />);

    await user.type(screen.getByLabelText(/email/i), "not-an-email");
    await user.type(screen.getByLabelText(/password/i), "a long password");
    await user.click(screen.getByRole("button", { name: /sign in|log in|login/i }));

    expect(service.loginUser).not.toHaveBeenCalled();
  });
});

describe("Register", () => {
  it("creates the account through the API", async () => {
    const user = userEvent.setup();
    service.registerUser.mockResolvedValue({ data: { user: USER } });
    show(<Register />);

    await user.type(screen.getByLabelText(/full name/i), "Ada");
    await user.type(screen.getByLabelText(/email/i), "ada@example.com");
    await user.type(screen.getByLabelText(/^password/i), "a long password");
    await user.type(screen.getByLabelText(/confirm/i), "a long password");
    await user.click(screen.getByRole("button", { name: /create|register|sign up/i }));

    await waitFor(() => expect(service.registerUser).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Ada", email: "ada@example.com", password: "a long password" }),
    ));
  });

  it("shows the backend's message when the email is taken", async () => {
    const user = userEvent.setup();
    service.registerUser.mockRejectedValue({
      response: { data: { message: "An account with this email already exists" } },
    });
    show(<Register />);

    await user.type(screen.getByLabelText(/full name/i), "Ada");
    await user.type(screen.getByLabelText(/email/i), "ada@example.com");
    await user.type(screen.getByLabelText(/^password/i), "a long password");
    await user.type(screen.getByLabelText(/confirm/i), "a long password");
    await user.click(screen.getByRole("button", { name: /create|register|sign up/i }));

    expect(await screen.findByText(/already exists/i)).toBeInTheDocument();
  });
});

describe("Profile", () => {
  beforeEach(() => {
    useAuthStore.setState({ user: USER, isAuthenticated: true, isLoading: false, error: null });
  });

  it("shows the signed-in user's details", () => {
    show(<Profile />);

    expect(screen.getByDisplayValue("Ada")).toBeInTheDocument();
    expect(screen.getByDisplayValue("ada@example.com")).toBeInTheDocument();
  });

  it("saves the profile to /users/me", async () => {
    const user = userEvent.setup();
    service.updateProfile.mockResolvedValue({ data: { user: { ...USER, name: "Ada Lovelace" } } });
    show(<Profile />);

    await user.clear(screen.getByDisplayValue("Ada"));
    await user.type(screen.getByLabelText(/name/i), "Ada Lovelace");
    await user.click(screen.getByRole("button", { name: /save|update/i }));

    await waitFor(() => expect(service.updateProfile).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Ada Lovelace", email: "ada@example.com" }),
    ));
  });

  it("shows the backend's message when the new email is taken", async () => {
    const user = userEvent.setup();
    service.updateProfile.mockRejectedValue({
      response: { data: { message: "An account with this email already exists" } },
    });
    show(<Profile />);

    await user.click(screen.getByRole("button", { name: /save|update/i }));

    expect(await screen.findByText(/already exists/i)).toBeInTheDocument();
  });
});
