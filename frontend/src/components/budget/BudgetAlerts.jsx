import { useState } from "react";

import {
  ALERT_STYLES,
  alertKey,
  alertMessage,
  readDismissed,
  saveDismissed,
} from "../../utils/budgetAlerts";
import useAuthStore from "../../store/authStore";

const BudgetAlerts = ({ alerts = [] }) => {
  const userId = useAuthStore((state) => state.user?.id);
  const [dismissed, setDismissed] = useState(() => readDismissed(userId));

  const visible = alerts
    .filter((alert) => !dismissed.includes(alertKey(alert)))
    // Over-budget first: it is the more urgent of the two.
    .sort((a, b) => (a.level === b.level ? 0 : a.level === "over" ? -1 : 1));

  const dismiss = (alert) => {
    // Keys for alerts no longer showing are dropped, so storage doesn't grow
    // month after month.
    const current = alerts.map(alertKey);
    const next = [...dismissed.filter((key) => current.includes(key)), alertKey(alert)];

    setDismissed(next);
    saveDismissed(userId, next);
  };

  if (visible.length === 0) return null;

  return (
    <div className="space-y-2">
      {visible.map((alert) => (
        <div
          key={alertKey(alert)}
          role="alert"
          className={`flex items-center justify-between gap-4 rounded-lg border px-4 py-3 text-sm ${ALERT_STYLES[alert.level]}`}
        >
          <span>{alertMessage(alert)}</span>
          <button
            type="button"
            onClick={() => dismiss(alert)}
            aria-label={`Dismiss ${alert.category} alert`}
            className="shrink-0 rounded px-1 opacity-70 hover:opacity-100"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
};

export default BudgetAlerts;
