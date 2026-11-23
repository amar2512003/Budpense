import Expense from "../models/Expense.js";
import Recurring from "../models/Recurring.js";
import ApiError from "../utils/apiError.js";
import occurrenceDate from "../utils/occurrenceDate.js";
import localToday from "../utils/localToday.js";
import { toPayload } from "./expense.service.js";

const ENTRY_FIELDS = ["amount", "category", "source", "title", "description", "paymentMethod"];
const DUPLICATE_KEY = 11000;
// The furthest any time zone runs ahead of UTC (UTC+14).
const MAX_AHEAD_MS = 14 * 60 * 60 * 1000;

/**
 * Creates every entry the rule owes up to today in the rule's time zone,
 * oldest first, then stores where it got to. An entry that already exists is
 * skipped by the unique index, so a run that died halfway, or two runs at
 * once, cannot double up.
 *
 * With skipCoveredPeriods, a period that already holds an entry from this rule
 * on any date gets no second one. Used after the start date moves, when the
 * old entries sit on different days from the new schedule.
 */
async function catchUp(rule, now, { skipCoveredPeriods = false } = {}) {
  const today = localToday(now, rule.timeZone);

  while (rule.nextDate && rule.nextDate <= today) {
    if (rule.endDate && rule.nextDate > rule.endDate) break;

    const covered =
      skipCoveredPeriods &&
      (await Expense.exists({
        recurring: rule._id,
        date: {
          $gte: rule.nextDate,
          $lt: occurrenceDate(rule.startDate, rule.frequency, rule.occurrences + 1),
        },
      }));

    if (!covered) {
      try {
        await Expense.create({
          ...Object.fromEntries(ENTRY_FIELDS.map((field) => [field, rule[field]])),
          user: rule.user,
          type: rule.type,
          date: rule.nextDate,
          recurring: rule._id,
        });
      } catch (error) {
        if (error.code !== DUPLICATE_KEY) throw error;
      }
    }

    rule.occurrences += 1;
    rule.nextDate = occurrenceDate(rule.startDate, rule.frequency, rule.occurrences);
  }

  if (rule.endDate && rule.nextDate > rule.endDate) rule.nextDate = null;

  await rule.save();
}

/** Run on a timer by the server. */
export async function generateDue(now = new Date()) {
  // Wide enough for any zone; catchUp then checks each rule's own today.
  const rules = await Recurring.find({ nextDate: { $lte: new Date(now.getTime() + MAX_AHEAD_MS) } });

  for (const rule of rules) {
    // One rule failing, or changing under us, must not hold up everyone
    // else's. It is retried on the next run.
    try {
      await catchUp(rule, now);
    } catch (error) {
      console.error(`Recurring rule ${rule._id} skipped:`, error.message);
    }
  }
}

function toPublicRule({ user, __v, occurrences, ...rule }) {
  return rule;
}

async function findOwned(userId, type, id) {
  const rule = await Recurring.findOne({ _id: id, user: userId, type });

  if (!rule) {
    throw new ApiError(404, "Recurring entry not found");
  }

  return rule;
}

function checkEndDate(rule) {
  if (rule.endDate && rule.endDate < rule.startDate) {
    throw new ApiError(400, "Validation failed", {
      endDate: "End date can't be before the start date",
    });
  }
}

export async function listRules(userId, type) {
  const rules = await Recurring.find({ user: userId, type }).sort({ createdAt: -1 }).lean();

  return rules.map(toPublicRule);
}

/** The rule's first entry is on `date`, created now if that day has come. */
export async function createRule(userId, type, body) {
  const { date, ...fields } = toPayload(type, body);
  const rule = new Recurring({
    ...fields,
    user: userId,
    type,
    frequency: body.frequency,
    startDate: date,
    nextDate: date,
    endDate: body.endDate || undefined,
    timeZone: body.timeZone,
  });

  checkEndDate(rule);
  await rule.save();
  await catchUp(rule, new Date());

  return toPublicRule(rule.toObject());
}

/**
 * Applies to entries not yet generated; existing ones are left alone. A new
 * start date earlier than the old one fills in the periods before it.
 */
export async function updateRule(userId, type, id, body) {
  const rule = await findOwned(userId, type, id);
  const wasEnded = rule.nextDate === null;
  const { date: start, ...fields } = toPayload(type, body);
  const startMoved = Boolean(start) && start.getTime() !== rule.startDate.getTime();

  Object.assign(rule, fields);
  rule.endDate = body.endDate || undefined;
  if (body.timeZone) rule.timeZone = body.timeZone;

  if (startMoved) {
    // Planned again from the new date. Moving it earlier fills in the months
    // before; periods that already have an entry are left as they are.
    rule.startDate = start;
    rule.occurrences = 0;
    rule.frequency = body.frequency;
    checkEndDate(rule);
  } else if (body.frequency !== rule.frequency) {
    // A new frequency starts counting from the next pending date rather than
    // from the original start, so dates already generated don't shift.
    rule.startDate = occurrenceDate(rule.startDate, rule.frequency, rule.occurrences);
    rule.occurrences = 0;
    rule.frequency = body.frequency;
  }

  // Recomputed rather than kept, so moving the end date later revives a rule
  // that had already ended.
  rule.nextDate = occurrenceDate(rule.startDate, rule.frequency, rule.occurrences);

  // Dates that passed while the rule had ended are not filled in.
  if (wasEnded && !startMoved) {
    const today = localToday(new Date(), rule.timeZone);

    while (rule.nextDate < today) {
      rule.occurrences += 1;
      rule.nextDate = occurrenceDate(rule.startDate, rule.frequency, rule.occurrences);
    }
  }

  await catchUp(rule, new Date(), { skipCoveredPeriods: startMoved });

  return toPublicRule(rule.toObject());
}

/** Stops the rule. Entries it already created stay. */
export async function deleteRule(userId, type, id) {
  const rule = await findOwned(userId, type, id);

  await rule.deleteOne();
}
