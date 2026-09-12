import { describe, expect, it } from "vitest";

import { toErrorMessage } from "../errorMessage";

const failure = (data) => ({ response: { data } });

describe("toErrorMessage", () => {
  it("uses the API's message", () => {
    expect(toErrorMessage(failure({ success: false, message: "Expense not found" }))).toBe("Expense not found");
  });

  it("prefers the field errors over the generic validation message", () => {
    expect(
      toErrorMessage(failure({ message: "Validation failed", errors: { amount: "Amount must be greater than 0" } })),
    ).toBe("Amount must be greater than 0");
  });

  it("joins several field errors into one sentence", () => {
    const message = toErrorMessage(
      failure({ message: "Validation failed", errors: { name: "Name is required", email: "Enter a valid email address" } }),
    );

    expect(message).toContain("Name is required");
    expect(message).toContain("Enter a valid email address");
  });

  it("falls back when the body has neither", () => {
    expect(toErrorMessage(failure({ success: false }))).toMatch(/something went wrong/i);
  });

  it("explains a dead server rather than showing Network Error", () => {
    expect(toErrorMessage(Object.assign(new Error("Network Error"), {}))).toMatch(/cannot reach the server/i);
  });

  it("survives being handed nothing at all", () => {
    expect(typeof toErrorMessage(undefined)).toBe("string");
    expect(toErrorMessage(undefined).length).toBeGreaterThan(0);
  });

  it("ignores an empty errors object", () => {
    expect(toErrorMessage(failure({ message: "Validation failed", errors: {} }))).toBe("Validation failed");
  });
});

describe("validateRegister", () => {
  const { validateRegister } = await import("../validators");

  const base = { name: "Srishti", email: "srishti@example.com", password: "a long password", confirmPassword: "a long password" };

  it("accepts a matching pair", () => {
    expect(validateRegister(base)).toEqual({});
  });

  it("rejects a genuine mismatch", () => {
    expect(validateRegister({ ...base, confirmPassword: "a different password" }).confirmPassword)
      .toBe("Passwords do not match.");
  });

  it("points at the invisible difference when only whitespace differs", () => {
    expect(validateRegister({ ...base, confirmPassword: "a long password " }).confirmPassword)
      .toMatch(/space at the start or end/);
  });

  it("still requires a long enough password", () => {
    expect(validateRegister({ ...base, password: "short", confirmPassword: "short" }).password)
      .toMatch(/at least 8/);
  });
});
