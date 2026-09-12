import { beforeEach, describe, expect, it, vi } from "vitest";

import useExpenseStore, { PAGE_SIZE } from "../expenseStore";

vi.mock("../../services/expenseService", () => ({
  getExpenses: vi.fn(),
  getExpenseById: vi.fn(),
  createExpense: vi.fn(),
  updateExpense: vi.fn(),
  deleteExpense: vi.fn(),
}));

const service = await import("../../services/expenseService");

const expense = (id, overrides = {}) => ({
  _id: id, type: "expense", amount: 100, category: "food",
  title: `Expense ${id}`, date: "2026-09-02T00:00:00.000Z", ...overrides,
});
const page = (items, extra = {}) => ({
  data: { items, total: items.length, page: 1, pages: 1, ...extra },
});
const rejection = (status, data) => Object.assign(new Error("Request failed"), { response: { status, data } });

beforeEach(() => {
  useExpenseStore.setState({
    expenses: [], selectedExpense: null, total: 0, page: 1, pages: 1, loading: false, error: null,
  });
});

describe("expenseStore", () => {
  describe("fetchExpenses", () => {
    it("fills the list from the API", async () => {
      service.getExpenses.mockResolvedValue(page([expense("a"), expense("b")]));

      await useExpenseStore.getState().fetchExpenses();

      expect(useExpenseStore.getState().expenses).toHaveLength(2);
      expect(useExpenseStore.getState().total).toBe(2);
    });

    it("asks for a page of the documented size", async () => {
      service.getExpenses.mockResolvedValue(page([]));

      await useExpenseStore.getState().fetchExpenses();

      expect(service.getExpenses).toHaveBeenCalledWith({ limit: PAGE_SIZE });
      expect(PAGE_SIZE).toBeLessThanOrEqual(100);
    });

    it("passes filters to the API rather than filtering what it already has", async () => {
      service.getExpenses.mockResolvedValue(page([]));

      await useExpenseStore.getState().fetchExpenses({ search: "cafe", category: "food", sort: "highest", page: 2 });

      expect(service.getExpenses).toHaveBeenCalledWith({
        limit: PAGE_SIZE, search: "cafe", category: "food", sort: "highest", page: 2,
      });
    });

    it("keeps the paging figures the API reports", async () => {
      service.getExpenses.mockResolvedValue(page([expense("a")], { total: 41, page: 2, pages: 3 }));

      await useExpenseStore.getState().fetchExpenses({ page: 2 });

      expect(useExpenseStore.getState()).toMatchObject({ total: 41, page: 2, pages: 3 });
    });

    it("is loading while the request is in flight", async () => {
      let release;
      service.getExpenses.mockReturnValue(new Promise((resolve) => { release = () => resolve(page([])); }));

      const pending = useExpenseStore.getState().fetchExpenses();
      expect(useExpenseStore.getState().loading).toBe(true);

      release();
      await pending;
      expect(useExpenseStore.getState().loading).toBe(false);
    });

    it("reports a failure and leaves an empty list rather than stale rows", async () => {
      useExpenseStore.setState({ expenses: [expense("old")] });
      service.getExpenses.mockRejectedValue(rejection(500, { message: "Something went wrong" }));

      await useExpenseStore.getState().fetchExpenses();

      expect(useExpenseStore.getState().expenses).toEqual([]);
      expect(useExpenseStore.getState().error).toBe("Something went wrong");
      expect(useExpenseStore.getState().loading).toBe(false);
    });
  });

  describe("fetchExpenseById", () => {
    it("selects the record", async () => {
      service.getExpenseById.mockResolvedValue({ data: { expense: expense("a") } });

      const found = await useExpenseStore.getState().fetchExpenseById("a");

      expect(found._id).toBe("a");
      expect(useExpenseStore.getState().selectedExpense._id).toBe("a");
    });

    it("leaves nothing selected when the record is not found", async () => {
      service.getExpenseById.mockRejectedValue(rejection(404, { message: "Expense not found" }));

      const found = await useExpenseStore.getState().fetchExpenseById("missing");

      expect(found).toBeNull();
      expect(useExpenseStore.getState().selectedExpense).toBeNull();
      expect(useExpenseStore.getState().error).toBe("Expense not found");
    });
  });

  describe("addExpense", () => {
    it("puts the created record at the top of the list", async () => {
      useExpenseStore.setState({ expenses: [expense("old")], total: 1 });
      service.createExpense.mockResolvedValue({ data: { expense: expense("new") } });

      await useExpenseStore.getState().addExpense({ amount: 10, category: "food", date: "2026-09-03" });

      expect(useExpenseStore.getState().expenses[0]._id).toBe("new");
      expect(useExpenseStore.getState().total).toBe(2);
    });

    it("returns the record the API stored, not the form's own object", async () => {
      service.createExpense.mockResolvedValue({ data: { expense: expense("new", { amount: 99.5 }) } });

      const created = await useExpenseStore.getState().addExpense({ amount: "99.50", category: "food", date: "2026-09-03" });

      expect(created.amount).toBe(99.5);
      expect(created._id).toBe("new");
    });

    it("throws the backend's validation message for the form to display", async () => {
      service.createExpense.mockRejectedValue(
        rejection(400, { message: "Validation failed", errors: { amount: "Amount must be greater than 0" } }),
      );

      await expect(
        useExpenseStore.getState().addExpense({ amount: 0, category: "food", date: "2026-09-03" }),
      ).rejects.toThrow("Amount must be greater than 0");
      expect(useExpenseStore.getState().loading).toBe(false);
    });

    it("does not add anything when the request fails", async () => {
      service.createExpense.mockRejectedValue(rejection(400, { message: "Validation failed" }));

      await expect(useExpenseStore.getState().addExpense({})).rejects.toThrow();
      expect(useExpenseStore.getState().expenses).toEqual([]);
    });
  });

  describe("editExpense", () => {
    it("replaces the row in place", async () => {
      useExpenseStore.setState({ expenses: [expense("a"), expense("b")] });
      service.updateExpense.mockResolvedValue({ data: { expense: expense("a", { amount: 500 }) } });

      await useExpenseStore.getState().editExpense("a", { amount: 500, category: "food", date: "2026-09-02" });

      const [first, second] = useExpenseStore.getState().expenses;
      expect(first.amount).toBe(500);
      expect(second._id).toBe("b");
    });

    it("keeps the list untouched when the update fails", async () => {
      useExpenseStore.setState({ expenses: [expense("a")] });
      service.updateExpense.mockRejectedValue(rejection(404, { message: "Expense not found" }));

      await expect(useExpenseStore.getState().editExpense("a", {})).rejects.toThrow("Expense not found");
      expect(useExpenseStore.getState().expenses[0].amount).toBe(100);
    });
  });

  describe("removeExpense", () => {
    it("removes the row", async () => {
      useExpenseStore.setState({ expenses: [expense("a"), expense("b")], total: 2 });
      service.deleteExpense.mockResolvedValue({ data: { id: "a" } });

      await useExpenseStore.getState().removeExpense("a");

      expect(useExpenseStore.getState().expenses.map((e) => e._id)).toEqual(["b"]);
      expect(useExpenseStore.getState().total).toBe(1);
    });

    it("puts the row back when the delete fails", async () => {
      useExpenseStore.setState({ expenses: [expense("a"), expense("b")], total: 2 });
      service.deleteExpense.mockRejectedValue(rejection(404, { message: "Expense not found" }));

      await expect(useExpenseStore.getState().removeExpense("a")).rejects.toThrow("Expense not found");

      expect(useExpenseStore.getState().expenses.map((e) => e._id)).toEqual(["a", "b"]);
      expect(useExpenseStore.getState().error).toBe("Expense not found");
    });

    it("never takes the total below zero", async () => {
      useExpenseStore.setState({ expenses: [expense("a")], total: 0 });
      service.deleteExpense.mockResolvedValue({ data: { id: "a" } });

      await useExpenseStore.getState().removeExpense("a");

      expect(useExpenseStore.getState().total).toBe(0);
    });
  });

  it("clears errors and the selection", () => {
    useExpenseStore.setState({ error: "boom", selectedExpense: expense("a") });

    useExpenseStore.getState().clearError();
    useExpenseStore.getState().clearSelectedExpense();

    expect(useExpenseStore.getState().error).toBeNull();
    expect(useExpenseStore.getState().selectedExpense).toBeNull();
  });
});
