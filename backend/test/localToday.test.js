import assert from "node:assert/strict";
import { describe, it } from "node:test";

import localToday, { isTimeZone } from "../src/utils/localToday.js";

const iso = (date) => date.toISOString();

describe("localToday", () => {
  // 00:13 on 23 Nov in India, still 22 Nov in UTC.
  const now = new Date("2026-11-22T18:43:00Z");

  it("gives the local date, not the UTC one", () => {
    assert.equal(iso(localToday(now, "Asia/Kolkata")), "2026-11-23T00:00:00.000Z");
    assert.equal(iso(localToday(now, "UTC")), "2026-11-22T00:00:00.000Z");
  });

  it("goes back a day for zones behind UTC", () => {
    assert.equal(iso(localToday(new Date("2026-11-23T03:00:00Z"), "America/New_York")), "2026-11-22T00:00:00.000Z");
  });

  it("defaults to UTC", () => {
    assert.equal(iso(localToday(now)), "2026-11-22T00:00:00.000Z");
  });
});

describe("isTimeZone", () => {
  it("accepts IANA zones and rejects anything else", () => {
    assert.equal(isTimeZone("Asia/Kolkata"), true);
    assert.equal(isTimeZone("UTC"), true);
    assert.equal(isTimeZone("Mars/Olympus"), false);
  });
});
