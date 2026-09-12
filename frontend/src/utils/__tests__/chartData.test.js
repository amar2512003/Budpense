import { describe, expect, it } from "vitest";

import { toDailySeries, toMonthlySeries } from "../chartData";

describe("chart data", () => {
  it("turns the API's ISO days into short axis labels", () => {
    const [first] = toDailySeries([{ date: "2026-09-02", amount: 450 }]);

    expect(first.amount).toBe(450);
    expect(first.date).toMatch(/02/);
    expect(first.date).toMatch(/Sep/);
  });

  it("keeps the daily rows in the order the API sent them", () => {
    const series = toDailySeries([
      { date: "2026-09-02", amount: 1 },
      { date: "2026-09-09", amount: 2 },
      { date: "2026-09-20", amount: 3 },
    ]);

    expect(series.map((point) => point.amount)).toEqual([1, 2, 3]);
  });

  it("turns 2026-09 into a month label without shifting the month", () => {
    const [first] = toMonthlySeries([{ month: "2026-09", income: 1, expense: 2 }]);

    expect(first.month).toMatch(/Sep/);
    expect(first).toMatchObject({ income: 1, expense: 2 });
  });

  it("keeps the six-month trend at six points, zeros included", () => {
    const trend = ["2026-04", "2026-05", "2026-06", "2026-07", "2026-08", "2026-09"]
      .map((month) => ({ month, income: 0, expense: 0 }));

    expect(toMonthlySeries(trend)).toHaveLength(6);
  });

  it("copes with an empty summary", () => {
    expect(toDailySeries()).toEqual([]);
    expect(toMonthlySeries()).toEqual([]);
  });
});
