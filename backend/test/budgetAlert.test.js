import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { alertLevel, toAlert } from "../src/utils/budgetAlert.js";

describe("alertLevel", () => {
  it("stays quiet below 80%", () => {
    assert.equal(alertLevel(3950, 5000), null);
    assert.equal(alertLevel(3999.99, 5000), null);
  });

  it("warns from exactly 80%", () => {
    assert.equal(alertLevel(4000, 5000), "warning");
    assert.equal(alertLevel(4999.99, 5000), "warning");
  });

  it("reports over budget from exactly 100%", () => {
    assert.equal(alertLevel(5000, 5000), "over");
    assert.equal(alertLevel(6200, 5000), "over");
  });
});

describe("toAlert", () => {
  const budget = { category: "food", month: "11", year: 2026, percentage: 124, totalAvailable: 5000 };

  it("returns null for a budget under 80%", () => {
    assert.equal(toAlert({ ...budget, spent: 3950, percentage: 79 }), null);
  });

  it("includes how much was overspent", () => {
    const alert = toAlert({ ...budget, spent: 6200 });

    assert.equal(alert.level, "over");
    assert.equal(alert.overspent, 1200);
  });

  it("reports nothing overspent at a warning", () => {
    assert.equal(toAlert({ ...budget, spent: 4250, percentage: 85 }).overspent, 0);
  });
});
