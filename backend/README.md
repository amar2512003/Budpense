# Budpense API

Express and MongoDB backend for Budpense. Design notes and the response
contract live in [`plan/backend-plan.md`](../plan/backend-plan.md).

## Running it

```bash
cp .env.example .env   # then fill in MONGO_URI, JWT_SECRET, EMAIL_USER and EMAIL_PASS
npm install
npm run dev            # or npm start
```

`config/env.js` checks the environment at boot and throws listing anything
missing, so a misconfigured server fails immediately rather than at the first
request that needs the value.

| Variable | Notes |
|---|---|
| `PORT` | `5001`; the frontend's `.env.example` points here |
| `NODE_ENV` | `production` turns on `secure` cookies and `sameSite: "none"` |
| `MONGO_URI` | Connection string; the server connects before it listens |
| `JWT_SECRET` | Signs the session cookie |
| `JWT_EXPIRES_IN` | `7d`, matching the cookie's `maxAge` |
| `CLIENT_URL` | Exact frontend origin — CORS cannot use a wildcard with credentials |
| `EMAIL_USER` | Gmail address the reset OTP is sent from |
| `EMAIL_PASS` | A Gmail **App Password** for that address, not its login password |
| `EMAIL_FROM` | Optional; defaults to `EMAIL_USER` |

`.env` is never committed; `.env.example` is the template.

## Endpoints

Everything is under `/api`. Only the five session routes are public; every other
route needs the cookie.

| Method | Path | Purpose |
|---|---|---|
| POST | `/auth/register` | Create an account and start a session |
| POST | `/auth/login` | Start a session |
| POST | `/auth/logout` | Clear the session cookie |
| GET | `/auth/me` | Is this session still valid |
| POST | `/auth/forgot-password` | Email a 6-digit reset OTP (see below) |
| POST | `/auth/verify-otp` | Check the OTP, trade it for a reset session |
| POST | `/auth/reset-password` | Set a new password with that reset session |
| GET | `/users/me` | The signed-in user's profile |
| PUT | `/users/me` | Update name and email |
| PUT | `/users/change-password` | Change password, current one required |
| POST · GET | `/expenses` | Create · list |
| GET · PUT · DELETE | `/expenses/:id` | Read · replace · delete |
| POST · GET | `/income` | The same five routes over the income side |
| GET · PUT · DELETE | `/income/:id` | of the same collection |
| POST · GET | `/budgets` | Create · list, each with computed spend |
| GET · PUT · DELETE | `/budgets/:id` | Read · replace · delete |
| GET | `/dashboard` | This month summarised, plus a six-month trend |
| GET | `/health` | Liveness, unauthenticated |

### Listing expenses and income

`search` · `category` (expenses) / `source` (income) · `startDate` · `endDate` ·
`month=YYYY-MM` · `sort` (`newest` default, `oldest`, `highest`, `lowest`) ·
`page` · `limit` (default 50, capped at 100). The response is
`{ items, total, page, pages }`.

### Responses

```json
{ "success": true,  "data": {} }
{ "success": false, "message": "Expense not found" }
{ "success": false, "message": "Validation failed", "errors": { "amount": "Must be greater than 0" } }
```

## Password reset is a three-step OTP flow

1. `POST /api/auth/forgot-password { email }` — if the address is registered,
   a 6-digit code is emailed to it via Gmail (Nodemailer), valid for 10
   minutes. The endpoint answers `200` either way, so the response itself
   never says whether the address exists.
2. `POST /api/auth/verify-otp { email, otp }` — checks the code. A wrong
   guess costs one of 5 attempts; the fifth wrong guess kills the code the
   same as letting it expire would. A correct one consumes the OTP and
   returns `{ resetToken }`, a second, separate token good for 10 more minutes.
3. `POST /api/auth/reset-password { email, resetToken, password,
   confirmPassword }` — sets the new password. No cookie is issued; the
   client sends the user to `/login` afterwards.

Both the OTP and the reset token are stored hashed, never in plaintext, and
each is cleared the moment it's used — a code or a reset session works once,
within its own window, and never again after that.

## Security notes

- **Identity comes from the session cookie, never from the request.** No handler
  reads `user` or `userId` from a body, query or param; those fields are ignored
  if sent.
- **Ownership is part of the query**, not a check that follows it, so another
  user's record returns `404` rather than `403` — a `403` would confirm it
  exists.
- **Passwords** are bcrypt hashes at cost 12, excluded from queries by default,
  and never returned. Unknown email and wrong password answer with the same
  `401`, at the same cost, so neither the message nor the timing says which.
- **Rate limits:** 100 requests / 15 minutes globally, and 5 / 15 minutes each on
  `/auth/login`, `/auth/register` and `/auth/forgot-password`.
- **Sessions are stateless.** Logout clears the cookie, which ends the session
  for a browser. A client that kept the raw token could still use it until it
  expires; revoking tokens server-side would need a store this project does not
  have.
