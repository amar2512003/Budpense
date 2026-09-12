import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import Expenses from "../expenses/Expenses";
import useExpenseStore from "../../store/expenseStore";

vi.mock("../../services/expenseService", () => ({
  getExpenses: vi.fn(),
  getExpenseById: vi.fn(),
  createExpense: vi.fn(),
  updateExpense: vi.fn(),
  deleteExpense: vi.fn(),
}));

const service = await import("../../services/expenseService");

const expense = (id, overrides = {}) => ({
  _id: id, type: "expense", amount: 450, category: "food",
  title: `Expense ${id}`, date: "2026-09-02T00:00:00.000Z", ...overrides,
});
const page = (items, extra = {}) => ({
  data: { items, total: items.length, page: 1, pages: 1, ...extra },
});

const show = () => render(<MemoryRouter><Expenses /></MemoryRouter>);

beforeEach(() => {
  useExpenseStore.setState({ expenses: [], total: 0, page: 1, pages: 1, loading: false, error: null });
  service.getExpenses.mockResolvedValue(page([]));
});

describe("Expenses page", () => {
  it("fetches from the backend on arrival", async () => {
    show();

    await waitFor(() => expect(service.getExpenses).toHaveBeenCalled());
  });

  it("lists what the API returned", async () => {
    service.getExpenses.mockResolvedValue(page([expense("a", { title: "Lunch" }), expense("b", { title: "Cab" })]));

    show();

    expect(await screen.findByText("Lunch")).toBeInTheDocument();
    expect(screen.getByText("Cab")).toBeInTheDocument();
  });

  it("shows the empty state when there are none", async () => {
    show();

    expect(await screen.findByText(/no expenses found/i)).toBeInTheDocument();
  });

  it("shows a loading state while the request is in flight", async () => {
    let release;
    service.getExpenses.mockReturnValue(new Promise((resolve) => { release = () => resolve(page([])); }));

    show();

    await waitFor(() => expect(useExpenseStore.getState().loading).toBe(true));
    release();
    await screen.findByText(/no expenses found/i);
  });

  it("shows the backend's error message when the fetch fails", async () => {
    service.getExpenses.mockRejectedValue({ response: { data: { message: "Not authorised, please sign in" } } });

    show();

    expect(await screen.findByRole("alert")).toHaveTextContent("Not authorised, please sign in");
  });

  it("counts the total the API reports, not the rows on this page", async () => {
    service.getExpenses.mockResolvedValue(page([expense("a")], { total: 41, pages: 3 }));

    show();

    expect(await screen.findByText(/41 Expenses/i)).toBeInTheDocument();
  });

  it("sends the category filter to the API instead of filtering locally", async () => {
    const user = userEvent.setup();
    service.getExpenses.mockResolvedValue(page([expense("a")]));
    show();
    await screen.findByText("Expense a");

    await user.selectOptions(screen.getByDisplayValue(/all categories/i), "transport");

    await waitFor(() =>
      expect(service.getExpenses).toHaveBeenLastCalledWith(expect.objectContaining({ category: "transport" })));
  });

  it("sends the sort order to the API", async () => {
    const user = userEvent.setup();
    show();
    await screen.findByText(/no expenses found/i);

    await user.selectOptions(screen.getByDisplayValue(/newest first/i), "highest");

    await waitFor(() =>
      expect(service.getExpenses).toHaveBeenLastCalledWith(expect.objectContaining({ sort: "highest" })));
  });

  it("debounces the search box rather than firing on every keystroke", async () => {
    const user = userEvent.setup();
    show();
    await screen.findByText(/no expenses found/i);
    const callsBefore = service.getExpenses.mock.calls.length;

    await user.type(screen.getByPlaceholderText(/search/i), "cafe");

    expect(service.getExpenses.mock.calls.length).toBe(callsBefore);
    await waitFor(
      () => expect(service.getExpenses).toHaveBeenLastCalledWith(expect.objectContaining({ search: "cafe" })),
      { timeout: 2000 },
    );
  });

  it("hides the pager when everything fits on one page", async () => {
    service.getExpenses.mockResolvedValue(page([expense("a")]));

    show();
    await screen.findByText("Expense a");

    expect(screen.queryByRole("button", { name: /next/i })).not.toBeInTheDocument();
  });

  it("pages through a longer list", async () => {
    const user = userEvent.setup();
    service.getExpenses.mockResolvedValue(page([expense("a")], { total: 41, pages: 3 }));
    show();
    await screen.findByText("Expense a");

    await user.click(screen.getByRole("button", { name: /next/i }));

    await waitFor(() =>
      expect(service.getExpenses).toHaveBeenLastCalledWith(expect.objectContaining({ page: 2 })));
  });

  it("deletes a row after the user confirms", async () => {
    const user = userEvent.setup();
    vi.spyOn(window, "confirm").mockReturnValue(true);
    service.getExpenses.mockResolvedValue(page([expense("a", { title: "Lunch" })]));
    service.deleteExpense.mockResolvedValue({ data: { id: "a" } });
    show();
    await screen.findByText("Lunch");

    await user.click(screen.getByRole("button", { name: /delete/i }));

    await waitFor(() => expect(service.deleteExpense).toHaveBeenCalledWith("a"));
    await waitFor(() => expect(screen.queryByText("Lunch")).not.toBeInTheDocument());
  });

  it("keeps the row when the user cancels the confirmation", async () => {
    const user = userEvent.setup();
    vi.spyOn(window, "confirm").mockReturnValue(false);
    service.getExpenses.mockResolvedValue(page([expense("a", { title: "Lunch" })]));
    show();
    await screen.findByText("Lunch");

    await user.click(screen.getByRole("button", { name: /delete/i }));

    expect(service.deleteExpense).not.toHaveBeenCalled();
    expect(screen.getByText("Lunch")).toBeInTheDocument();
  });

  it("puts the row back and explains when the delete fails", async () => {
    const user = userEvent.setup();
    vi.spyOn(window, "confirm").mockReturnValue(true);
    service.getExpenses.mockResolvedValue(page([expense("a", { title: "Lunch" })]));
    service.deleteExpense.mockRejectedValue({ response: { data: { message: "Expense not found" } } });
    show();
    await screen.findByText("Lunch");

    await user.click(screen.getByRole("button", { name: /delete/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Expense not found");
    expect(screen.getByText("Lunch")).toBeInTheDocument();
  });
});
