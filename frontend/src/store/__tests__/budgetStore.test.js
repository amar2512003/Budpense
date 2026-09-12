import { beforeEach, describe, expect, it, vi } from "vitest";

import useBudgetStore from "../budgetStore";

vi.mock("../../services/budgetService", () => ({
  getBudgets: vi.fn(),
  createBudget: vi.fn(),
  updateBudget: vi.fn(),
  deleteBudget: vi.fn(),
}));

const service = await import("../../services/budgetService");

const budget = (id, overrides = {}) => ({
  _id: id, category: "food", amount: 8000, month: "09", year: 2026,
  spent: 6500, remaining: 1500, percentage: 81.25, isOverBudget: false, ...overrides,
});
const rejection = (status, data) => Object.assign(new Error("Request failed"), { response: { status, data } });

beforeEach(() => {
  useBudgetStore.setState({ budgets: [], loading: false, error: null });
});

describe("budgetStore", () => {
  it("keeps the spend the API computed rather than deriving its own", async () => {
    service.getBudgets.mockResolvedValue({ data: { budgets: [budget("a")] } });

    await useBudgetStore.getState().fetchBudgets();

    const [stored] = useBudgetStore.getState().budgets;
    expect(stored.spent).toBe(6500);
    expect(stored.percentage).toBe(81.25);
    expect(stored.isOverBudget).toBe(false);
  });

  it("carries an overspend through unclamped", async () => {
    service.getBudgets.mockResolvedValue({
      data: { budgets: [budget("a", { spent: 11200, remaining: -3200, percentage: 140, isOverBudget: true })] },
    });

    await useBudgetStore.getState().fetchBudgets();

    expect(useBudgetStore.getState().budgets[0].percentage).toBe(140);
    expect(useBudgetStore.getState().budgets[0].remaining).toBe(-3200);
  });

  it("reports a failed fetch and shows no budgets", async () => {
    service.getBudgets.mockRejectedValue(rejection(500, { message: "Something went wrong" }));

    await useBudgetStore.getState().fetchBudgets();

    expect(useBudgetStore.getState().budgets).toEqual([]);
    expect(useBudgetStore.getState().error).toBe("Something went wrong");
  });

  it("adds a budget", async () => {
    service.createBudget.mockResolvedValue({ data: { budget: budget("new") } });

    await useBudgetStore.getState().addBudget({ category: "food", amount: 8000, month: "09", year: 2026 });

    expect(useBudgetStore.getState().budgets[0]._id).toBe("new");
  });

  it("surfaces the duplicate-budget message", async () => {
    service.createBudget.mockRejectedValue(
      rejection(409, { message: "A budget for that category and month already exists" }),
    );

    await expect(
      useBudgetStore.getState().addBudget({ category: "food", amount: 8000, month: "09", year: 2026 }),
    ).rejects.toThrow("A budget for that category and month already exists");
  });

  it("replaces an edited budget with the recomputed one", async () => {
    useBudgetStore.setState({ budgets: [budget("a")] });
    service.updateBudget.mockResolvedValue({
      data: { budget: budget("a", { amount: 5000, remaining: -1500, percentage: 130, isOverBudget: true }) },
    });

    await useBudgetStore.getState().editBudget("a", { category: "food", amount: 5000, month: "09", year: 2026 });

    expect(useBudgetStore.getState().budgets[0].isOverBudget).toBe(true);
  });

  it("restores a budget when the delete fails", async () => {
    useBudgetStore.setState({ budgets: [budget("a")] });
    service.deleteBudget.mockRejectedValue(rejection(404, { message: "Budget not found" }));

    await expect(useBudgetStore.getState().removeBudget("a")).rejects.toThrow("Budget not found");

    expect(useBudgetStore.getState().budgets).toHaveLength(1);
    expect(useBudgetStore.getState().error).toBe("Budget not found");
  });
});
