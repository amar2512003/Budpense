import assert from "node:assert/strict";
import { describe, it } from "node:test";

import occurrenceDate from "../src/utils/occurrenceDate.js";

const day = (iso) => new Date(`${iso}T00:00:00.000Z`);
const dates = (start, frequency, count) =>
  Array.from({ length: count }, (_, n) =>
    occurrenceDate(day(start), frequency, n).toISOString().slice(0, 10),
  );

describe("occurrenceDate", () => {
  it("steps weekly by seven days, across a month end", () => {
    assert.deepEqual(dates("2026-01-28", "weekly", 3), ["2026-01-28", "2026-02-04", "2026-02-11"]);
  });

  it("keeps monthly dates on the same day", () => {
    assert.deepEqual(dates("2026-01-15", "monthly", 3), ["2026-01-15", "2026-02-15", "2026-03-15"]);
  });

  it("moves the 31st to the last day of shorter months and back again", () => {
    assert.deepEqual(dates("2026-01-31", "monthly", 4), [
      "2026-01-31",
      "2026-02-28",
      "2026-03-31",
      "2026-04-30",
    ]);
  });

  it("uses 29 February in a leap year", () => {
    assert.deepEqual(dates("2028-01-30", "monthly", 2), ["2028-01-30", "2028-02-29"]);
  });

  it("rolls over the year", () => {
    assert.deepEqual(dates("2026-11-30", "monthly", 3), ["2026-11-30", "2026-12-30", "2027-01-30"]);
  });

  it("moves a yearly 29 February to the 28th in common years", () => {
    assert.deepEqual(dates("2028-02-29", "yearly", 5), [
      "2028-02-29",
      "2029-02-28",
      "2030-02-28",
      "2031-02-28",
      "2032-02-29",
    ]);
  });
});
