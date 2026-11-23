import assert from "node:assert/strict";
import { after, before, beforeEach, describe, it } from "node:test";

import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";

import Budget from "../src/models/Budget.js";
import Expense from "../src/models/Expense.js";
import { alertForNewExpense } from "../src/services/budget.service.js";
import { getDashboard } from "../src/services/dashboard.service.js";
import { createRecord } from "../src/services/expense.service.js";

const userId = new mongoose.Types.ObjectId();
const now = new Date();
const year = now.getUTCFullYear();
const month = now.getUTCMonth() + 1;
const today = new Date(Date.UTC(year, month - 1, now.getUTCDate()));
const lastMonth = new Date(Date.UTC(year, month - 2, 1));

const budget = (category, amount, extra = {}) =>
  Budget.create({ user: userId, category, amount, year, month, ...extra });

const spend = (category, amount, date = today) =>
  Expense.create({ user: userId, type: "expense", category, amount, date });

const addExpense = async (category, amount) => {
  const record = await createRecord(userId, "expense", { category, amount, date: today });

  return alertForNewExpense(userId, record);
};

let mongod;

before(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
});

after(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

beforeEach(async () => {
  await Expense.deleteMany({});
  await Budget.deleteMany({});
});

describe("dashboard budget alerts", () => {
  it("lists this month's categories at 80% and at 100%, and none below", async () => {
    await budget("food", 5000);
    await budget("transport", 2000);
    await budget("shopping", 1000);
    await spend("food", 4250);
    await spend("transport", 2600);
    await spend("shopping", 790);

    const { budgetAlerts } = await getDashboard(userId);

    assert.deepEqual(
      budgetAlerts.map(({ category, level, percentage, overspent }) => ({ category, level, percentage, overspent })),
      [
        { category: "food", level: "warning", percentage: 85, overspent: 0 },
        { category: "transport", level: "over", percentage: 130, overspent: 600 },
      ],
    );
  });

  it("never alerts on a category without a budget", async () => {
    await spend("travel", 99999);

    assert.deepEqual((await getDashboard(userId)).budgetAlerts, []);
  });

  it("measures against the rolled-over total, like the budget card", async () => {
    await Budget.create({ user: userId, category: "food", amount: 5000, year: lastMonth.getUTCFullYear(), month: lastMonth.getUTCMonth() + 1 });
    await spend("food", 3000, lastMonth);
    await budget("food", 5000, { rollover: true });
    // 4,500 of 7,000 available is 64%; it would be 90% without the rollover.
    await spend("food", 4500);

    assert.deepEqual((await getDashboard(userId)).budgetAlerts, []);
  });
});

describe("alert for a new expense", () => {
  it("is returned only when the expense crosses a threshold", async () => {
    await budget("food", 5000);

    assert.equal(await addExpense("food", 3900), null);

    const warning = await addExpense("food", 200);
    assert.equal(warning.level, "warning");
    assert.equal(warning.percentage, 82);

    assert.equal(await addExpense("food", 100), null);

    const over = await addExpense("food", 1000);
    assert.equal(over.level, "over");
    assert.equal(over.overspent, 200);

    assert.equal(await addExpense("food", 50), null);
  });

  it("doesn't repeat a warning because of floating-point drift", async () => {
    await budget("food", 5000);
    await spend("food", 4000);

    // 4096.03 - 96.03 is 3999.9999999999995 unrounded, which reads as under 80%.
    assert.equal(await addExpense("food", 96.03), null);
  });

  it("is null for a category without a budget", async () => {
    assert.equal(await addExpense("travel", 5000), null);
  });
});
