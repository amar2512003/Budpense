import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";

import BudgetAlerts from "../budget/BudgetAlerts";
import useAuthStore from "../../store/authStore";

const now = new Date();
const month = String(now.getUTCMonth() + 1).padStart(2, "0");
const year = now.getUTCFullYear();

const food = {
  category: "food", month, year, level: "warning",
  percentage: 85.4, spent: 4270, totalAvailable: 5000, overspent: 0,
};
const transport = {
  category: "transport", month, year, level: "over",
  percentage: 130, spent: 2600, totalAvailable: 2000, overspent: 600,
};

beforeEach(() => {
  window.localStorage.clear();
  useAuthStore.setState({ user: { id: "u1" } });
});

describe("BudgetAlerts", () => {
  it("shows a warning and a separate over-budget alert, over first", () => {
    render(<BudgetAlerts alerts={[food, transport]} />);

    const alerts = screen.getAllByRole("alert");
    expect(alerts[0]).toHaveTextContent("Transport: ₹600.00 over your ₹2,000.00 budget");
    expect(alerts[1]).toHaveTextContent("Food: 85% of ₹5,000.00 used");
  });

  it("says the budget is used up at exactly 100%", () => {
    render(<BudgetAlerts alerts={[{ ...food, level: "over", percentage: 100, spent: 5000 }]} />);

    expect(screen.getByRole("alert")).toHaveTextContent("Food: all of your ₹5,000.00 budget is used");
  });

  it("renders nothing without alerts", () => {
    const { container } = render(<BudgetAlerts alerts={[]} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("keeps a dismissed alert hidden after the page reloads", async () => {
    const user = userEvent.setup();
    const { unmount } = render(<BudgetAlerts alerts={[food]} />);

    await user.click(screen.getByRole("button", { name: /dismiss food/i }));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();

    unmount();
    render(<BudgetAlerts alerts={[food]} />);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("keeps one user's dismissals from hiding another user's alerts", async () => {
    const user = userEvent.setup();
    const { unmount } = render(<BudgetAlerts alerts={[food]} />);

    await user.click(screen.getByRole("button", { name: /dismiss food/i }));
    unmount();
    useAuthStore.setState({ user: { id: "u2" } });
    render(<BudgetAlerts alerts={[food]} />);

    expect(screen.getByRole("alert")).toHaveTextContent("Food: 85%");
  });

  it("brings a dismissed category back when it crosses the next threshold", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<BudgetAlerts alerts={[food]} />);

    await user.click(screen.getByRole("button", { name: /dismiss food/i }));
    rerender(<BudgetAlerts alerts={[{ ...food, level: "over", spent: 5200, overspent: 200 }]} />);

    expect(screen.getByRole("alert")).toHaveTextContent("Food: ₹200.00 over");
  });

  it("brings a dismissed alert back in a new month", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<BudgetAlerts alerts={[food]} />);

    await user.click(screen.getByRole("button", { name: /dismiss food/i }));
    rerender(<BudgetAlerts alerts={[{ ...food, year: year + 1 }]} />);

    expect(screen.getByRole("alert")).toHaveTextContent(/Food.*: 85%/);
  });
});
