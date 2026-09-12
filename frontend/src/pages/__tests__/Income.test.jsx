import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import Income from "../income/Income";
import useIncomeStore from "../../store/incomeStore";

vi.mock("../../services/incomeService", () => ({
  getIncome: vi.fn(), createIncome: vi.fn(), updateIncome: vi.fn(), deleteIncome: vi.fn(),
}));

const service = await import("../../services/incomeService");

const entry = (id, overrides = {}) => ({
  _id: id, type: "income", amount: 60000, source: "salary",
  description: "September pay", date: "2026-09-01T00:00:00.000Z", ...overrides,
});
const page = (items) => ({ data: { items, total: items.length, page: 1, pages: 1 } });

beforeEach(() => {
  useIncomeStore.setState({ income: [], total: 0, page: 1, pages: 1, loading: false, error: null });
  service.getIncome.mockResolvedValue(page([]));
});

describe("Income page", () => {
  it("fetches income on arrival, which it never used to do", async () => {
    render(<Income />);

    await waitFor(() => expect(service.getIncome).toHaveBeenCalled());
  });

  it("lists entries from the API with a readable date", async () => {
    service.getIncome.mockResolvedValue(page([entry("a")]));

    render(<Income />);

    expect(await screen.findByText("Salary")).toBeInTheDocument();
    expect(screen.queryByText(/2026-09-01T00:00:00.000Z/)).not.toBeInTheDocument();
  });

  it("shows the empty state when there is no income", async () => {
    render(<Income />);

    expect(await screen.findByText(/no income found/i)).toBeInTheDocument();
  });

  it("shows the backend's error", async () => {
    service.getIncome.mockRejectedValue({ response: { data: { message: "Not authorised, please sign in" } } });

    render(<Income />);

    expect(await screen.findByRole("alert")).toHaveTextContent("Not authorised, please sign in");
  });

  it("creates income through the API", async () => {
    const user = userEvent.setup();
    service.createIncome.mockResolvedValue({ data: { income: entry("new") } });
    render(<Income />);
    await screen.findByText(/no income found/i);

    await user.click(screen.getByRole("button", { name: /add income/i }));
    await user.selectOptions(screen.getByLabelText(/source/i), "freelancing");
    await user.type(screen.getByLabelText(/amount/i), "25000");
    await user.type(screen.getByLabelText(/date/i), "2026-09-04");
    await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: /add income/i }));

    await waitFor(() => expect(service.createIncome).toHaveBeenCalledWith(
      expect.objectContaining({ source: "freelancing", amount: 25000, date: "2026-09-04" }),
    ));
  });

  it("keeps the form open and explains when the API rejects the entry", async () => {
    const user = userEvent.setup();
    service.createIncome.mockRejectedValue({
      response: { data: { message: "Validation failed", errors: { amount: "Amount must be greater than 0" } } },
    });
    render(<Income />);
    await screen.findByText(/no income found/i);

    await user.click(screen.getByRole("button", { name: /add income/i }));
    await user.selectOptions(screen.getByLabelText(/source/i), "salary");
    await user.type(screen.getByLabelText(/amount/i), "5");
    await user.type(screen.getByLabelText(/date/i), "2026-09-04");
    await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: /add income/i }));

    expect(await screen.findByText("Amount must be greater than 0")).toBeInTheDocument();
  });

  it("opens an existing entry with a date the input can show", async () => {
    const user = userEvent.setup();
    service.getIncome.mockResolvedValue(page([entry("a")]));
    render(<Income />);
    await screen.findByText("Salary");

    await user.click(screen.getByRole("button", { name: /edit/i }));

    expect(screen.getByLabelText(/date/i)).toHaveValue("2026-09-01");
  });

  it("deletes after confirmation", async () => {
    const user = userEvent.setup();
    vi.spyOn(window, "confirm").mockReturnValue(true);
    service.getIncome.mockResolvedValue(page([entry("a")]));
    service.deleteIncome.mockResolvedValue({ data: { id: "a" } });
    render(<Income />);
    await screen.findByText("Salary");

    await user.click(screen.getByRole("button", { name: /delete/i }));

    await waitFor(() => expect(service.deleteIncome).toHaveBeenCalledWith("a"));
  });
});
