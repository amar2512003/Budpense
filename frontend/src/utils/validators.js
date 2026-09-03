// src/utils/validators.js

export const isRequired = (value) => {
  return value !== undefined && value !== null && String(value).trim() !== "";
};

export const isValidEmail = (email) => {
  if (!email) return false;

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const isValidPassword = (password) => {
  if (!password) return false;

  return password.length >= 8;
};

export const isValidAmount = (amount) => {
  if (amount === undefined || amount === null || amount === "") {
    return false;
  }

  const numericAmount = Number(amount);

  return Number.isFinite(numericAmount) && numericAmount > 0;
};

export const isValidDate = (date) => {
  if (!date) return false;

  const parsedDate = new Date(date);

  return !Number.isNaN(parsedDate.getTime());
};

export const validateExpense = (expense) => {
  const errors = {};

  if (!isRequired(expense.title)) {
    errors.title = "Title is required.";
  }

  if (!isValidAmount(expense.amount)) {
    errors.amount = "Please enter a valid amount.";
  }

  if (!isRequired(expense.category)) {
    errors.category = "Category is required.";
  }

  if (!isValidDate(expense.date)) {
    errors.date = "Please select a valid date.";
  }

  return errors;
};

export const validateLogin = (data) => {
  const errors = {};

  if (!isValidEmail(data.email)) {
    errors.email = "Please enter a valid email address.";
  }

  if (!isRequired(data.password)) {
    errors.password = "Password is required.";
  }

  return errors;
};

export const validateRegister = (data) => {
  const errors = {};

  if (!isRequired(data.name)) {
    errors.name = "Name is required.";
  }

  if (!isValidEmail(data.email)) {
    errors.email = "Please enter a valid email address.";
  }

  if (!isValidPassword(data.password)) {
    errors.password = "Password must be at least 8 characters.";
  }

  if (data.password !== data.confirmPassword) {
    errors.confirmPassword = "Passwords do not match.";
  }

  return errors;
};