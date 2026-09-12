/**
 * A calendar month as a half-open UTC range: [first instant, first instant of
 * the next month). Built from Date.UTC so it cannot drift with the server's
 * timezone, and half-open so an expense dated midnight on the last day of the
 * month belongs to that month rather than being counted twice or missed.
 */
export default function monthRange(year, month) {
  return {
    start: new Date(Date.UTC(year, month - 1, 1)),
    end: new Date(Date.UTC(year, month, 1)),
  };
}
