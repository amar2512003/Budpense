import { useEffect, useState } from "react";

import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import Loader from "../../components/ui/Loader";
import Modal from "../../components/ui/Modal";
import Select from "../../components/ui/Select";
import useRecurringStore from "../../store/recurringStore";
import {
  CATEGORIES,
  FREQUENCIES,
  INCOME_SOURCES,
  PAYMENT_METHODS,
} from "../../constants/enums";
import { formatCurrency } from "../../utils/formatCurrency";
import { formatDate } from "../../utils/formatDate";

const labelIn = (options, value) =>
  options.find((option) => option.value === value)?.label || value;

const ruleName = (type, rule) =>
  type === "income"
    ? labelIn(INCOME_SOURCES, rule.source)
    : rule.title || labelIn(CATEGORIES, rule.category);

const toForm = (rule) => ({
  amount: rule.amount,
  category: rule.category || "",
  source: rule.source || "",
  title: rule.title || "",
  paymentMethod: rule.paymentMethod || "",
  description: rule.description || "",
  frequency: rule.frequency,
  date: (rule.startDate || "").slice(0, 10),
  endDate: (rule.endDate || "").slice(0, 10),
});

const RuleList = ({ type, rules, onEdit, onStop }) => {
  if (rules.length === 0) {
    return <p className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">Nothing repeats yet.</p>;
  }

  return (
    <div className="space-y-3">
      {rules.map((rule) => (
        <div
          key={rule._id}
          className="flex items-center justify-between gap-4 rounded-lg border border-gray-100 dark:border-gray-800 p-4"
        >
          <div className="min-w-0">
            <p className="font-medium text-gray-900 dark:text-gray-100">{ruleName(type, rule)}</p>
            <p className="truncate text-xs text-gray-500 dark:text-gray-400">
              {formatCurrency(rule.amount)} · {labelIn(FREQUENCIES, rule.frequency)} ·{" "}
              {rule.nextDate ? `Next on ${formatDate(rule.nextDate)}` : "Ended"}
              {rule.nextDate && rule.endDate && `, until ${formatDate(rule.endDate)}`}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => onEdit(type, rule)}
              className="rounded-md px-2 py-1 text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={() => onStop(type, rule)}
              className="rounded-md px-2 py-1 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950"
            >
              Stop
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

const Recurring = () => {
  const rules = useRecurringStore((state) => state.rules);
  const loading = useRecurringStore((state) => state.loading);
  const storeError = useRecurringStore((state) => state.error);
  const fetchRules = useRecurringStore((state) => state.fetchRules);
  const editRule = useRecurringStore((state) => state.editRule);
  const removeRule = useRecurringStore((state) => state.removeRule);

  // { type, rule } while the edit form is open.
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  const openEdit = (type, rule) => {
    setEditing({ type, rule });
    setFormData(toForm(rule));
    setError("");
  };

  const closeEdit = () => {
    setEditing(null);
    setFormData(null);
  };

  const handleStop = (type, rule) => {
    if (window.confirm(`Stop repeating "${ruleName(type, rule)}"? Entries already added stay.`)) {
      removeRule(type, rule._id);
    }
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({ ...previous, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!formData.amount || Number(formData.amount) <= 0) {
      setError("Please enter a valid amount.");
      return;
    }

    if (formData.endDate && formData.endDate < formData.date) {
      setError("The end date can't be before the start date.");
      return;
    }

    try {
      await editRule(editing.type, editing.rule._id, {
        ...formData,
        amount: Number(formData.amount),
      });
      closeEdit();
    } catch (submitError) {
      setError(submitError.message);
    }
  };

  const isExpense = editing?.type === "expense";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Recurring</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Entries added for you on a schedule. Changes apply to future entries only.
        </p>
      </div>

      {storeError && (
        <div className="rounded-lg bg-red-50 dark:bg-red-950 p-4 text-sm text-red-600 dark:text-red-400" role="alert">
          {storeError}
        </div>
      )}

      {loading && !editing ? (
        <Loader />
      ) : (
        <>
          <Card title="Expenses">
            <RuleList type="expense" rules={rules.expense} onEdit={openEdit} onStop={handleStop} />
          </Card>

          <Card title="Income">
            <RuleList type="income" rules={rules.income} onEdit={openEdit} onStop={handleStop} />
          </Card>
        </>
      )}

      <Modal isOpen={Boolean(editing)} onClose={closeEdit} title="Edit recurring entry">
        {formData && (
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="rounded-lg bg-red-50 dark:bg-red-950 p-3 text-sm text-red-600 dark:text-red-400">{error}</div>
            )}

            {isExpense && (
              <Input label="Title" name="title" value={formData.title} onChange={handleChange} />
            )}

            <Input
              label="Amount"
              name="amount"
              type="number"
              min="0"
              step="0.01"
              value={formData.amount}
              onChange={handleChange}
              required
            />

            {isExpense ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <Select
                  label="Category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  options={CATEGORIES}
                  required
                />
                <Select
                  label="Payment Method"
                  name="paymentMethod"
                  value={formData.paymentMethod}
                  onChange={handleChange}
                  options={PAYMENT_METHODS}
                />
              </div>
            ) : (
              <Select
                label="Income Source"
                name="source"
                value={formData.source}
                onChange={handleChange}
                options={INCOME_SOURCES}
                required
              />
            )}

            <Select
              label="Repeat"
              name="frequency"
              value={formData.frequency}
              onChange={handleChange}
              options={FREQUENCIES}
              placeholder={null}
            />

            <div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Starts on"
                  name="date"
                  type="date"
                  value={formData.date}
                  onChange={handleChange}
                  required
                />
                <Input
                  label="Ends on (optional)"
                  name="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={handleChange}
                />
              </div>
              <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                Moving the start earlier adds the entries missed in between.
              </p>
            </div>

            <Input
              label="Description"
              name="description"
              value={formData.description}
              onChange={handleChange}
            />

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={closeEdit}>
                Cancel
              </Button>
              <Button type="submit" loading={loading}>
                Save Changes
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default Recurring;
