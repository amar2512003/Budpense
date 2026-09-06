# AI Usage Log — Budpense

A record of where generative AI tools were used on this project, what they produced, what had to be corrected before the output was accepted, and the exact prompts that produced it.

Kept per the course guidance in `DSC4141-Notes01.pdf` ("Keep a short AI usage log"). The governing rule from that deck is *you own every line*: AI output is treated as a draft to be read, verified and corrected, never as a finished answer.

**Maintainer:** Srishti Dutta
**Tool in use:** Claude Code (agentic CLI), model Opus 5
**Convention:** every prompt issued is reproduced verbatim in the "Prompts issued" section of its session. Long specification documents are collapsed for readability but recorded in full.

---

## Session 1 — 6 September 2026

### Objective

Break the backend down into a set of GitHub issues detailed enough to serve as the implementation plan, following the Agile workflow from the course deck: user stories with acceptance criteria, one module per issue, tracked on the project board and linked under the parent backend issue (#18).

### Work produced

Five issues created on `amar2512003/Budpense`, labelled `backend`, forming a sequential plan:

| Issue | Scope | Implementation order covered |
|---|---|---|
| [#25](https://github.com/amar2512003/Budpense/issues/25) | Express app, MongoDB connection, centralised errors, security middleware | Steps 1–2, 9–10 |
| [#26](https://github.com/amar2512003/Budpense/issues/26) | User model, register/login/logout, JWT session, profile management | Steps 3–5 |
| [#27](https://github.com/amar2512003/Budpense/issues/27) | Expense and income CRUD, filtering, per-user data isolation | Step 6 |
| [#28](https://github.com/amar2512003/Budpense/issues/28) | Budget CRUD, spend calculation, dashboard aggregation | Steps 7–8 |
| [#29](https://github.com/amar2512003/Budpense/issues/29) | Replace localStorage stores with the live API, then deploy | Step 10 |

Each issue carries a user story, the models and endpoints in scope, the design decisions with their reasoning, a checkbox list of acceptance criteria, an explicit out-of-scope section, and a Definition of Done.

Parent issue [#18](https://github.com/amar2512003/Budpense/issues/18) was rewritten as the tracking epic: a linked checklist of the five, the dependency order, the API surface, the layering rule, the cross-cutting security rules, a register of the open decisions, and a Definition of Done for the epic as a whole.

### Verification performed

The tool was directed to read the existing frontend source before drafting, rather than working from the architecture document alone. That comparison surfaced four contract mismatches between the planned backend and the already-completed frontend, each of which would have caused an integration failure. All four are recorded on the relevant issue as a decision requiring sign-off before coding begins:

1. **`/api/income` has no counterpart in the architecture.** `frontend/src/services/incomeService.js` calls it; the architecture models income as a `type` field on `Expense`. Resolved by keeping the single model and adding a thin second router.
2. **Profile endpoints sit at two different paths.** The architecture specifies `/api/users/*`; `authService.js` calls `/auth/profile` and `/auth/change-password`. Resolved in favour of the architecture, with a two-line frontend edit scheduled in #29.
3. **Three different category lists exist** across the architecture, `ExpenseForm.jsx` and `BudgetForm.jsx`. Resolved to a single shared enum, with `education` and `travel` added to the expense form.
4. **Budget month is a number in the architecture and a zero-padded string in the form.** Kept as a number in the model, normalised on input and output, because the select comparison would otherwise leave the field blank when editing an existing budget.

Two further problems were found by reading the frontend source:

- **A latent session bug in `authStore.js`.** It initialises `isLoading: false`, which is correct against synchronous `localStorage` but wrong against a real `/auth/me` request — `ProtectedRoute` would redirect to `/login` before the response arrived, on every page refresh. Documented with its fix in #29.
- **A persisted `spent` column on the Budget model.** Flagged as a drift risk, since it would need recalculating on every expense create, update, delete and category change. The issue recommends computing the value instead, and records the alternative so the decision is a deliberate one.

Issue bodies were then read back from the GitHub API to confirm they had been created in full, with labels and assignee applied — 7,773 to 9,453 characters each, 14 to 21 acceptance criteria apiece.

### Assessment

| Task | Tool | Helped? | What had to be corrected |
|---|---|---|---|
| Reading the course notes and extracting the required workflow | Claude Code | Yes | None. |
| Drafting issue content in user-story format | Claude Code | Yes | First draft followed a generic issue template. Rejected and rewritten to be specific to this codebase. |
| Matching the plan to the existing frontend | Claude Code | Yes | Needed an explicit instruction to read the frontend first; the initial draft assumed endpoint names rather than verifying them. |
| Aligning issues to the supplied architecture | Claude Code | Partly | The first version used its own folder structure and a `Transaction` model. Replaced with the specified layered structure and `Expense` model. |
| Identifying integration risks | Claude Code | Yes | Findings were checked against the source files before being written into the issues. |
| Confirming the issues were created correctly | Claude Code | Yes | Output was re-read from the API rather than accepted on the tool's report. |

### Notes for the retrospective

The value in this session came from pointing the tool at the actual repository rather than accepting a plan generated from the architecture description alone. The generic first draft was plausible and would have passed a quick read, but it named endpoints that did not match `frontend/src/services/`, and those mismatches would have surfaced as integration bugs several days later.

### Prompts issued

**Prompt 1 — project plan and initial instruction**

> okay i need to be working on the backend. look at the dsc notes pdf, that is the method of development we must use. […] this is the project plan. first create 3 - 5 issues with detailed issues descriptions. ensure none of this looks like ai slop. go through the entire project structure and everything and what i must do. every feature or module must be one issue. i will link these issues then to the overall backend issues.

<details>
<summary>Full project plan supplied with prompt 1</summary>

Specified a Personal Budgeting & Expense Tracker on the MERN stack: React + Vite frontend, Node/Express backend, MongoDB + Mongoose, JWT with HTTP-only cookies, Zustand or Redux Toolkit, Tailwind CSS, Recharts, Zod/Joi validation, bcrypt hashing, and deployment to Vercel / Render / MongoDB Atlas.

Seventeen core features were listed: user registration, login/logout, protected routes, JWT authentication, profile management, add income, add expenses, expense categories, monthly budgets, budget vs actual spending, dashboard, transaction history, filtering/search, monthly reports, spending charts, financial summary, and user-specific data isolation.

The document then set out, in sections: a three-layer high-level architecture (browser → frontend → backend → MongoDB) with the rule that the frontend never talks to MongoDB directly; a monorepo repository structure with separate `frontend/` and `backend/` directories; the full frontend folder tree; the full backend folder tree enforcing route → controller → service → model; the authentication architecture including the register/login flow and the `authMiddleware` path for protected requests; the User, Transaction, Budget and Category models; the REST API surface for auth, transactions, budgets, categories and dashboard; a worked example of a `POST /api/transactions` request tracing every layer; a section headed "VERY Important Security Rule" stating that `userId` must never be trusted from the frontend and must always come from `req.user.id`; the dashboard layout; the frontend route architecture with `/app/*` protected; the Zustand store design; environment variables for both halves; a seven-phase development order (setup, authentication, transactions, dashboard, budgets, reports, polish); and a final architecture diagram.

The closing recommendation was to begin with Phase 1 and Phase 2 — create the two directories, connect MongoDB, and implement register/login/logout with JWT and HTTP-only cookies — before touching the dashboard.

</details>

**Prompt 2 — rejecting the existing issue format**

> The way fronetend issues are is absolutely incorrect. we will not be doing it like that

**Prompt 3 — clarifying the required shape**

> the issues you form must be like a plan. the plan that entirely solves the backend and then issue for integration.

**Prompt 4 — backend architecture, superseding the earlier structure**

> Absolutely. For your **Budgeting & Expense Tracker MERN project**, let's frame the backend separately and keep it production-style rather than putting everything into one huge Express file. […] this is my backend architecture. form the backend and corresponding issues accordingly

<details>
<summary>Full backend architecture supplied with prompt 4</summary>

Specified a `backend/src/` tree using dot-notation filenames: `config/` (`db.js`, `env.js`); `controllers/` (`auth`, `user`, `expense`, `budget`, `dashboard`); `models/` (`User.js`, `Expense.js`, `Budget.js`); `routes/` mirroring the controllers; `middleware/` (`auth.middleware.js`, `error.middleware.js`, `validate.middleware.js`); `services/` (`auth`, `expense`, `budget`, `dashboard`); `utils/` (`generateToken.js`, `hashPassword.js`, `apiError.js`); `validators/` (`auth`, `expense`, `budget`); plus `app.js` and `server.js`, with `.env`, `.env.example`, `.gitignore`, `package.json` and `README.md` at the root.

Seventeen numbered sections followed:

1. **Tech stack** — Node, Express, MongoDB, Mongoose, JWT, bcrypt, cookie-parser, CORS, dotenv, express-validator or Zod, with the request path React → Express → middleware → routes → controllers → services → models → MongoDB.
2. **Authentication** — a User model of name, email, password, currency and timestamps; passwords hashed with bcrypt before storage; full register and login flows; a stated preference for an HTTP-only, Secure cookie over `localStorage`.
3. **Authentication middleware** — invalid JWT returns 401, valid JWT populates `req.user`; the backend identifies the user from the token rather than trusting a `userId` from React.
4. **Expense model** — user, amount, category, description, date, paymentMethod, type and timestamps, with categories Food, Transport, Shopping, Bills, Entertainment, Health, Education, Travel, Others.
5. **Expense APIs** — full CRUD, with filtering by category and by `startDate`/`endDate`; all authenticated.
6. **Budget model** — user, category, amount, month, year, spent and timestamps, with the worked example of ₹8,000 budgeted against ₹6,500 spent giving ₹1,500 remaining at 81.25% usage.
7. **Budget APIs** — full CRUD.
8. **Dashboard API** — a single `GET /api/dashboard` in place of five or six separate requests, returning `totalIncome`, `totalExpense`, `balance`, `monthlyExpense`, `budgetUsed`, `categoryBreakdown`, `recentExpenses` and `monthlyTrend`, computed with MongoDB aggregation.
9. **Dashboard data** — the specific figures behind each field, including the category breakdown and monthly spending series that feed the charts.
10. **User APIs** — `GET /api/users/me`, `PUT /api/users/me`, and a separate `PUT /api/users/change-password`; profile settings covering name, email, currency and monthly income.
11. **Complete API structure** — the full `/api` tree across `/auth`, `/users`, `/expenses`, `/budgets` and `/dashboard`.
12. **Middleware flow** — CORS → Express → route → validation → auth check → controller → service → Mongoose → MongoDB.
13. **Error handling** — no ad-hoc error responses; one centralised error middleware producing a standard JSON shape, with examples for not-found, validation and unauthorised cases.
14. **Security layer** — bcrypt, JWT, HTTP-only cookies, CORS, validation, Helmet and rate limiting; and the rule "never trust the frontend", with `Expense.user` always set from `req.user.id`.
15. **Database relationships** — User as the parent of both Expenses and Budgets, so every query naturally filters by the logged-in user.
16. **Backend environment** — `PORT`, `MONGO_URI`, `JWT_SECRET`, `CLIENT_URL`, `NODE_ENV`, with the production variants and the instruction never to commit `.env`.
17. **Folder responsibility** — a table assigning one responsibility to each folder, contrasted against putting 200 lines of database logic in a route.

It closed with a final architecture diagram and a ten-step implementation order: Express server, MongoDB connection, User model, register/login/logout, JWT middleware, expense CRUD, budget CRUD, dashboard aggregation, validation and centralised errors, then security and production configuration.

</details>

**Prompt 5 — establishing this log**

> also while you're at it from now onwards i want you to maintain a .md file that is going to be an ai log for me. keep the ai log professional and my commands for it professional so that I can show it to my professor

**Prompt 6 — verification challenge**

> are you sure the issue has proper descriptions?

**Prompt 7 — extending the log convention**

> also include all the prompts i give

**Prompt 8 — linking the epic**

> https://github.com/amar2512003/Budpense/issues/18 edit this issue to link and make a todo list for all the backend issues i created

---

## How to add an entry

One entry per working session, containing:

- **Objective** — what the session set out to achieve.
- **Work produced** — what was created or changed, with links.
- **Verification performed** — what was independently checked, and how.
- **Assessment** — the task/tool/helped/corrected table.
- **Notes for the retrospective** — what to carry into the next sprint.
- **Prompts issued** — every prompt, verbatim, in order.

The "what had to be corrected" column and the verification section are the substance of this log. They are what distinguish critical use of the tool from acceptance of its output.
