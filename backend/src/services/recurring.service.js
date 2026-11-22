import Expense from "../models/Expense.js";
import Recurring from "../models/Recurring.js";
import ApiError from "../utils/apiError.js";
import occurrenceDate from "../utils/occurrenceDate.js";
import startOfDay from "../utils/startOfDay.js";
import { toPayload } from "./expense.service.js";

const ENTRY_FIELDS = ["amount", "category", "source", "title", "description", "paymentMethod"];
const DUPLICATE_KEY = 11000;

/**
 * Creates every entry the rule owes up to `now`, oldest first, then stores
 * where it got to. An entry that already exists is skipped by the unique
 * index, so a run that died halfway, or two runs at once, cannot double up.
 */
async function catchUp(rule, now) {
  while (rule.nextDate && rule.nextDate <= now) {
    if (rule.endDate && rule.nextDate > rule.endDate) break;

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

    rule.occurrences += 1;
    rule.nextDate = occurrenceDate(rule.startDate, rule.frequency, rule.occurrences);
  }

  if (rule.endDate && rule.nextDate > rule.endDate) rule.nextDate = null;

  await rule.save();
}

/** Run on a timer by the server. */
export async function generateDue(now = new Date()) {
  const rules = await Recurring.find({ nextDate: { $lte: now } });

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
  });

  checkEndDate(rule);
  await rule.save();
  await catchUp(rule, new Date());

  return toPublicRule(rule.toObject());
}

/** Applies to entries not yet generated; existing ones are left alone. */
export async function updateRule(userId, type, id, body) {
  const rule = await findOwned(userId, type, id);
  const wasEnded = rule.nextDate === null;
  // The start date is fixed at creation; only the fields after it change.
  const { date: _start, ...fields } = toPayload(type, body);

  Object.assign(rule, fields);
  rule.endDate = body.endDate || undefined;

  // A new frequency starts counting from the next pending date rather than
  // from the original start, so dates already generated don't shift.
  if (body.frequency !== rule.frequency) {
    rule.startDate = occurrenceDate(rule.startDate, rule.frequency, rule.occurrences);
    rule.occurrences = 0;
    rule.frequency = body.frequency;
  }

  // Recomputed rather than kept, so moving the end date later revives a rule
  // that had already ended.
  rule.nextDate = occurrenceDate(rule.startDate, rule.frequency, rule.occurrences);

  // Dates that passed while the rule had ended are not filled in.
  if (wasEnded) {
    const today = startOfDay(new Date());

    while (rule.nextDate < today) {
      rule.occurrences += 1;
      rule.nextDate = occurrenceDate(rule.startDate, rule.frequency, rule.occurrences);
    }
  }

  await catchUp(rule, new Date());

  return toPublicRule(rule.toObject());
}

/** Stops the rule. Entries it already created stay. */
export async function deleteRule(userId, type, id) {
  const rule = await findOwned(userId, type, id);

  await rule.deleteOne();
}
