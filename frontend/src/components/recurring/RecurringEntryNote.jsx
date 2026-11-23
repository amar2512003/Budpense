import { Link } from "react-router-dom";

/** Shown when editing an entry a recurring rule created. */
const RecurringEntryNote = () => (
  <p className="rounded-lg bg-indigo-50 p-3 text-sm text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
    This entry was added by a repeating rule. Changes here only affect this
    entry. To change the schedule or when it started, edit the rule on the{" "}
    <Link to="/app/recurring" className="font-medium underline">
      Recurring
    </Link>{" "}
    page.
  </p>
);

export default RecurringEntryNote;
