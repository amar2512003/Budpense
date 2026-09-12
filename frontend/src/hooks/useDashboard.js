import { useCallback, useEffect, useState } from "react";

import { getDashboard } from "../services/dashboardService";
import { toErrorMessage } from "../utils/errorMessage";

const EMPTY = {
  totalIncome: 0,
  totalExpense: 0,
  balance: 0,
  savingsRate: 0,
  budgetUsed: 0,
  categoryBreakdown: [],
  dailyExpense: [],
  monthlyTrend: [],
  recentExpenses: [],
};

/**
 * The dashboard endpoint answers everything the charts need in one request, so
 * both Dashboard and Reports read it through here rather than each assembling
 * the figures from the stores.
 */
const useDashboard = () => {
  const [summary, setSummary] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const { data } = await getDashboard();

      setSummary(data);
    } catch (requestError) {
      setSummary(EMPTY);
      setError(toErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { summary, loading, error, reload: load };
};

export { EMPTY as EMPTY_SUMMARY };
export default useDashboard;
