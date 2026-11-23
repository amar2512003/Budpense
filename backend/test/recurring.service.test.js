import assert from "node:assert/strict";
import { after, before, beforeEach, describe, it } from "node:test";

import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";

import Expense from "../src/models/Expense.js";
import Recurring from "../src/models/Recurring.js";
import {
  createRule,
  deleteRule,
  generateDue,
  updateRule,
} from "../src/services/recurring.service.js";

const userId = new mongoose.Types.ObjectId();
const DAY_MS = 24 * 60 * 60 * 1000;

const daysAgo = (days) => {
  const today = new Date();
  return new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()) - days * DAY_MS);
};

const rent = (overrides = {}) => ({
  amount: 12000,
  category: "bills",
  title: "Rent",
  paymentMethod: "bank",
  date: daysAgo(14),
  frequency: "weekly",
  ...overrides,
});

const entriesOf = (rule) =>
  Expense.find({ recurring: rule._id }).sort({ date: 1 }).lean();

let mongod;

before(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  await Expense.syncIndexes();
});

after(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

beforeEach(async () => {
  await Expense.deleteMany({});
  await Recurring.deleteMany({});
});

describe("recurring entries", () => {
  it("creates every occurrence up to today when the rule is saved", async () => {
    const rule = await createRule(userId, "expense", rent());
    const entries = await entriesOf(rule);

    assert.equal(entries.length, 3);
    assert.deepEqual(
      entries.map((entry) => entry.date.getTime()),
      [daysAgo(14), daysAgo(7), daysAgo(0)].map((date) => date.getTime()),
    );
    assert.equal(entries[0].title, "Rent");
    assert.equal(entries[0].paymentMethod, "bank");
    assert.equal(entries[0].type, "expense");
    assert.equal(rule.nextDate.getTime(), daysAgo(-7).getTime());
  });

  it("creates nothing yet for a rule starting in the future", async () => {
    const rule = await createRule(userId, "expense", rent({ date: daysAgo(-3) }));

    assert.equal((await entriesOf(rule)).length, 0);
  });

  it("catches up on missed dates and never creates one twice", async () => {
    const rule = await createRule(userId, "income", {
      amount: 50000,
      source: "salary",
      date: daysAgo(0),
      frequency: "weekly",
    });

    // As if the server had been down for three weeks.
    await generateDue(new Date(Date.now() + 21 * DAY_MS));
    await generateDue(new Date(Date.now() + 21 * DAY_MS));

    assert.equal((await entriesOf(rule)).length, 4);
  });

  it("does not duplicate entries when a run died before saving its progress", async () => {
    const rule = await createRule(userId, "expense", rent());

    // Rewind the rule as though the entries were created but the save was lost.
    await Recurring.updateOne({ _id: rule._id }, { occurrences: 0, nextDate: daysAgo(14) });
    await generateDue();

    assert.equal((await entriesOf(rule)).length, 3);
  });

  it("stops at the end date", async () => {
    const rule = await createRule(userId, "expense", rent({ endDate: daysAgo(7) }));

    await generateDue(new Date(Date.now() + 60 * DAY_MS));

    assert.equal((await entriesOf(rule)).length, 2);
    assert.equal((await Recurring.findById(rule._id)).nextDate, null);
  });

  it("refuses an end date before the start", async () => {
    await assert.rejects(createRule(userId, "expense", rent({ endDate: daysAgo(20) })), {
      status: 400,
    });
  });

  it("creates nothing after the rule is stopped", async () => {
    const rule = await createRule(userId, "expense", rent());

    await deleteRule(userId, "expense", rule._id);
    await generateDue(new Date(Date.now() + 60 * DAY_MS));

    assert.equal((await entriesOf(rule)).length, 3);
  });

  it("applies an edit to future entries only", async () => {
    const rule = await createRule(userId, "expense", rent());

    await updateRule(userId, "expense", rule._id, { ...rent(), amount: 13000 });
    await generateDue(new Date(Date.now() + 7 * DAY_MS));

    const amounts = (await entriesOf(rule)).map((entry) => entry.amount);
    assert.deepEqual(amounts, [12000, 12000, 12000, 13000]);
  });

  it("counts a new frequency from the next pending date", async () => {
    const rule = await createRule(userId, "expense", rent());

    const updated = await updateRule(userId, "expense", rule._id, { ...rent(), frequency: "monthly" });

    assert.equal(updated.nextDate.getTime(), daysAgo(-7).getTime());
    assert.equal(updated.startDate.getTime(), daysAgo(-7).getTime());
  });

  it("revives an ended rule when its end date moves later", async () => {
    const rule = await createRule(userId, "expense", rent({ endDate: daysAgo(7) }));

    const updated = await updateRule(userId, "expense", rule._id, { ...rent(), endDate: undefined });

    assert.equal((await entriesOf(rule)).length, 3);
    assert.equal(updated.nextDate.getTime(), daysAgo(-7).getTime());
  });

  it("does not fill in dates that passed while the rule had ended", async () => {
    const rule = await createRule(userId, "expense", rent({ date: daysAgo(28), endDate: daysAgo(21) }));

    await updateRule(userId, "expense", rule._id, { ...rent(), date: daysAgo(28), endDate: undefined });

    const dates = (await entriesOf(rule)).map((entry) => entry.date.getTime());
    assert.deepEqual(dates, [daysAgo(28), daysAgo(21), daysAgo(0)].map((date) => date.getTime()));
  });

  it("keeps generating other rules when one fails", async () => {
    const broken = await createRule(userId, "expense", rent({ date: daysAgo(-1) }));
    const healthy = await createRule(userId, "expense", rent({ date: daysAgo(-2) }));
    // A template that no longer validates, e.g. a category since removed.
    await Recurring.collection.updateOne({ _id: broken._id }, { $set: { category: "gone" } });

    await generateDue(new Date(Date.now() + 3 * DAY_MS));

    assert.equal((await entriesOf(healthy)).length, 1);
  });

  it("rejects a save from a copy loaded before someone else's edit", async () => {
    const rule = await createRule(userId, "expense", rent());
    const stale = await Recurring.findById(rule._id);

    await updateRule(userId, "expense", rule._id, { ...rent(), frequency: "monthly" });
    stale.occurrences += 1;

    await assert.rejects(stale.save(), mongoose.Error.VersionError);
  });

  it("creates an entry dated today in the user's zone before UTC reaches that date", async () => {
    const start = new Date("2030-01-01T00:00:00Z");
    // 00:13 on 1 Jan in India; still 31 Dec in UTC.
    const justAfterMidnightInIndia = new Date("2029-12-31T18:43:00Z");
    const india = await createRule(userId, "income", {
      amount: 2000, source: "investment", date: start, frequency: "weekly", timeZone: "Asia/Kolkata",
    });
    const utc = await createRule(userId, "income", {
      amount: 2000, source: "investment", date: start, frequency: "weekly",
    });

    await generateDue(justAfterMidnightInIndia);

    assert.equal((await entriesOf(india)).length, 1);
    assert.equal((await entriesOf(utc)).length, 0);
  });

  it("fills the missing periods when the start moves earlier", async () => {
    // Started today, then its one entry was moved back two weeks by hand.
    const rule = await createRule(userId, "expense", rent({ date: daysAgo(0) }));
    await Expense.updateOne({ recurring: rule._id }, { date: daysAgo(14) });

    const updated = await updateRule(userId, "expense", rule._id, { ...rent(), date: daysAgo(14) });

    const dates = (await entriesOf(rule)).map((entry) => entry.date.getTime());
    assert.deepEqual(dates, [daysAgo(14), daysAgo(7), daysAgo(0)].map((date) => date.getTime()));
    assert.equal(updated.startDate.getTime(), daysAgo(14).getTime());
    assert.equal(updated.nextDate.getTime(), daysAgo(-7).getTime());
  });

  it("doesn't double up periods that already have an entry on another day", async () => {
    const rule = await createRule(userId, "expense", rent({ date: daysAgo(14) }));

    const updated = await updateRule(userId, "expense", rule._id, { ...rent(), date: daysAgo(17) });

    const dates = (await entriesOf(rule)).map((entry) => entry.date.getTime());
    assert.deepEqual(dates, [daysAgo(14), daysAgo(7), daysAgo(0)].map((date) => date.getTime()));
    assert.equal(updated.nextDate.getTime(), daysAgo(-4).getTime());
  });

  it("refuses a new start after the end date", async () => {
    const rule = await createRule(userId, "expense", rent({ date: daysAgo(14), endDate: daysAgo(7) }));

    await assert.rejects(
      updateRule(userId, "expense", rule._id, { ...rent(), date: daysAgo(3), endDate: daysAgo(7) }),
      { status: 400 },
    );
  });

  it("hides other users' rules", async () => {
    const rule = await createRule(userId, "expense", rent());

    await assert.rejects(deleteRule(new mongoose.Types.ObjectId(), "expense", rule._id), {
      status: 404,
    });
  });
});
