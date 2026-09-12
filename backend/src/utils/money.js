/**
 * Rounds a currency figure to two places. Summing doubles leaves tails like
 * 0.30000000000000004, which is not a number to show anyone as an amount, and
 * a tail that size should not decide a comparison either.
 */
export default function toMoney(value) {
  return Math.round(value * 100) / 100;
}
