const FALLBACK = "Something went wrong. Please try again.";

/**
 * The sentence to show a user for a failed request. The API answers
 * `{ message }`, and for a rejected body also `{ errors: { field: reason } }` —
 * those reasons are the useful part, so they are read out rather than replaced
 * by the generic "Validation failed".
 */
export const toErrorMessage = (error) => {
  const data = error?.response?.data;

  if (!data) {
    return error?.message && error.message !== "Network Error"
      ? error.message
      : "Cannot reach the server. Is the API running?";
  }

  const fieldErrors = data.errors ? Object.values(data.errors).filter(Boolean) : [];

  if (fieldErrors.length > 0) return fieldErrors.join(" ");

  return data.message || FALLBACK;
};

export default toErrorMessage;
