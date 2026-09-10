import { useState } from "react";

import Input from "../ui/Input";
import Select from "../ui/Select";
import Button from "../ui/Button";

const ExpenseForm = ({
  initialData = {},
  onSubmit,
  loading = false,
  onCancel,
}) => {
  const [formData, setFormData] = useState({
    title: initialData.title || "",
    amount: initialData.amount || "",
    category: initialData.category || "",
    date: initialData.date || "",
    paymentMethod: initialData.paymentMethod || "",
    description: initialData.description || "",
  });

  const [error, setError] = useState("");

  const categories = [
    { value: "food", label: "Food" },
    { value: "transport", label: "Transport" },
    { value: "shopping", label: "Shopping" },
    { value: "bills", label: "Bills" },
    { value: "entertainment", label: "Entertainment" },
    { value: "health", label: "Health" },
    { value: "other", label: "Other" },
  ];

  const paymentMethods = [
    { value: "cash", label: "Cash" },
    { value: "upi", label: "UPI" },
    { value: "card", label: "Card" },
    { value: "bank", label: "Bank Transfer" },
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

    if (!formData.amount || Number(formData.amount) <= 0) {
      setError("Please enter a valid amount.");
      return;
    }

    if (!formData.category) {
      setError("Please select a category.");
      return;
    }

    try {
      await onSubmit?.({
        ...formData,
        amount: Number(formData.amount),
      });
    } catch (err) {
      setError(err.message || "Something went wrong.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <Input
        label="Title"
        name="title"
        placeholder="e.g. Lunch"
        value={formData.title}
        onChange={handleChange}
      />

      <Input
        label="Amount"
        name="amount"
        type="number"
        min="0"
        step="0.01"
        placeholder="0.00"
        value={formData.amount}
        onChange={handleChange}
        required
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Select
          label="Category"
          name="category"
          value={formData.category}
          onChange={handleChange}
          options={categories}
          required
        />

        <Input
          label="Date"
          name="date"
          type="date"
          value={formData.date}
          onChange={handleChange}
          required
        />
      </div>

      <Select
        label="Payment Method"
        name="paymentMethod"
        value={formData.paymentMethod}
        onChange={handleChange}
        options={paymentMethods}
      />

      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">
          Description
        </label>

        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Add some notes..."
          rows={4}
          className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
        />
      </div>

      <div className="flex justify-end gap-3">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
          >
            Cancel
          </Button>
        )}

        <Button type="submit" loading={loading}>
          {initialData._id ? "Update Expense" : "Add Expense"}
        </Button>
      </div>
    </form>
  );
};

export default ExpenseForm;