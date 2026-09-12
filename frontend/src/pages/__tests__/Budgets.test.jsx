import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import Budgets from "../budgets/Budgets";
import useBudgetStore from "../../store/budgetStore";

vi.mock("../../services/budgetService", () => ({
  getBudgets: vi.fn(), createBudget: vi.fn(), updateBudget: vi.fn(), deleteBudget: vi.fn(),
}));

const service = await import("../../services/budgetService");

const budget = (id, overrides = {}) => ({
  _id: id, category: "food", amount: 8000, month: "09", year: 2026,
  spent: 6500, remaining: 1500, percentage: 81.25, isOverBudget: false, ...overrides,
});

beforeEach(() => {
  useBudgetStore.setState({ budgets: [], loading: false, error: null });
  service.getBudgets.mockResolvedValue({ data: { budgets: [] } });
});

describe("Budgets page", () => {
  it("fetches budgets on arrival", async () => {
    render(<Budgets />);

    await waitFor(() => expect(service.getBudgets).toHaveBeenCalled());
  });

  it("shows the spend the API computed", async () => {
    service.getBudgets.mockResolvedValue({ data: { budgets: [budget("a")] } });

    render(<Budgets />);

    expect(await screen.findByText(/6,500/)).toBeInTheDocument();
  });

  it("shows an overspent budget as over, not clamped", async () => {
    service.getBudgets.mockResolvedValue({
      data: { budgets: [budget("a", { spent: 11200, remaining: -3200, percentage: 140, isOverBudget: true })] },
    });

    render(<Budgets />);

    expect(await screen.findByText(/exceeded by/i)).toBeInTheDocument();
  });

  it("shows the empty state", async () => {
    render(<Budgets />);

    expect(await screen.findByText(/no budgets/i)).toBeInTheDocument();
  });

  it("creates a budget with a zero-padded month", async () => {
    const user = userEvent.setup();
    service.createBudget.mockResolvedValue({ data: { budget: budget("new") } });
    render(<Budgets />);
    await screen.findByText(/no budgets/i);

    await user.click(screen.getByRole("button", { name: /create budget/i }));
    await user.selectOptions(screen.getByLabelText(/category/i), "travel");
    await user.type(screen.getByLabelText(/amount/i), "5000");
    await user.selectOptions(screen.getByLabelText(/month/i), "09");
    await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: /create budget/i }));

    await waitFor(() => expect(service.createBudget).toHaveBeenCalledWith(
      expect.objectContaining({ category: "travel", amount: 5000, month: "09" }),
    ));
  });

  it("shows the duplicate message the API returns", async () => {
    const user = userEvent.setup();
    service.createBudget.mockRejectedValue({
      response: { data: { message: "A budget for that category and month already exists" } },
    });
    render(<Budgets />);
    await screen.findByText(/no budgets/i);

    await user.click(screen.getByRole("button", { name: /create budget/i }));
    await user.selectOptions(screen.getByLabelText(/category/i), "food");
    await user.type(screen.getByLabelText(/amount/i), "8000");
    await user.selectOptions(screen.getByLabelText(/month/i), "09");
    await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: /create budget/i }));

    expect(await screen.findByText(/already exists/i)).toBeInTheDocument();
  });

  it("deletes after confirmation", async () => {
    const user = userEvent.setup();
    vi.spyOn(window, "confirm").mockReturnValue(true);
    service.getBudgets.mockResolvedValue({ data: { budgets: [budget("a")] } });
    service.deleteBudget.mockResolvedValue({ data: { id: "a" } });
    render(<Budgets />);
    await screen.findByText(/6,500/);

    await user.click(screen.getByRole("button", { name: /delete/i }));

    await waitFor(() => expect(service.deleteBudget).toHaveBeenCalledWith("a"));
  });
});
