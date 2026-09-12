import Expense from "../models/Expense.js";
import ApiError from "../utils/apiError.js";
import escapeRegex from "../utils/escapeRegex.js";

// Everything a client is allowed to write, per type. An allowlist rather than a
// blocklist: user and type are set from the session and the route, and no body
// field can reach the document unless it is named here.
const WRITABLE_FIELDS = {
  expense: ["amount", "category", "title", "description", "date", "paymentMethod"],
  income: ["amount", "source", "description", "date"],
};

// What each page's own search box already matches, kept the same server-side.
const SEARCH_FIELDS = {
  expense: ["title", "description"],
  income: ["description", "source"],
};

const LABELS = { expense: "Expense", income: "Income" };

// _id last so pages cannot repeat or skip a record when several share a date
// or an amount.
const SORTS = {
  newest: { date: -1, _id: -1 },
  oldest: { date: 1, _id: 1 },
  highest: { amount: -1, _id: -1 },
  lowest: { amount: 1, _id: 1 },
};

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;
const DAY_MS = 24 * 60 * 60 * 1000;

/** Drops the owner and the version key; the client has no use for either. */
function toPublicRecord({ user, __v, ...record }) {
  return record;
}

/**
 * A blank field means "no value", not the empty string: writing "" would put an
 * unusable category on a record, and on an update it has to clear the field
 * rather than be quietly ignored, or a cleared payment method comes back.
 */
function toPayload(type, body) {
  const payload = {};

  for (const field of WRITABLE_FIELDS[type]) {
    const value = body[field];
    payload[field] = value === "" || value === null ? undefined : value;
  }

  return payload;
}

function buildFilter(userId, type, query) {
  const filter = { user: userId, type };
  const { search, category, source, month, startDate, endDate } = query;

  if (search) {
    const pattern = new RegExp(escapeRegex(search), "i");
    filter.$or = SEARCH_FIELDS[type].map((field) => ({ [field]: pattern }));
  }

  if (category) filter.category = category;
  if (source) filter.source = source;

  if (month) {
    const [year, monthNumber] = month.split("-").map(Number);

    filter.date = {
      $gte: new Date(Date.UTC(year, monthNumber - 1, 1)),
      $lt: new Date(Date.UTC(year, monthNumber, 1)),
    };
  } else if (startDate || endDate) {
    filter.date = {};

    if (startDate) filter.date.$gte = startDate;
    // An end date names a whole day. A half-open range to the next midnight
    // includes it without the off-by-one that $lte against midnight causes.
    if (endDate) filter.date.$lt = new Date(endDate.getTime() + DAY_MS);
  }

  return filter;
}

export async function listRecords(userId, type, query) {
  const page = query.page ?? 1;
  const limit = Math.min(query.limit ?? DEFAULT_LIMIT, MAX_LIMIT);
  const filter = buildFilter(userId, type, query);

  const [items, total] = await Promise.all([
    Expense.find(filter)
      .sort(SORTS[query.sort ?? "newest"])
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Expense.countDocuments(filter),
  ]);

  return {
    items: items.map(toPublicRecord),
    total,
    page,
    // An empty list is one empty page, not zero pages.
    pages: Math.max(1, Math.ceil(total / limit)),
  };
}

/**
 * Loads one record. The owner is part of the query rather than a check that
 * follows it, so there is no path on which a record loads before the check —
 * and someone else's record is simply not found, which a 403 would confirm.
 */
async function findOwned(userId, type, id) {
  const record = await Expense.findOne({ _id: id, user: userId, type });

  if (!record) {
    throw new ApiError(404, `${LABELS[type]} not found`);
  }

  return record;
}

export async function getRecord(userId, type, id) {
  return toPublicRecord((await findOwned(userId, type, id)).toObject());
}

export async function createRecord(userId, type, body) {
  const record = await Expense.create({
    ...toPayload(type, body),
    user: userId,
    type,
  });

  return toPublicRecord(record.toObject());
}

export async function updateRecord(userId, type, id, body) {
  const record = await findOwned(userId, type, id);

  Object.assign(record, toPayload(type, body));
  // save() rather than findOneAndUpdate so the schema's validators, including
  // the type-dependent required rules, actually run.
  await record.save();

  return toPublicRecord(record.toObject());
}

export async function deleteRecord(userId, type, id) {
  const record = await findOwned(userId, type, id);

  await record.deleteOne();
}
