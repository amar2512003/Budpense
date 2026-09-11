// src/components/budget/BudgetForm.jsx

import { useState } from "react";

import Input from "../ui/Input";
import Select from "../ui/Select";
import Button from "../ui/Button";

const BudgetForm = ({
  initialData = {},
  onSubmit,
  onCancel,
  loading = false,
}) => {
  const [formData, setFormData] = useState({
    category: initialData.category || "",
    amount: initialData.amount || "",
    month: initialData.month || "",
    year:
      initialData.year ||
      new Date().getFullYear(),
  });

  const [error, setError] = useState("");

  const categories = [
    {
      value: "food",
      label: "Food",
    },
    {
      value: "transport",
      label: "Transport",
    },
    {
      value: "shopping",
      label: "Shopping",
    },
    {
      value: "bills",
      label: "Bills",
    },
    {
      value: "entertainment",
      label: "Entertainment",
    },
    {
      value: "health",
      label: "Health",
    },
    {
      value: "education",
      label: "Education",
    },
    {
      value: "other",
      label: "Other",
    },
  ];

  const months = [
    { value: "01", label: "January" },
    { value: "02", label: "February" },
    { value: "03", label: "March" },
    { value: "04", label: "April" },
    { value: "05", label: "May" },
    { value: "06", label: "June" },
    { value: "07", label: "July" },
    { value: "08", label: "August" },
    { value: "09", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.category) {
      setError("Please select a category.");
      return;
    }

    if (
      !formData.amount ||
      Number(formData.amount) <= 0
    ) {
      setError(
        "Please enter a valid budget amount."
      );
      return;
    }

    if (!formData.month) {
      setError("Please select a month.");
      return;
    }

    try {
      await onSubmit?.({
        ...formData,
        amount: Number(formData.amount),
        year: Number(formData.year),
      });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Something went wrong."
      );
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5"
    >
      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <Select
        label="Category"
        name="category"
        value={formData.category}
        onChange={handleChange}
        options={categories}
        placeholder="Select category"
        required
      />

      <Input
        label="Budget Amount"
        name="amount"
        type="number"
        min="0"
        step="0.01"
        placeholder="e.g. 10000"
        value={formData.amount}
        onChange={handleChange}
        required
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Select
          label="Month"
          name="month"
          value={formData.month}
          onChange={handleChange}
          options={months}
          placeholder="Select month"
          required
        />

        <Input
          label="Year"
          name="year"
          type="number"
          min="2020"
          max="2100"
          value={formData.year}
          onChange={handleChange}
          required
        />
      </div>

      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
        >
          Cancel
        </Button>

        <Button
          type="submit"
          loading={loading}
        >
          {initialData._id
            ? "Update Budget"
            : "Create Budget"}
        </Button>
      </div>
    </form>
  );
};

export default BudgetForm;