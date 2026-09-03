import { useMemo, useState } from "react";

import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import Modal from "../../components/ui/Modal";
import useIncomeStore from "../../store/incomeStore";
import { formatCurrency } from "../../utils/formatCurrency";
import { sortByNewestDate, totalAmount } from "../../utils/finance";

const emptyForm = {
  source: "",
  amount: "",
  date: "",
  description: "",
};

const sourceOptions = [
  { value: "salary", label: "Salary" },
  { value: "freelancing", label: "Freelancing" },
  { value: "business", label: "Business" },
  { value: "investment", label: "Investment" },
  { value: "other", label: "Other" },
];

const labelForSource = (source) =>
  sourceOptions.find((option) => option.value === source)?.label || source;

const Income = () => {
  const income = useIncomeStore((state) => state.income);
  const loading = useIncomeStore((state) => state.loading);
  const addIncome = useIncomeStore((state) => state.addIncome);
  const editIncome = useIncomeStore((state) => state.editIncome);
  const removeIncome = useIncomeStore((state) => state.removeIncome);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIncome, setEditingIncome] = useState(null);
  const [search, setSearch] = useState("");
  const [formData, setFormData] = useState(emptyForm);
  const [error, setError] = useState("");

  const openForm = (entry = null) => {
    setEditingIncome(entry);
    setFormData(
      entry
        ? {
            source: entry.source || "",
            amount: entry.amount || "",
            date: entry.date || "",
            description: entry.description || "",
          }
        : emptyForm
    );
    setError("");
    setIsModalOpen(true);
  };

  const closeForm = () => {
    setIsModalOpen(false);
    setEditingIncome(null);
    setFormData(emptyForm);
    setError("");
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({ ...previous, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!formData.source) {
      setError("Please select an income source.");
      return;
    }

    if (!formData.amount || Number(formData.amount) <= 0) {
      setError("Please enter a valid amount.");
      return;
    }

    if (!formData.date) {
      setError("Please select a date.");
      return;
    }

    const incomeData = { ...formData, amount: Number(formData.amount) };

    if (editingIncome) {
      await editIncome(editingIncome._id || editingIncome.id, incomeData);
    } else {
      await addIncome(incomeData);
    }

    closeForm();
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this income?")) {
      return;
    }

    await removeIncome(id);
  };

  const filteredIncome = useMemo(() => {
    const query = search.trim().toLowerCase();
    const entries = sortByNewestDate(income);

    if (!query) {
      return entries;
    }

    return entries.filter(
      (entry) =>
        entry.source?.toLowerCase().includes(query) ||
        entry.description?.toLowerCase().includes(query)
    );
  }, [income, search]);

  const totalIncome = useMemo(() => totalAmount(income), [income]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Income</h1>
          <p className="mt-1 text-sm text-gray-500">
            Track all your income sources.
          </p>
        </div>

        <Button onClick={() => openForm()}>+ Add Income</Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <p className="text-sm text-gray-500">Total Income</p>
          <p className="mt-2 text-2xl font-bold text-green-600">
            {formatCurrency(totalIncome)}
          </p>
        </Card>

        <Card>
          <p className="text-sm text-gray-500">Income Entries</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">
            {income.length}
          </p>
        </Card>
      </div>

      <Input
        placeholder="Search income..."
        value={search}
        onChange={(event) => setSearch(event.target.value)}
      />

      <Card title="Income History" description="Your recorded income transactions.">
        {filteredIncome.length === 0 ? (
          <div className="py-10 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
              ₹
            </div>
            <h3 className="mt-3 font-medium text-gray-900">No income found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {search
                ? "Try a different search term."
                : "Start by adding your first income."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredIncome.map((entry) => (
              <div
                key={entry._id || entry.id}
                className="flex items-center justify-between gap-4 rounded-lg border border-gray-100 p-4"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-50 text-green-600">
                    ↑
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900">
                      {labelForSource(entry.source)}
                    </p>
                    <p className="truncate text-xs text-gray-500">
                      {entry.date}
                      {entry.description && ` • ${entry.description}`}
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                  <span className="font-semibold text-green-600">
                    + {formatCurrency(entry.amount)}
                  </span>
                  <button
                    type="button"
                    onClick={() => openForm(entry)}
                    className="rounded-md px-2 py-1 text-xs text-gray-600 hover:bg-gray-100"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(entry._id || entry.id)}
                    className="rounded-md px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={closeForm}
        title={editingIncome ? "Edit Income" : "Add Income"}
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <Select
            label="Income Source"
            name="source"
            value={formData.source}
            onChange={handleChange}
            options={sourceOptions}
            placeholder="Select source"
            required
          />

          <Input
            label="Amount"
            name="amount"
            type="number"
            min="0"
            step="0.01"
            placeholder="e.g. 50000"
            value={formData.amount}
            onChange={handleChange}
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

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              placeholder="Optional description..."
              className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={closeForm}>
              Cancel
            </Button>
            <Button type="submit" loading={loading}>
              {editingIncome ? "Save Changes" : "Add Income"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Income;
