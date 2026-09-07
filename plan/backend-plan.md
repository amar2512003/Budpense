# Backend Plan

Reference document for the Budpense backend. The GitHub issues carry the stories and acceptance criteria; the detail lives here.

Tracking epic: [#18](https://github.com/amar2512003/Budpense/issues/18)

---

## Structure

```text
backend/
├── src/
│   ├── config/       db.js · env.js
│   ├── controllers/  auth · user · expense · budget · dashboard
│   ├── models/       User.js · Expense.js · Budget.js
│   ├── routes/       auth · user · expense · income · budget · dashboard
│   ├── middleware/   auth.middleware · error.middleware · validate.middleware
│   ├── services/     auth · expense · budget · dashboard
│   ├── utils/        generateToken · hashPassword · apiError
│   ├── validators/   auth · expense · budget
│   ├── app.js
│   └── server.js
├── .env · .env.example · .gitignore · package.json
```

`app.js` builds and exports the app; `server.js` connects to Mongo then listens. Layering rule: `routes → controller → service → model → MongoDB`. A controller holding a Mongoose query has skipped a layer.

| Folder | Responsibility |
|---|---|
| `models` | Mongoose schemas only |
| `routes` | Endpoints and middleware chaining |
| `controllers` | Read request, call service, shape response |
| `services` | Business logic and database access |
| `middleware` | Auth, validation, errors |
| `validators` | Request-shape rules |
| `utils` | Reusable helpers |
| `config` | DB and environment configuration |

## Middleware order

```text
helmet → cors({ origin: CLIENT_URL, credentials: true }) → express.json()
  → cookieParser() → rateLimit → morgan (dev) → /api routes → 404 → error.middleware
```

- `cookieParser()` must precede any route reading `req.cookies`.
- `error.middleware` must be registered last — Express only reaches it if nothing already responded.
- CORS cannot use a wildcard origin with credentialed requests, so `CLIENT_URL` is required.

## Environment

```env
PORT=5001
NODE_ENV=development
MONGO_URI=
JWT_SECRET=
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
```

`config/env.js` validates these at boot and throws listing what's missing. Everything else imports from it rather than reading `process.env` directly.

## Response contract

```json
{ "success": true, "data": {} }
{ "success": false, "message": "Expense not found" }
{ "success": false, "message": "Validation failed", "errors": { "amount": "Must be greater than 0" } }
```

The `message` key is required: `BudgetForm.jsx` reads `err.response?.data?.message`, and `authStore.js` builds errors in that shape. Any other key and the UI shows "Something went wrong."

`utils/apiError.js` exports `ApiError(status, message)`. `error.middleware` returns its status and message; any other `Error` returns 500 with a generic message, stack logged only when `NODE_ENV !== "production"`. Mongoose errors are handled centrally: `ValidationError` → 400, `CastError` → 400, duplicate key (11000) → 409.

---

## Models

### User

```text
name          String, required, 2–50
email         String, required, unique, lowercase
password      String, required, min 8, select: false
currency      String, default "INR"
resetToken    String (hashed), select: false
resetTokenExp Date, select: false
```

- bcrypt cost 12, hashed in a `pre("save")` hook guarded by `if (!this.isModified("password")) return next()`. Without the guard, profile updates re-hash the hash and lock the user out.
- `matchPassword(plain)` instance method.
- `currency` has no UI — `formatCurrency.js` hardcodes INR and `Profile.jsx` has no field for it. Stored anyway to avoid a migration later.
- `resetToken` fields exist because `ForgotPassword.jsx` and `ResetPassword.jsx` are already built and routed.

### Expense (holds income too, via `type`)

```text
user          ObjectId → User, required
type          "expense" | "income", default "expense"
amount        Number, required, > 0
category      String  — expense only
source        String  — income only
title         String  — expense only, optional, max 100
description   String, optional, max 500
date          Date, required
paymentMethod String  — expense only, optional
```

Index `{ user: 1, type: 1, date: -1 }`.

`source` is an addition — `Income.jsx` submits `source` with its own value list, not `category`.

### Budget

```text
user      ObjectId → User, required
category  String, required, shared enum
amount    Number, required, > 0
month     Number, 1–12
year      Number, 2020–2100
```

Compound unique index `{ user, category, month, year }` → duplicate returns 409.

---

## Enums

**Category** (shared by Expense and Budget, single source file):
`food · transport · shopping · bills · entertainment · health · education · travel · other`

**Payment method:** `cash · upi · card · bank`

**Income source:** `salary · freelancing · business · investment · other`

Lowercase slugs, because that is what both forms submit and what `categoryLabel()` in `utils/finance.js` expects to prettify.

---

## API surface

```text
/api
├── /auth       POST register · POST login · POST logout · GET me
│               POST forgot-password · POST reset-password/:token
├── /users      GET me · PUT me · PUT change-password
├── /expenses   POST · GET · GET /:id · PUT /:id · DELETE /:id
├── /income     POST · GET · GET /:id · PUT /:id · DELETE /:id
├── /budgets    POST · GET · GET /:id · PUT /:id · DELETE /:id
└── /dashboard  GET
```

`/auth/me` answers "is this session valid" and is polled by `ProtectedRoute`; `/users/me` returns the full profile. They can share a service method.

### List query parameters (`/expenses`, `/income`)

`search` · `category` / `source` · `startDate` · `endDate` · `month=YYYY-MM` · `sort` (`newest` default, `oldest`, `highest`, `lowest`) · `page` · `limit` (default 50, cap 100)

```json
{ "success": true, "data": { "items": [], "total": 0, "page": 1, "pages": 1 } }
```

Escape user input before building the `$regex` for `search` — an unescaped `.` or `(` becomes a regex operator, and a hostile pattern can pin the CPU.

### Session cookie

```text
name: "token"   payload: { id } only
httpOnly: true
secure:   NODE_ENV === "production"
sameSite: production ? "none" : "lax"
maxAge:   7 days
path:     "/"
```

`sameSite: "none"` requires `secure: true`. Locally `:5173` and `:5001` are same-site so `lax` works. Logout must clear the cookie with the **same** options — a mismatched `path` or `sameSite` leaves it in place.

### Budget response

```json
{ "category": "food", "amount": 8000, "month": "09", "year": 2026,
  "spent": 6500, "remaining": 1500, "percentage": 81.25, "isOverBudget": false }
```

`BudgetCard.jsx` reads `budget.spent`, so that name is fixed. Don't clamp `percentage` — send the true value so a 140% overspend reads as 140%; the card clamps the bar width itself.

Joining a budget to its expenses:

```js
const start = new Date(Date.UTC(year, month - 1, 1));
const end   = new Date(Date.UTC(year, month, 1));
// match: type === "expense" && date >= start && date < end
```

Half-open range avoids the off-by-one at midnight on the last day. Compute the whole list in one aggregation grouped by category, not one query per budget.

### Dashboard response

```json
{
  "totalIncome": 60000, "totalExpense": 17500, "balance": 42500,
  "savingsRate": 71, "budgetUsed": 72,
  "categoryBreakdown": [{ "name": "Bills", "value": 5500 }],
  "dailyExpense":      [{ "date": "2026-09-02", "amount": 450 }],
  "monthlyTrend":      [{ "month": "2026-04", "income": 60000, "expense": 17500 }],
  "recentExpenses":    []
}
```

- `savingsRate` = `round(balance / totalIncome * 100)`, **0 when income is 0** — the client code guards that division; without it the card renders `NaN%`.
- `budgetUsed` = total spent / total budgeted for the month, 0 when no budgets.
- `categoryBreakdown` → `CategoryChart`, `{ name, value }` sorted descending, display labels not slugs, missing category → `Uncategorised`.
- `dailyExpense` → `ExpenseChart`. Return ISO dates; the component formats to `02 Sep`.
- `monthlyTrend` → `IncomeExpenseChart`, last 6 months. **Months with no activity must still appear with zeros** — a bare `$group` drops them and the chart's x-axis compresses.
- `recentExpenses` → 4 most recent, matching `sortByNewestDate(expenses).slice(0, 4)`.

`Reports.jsx` uses the same three charts over a wider range, so it reuses this endpoint — no separate reports endpoint.

---

## Security rules (apply to every issue)

- **Identity comes from the cookie, never the client.** No endpoint reads `user`/`userId` from a body, query or param. Strip it defensively: `const { user, type, ...safe } = req.body`.
- **Scope in the query, not after the fetch.** `Expense.findOne({ _id: id, user: req.user.id })` — no ownership check to forget, no path where a record loads before the check.
- **Another user's record returns 404, not 403.** A 403 confirms it exists.
- **Passwords** never stored or returned in plaintext.
- **Identical 401** for unknown email and wrong password, so emails can't be enumerated.
- **Reset tokens** stored hashed with a 15-minute expiry; `/forgot-password` returns 200 either way.
- **Rate limits:** 100 req / 15 min globally, 5 / 15 min on `/login`, `/register`, `/forgot-password`.
- **`.env` never committed;** `.env.example` is.

There is no mail service — `/forgot-password` logs the reset URL to the server console. Record this in `backend/README.md`. Link format: `${CLIENT_URL}/reset-password/${token}`.

---

## Open decisions

Mismatches between the architecture and the finished frontend. Each needs sign-off before its issue starts.

| # | Conflict | Proposed resolution |
|---|---|---|
| 1 | `/api/income` isn't in the architecture, but `incomeService.js` calls it | Keep the single `Expense` model; add `income.routes.js` as a thin second router whose controller sets `type: "income"`. Both delegate to `expense.service.js`. |
| 2 | Profile at `/api/users/*` (architecture) vs `/auth/profile` (`authService.js`) | Build under `/api/users`; change the two lines in `authService.js` during #29. |
| 3 | Three category lists disagree (architecture, `ExpenseForm`, `BudgetForm`) | One shared enum; add `education` and `travel` to `ExpenseForm.jsx`. Otherwise a budget can exist for a category no expense can use. |
| 4 | Budget `month` is a Number in the architecture, `"09"` string from the form | Store Number, accept both, return zero-padded string. The select compares by value, so `month: 9` renders an empty field when editing. |
| 5 | `spent` as a stored column on Budget | **Recommend computing it.** A stored value must be updated on every expense create, update, delete and category change — each a chance to drift, and a wrong figure is invisible until someone adds it up by hand. |

## Known frontend bug to fix during integration

`authStore.js` initialises `isLoading: false` — correct against synchronous `localStorage`, wrong against a real `/auth/me`. On a hard refresh of `/app/dashboard`, `ProtectedRoute` sees `isLoading === false` and `isAuthenticated === false` on the first render and redirects to `/login`. Fix: initialise `isLoading: true` and set it `false` in both the success and failure paths of `checkAuth`. `ProtectedRoute` already renders a loading state.

## Integration checklist (#29)

| Store | Change |
|---|---|
| `authStore` | Delete `getAccounts`, `getCurrentUser`, `normalizeEmail`, `createAuthError` and all `localStorage` calls. Point actions at `authService`. Fix the `isLoading` bug above. |
| `expenseStore` | Replace `getStoredExpenses`/`saveExpenses` with `expenseService`. Move `search`/`category`/`sort` into the request, debounced via the existing `useDebounce`. |
| `incomeStore` | Add `fetchIncome` and `loading`/`error` handling — neither exists. Point mutations at `incomeService`. |
| `budgetStore` | Point at `budgetService`. Remove the `spent` derivation in `Budgets.jsx` — the API returns it. |
| `Dashboard` / `Reports` | Switch to `GET /api/dashboard`. Keep `utils/finance.js` as the reference the aggregation was verified against. |

Plus: commit `frontend/.env.example`; add an axios interceptor that clears auth and redirects on a 401 from anything but `/auth/login`; delete `utils/localStorage.js` only if `uiStore.js` no longer needs it.

### Deployment

Backend on Render/Railway with `MONGO_URI`, `JWT_SECRET`, `CLIENT_URL`, `NODE_ENV=production`. Frontend on Vercel with `VITE_API_URL`. Cross-origin in production means the cookie needs `sameSite: "none"` + `secure: true` or the browser drops it — login appears to succeed and `/auth/me` immediately 401s. `CLIENT_URL` must be the exact origin; a trailing slash or wrong scheme fails CORS with no useful console error. Atlas network access must allow the backend host.
