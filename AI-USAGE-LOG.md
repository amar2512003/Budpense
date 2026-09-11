# AI Usage Log

DSC4141 — Budpense. One section per working session, appended in order.
Governing rule: **you own every line.** Entries record what was corrected, not
only what was produced.

---

## Session — 8–9 September 2026

### Objective

Review the open pull request against the authentication story, determine why the
story was not delivered, restructure the backlog so the backend is actually
tracked, and implement the first backend issue (#5, backend foundation).

### Work produced

- **Review of PR #3** (`feat: integrate frontend authentication`). Found the PR
  description and its six ticked test boxes did not match the diff: the branch
  contained the stock `create-vite` scaffold plus an 11-line axios instance, with
  no `authService`, `authStore`, router, `ProtectedRoute`, or login/register form.
- **Issue #4** raised, flagging that #1 had been closed as completed without
  meeting any of its acceptance criteria, and that the backend it depends on did
  not exist. Assigned to the PR author.
- **Issues #5–#11** created from `plan/backend-plan.md`, sequencing the backend
  from foundation to deployment. Each is a user story with acceptance criteria;
  design detail stays in the plan, referenced by line number.
- **Issue #5 implemented** on branch `feat/backend-foundation`:
  `backend/` skeleton on the `routes → controller → service → model` layering,
  `config/env.js` (boot-time validation), `config/db.js`, `utils/apiError.js`,
  `error.middleware.js`, `notFound.middleware.js`, `app.js`, `server.js`,
  `.env.example`, `.gitignore`.

### Verification performed

Nothing below was taken on the model's word; each was executed.

| Check | Method | Result |
|---|---|---|
| PR #3 contents vs. its description | `gh pr diff`, read every source file on the branch | Description unsupported by the diff |
| `axios` actually declared | `grep axios` over the committed `package-lock.json` | Absent — a clean `npm ci` build would break |
| Backend port | Compared `api.js` fallback against `plan/backend-plan.md:54` | Mismatch, 5000 vs 5001 |
| Env validation | Booted `config/env.js` with no vars, partial vars, and `PORT=abc` | Threw listing exactly the missing names |
| Error contract | Live server; forced `ApiError`, raw `Error`, async throw, Mongoose `ValidationError`, `CastError`, duplicate key 11000, unmatched route | 418/500/401/400/400/409/404, all in the `{ success, message }` shape |
| Internal detail leakage | Threw `new Error("secret internal detail")` | Client got `"Something went wrong"`; detail only in the server log |
| Prod vs dev logging | Ran the same suite under both `NODE_ENV` values | Full stack in dev; one-line 500 summary in production |
| Security headers, CORS, rate limit | Inspected live response headers | Helmet CSP present, `x-powered-by` absent, `access-control-allow-credentials: true`, `ratelimit: limit=100` |
| Startup failure | Pointed `MONGO_URI` at a dead port | Exited 1 with one readable line, no stack spew |
| Git hygiene | `git add -A backend` then inspected the index | 16 files; `node_modules` excluded, `.env.example` tracked |

### Assessment

| Task | Tool | Helped? | What had to be corrected |
|---|---|---|---|
| Reading PR #3 against its description | Claude Code | Yes | Nothing — the mismatch was reproducible from the diff |
| Backlog restructuring | Claude Code | Partly | The plan cites a tracking epic #18 and integration issue #29; **neither exists** — the repo only had #1–#4. Numbers dropped from the new issues rather than copied through. |
| Reading the backend plan | Claude Code | Partly | The plan describes a finished frontend (`BudgetForm.jsx`, `Income.jsx`, `authStore.js`) that is not in this repo. The response contracts were kept as build targets; the file references were not treated as real. |
| Verifying the error middleware | Claude Code | **No, first attempt** | The first test harness registered its throwing routes *after* `notFoundMiddleware` was already mounted, so every error route returned 404 and the run appeared to show broken error handling. Express matches in order. Harness rebuilt to mount the error middleware itself. Had this not been re-run, the conclusion drawn would have been wrong. |
| Reading CORS behaviour | Claude Code | Partly | A foreign `Origin` still received `access-control-allow-origin: http://localhost:5173`, which looked like a bug. It is not: the `cors` package echoes the configured origin and the *browser* enforces the mismatch. Confirmed before changing anything. |
| Dependency choice | Claude Code | Yes | `dotenv` v17 prints a promotional banner on every boot; `{ quiet: true }` added. |

### Notes for the retrospective

- A PR description is not evidence. #3's checklist claimed six passing manual
  tests for code that was not in the branch, and the merge auto-closed #1 as
  completed. The board said authentication was delivered while `main` had none.
  Acceptance criteria are only worth something if someone checks them against
  the diff before merging.
- The undeclared `axios` import is on `main` now and will break the first clean
  install. It is latent only because nothing imports `api.js` yet.
- Verification caught a wrong conclusion once this session (the 404-ordering
  harness bug). The general lesson is that a test that reports failure deserves
  the same scepticism as one that reports success.

### Prompts issued

Verbatim, in order.

1. `read the latest open pr and review it`
2. `are those things backend work?`
3. `raise an issue flagging this`
4. `because i have merged that pr`
5. `and add amar as an assignee`
6. `go through the plan and and set up 4 - 7 github issues that will make me work on the backend and complete it`
7. `https://github.com/amar2512003/Budpense/issues/5 lets fix this issue`

---

## Session — 10 September 2026

### Objective

Audit issue #5 (backend foundation) to a standard where the boxes can be ticked
from evidence rather than assertion, and account for the code that arrived on
`main` while the branch was open.

### What the audit found

The backend on `origin/main` is byte-identical to `feat/backend-foundation`
(`git diff` between the two over `backend/` is empty) — #5's code was merged by
PR #12. Every acceptance criterion was re-checked against that tree and all of
them hold, so **no backend change was made this session.** The defects found
were in the frontend code pulled in by PRs #14 and #16.

### Work produced

- `frontend/src/services/api.js` — base-URL fallback `5000` → `5001`. The
  backend serves 5001 (`backend/.env.example`, `plan/backend-plan.md:54`), and
  `frontend/.env` is empty, so the fallback was the effective configuration:
  every API call went to a port with nothing on it.
- `frontend/.gitignore` — had no `.env` rule at all, so `frontend/.env` was
  tracked. Added the same block the backend uses; untracked the file. It was
  committed empty in `30ce821`, so no secret has leaked yet.
- `frontend/.env.example` — committed template, mirroring `backend/.env.example`.

### Verification performed

Nothing below was taken on the model's word; each was executed.

| Check | Method | Result |
|---|---|---|
| Middleware order | Printed the live Express router stack | `helmet → cors → json → cookieParser → rateLimit → morgan → routes → 404 → error`, matching the criterion |
| Error contract, 18 cases | Probe routes spliced *before* the 404 layer, real server, dev and prod | 18/18 both runs |
| `ApiError`, raw `Error`, async rejection | Live requests | 418 / 500 generic / 500 generic |
| Internal detail leakage | Threw `new Error("secret internal detail")` | Client got `"Something went wrong"`; detail only in the server log |
| Mongoose errors, **real DB** | `mongodb-memory-server`; real unique index, real bad-ObjectId query, real missing-field insert | `ValidationError` 400, `CastError` 400, E11000 409 — and the 409 leaks no index or collection name |
| `connectDB` / `disconnectDB` | Against a real mongod | `readyState` 1 then 0 |
| Rate limit | Sent 101 requests in one window | 101st returned 429 in the `{ success, message }` shape |
| Env validation | Booted with no vars, partial vars, `PORT=abc`, `PORT=0`, `PORT=5001.5`, whitespace, empty secret | Threw listing exactly the missing names in every case |
| dotenv loads `.env` | Temporary `.env`, empty environment | Loaded, no banner, and `git status --ignored` showed it as ignored |
| Connect-before-listen | Started `server.js` against a dead Mongo, probed the port mid-connect | Port refused connections during the connect phase; exit 1, one readable line |
| Successful boot | Real `server.js` against a real mongod | `MongoDB connected` then `API listening on 5001` |
| **End-to-end in Chrome** | Real backend on 5001, real Vite on 5173, credentialed cross-origin `fetch` | Health `{ success, data }`; `/api/auth/forgot-password` → 404 `{ success, message }`, the exact string `err.response?.data?.message` renders |
| Foreign-origin CORS | `curl` with `Origin: http://evil.test` | Server echoes only the configured origin, never the caller's — the browser rejects the mismatch |
| Lockfile hygiene | Inspected `git diff` after `npm install` | Churn only (dropped `libc` fields); reverted rather than committed |

### Assessment

| Task | Tool | Helped? | What had to be corrected |
|---|---|---|---|
| Auditing #5 | Claude Code | Yes | The honest result was "already correct, change nothing". Worth recording that the audit's output was a decision not to write code. |
| Accounting for the pulled code | Claude Code | Yes | The first read assumed the branch still needed merging; it had already been merged, and the real work was checking the *frontend* against the backend's contract. |
| Simulated vs. real errors | Claude Code | **Partly** | The first duplicate-key test threw a hand-constructed `MongoServerError`. That only proves the middleware branches on `code === 11000`, not that a real driver error reaches it in that shape. Re-run against a real mongod with a real unique index before the box was ticked. |
| Foreign-origin CORS | Claude Code | **No, first attempt** | The in-browser negative test reported `location.origin` as `"null"`, so its "blocked" result proved nothing — a null origin would fail regardless. Redone with `curl` against the server's actual headers. The earlier reading was ambiguous, not wrong, but it was not evidence. |
| Frontend routing | Claude Code | Yes | Loading `/forgot-password` rendered the stock Vite counter. `main.jsx` renders `App.jsx`, which is still the scaffold; `AppRoutes.jsx` is imported nowhere. |

### Notes for the retrospective

- **The new frontend is unreachable.** `AppRoutes.jsx` is imported by no file, so
  every route added by PRs #14 and #16 — login, register, dashboard, expenses,
  income — is dead code, and every URL renders the Vite starter page. This was
  found by loading the app, not by reading the diff. Needs its own issue against
  the frontend story; deliberately not fixed here, as it is not #5's scope.
- A second `.env` was committed to the repo, by a different person, in the same
  week #5 shipped a `.gitignore` specifically to prevent that. The rule only
  helps where it is applied.
- Two checks this session passed for the wrong reason at first (a constructed
  Mongo error, a null-origin fetch). Both were caught by asking what the test
  would have done had the code been broken. A green result deserves that question
  as much as a red one.

### Prompts issued

Verbatim, in order.

1. `https://github.com/amar2512003/Budpense/issues/5 lets solve this issue. before you commit, ensure that you have run deep audit to ensure that the issued is solved thoroughly and correctly and that everything is working properly and correctly`
2. `there's new code from a git pull ensure that is accounted for`
3. `also dont make any ai slop code changes. do not commit any slop. create a branch derived from main and then work on it`

---

## Session — 11 September 2026

### Objective

Implement issue #6 — the authentication API: `User` model, register, login,
logout and session check, on the foundation shipped by #5.

### Work produced

Branch `feature/auth-api`, derived from `main`.

- **`models/User.js`** — `name` 2–50, `email` unique and lowercased, `password`
  min 8 with `select: false`, `currency` default `INR`. bcrypt cost 12 in a
  `pre("save")` hook guarded by `isModified("password")`; `matchPassword()`
  instance method. Mongoose validates *before* save hooks run, so the min-8 rule
  sees the plaintext and never the 60-character hash.
- **`services/auth.service.js`** — register, login, and the session lookup used
  by `protect`. A single `toPublicUser()` decides what leaves the server, so the
  password has no route out even if a query forgets to exclude it.
- **`controllers/auth.controller.js`**, **`routes/auth.routes.js`** — the four
  endpoints. No `try/catch`: Express 5 forwards a rejected promise to
  `error.middleware` by itself.
- **`utils/authCookie.js`** — one `cookieOptions` object shared by set and
  clear, which is what makes "logout clears with the same options" true by
  construction rather than by two lists staying in step.
- **`utils/generateToken.js`** — payload `{ id }` only.
- **`middleware/auth.middleware.js`** — `protect`; identity from the signed
  cookie, and the user re-read from the database on every request.
- **`middleware/validate.middleware.js`**, **`validators/auth.js`** — malformed
  bodies answered as `{ success: false, message: "Validation failed", errors }`.
- Credential rate limit of 5 / 15 min, as a **separate limiter per route** so a
  run of failed registrations cannot lock a legitimate user out of login.
- Dependencies added: `bcryptjs`, `jsonwebtoken`, `express-validator`.

Not built, and deliberately: `resetToken` fields, `/forgot-password` and
`/reset-password` (issue #7), and `/users/*` (issue #7). The issue scopes them
out; adding the schema fields early would only have been dead weight.

### Verification performed

66 assertions across three runs against a real `mongod` (`mongodb-memory-server`,
installed with `--no-save` for the runs and removed afterwards so the dependency
list stays exactly what the app needs), plus a run in a real browser. Every row
was executed, not reasoned about.

| Check | Method | Result |
|---|---|---|
| Register / login / logout / me | Live server, real Mongo, 48 assertions | All four in the `{ success, data }` shape |
| Password storage | Read the stored document | `$2b$12$…`, never the plaintext, absent from a default query |
| `pre("save")` guard | Changed a name on a loaded user and saved | Hash byte-identical afterwards, and login still worked — the criterion's failure mode, reproduced as a passing test |
| Cookie attributes | Parsed `Set-Cookie` in both environments | dev `HttpOnly; SameSite=Lax; Path=/; Max-Age=604800`; production adds `Secure` and `SameSite=None` |
| Logout parity | Compared the cleared cookie's attributes with the set one's | Identical in both environments |
| Token payload | Decoded the JWT | `{ id, iat, exp }`, 7-day life, nothing else |
| Email enumeration | Unknown email vs. wrong password | Same 401, same body, and 276 ms vs. 280 ms at the service layer |
| Session rejection | No cookie, garbage, tampered, foreign secret, expired, deleted account | 401 every time; none reached a 500 |
| NoSQL injection | `email: {$gt:""}`, `password: {$ne:null}`, numeric credentials | 400 at the validator, no session issued |
| Client-supplied fields | Registered with `currency`, `_id`, `role` in the body | All ignored; the stored record has the server's values |
| Rate limits | Six calls to each credential endpoint | 6th → 429 in the `{ success, message }` shape; `/register` and `/auth/me` unaffected by the login window |
| **Real browser** | Chrome on `:5173`, credentialed `fetch` to `:5001` | Register → `/auth/me` 200 → logout → `/auth/me` 401 → login → 200. The browser genuinely dropped the cookie on logout |
| Lockfile hygiene | `git diff` after `npm install` | 152 lines, additions only, no test-only package left behind |

### Assessment

| Task | Tool | Helped? | What had to be corrected |
|---|---|---|---|
| Writing the model and endpoints | Claude Code | Yes | Nothing structural — the criteria are specific enough to build straight from |
| Email enumeration | Claude Code | **Partly** | The first implementation matched the two error *messages* and stopped there. An unknown email skipped bcrypt entirely and answered in about 1 ms against 280 ms for a wrong password — the message hid what the clock announced. A comparison against a throwaway hash now keeps both paths on the same cost. |
| Validation messages | Claude Code | **No, first attempt** | `body("password").isString().withMessage(...)` attaches the message to *that one* validator, so a non-string password fell through to express-validator's default `"Invalid value"`. Found only because the injection test printed the body it got back. Rewritten with the chain-level fallback message. |
| Foreign-origin CORS check | Claude Code | **No** | Repeated last session's mistake exactly: the in-page `fetch` reported `location.origin` as `"null"`, so its failure proved nothing. Fell back to `curl` against the response headers, which is what the last entry already said to do. The note was in the log and still got walked into. |
| Ordering the test suite | Claude Code | Partly | The first suite exhausted its own 5-per-window budget and reported false 429s. The limiter is process-wide, so the rate-limit assertions have to come last — a property of the feature, learned by tripping over it. |

### Notes for the retrospective

- **A criterion can be met on its face and missed in substance.** "Identical 401
  for unknown email and wrong password" was satisfied by the response body while
  the response *time* still sorted registered emails from unregistered ones. The
  criterion names the mechanism, not the goal; reading it as the goal is what
  caught this.
- Two of the three corrections above came from a test *printing what it got*
  rather than asserting a boolean. The `"Invalid value"` message would have
  passed a status-code-only assertion.
- Logout parity is enforced by one shared options object rather than by two
  matching literals. Both spellings pass the test today; only one of them keeps
  passing after someone changes the path.
- `AI-USAGE-LOG.md` existed only on the unmerged local `fix/frontend-api-port`
  branch, so it was carried onto this branch to be appended to. If that branch is
  merged separately, this file will need a hand-merge that keeps both sessions.

### Prompts issued

Verbatim, in order.

1. `https://github.com/amar2512003/Budpense/issues/6 solve this issue, ensure you complete everything in the checklist and then ensure that there are no ai slop code changes and that everything you do is correct. do not take the longer route, do what is necessary. complete the issue in detail`
