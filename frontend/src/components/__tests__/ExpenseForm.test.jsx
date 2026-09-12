import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import ExpenseForm from "../expense/ExpenseForm";

const fill = async (user, { title = "Lunch", amount = "450", category = "food", date = "2026-09-02" } = {}) => {
  if (title) await user.type(screen.getByLabelText(/title/i), title);
  if (amount) await user.type(screen.getByLabelText(/amount/i), amount);
  if (category) await user.selectOptions(screen.getByLabelText(/category/i), category);
  if (date) await user.type(screen.getByLabelText(/date/i), date);
};

describe("ExpenseForm", () => {
  it("submits what the user typed, with the amount as a number", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<ExpenseForm onSubmit={onSubmit} />);

    await fill(user);
    await user.click(screen.getByRole("button", { name: /add expense|save/i }));

    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
      title: "Lunch", amount: 450, category: "food", date: "2026-09-02",
    }));
  });

  it("shows the backend's validation message when the save is rejected", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockRejectedValue(new Error("Amount must be greater than 0"));
    render(<ExpenseForm onSubmit={onSubmit} />);

    await fill(user);
    await user.click(screen.getByRole("button", { name: /add expense|save/i }));

    expect(await screen.findByText("Amount must be greater than 0")).toBeInTheDocument();
  });

  it("does not call the API when the amount is missing", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<ExpenseForm onSubmit={onSubmit} />);

    await fill(user, { amount: "" });
    await user.click(screen.getByRole("button", { name: /add expense|save/i }));

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("does not call the API when no category is chosen", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<ExpenseForm onSubmit={onSubmit} />);

    await fill(user, { category: "" });
    await user.click(screen.getByRole("button", { name: /add expense|save/i }));

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("trims an API timestamp down to what a date input can show", () => {
    render(<ExpenseForm initialData={{ title: "Cab", amount: 1200, category: "transport", date: "2026-09-08T00:00:00.000Z" }} onSubmit={vi.fn()} />);

    expect(screen.getByLabelText(/date/i)).toHaveValue("2026-09-08");
  });

  it("fills every field when editing an existing expense", () => {
    render(<ExpenseForm
      initialData={{ title: "Cab", amount: 1200, category: "transport", paymentMethod: "card", description: "airport", date: "2026-09-08T00:00:00.000Z" }}
      onSubmit={vi.fn()}
    />);

    expect(screen.getByLabelText(/title/i)).toHaveValue("Cab");
    expect(screen.getByLabelText(/amount/i)).toHaveValue(1200);
    expect(screen.getByLabelText(/category/i)).toHaveValue("transport");
  });

  it("offers every category the API accepts", () => {
    render(<ExpenseForm onSubmit={vi.fn()} />);

    const values = [...screen.getByLabelText(/category/i).options].map((option) => option.value);

    for (const category of ["food", "transport", "shopping", "bills", "entertainment", "health", "education", "travel", "other"]) {
      expect(values).toContain(category);
    }
  });

  it("offers only payment methods the API accepts", () => {
    render(<ExpenseForm onSubmit={vi.fn()} />);

    const values = [...screen.getByLabelText(/payment/i).options].map((option) => option.value).filter(Boolean);

    expect(values.sort()).toEqual(["bank", "card", "cash", "upi"]);
  });
});

describe("Select placeholder", () => {
  it("keeps a placeholder option where a field may legitimately be empty", async () => {
    const { default: ExpenseFilters } = await import("../expense/ExpenseFilters");
    render(<ExpenseFilters search="" setSearch={vi.fn()} category="" setCategory={vi.fn()} sort="newest" setSort={vi.fn()} />);

    const [categorySelect] = screen.getAllByRole("combobox");

    expect([...categorySelect.options].map((option) => option.value)).toContain("");
  });

  it("drops it where the field always has a value", async () => {
    const { default: ExpenseFilters } = await import("../expense/ExpenseFilters");
    render(<ExpenseFilters search="" setSearch={vi.fn()} category="" setCategory={vi.fn()} sort="newest" setSort={vi.fn()} />);

    const sortSelect = screen.getAllByRole("combobox")[1];

    expect([...sortSelect.options].map((option) => option.value)).not.toContain("");
    expect([...sortSelect.options]).toHaveLength(4);
  });
});
