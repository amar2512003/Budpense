import { useEffect } from "react";

import useUIStore from "../../store/uiStore";
import { ALERT_STYLES } from "../../utils/budgetAlerts";

const DURATION_MS = 6000;

const STYLES = {
  ...ALERT_STYLES,
  info: "border-gray-200 bg-white text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100",
};

/** Shows uiStore's notification, then hides it after a few seconds. */
const Toast = () => {
  const notification = useUIStore((state) => state.notification);
  const hideNotification = useUIStore((state) => state.hideNotification);

  useEffect(() => {
    if (!notification.visible) return undefined;

    const timer = setTimeout(hideNotification, DURATION_MS);

    return () => clearTimeout(timer);
  }, [notification, hideNotification]);

  // Cleared when the layout goes away, e.g. on logout, so the next person to
  // sign in on this browser doesn't see the previous user's toast.
  useEffect(() => hideNotification, [hideNotification]);

  if (!notification.visible) return null;

  return (
    <div
      role="status"
      className={`fixed bottom-4 left-4 right-4 z-50 flex sm:left-auto sm:max-w-sm items-start gap-3 rounded-lg border px-4 py-3 text-sm shadow-lg ${
        STYLES[notification.type] || STYLES.info
      }`}
    >
      <span>{notification.message}</span>
      <button
        type="button"
        onClick={hideNotification}
        aria-label="Dismiss notification"
        className="shrink-0 opacity-70 hover:opacity-100"
      >
        ✕
      </button>
    </div>
  );
};

export default Toast;
