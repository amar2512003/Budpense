/**
 * Makes a user's search text safe to put inside a regular expression. Without
 * this, a "." matches any character and a stray "(" is a syntax error, while a
 * pattern like "(a+)+$" can pin the CPU for the length of the request.
 */
export default function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
