import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import Recurring from "../recurring/Recurring";
import useRecurringStore from "../../store/recurringStore";

vi.mock("../../services/recurringService", () => ({
  getRecurring: vi.fn(), createRecurring: vi.fn(), updateRecurring: vi.fn(), deleteRecurring: vi.fn(),
}));

const service = await import("../../services/recurringService");

const rent = {
  _id: "r1", type: "expense", amount: 12000, category: "bills", title: "Rent",
  paymentMethod: "bank", frequency: "monthly", startDate: "2026-09-01T00:00:00.000Z",
  nextDate: "2026-12-01T00:00:00.000Z",
};
const salary = {
  _id: "r2", type: "income", amount: 60000, source: "salary", frequency: "monthly",
  startDate: "2026-01-01T00:00:00.000Z", nextDate: null, endDate: "2026-06-30T00:00:00.000Z",
};
const items = (list) => ({ data: { items: list } });

beforeEach(() => {
  useRecurringStore.setState({ rules: { expense: [], income: [] }, loading: false, error: null });
  service.getRecurring.mockImplementation(async (type) => items(type === "income" ? [salary] : [rent]));
});

describe("Recurring page", () => {
  it("lists rules of both types with their next date or that they ended", async () => {
    render(<Recurring />);

    expect(await screen.findByText("Rent")).toBeInTheDocument();
    expect(screen.getByText(/next on 01 dec 2026/i)).toBeInTheDocument();
    expect(screen.getByText("Salary")).toBeInTheDocument();
    expect(screen.getByText(/ended/i)).toBeInTheDocument();
  });

  it("saves an edit through the API", async () => {
    const user = userEvent.setup();
    service.updateRecurring.mockResolvedValue({ data: { recurring: { ...rent, amount: 13000 } } });
    render(<Recurring />);
    await screen.findByText("Rent");

    await user.click(screen.getAllByRole("button", { name: "Edit" })[0]);
    const dialog = screen.getByRole("dialog");
    await user.clear(within(dialog).getByLabelText(/amount/i));
    await user.type(within(dialog).getByLabelText(/amount/i), "13000");
    await user.click(within(dialog).getByRole("button", { name: /save/i }));

    await waitFor(() => expect(service.updateRecurring).toHaveBeenCalledWith(
      "expense",
      "r1",
      expect.objectContaining({ amount: 13000, category: "bills", frequency: "monthly" }),
    ));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("moves the start date", async () => {
    const user = userEvent.setup();
    service.updateRecurring.mockResolvedValue({ data: { recurring: rent } });
    render(<Recurring />);
    await screen.findByText("Rent");

    await user.click(screen.getAllByRole("button", { name: "Edit" })[0]);
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByLabelText(/starts on/i)).toHaveValue("2026-09-01");

    await user.clear(within(dialog).getByLabelText(/starts on/i));
    await user.type(within(dialog).getByLabelText(/starts on/i), "2026-07-01");
    await user.click(within(dialog).getByRole("button", { name: /save/i }));

    await waitFor(() => expect(service.updateRecurring).toHaveBeenCalledWith(
      "expense", "r1", expect.objectContaining({ date: "2026-07-01" }),
    ));
  });

  it("refuses an end date before the start", async () => {
    const user = userEvent.setup();
    render(<Recurring />);
    await screen.findByText("Rent");

    await user.click(screen.getAllByRole("button", { name: "Edit" })[0]);
    const dialog = screen.getByRole("dialog");
    await user.type(within(dialog).getByLabelText(/ends on/i), "2026-08-01");
    await user.click(within(dialog).getByRole("button", { name: /save/i }));

    expect(await within(dialog).findByText(/end date can't be before the start/i)).toBeInTheDocument();
    expect(service.updateRecurring).not.toHaveBeenCalled();
  });

  it("stops a rule after confirmation", async () => {
    const user = userEvent.setup();
    vi.spyOn(window, "confirm").mockReturnValue(true);
    service.deleteRecurring.mockResolvedValue({ data: { id: "r1" } });
    render(<Recurring />);
    await screen.findByText("Rent");

    await user.click(screen.getAllByRole("button", { name: "Stop" })[0]);

    await waitFor(() => expect(service.deleteRecurring).toHaveBeenCalledWith("expense", "r1"));
    await waitFor(() => expect(screen.queryByText("Rent")).not.toBeInTheDocument());
  });
});
