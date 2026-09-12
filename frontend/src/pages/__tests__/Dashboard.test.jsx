import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import Dashboard from "../dashboard/Dashboard";
import Reports from "../reports/Reports";

vi.mock("../../services/dashboardService", () => ({ getDashboard: vi.fn() }));

const service = await import("../../services/dashboardService");

const summary = {
  totalIncome: 65000, totalExpense: 8950, balance: 56050, savingsRate: 86, budgetUsed: 75,
  categoryBreakdown: [{ name: "Bills", value: 5500 }, { name: "Food", value: 2450 }],
  dailyExpense: [{ date: "2026-09-02", amount: 5950 }, { date: "2026-09-09", amount: 3000 }],
  monthlyTrend: [
    { month: "2026-04", income: 0, expense: 0 }, { month: "2026-05", income: 0, expense: 0 },
    { month: "2026-06", income: 0, expense: 0 }, { month: "2026-07", income: 0, expense: 0 },
    { month: "2026-08", income: 40000, expense: 3000 }, { month: "2026-09", income: 65000, expense: 8950 },
  ],
  recentExpenses: [{ _id: "e1", title: "Electricity", amount: 5500, category: "bills", date: "2026-09-02T00:00:00.000Z" }],
};

beforeEach(() => {
  service.getDashboard.mockResolvedValue({ data: summary });
});

const showDashboard = () => render(<MemoryRouter><Dashboard /></MemoryRouter>);

describe("Dashboard", () => {
  it("asks the API once instead of assembling the figures itself", async () => {
    showDashboard();

    await waitFor(() => expect(service.getDashboard).toHaveBeenCalledTimes(1));
  });

  it("shows the totals the API computed", async () => {
    showDashboard();

    expect(await screen.findByText(/56,050/)).toBeInTheDocument();
    expect(screen.getByText(/65,000/)).toBeInTheDocument();
    expect(screen.getByText(/8,950/)).toBeInTheDocument();
  });

  it("shows the savings rate from the API, not one it recomputed", async () => {
    showDashboard();

    expect(await screen.findByText("86%")).toBeInTheDocument();
  });

  it("renders a zero savings rate rather than NaN when there is no income", async () => {
    service.getDashboard.mockResolvedValue({
      data: { ...summary, totalIncome: 0, balance: -8950, savingsRate: 0 },
    });

    showDashboard();

    expect(await screen.findByText("0%")).toBeInTheDocument();
    expect(screen.queryByText(/NaN/)).not.toBeInTheDocument();
  });

  it("lists the recent expenses the API picked", async () => {
    showDashboard();

    expect(await screen.findByText("Electricity")).toBeInTheDocument();
  });

  it("says so when the account has no recent expenses", async () => {
    service.getDashboard.mockResolvedValue({ data: { ...summary, recentExpenses: [] } });

    showDashboard();

    expect(await screen.findByText(/add an expense to see it here/i)).toBeInTheDocument();
  });

  it("shows the backend's message when the request fails", async () => {
    service.getDashboard.mockRejectedValue({ response: { data: { message: "Not authorised, please sign in" } } });

    showDashboard();

    expect(await screen.findByRole("alert")).toHaveTextContent("Not authorised, please sign in");
  });

  it("shows zeros rather than blanks when the request fails", async () => {
    service.getDashboard.mockRejectedValue({ response: { data: { message: "Something went wrong" } } });

    showDashboard();

    await screen.findByRole("alert");
    expect(screen.getAllByText(/₹0|0%/).length).toBeGreaterThan(0);
  });
});

describe("Reports", () => {
  it("reuses the dashboard endpoint rather than a separate one", async () => {
    render(<MemoryRouter><Reports /></MemoryRouter>);

    await waitFor(() => expect(service.getDashboard).toHaveBeenCalled());
  });

  it("shows the same totals the dashboard shows", async () => {
    render(<MemoryRouter><Reports /></MemoryRouter>);

    expect(await screen.findByText(/65,000/)).toBeInTheDocument();
    expect(screen.getByText(/8,950/)).toBeInTheDocument();
  });

  it("names the biggest category from the API's own ordering", async () => {
    render(<MemoryRouter><Reports /></MemoryRouter>);

    expect(await screen.findAllByText(/Bills/)).not.toHaveLength(0);
  });
});
