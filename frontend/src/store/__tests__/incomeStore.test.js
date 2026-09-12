import { beforeEach, describe, expect, it, vi } from "vitest";

import useIncomeStore, { PAGE_SIZE } from "../incomeStore";

vi.mock("../../services/incomeService", () => ({
  getIncome: vi.fn(),
  createIncome: vi.fn(),
  updateIncome: vi.fn(),
  deleteIncome: vi.fn(),
}));

const service = await import("../../services/incomeService");

const entry = (id, overrides = {}) => ({
  _id: id, type: "income", amount: 60000, source: "salary",
  date: "2026-09-01T00:00:00.000Z", ...overrides,
});
const rejection = (status, data) => Object.assign(new Error("Request failed"), { response: { status, data } });

beforeEach(() => {
  useIncomeStore.setState({ income: [], total: 0, page: 1, pages: 1, loading: false, error: null });
});

describe("incomeStore", () => {
  it("fetches income, which the previous store could not do at all", async () => {
    service.getIncome.mockResolvedValue({ data: { items: [entry("a")], total: 1, page: 1, pages: 1 } });

    await useIncomeStore.getState().fetchIncome();

    expect(useIncomeStore.getState().income).toHaveLength(1);
    expect(service.getIncome).toHaveBeenCalledWith({ limit: PAGE_SIZE });
  });

  it("tracks loading through a fetch", async () => {
    let release;
    service.getIncome.mockReturnValue(new Promise((resolve) => {
      release = () => resolve({ data: { items: [], total: 0, page: 1, pages: 1 } });
    }));

    const pending = useIncomeStore.getState().fetchIncome();
    expect(useIncomeStore.getState().loading).toBe(true);

    release();
    await pending;
    expect(useIncomeStore.getState().loading).toBe(false);
  });

  it("reports a failed fetch", async () => {
    service.getIncome.mockRejectedValue(rejection(500, { message: "Something went wrong" }));

    await useIncomeStore.getState().fetchIncome();

    expect(useIncomeStore.getState().error).toBe("Something went wrong");
    expect(useIncomeStore.getState().income).toEqual([]);
  });

  it("adds an entry at the top", async () => {
    useIncomeStore.setState({ income: [entry("old")], total: 1 });
    service.createIncome.mockResolvedValue({ data: { income: entry("new") } });

    await useIncomeStore.getState().addIncome({ source: "salary", amount: 1000, date: "2026-09-02" });

    expect(useIncomeStore.getState().income[0]._id).toBe("new");
    expect(useIncomeStore.getState().total).toBe(2);
  });

  it("throws the backend's message when a source is missing", async () => {
    service.createIncome.mockRejectedValue(
      rejection(400, { message: "Validation failed", errors: { source: "Choose one of: salary, freelancing" } }),
    );

    await expect(useIncomeStore.getState().addIncome({ amount: 10, date: "2026-09-02" }))
      .rejects.toThrow("Choose one of: salary, freelancing");
  });

  it("replaces an edited entry in place", async () => {
    useIncomeStore.setState({ income: [entry("a"), entry("b")] });
    service.updateIncome.mockResolvedValue({ data: { income: entry("a", { amount: 70000 }) } });

    await useIncomeStore.getState().editIncome("a", { source: "salary", amount: 70000, date: "2026-09-01" });

    expect(useIncomeStore.getState().income[0].amount).toBe(70000);
    expect(useIncomeStore.getState().income[1]._id).toBe("b");
  });

  it("removes an entry and restores it when the delete fails", async () => {
    useIncomeStore.setState({ income: [entry("a"), entry("b")], total: 2 });
    service.deleteIncome.mockResolvedValue({ data: { id: "a" } });

    await useIncomeStore.getState().removeIncome("a");
    expect(useIncomeStore.getState().income.map((e) => e._id)).toEqual(["b"]);

    useIncomeStore.setState({ income: [entry("a"), entry("b")], total: 2 });
    service.deleteIncome.mockRejectedValue(rejection(404, { message: "Income not found" }));

    await expect(useIncomeStore.getState().removeIncome("a")).rejects.toThrow("Income not found");
    expect(useIncomeStore.getState().income.map((e) => e._id)).toEqual(["a", "b"]);
  });
});
