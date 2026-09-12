import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../api", () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));

const api = (await import("../api")).default;
const auth = await import("../authService");
const expenses = await import("../expenseService");
const income = await import("../incomeService");
const budgets = await import("../budgetService");
const dashboard = await import("../dashboardService");

const ok = { data: { success: true, data: {} } };

beforeEach(() => {
  Object.values(api).forEach((method) => method.mockResolvedValue(ok));
});

describe("authService", () => {
  it("posts registration to /auth/register", async () => {
    await auth.registerUser({ name: "Ada", email: "a@b.c", password: "a long password" });

    expect(api.post).toHaveBeenCalledWith("/auth/register", { name: "Ada", email: "a@b.c", password: "a long password" });
  });

  it("posts credentials to /auth/login", async () => {
    await auth.loginUser({ email: "a@b.c", password: "x" });

    expect(api.post).toHaveBeenCalledWith("/auth/login", { email: "a@b.c", password: "x" });
  });

  it("checks the session at /auth/me", async () => {
    await auth.getCurrentUser();

    expect(api.get).toHaveBeenCalledWith("/auth/me");
  });

  it("posts a logout", async () => {
    await auth.logoutUser();

    expect(api.post).toHaveBeenCalledWith("/auth/logout");
  });

  it("sends a reset request with only the email", async () => {
    await auth.forgotPassword("a@b.c");

    expect(api.post).toHaveBeenCalledWith("/auth/forgot-password", { email: "a@b.c" });
  });

  it("puts the token in the path when resetting, not the body", async () => {
    await auth.resetPassword("tok123", "a long password");

    expect(api.post).toHaveBeenCalledWith("/auth/reset-password/tok123", { password: "a long password" });
  });

  it("updates the profile at /users/me, where the backend actually serves it", async () => {
    await auth.updateProfile({ name: "Ada", email: "a@b.c" });

    expect(api.put).toHaveBeenCalledWith("/users/me", { name: "Ada", email: "a@b.c" });
  });

  it("changes the password at /users/change-password", async () => {
    await auth.changePassword({ currentPassword: "old", password: "a long password" });

    expect(api.put).toHaveBeenCalledWith("/users/change-password", { currentPassword: "old", password: "a long password" });
  });

  it("returns the response body, not the axios envelope", async () => {
    api.get.mockResolvedValue({ data: { success: true, data: { user: { id: "u1" } } }, status: 200 });

    const result = await auth.getCurrentUser();

    expect(result).toEqual({ success: true, data: { user: { id: "u1" } } });
  });
});

describe("expenseService", () => {
  it("sends list parameters as a query", async () => {
    await expenses.getExpenses({ search: "cafe", sort: "newest", page: 2 });

    expect(api.get).toHaveBeenCalledWith("/expenses", { params: { search: "cafe", sort: "newest", page: 2 } });
  });

  it("reads, creates, updates and deletes by id", async () => {
    await expenses.getExpenseById("e1");
    await expenses.createExpense({ amount: 1 });
    await expenses.updateExpense("e1", { amount: 2 });
    await expenses.deleteExpense("e1");

    expect(api.get).toHaveBeenCalledWith("/expenses/e1");
    expect(api.post).toHaveBeenCalledWith("/expenses", { amount: 1 });
    expect(api.put).toHaveBeenCalledWith("/expenses/e1", { amount: 2 });
    expect(api.delete).toHaveBeenCalledWith("/expenses/e1");
  });
});

describe("incomeService", () => {
  it("talks to /income, the separate router", async () => {
    await income.getIncome({ month: "2026-09" });
    await income.createIncome({ amount: 1, source: "salary" });
    await income.updateIncome("i1", { amount: 2 });
    await income.deleteIncome("i1");

    expect(api.get).toHaveBeenCalledWith("/income", { params: { month: "2026-09" } });
    expect(api.post).toHaveBeenCalledWith("/income", { amount: 1, source: "salary" });
    expect(api.put).toHaveBeenCalledWith("/income/i1", { amount: 2 });
    expect(api.delete).toHaveBeenCalledWith("/income/i1");
  });
});

describe("budgetService", () => {
  it("talks to /budgets", async () => {
    await budgets.getBudgets();
    await budgets.createBudget({ category: "food", amount: 1, month: "09", year: 2026 });
    await budgets.updateBudget("b1", { amount: 2 });
    await budgets.deleteBudget("b1");

    expect(api.post).toHaveBeenCalledWith("/budgets", { category: "food", amount: 1, month: "09", year: 2026 });
    expect(api.put).toHaveBeenCalledWith("/budgets/b1", { amount: 2 });
    expect(api.delete).toHaveBeenCalledWith("/budgets/b1");
  });
});

describe("dashboardService", () => {
  it("reads the single summary endpoint", async () => {
    await dashboard.getDashboard();

    expect(api.get).toHaveBeenCalledWith("/dashboard");
  });
});
