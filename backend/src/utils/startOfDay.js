/** Midnight UTC on the day of `date`, the time every entry date is stored at. */
export default function startOfDay(date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}
