/**
 * Today's date in `timeZone`, at midnight UTC: the form entry dates are stored
 * in. At 00:30 in Kolkata this is already the next date, while UTC is not.
 */
export default function localToday(now, timeZone = "UTC") {
  const [year, month, day] = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(now)
    .split("-")
    .map(Number);

  return new Date(Date.UTC(year, month - 1, day));
}

export function isTimeZone(value) {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value });
    return true;
  } catch {
    return false;
  }
}
