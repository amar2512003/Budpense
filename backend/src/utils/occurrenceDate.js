const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * The date of occurrence n of a schedule starting on `start` (occurrence 0).
 * Monthly and yearly dates that do not exist in the target month, such as the
 * 31st in April or 29 February in a common year, land on its last day.
 */
export default function occurrenceDate(start, frequency, n) {
  if (frequency === "weekly") {
    return new Date(start.getTime() + n * WEEK_MS);
  }

  const year = start.getUTCFullYear();
  const month = start.getUTCMonth() + (frequency === "yearly" ? n * 12 : n);
  // Day 0 of the following month is the last day of this one.
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();

  return new Date(Date.UTC(year, month, Math.min(start.getUTCDate(), lastDay)));
}
