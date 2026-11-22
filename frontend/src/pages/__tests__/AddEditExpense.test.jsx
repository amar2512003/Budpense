import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import AddExpense from "../expenses/AddExpense";
import EditExpense from "../expenses/EditExpense";
import useExpenseStore from "../../store/expenseStore";

vi.mock("../../services/expenseService", () => ({
  getExpenses: vi.fn(),
  getExpenseById: vi.fn(),
  createExpense: vi.fn(),
  updateExpense: vi.fn(),
  deleteExpense: vi.fn(),
}));

vi.mock("../../services/recurringService", () => ({
  getRecurring: vi.fn(), createRecurring: vi.fn(), updateRecurring: vi.fn(), deleteRecurring: vi.fn(),
}));

const service = await import("../../services/expenseService");
const recurringService = await import("../../services/recurringService");

const stored = {
  _id: "e1", type: "expense", amount: 1200, category: "transport", title: "Cab",
  paymentMethod: "card", description: "airport", date: "2026-09-08T00:00:00.000Z",
};

beforeEach(() => {
  useExpenseStore.setState({ expenses: [], selectedExpense: null, total: 0, loading: false, error: null });
});

const fillNew = async (user) => {
  await user.type(screen.getByLabelText(/title/i), "Lunch");
  await user.type(screen.getByLabelText(/amount/i), "450");
  await user.selectOptions(screen.getByLabelText(/category/i), "food");
  await user.type(screen.getByLabelText(/date/i), "2026-09-02");
};

describe("AddExpense", () => {
  it("creates the expense through the API", async () => {
    const user = userEvent.setup();
    service.createExpense.mockResolvedValue({ data: { expense: { ...stored, _id: "new" } } });
    render(<MemoryRouter><AddExpense /></MemoryRouter>);

    await fillNew(user);
    await user.click(screen.getByRole("button", { name: /add expense/i }));

    await waitFor(() => expect(service.createExpense).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Lunch", amount: 450, category: "food", date: "2026-09-02" }),
    ));
  });

  it("shows the backend's validation error and stays on the form", async () => {
    const user = userEvent.setup();
    service.createExpense.mockRejectedValue({
      response: { data: { message: "Validation failed", errors: { amount: "Amount must be greater than 0" } } },
    });
    render(<MemoryRouter><AddExpense /></MemoryRouter>);

    await fillNew(user);
    await user.click(screen.getByRole("button", { name: /add expense/i }));

    expect(await screen.findByText("Amount must be greater than 0")).toBeInTheDocument();
    expect(screen.getByLabelText(/title/i)).toHaveValue("Lunch");
  });

  it("sends a repeating expense to the recurring endpoint instead", async () => {
    const user = userEvent.setup();
    recurringService.createRecurring.mockResolvedValue({ data: { recurring: { _id: "r1" } } });
    render(<MemoryRouter><AddExpense /></MemoryRouter>);

    await fillNew(user);
    await user.selectOptions(screen.getByLabelText(/repeat/i), "monthly");
    await user.type(screen.getByLabelText(/ends on/i), "2026-12-31");
    await user.click(screen.getByRole("button", { name: /add expense/i }));

    await waitFor(() => expect(recurringService.createRecurring).toHaveBeenCalledWith(
      "expense",
      expect.objectContaining({ title: "Lunch", amount: 450, date: "2026-09-02", frequency: "monthly", endDate: "2026-12-31" }),
    ));
    expect(service.createExpense).not.toHaveBeenCalled();
  });

  it("refuses an end date before the first date", async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><AddExpense /></MemoryRouter>);

    await fillNew(user);
    await user.selectOptions(screen.getByLabelText(/repeat/i), "weekly");
    await user.type(screen.getByLabelText(/ends on/i), "2026-09-01");
    await user.click(screen.getByRole("button", { name: /add expense/i }));

    expect(await screen.findByText(/end date can't be before/i)).toBeInTheDocument();
    expect(recurringService.createRecurring).not.toHaveBeenCalled();
  });
});

describe("EditExpense", () => {
  const showEdit = () => render(
    <MemoryRouter initialEntries={["/app/expenses/e1/edit"]}>
      <Routes><Route path="/app/expenses/:id/edit" element={<EditExpense />} /></Routes>
    </MemoryRouter>,
  );

  it("loads the expense it is editing", async () => {
    service.getExpenseById.mockResolvedValue({ data: { expense: stored } });

    showEdit();

    await waitFor(() => expect(service.getExpenseById).toHaveBeenCalledWith("e1"));
    expect(await screen.findByDisplayValue("Cab")).toBeInTheDocument();
  });

  it("shows the API's date in a form the date input accepts", async () => {
    service.getExpenseById.mockResolvedValue({ data: { expense: stored } });

    showEdit();

    expect(await screen.findByDisplayValue("2026-09-08")).toBeInTheDocument();
  });

  it("sends the changes to the API", async () => {
    const user = userEvent.setup();
    service.getExpenseById.mockResolvedValue({ data: { expense: stored } });
    service.updateExpense.mockResolvedValue({ data: { expense: { ...stored, amount: 1500 } } });
    showEdit();
    await screen.findByDisplayValue("Cab");

    await user.clear(screen.getByLabelText(/amount/i));
    await user.type(screen.getByLabelText(/amount/i), "1500");
    await user.click(screen.getByRole("button", { name: /save|update/i }));

    await waitFor(() => expect(service.updateExpense).toHaveBeenCalledWith("e1", expect.objectContaining({ amount: 1500 })));
  });

  it("explains that editing an entry from a rule doesn't change the rule", async () => {
    service.getExpenseById.mockResolvedValue({ data: { expense: { ...stored, recurring: "r1" } } });

    showEdit();
    await screen.findByDisplayValue("Cab");

    expect(screen.getByText(/added by a repeating rule/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Recurring" })).toHaveAttribute("href", "/app/recurring");
  });

  it("does not offer to repeat an existing entry", async () => {
    service.getExpenseById.mockResolvedValue({ data: { expense: stored } });

    showEdit();
    await screen.findByDisplayValue("Cab");

    expect(screen.queryByLabelText(/repeat/i)).not.toBeInTheDocument();
  });

  it("says so when the record is not there", async () => {
    service.getExpenseById.mockRejectedValue({ response: { data: { message: "Expense not found" } } });

    showEdit();

    expect(await screen.findByText(/expense not found/i)).toBeInTheDocument();
  });
});
