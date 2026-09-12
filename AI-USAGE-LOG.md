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

---

## Session — 11 September 2026 (second)

### Objective

Implement issue #7 — password reset and the profile endpoints — on top of the
auth API from #6.

### Work produced

Branch `feature/profile-password-reset`, derived from `feature/auth-api`
because #7 depends on code that is not in `main` yet.

- **Reset fields on `User`** — `resetToken` and `resetTokenExp`, both
  `select: false`.
- **`POST /auth/forgot-password`, `POST /auth/reset-password/:token`** — token
  is 32 random bytes, stored as a SHA-256 hash with a 15-minute expiry, matched
  by hash *and* expiry in one query and cleared on use, so a link works once.
  Rate limited 5 / 15 min like the other credential routes.
- **`GET`/`PUT /users/me`, `PUT /users/change-password`** — one router behind a
  single `router.use(protect)`, since every route on it acts on the caller's own
  record and no other. `change-password` verifies the current password first.
- **`validators/fields.js`** — `name`, `email` and new-password rules extracted
  from `validators/auth.js`, now shared with `validators/user.js`. Register and
  a profile update have to normalise an email identically or the two disagree
  about which row they mean.
- **`backend/README.md`** — how to run it, the environment table, and the
  console-only reset link, which criterion 4 asks to be written down.

Open decision 2 resolved as the plan proposed: profile lives at `/api/users`.
The two lines in the frontend's `authService.js` that still point at
`/auth/profile` are left for the integration issue, which is where the plan
puts them.

### Verification performed

45 new assertions against a real `mongod`, plus the 48 from #6 re-run to catch
what the validator extraction might have broken. Both suites green on the
committed tree.

| Check | Method | Result |
|---|---|---|
| Reset link contents | Captured the server's console output | `CLIENT_URL/reset-password/<64 hex>`, the raw token nowhere in the response |
| Unknown address | Compared both responses byte for byte | Identical 200, and nothing logged — the console does not leak the answer either |
| Token at rest | Read the stored document | SHA-256 of the raw token, `select: false`, expiry 15.00 minutes out |
| Single use | Replayed a consumed link, and an expired one | 400 both times, same message for expired as for forged |
| Reset actually resets | Logged in with old and new passwords afterwards | Old 401, new 200, new hash at cost 12 |
| Reset is not a sign-in | Inspected the response | No cookie set |
| Profile read | `/users/me` vs `/auth/me` | Same user, no password or reset fields in either |
| Profile update | Changed name and email, then logged in again | Trimmed and lowercased, password hash untouched, login still worked |
| Email clash | Took another account's address, then kept my own | 409, then 200 — a no-op email change is not a clash |
| Body injection | Sent `currency`, `_id` and `password` to `PUT /users/me` | All ignored; the stored password was unchanged |
| change-password | Wrong current, short new, missing current, correct | 401 / 400 / 400 / 200, and a failed attempt left the old password working |
| Rate limit | Six calls to `/forgot-password` | 6th → 429 in the `{ success, message }` shape |
| **Real browser** | Chrome on `:5173`, credentialed `PUT`s to `:5001` | Profile update, change-password and the full console-link reset all worked cross-origin; replaying the link afterwards returned 400 |

### Assessment

| Task | Tool | Helped? | What had to be corrected |
|---|---|---|---|
| Reset flow | Claude Code | Yes | Nothing — the criteria name the failure modes precisely enough to build against |
| Saving a partially selected document | Claude Code | Partly | `forgot-password` saves a user loaded *without* the password field. Mongoose skipping validation on unselected paths is what makes that safe; that was an assumption until the test proved it, and it would have failed as a 500 on the first real request. |
| Token validation | Claude Code | Partly | The first plan validated the `:token` parameter's shape in the validator, which would have answered a bad link with `"Validation failed"`. Dropped: the lookup rejects it anyway, and the service's message is the one the user needs to read. |
| Sharing field rules | Claude Code | Yes | Extracting `fields.js` re-touched code #6 had already verified, so #6's suite was re-run rather than assumed. |
| Keeping the test suites | Claude Code | **No** | The #7 suite was deleted during cleanup and then a service signature changed, leaving nothing to re-run. It had to be rewritten from scratch to re-verify. The suites now live in the scratchpad, not the repo working directory. |

### Notes for the retrospective

- The endpoint that returns the least is the one carrying the most design.
  `/forgot-password` answers one fixed sentence; everything interesting about it
  is what it declines to say, in the body *and* in the log.
- `/users/me` and `/auth/me` return the same thing today, which is what the plan
  describes. That is worth revisiting only if the profile grows fields the
  session check has no business fetching.
- A stale reset link still works after a deliberate password change, until it
  expires. Clearing the token there would be one line; it is not in #7's scope,
  so it is recorded here rather than added quietly.

### Prompts issued

Verbatim, in order.

1. `okay ensure the commits are in small logical batches and that none of the commits have any mention of claude and that they are all one liners`
2. `command to git push?`
3. `https://github.com/amar2512003/Budpense/issues/7 now solve this one, take all instructions given before into consideration as well`

---

## Session — 11 September 2026 (third)

### Objective

Implement issue #8 — the expense and income API, with filtering, sorting and
pagination — on the auth work from #6 and #7.

### Work produced

Branch `feature/expense-income-api`, derived from `feature/profile-password-reset`.

- **`constants/enums.js`** — the categories, payment methods and income sources,
  as lowercase slugs, in one file. Resolves open decision 3; `education` and
  `travel` are included, which `ExpenseForm.jsx` still lacks.
- **`models/Expense.js`** — one collection for both sides of the ledger, split
  by `type`, with `category` required for expenses and `source` for income
  through type-dependent `required` functions, and the index the plan asks for.
- **`services/expense.service.js`** — list, get, create, update, delete. The
  owner is part of every query rather than a check that follows it, so someone
  else's record is not found rather than forbidden.
- **`controllers/expense.controller.js`** — one factory returning the five
  handlers bound to a type; `/expenses` and `/income` are the same handlers over
  the same service, which is open decision 1's "thin second router".
- **`validators/expense.js`**, **`utils/escapeRegex.js`**, and the two routers.

Resolved open decision 1 and 3 as the plan proposed. The frontend half of
decision 3 — adding `education` and `travel` to `ExpenseForm.jsx` — is left for
the integration issue, where the rest of the frontend changes live.

### Verification performed

55 assertions against a real `mongod`, plus #6's 48 and #7's 45 re-run. All
green on the committed tree, and the whole CRUD cycle driven from a real browser.

| Check | Method | Result |
|---|---|---|
| Create, read, update, delete | Live server, both routers | 201/200/200/200, and the record gone afterwards |
| Body cannot set identity | Posted `user`, `type` and `_id` in the body | All three ignored; the record belonged to the caller, typed by its route |
| Cross-type fields | Posted `category`, `title`, `paymentMethod` to `/income` | Dropped by the per-type allowlist, not stored |
| Another user's record | Read, updated and deleted Bob's record as Alice | 404 each time, and the record still there afterwards |
| Wrong router | Fetched an expense's id through `/income` | 404 — the type is part of the query |
| Malformed id | `GET /expenses/not-an-id` | 400, not a 500 or a leaked `_id` cast error |
| Filters | `category`, `source`, `month`, `startDate`/`endDate`, `search` | Each exact; both range ends inclusive; month covering only its own month |
| Regex safety | Searched `.`, `(large)`, and `(a+)+(a+)+…$` | Escaped: 0 hits, 1 hit, and a 2 ms response |
| Sorting | All four orders | Correct, with `_id` as tie-break so paging cannot repeat a row |
| Paging | `limit=2&page=2`, `limit=5000`, an empty result | Right slice, capped at 100, and `pages: 1` for an empty list |
| Index | `collection.indexes()` **and** `explain()` on the list query | Present, and actually chosen — `IXSCAN`, not a collection scan |
| **Real browser** | Chrome on `:5173`, the exact body `ExpenseForm.jsx` submits | Create, read, update, list, delete all worked cross-origin |

### Assessment

| Task | Tool | Helped? | What had to be corrected |
|---|---|---|---|
| Model, service, routers | Claude Code | Yes | Nothing structural |
| Query parameter sanitising | Claude Code | **No** | Express 5 exposes `req.query` through a getter, so express-validator's `.toDate()` and `.toInt()` cannot write back and every filter arrived as a raw string. `startDate` crashed outright — but `page` and `limit` *passed*, because `"2" - 1` and `Math.min("5000", 100)` coerce. Two green assertions were green for the wrong reason. Fixed by reading `matchedData(req, { locations: ["query"] })`, which also drops unrecognised parameters. |
| Filter that does not apply | Claude Code | Partly | `/income?category=food` returned every income record with a 200, because an unvalidated parameter is simply dropped. The test had asserted a 400 that the code never implemented — so the test was wrong, but its expectation was the better behaviour, and the code changed to match rather than the test. |
| Search field choice | Claude Code | Yes | Read what each page's own search box filters on today and matched it, rather than inventing a field list. |

### Notes for the retrospective

- **A passing test is not evidence that the mechanism works.** The paging
  assertions passed while the sanitiser they depended on was doing nothing;
  JavaScript's coercion covered for it. The date filter is the only reason any
  of it was found, and only because a `Date` method does not exist on a string.
- Silently ignoring a filter is worse than refusing it. A request that filtered
  on nothing still answers 200 with a full list, and nothing in the response
  says the filter was dropped.
- `Income.jsx` renders `entry.date` directly. The API returns an ISO timestamp,
  so that field will need formatting during integration; it is not a backend
  concern but it will look like one.

### Prompts issued

Verbatim, in order.

1. ```
   gh pr create --base main --head feature/auth-api --title "feat: auth API — register, login, logout and session check" --body "Closes #6"
    give me 7 ib this format
   ```
2. `nooooo base is main`
3. `https://github.com/amar2512003/Budpense/issues/8 lets solve this issue, ensure you follow all the instructions from the previous issue solution`

---

## Session — 12 September 2026

### Objective

Implement issue #9 — the budget API with computed spend — on `main`, which now
carries #6, #7 and #8.

### Work produced

Branch `feature/budget-api`, derived from `main`.

- **`models/Budget.js`** — category from the shared enum, amount above zero,
  month 1–12 stored as a Number, year 2020–2100, and the compound unique index
  on `{ user, category, month, year }`.
- **`services/budget.service.js`** — CRUD plus the spend join. `spent` is
  computed on read, never stored (decision 5): a stored column would need
  correcting on every expense create, update, delete and category change, and a
  figure that drifts is wrong silently. The whole list costs **one** aggregation
  over the expenses, grouped by year, month and category, whatever the budget
  count.
- **`controllers/budget.controller.js`**, **`routes/budget.routes.js`**,
  **`validators/budget.js`** — the five routes behind one `router.use(protect)`.
- `inList()` moved from `validators/expense.js` into `validators/fields.js`, so
  the budget validator phrases its category choices identically.

Decision 4 resolved as proposed: `month` is stored as a Number, accepted as
either `9` or `"09"`, and returned zero-padded.

### Verification performed

37 assertions against a real `mongod`, plus #6's 48, #7's 45 and #8's 55 re-run
after the validator move. All green, and the full cycle driven from a browser.

| Check | Method | Result |
|---|---|---|
| Month in, month out | Posted `"09"` and `9` | Both stored as `9`, both returned as `"09"` |
| Duplicate | Same category and month twice; then a write straight to the collection | 409 from the service, `11000` from the index — the index is what actually enforces it |
| Not a duplicate | Same category in another month, another year, another user | All accepted |
| The join | Seeded spend inside, on both boundaries, outside, in another category, another user and as income | 6500 — only this user's expenses, in this category, in this month |
| Boundary | An expense at `23:59:59.999` on 30 September and one at `00:00` on 1 October | First counted, second not; the half-open UTC range holds |
| Unclamped | Lowered a budget below its spend | `percentage: 155.54`, `remaining: -2777`, `isOverBudget: true` |
| Not stored | Read the raw document | No `spent` field on it |
| One aggregation | Counted driver commands during `GET /budgets` with five budgets over three periods | `find, find, aggregate` — the session's user, the budgets, one pass over the expenses |
| Ownership | Read, updated and deleted another user's budget | 404 each time, record intact |
| Moving a budget | `PUT` onto another budget's slot, then onto its own | 409, then 200 — a budget is not its own duplicate |
| **Real browser** | Chrome on `:5173`, the exact body `BudgetForm.jsx` submits | `{ spent: 6500, remaining: 1500, percentage: 81.25 }` — the plan's documented example, reproduced |

### Assessment

| Task | Tool | Helped? | What had to be corrected |
|---|---|---|---|
| The aggregation | Claude Code | Yes | Casting the owner to `ObjectId` was handled deliberately — `aggregate` does no casting of its own, and a string would have matched nothing and reported every budget as unspent. |
| Branch base | Claude Code | **No** | Started the branch off `feature/expense-income-api` out of habit from #7 and #8. The instruction was `main`, and by then `main` had both PRs merged, so the dependency argument no longer held. Rebuilt off `main` before going further. |
| Counting the queries | Claude Code | **No, first attempt** | The "one aggregation" assertion listened for `commandStarted` on a client that was not monitoring commands, so it recorded nothing and failed while the code was correct. Re-run with `monitorCommands: true`, which then also showed the two finds — a claim the first version could not have made either way. |
| Reading the plan's example | Claude Code | Yes | The documented `81.25` was used as a fixture rather than a description, so the response either matches the plan exactly or the test fails. |

### Notes for the retrospective

- A test that observes nothing fails the same way as a test that observes a
  bug. This one failed while the feature worked; the previous session had one
  that passed while the feature was broken. Both were instrumentation, and
  neither was visible without asking what the assertion actually watched.
- `BudgetForm.jsx` offers eight categories and still omits `travel`, which the
  shared enum has. A budget can be created for it through the API but not
  through the form. That is the frontend half of decision 3, and it belongs to
  the integration issue.

### Audit of #9 after the fact

Run against the committed branch, through `server.js` itself rather than an
in-process import, on a server clock set to `Asia/Kolkata` (UTC+5:30) — every
month boundary in this feature is UTC, and a local-time range would have moved
both boundary expenses into the wrong month.

18 further assertions, covering what the build-time suite had not:

| Check | Result |
|---|---|
| Real boot path | `MongoDB connected` then `API listening`, and the running server built the unique index itself |
| Month boundaries on a UTC+5:30 clock | 30 Sep `23:59:59.999Z` counted, 1 Oct `00:00Z` not — unchanged by the server's timezone |
| Spend is recomputed, not cached | Adding, deleting and recategorising an expense each moved the figure with no write to the budget |
| A budget moved to another month | Reports that month's spend, not the one it was created in |
| **Five simultaneous identical creates** | 1 × 201, 4 × 409, one row — the index wins the race the service check cannot |
| Arithmetic | A third of a budget reads 33.33 |
| Inputs not previously tried | Unpadded `"7"`, an amount as a string, `spent`/`user`/`_id` in the body, an operator object as month — all handled |
| 19 budgets over 16 periods | Still `find, aggregate`: one pass over the expenses |
| Error contract | 404, 400, 409, 401 all in the documented shape |

**One defect found and fixed:** `spent` was returned straight from the
aggregation, so summing fractional amounts shipped `0.30000000000000004` as a
currency figure, and `remaining` inherited the tail. Both are now rounded to two
places, which also stops a tail of that size deciding `isOverBudget`. The four
suites — 48, 45, 55 and 37 assertions — were re-run against the fix.

The audit's own query-count probe failed first, watching a client that was not
monitoring commands. That is the third instrumentation fault in three sessions
and the second of exactly this kind; the first version of this check in #9 made
the same mistake.

### Prompts issued

Verbatim, in order.

1. `https://github.com/amar2512003/Budpense/issues/9 lets solve this the same way now`
2. `first create a new branch off of main branch and then solve the issue. dont take the long way dont make ai slop code changes`
3. `the open prs have been merged.. now create a new branch off of main and solve this issue thorougly`
4. `run an audit to ensure everythings is working properly`
5. `run an audit to ensure everythings is working properly, stick to this issue`

---

## Session — 12 September 2026 (second)

### Objective

Implement issue #10 — the dashboard aggregation endpoint — branching from
`main`, which now carries #6 through #9.

### Work produced

Branch `feature/dashboard-endpoint`, derived from `main`.

- **`services/dashboard.service.js`** — the nine documented fields. One `$facet`
  aggregation over the six-month window covers the month's totals, the category
  breakdown and the daily series; the budgets and the four recent expenses are
  two small indexed reads alongside it.
- **`utils/monthRange.js`** and **`utils/money.js`** — the half-open UTC month
  range and the two-place money rounding, lifted out of `budget.service.js`
  because the dashboard needs both. `toPublicRecord` is now exported from
  `expense.service.js`, so an expense has one shape on the wire wherever it
  appears.
- **`controllers/dashboard.controller.js`**, **`routes/dashboard.routes.js`**.

`monthlyTrend` is built from a generated list of the last six months and then
filled from the grouped result, rather than being read out of it — which is what
keeps a month with no activity in the series as a zero.

### Verification performed

31 assertions in the suite and 15 more in the audit, plus #6's 48, #7's 45,
#8's 55, #9's 37 and #9's audit of 18 re-run after the helpers moved. All green.

The suite checks the figures against the frontend's own `utils/finance.js` —
`totalAmount`, `entriesForMonth`, `categoryTotals`, `sortByNewestDate`,
`monthlyIncomeExpenseTotals` — imported directly and run over the same records,
so the endpoint is compared against an oracle written by someone else rather
than against my own restatement of the rules.

| Check | Result |
|---|---|
| Empty account | Zeros throughout, arrays empty, and six months of zeros in the trend |
| Totals, breakdown, recent | Agree exactly with `finance.js` over the same data |
| `savingsRate` | 0 when income is 0; −50 when spending outruns income, which is the true figure |
| `budgetUsed` | 0 with no budgets; 300 when spend is triple the budget — unclamped |
| `categoryBreakdown` | Display labels, descending, `Uncategorised` for a record with no category |
| `dailyExpense` | ISO dates, ascending, one row per day, not pre-formatted |
| `monthlyTrend` | Six months, oldest first; three empty months present as zeros |
| **Year rollover** | With the clock stubbed to 15 January 2027, the window reads `2026-08 … 2027-01`, and a record one millisecond before it is excluded |
| **Month edges on a UTC+5:30 server** | First and last instants of the month counted, the previous month's last instant not |
| Isolation | Another user's ledger appears nowhere |
| Cost and effects | One aggregation and three finds; no write command issued |
| **Real browser** | The whole shape returned from a credentialed cross-origin call |

### Assessment

| Task | Tool | Helped? | What had to be corrected |
|---|---|---|---|
| The aggregation | Claude Code | Yes | The `$facet` was written against the six-month window so the inner month slices re-match a narrowed stream rather than the whole collection. |
| `recentExpenses` ordering | Claude Code | **Partly** | The oracle and the endpoint disagreed on two expenses sharing a date. The plan says this field should match `sortByNewestDate(...).slice(0, 4)`, but that function returns 0 for equal dates, so its tie order is whatever order its input array had — an artifact of `Array.sort` being stable, not a rule, and circular once the array comes from this endpoint. Kept `_id` descending, which agrees with `/expenses?sort=newest`, and the assertion now checks the four records and the date order rather than a tie order the reference cannot define. Recorded rather than quietly changed. |
| `budgetUsed` | Claude Code | Partly | Read literally, as the plan words it: **total** spend over **total** budgeted. With one budget of 8000 and 7150 spent across three categories the card reads 89%, including spend in categories that were never budgeted. That is the specified formula, not an accident, but it is worth a product decision before release. |
| Testing the year rollover | Claude Code | Yes | The window arithmetic is the one piece here whose bug would appear only in January, so the clock was stubbed rather than reasoned about. |

### Notes for the retrospective

- Using the frontend's own helpers as the oracle was worth more than any
  assertion I wrote by hand: it compares the endpoint against code written
  independently, so agreement means something. It also raised the only real
  design question in the issue, which no hand-written test would have asked.
- The endpoint has no parameters, so it answers for the current month.
  `Reports.jsx` charts *all* history through the same three helpers, and the
  plan says reports reuses this endpoint. Those two cannot both hold. Nothing
  here guesses at a range parameter; the integration issue should decide.

### Prompts issued

Verbatim, in order.

1. `okay so is the big fixed?`
2. `now solve this by branching from main again, ensure no ai slop code changes are made and audit your code to ensure it is correct: https://github.com/amar2512003/Budpense/issues/10`
