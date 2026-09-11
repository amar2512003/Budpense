# Budpense API

Express and MongoDB backend for Budpense. Design notes and the response
contract live in [`plan/backend-plan.md`](../plan/backend-plan.md).

## Running it

```bash
cp .env.example .env   # then fill in MONGO_URI and JWT_SECRET
npm install
npm run dev            # or npm start
```

`config/env.js` checks the environment at boot and throws listing anything
missing, so a misconfigured server fails immediately rather than at the first
request that needs the value.

| Variable | Notes |
|---|---|
| `PORT` | `5001`; the frontend's dev fallback points here |
| `NODE_ENV` | `production` turns on `secure` cookies and `sameSite: "none"` |
| `MONGO_URI` | Connection string; the server connects before it listens |
| `JWT_SECRET` | Signs the session cookie |
| `JWT_EXPIRES_IN` | `7d`, matching the cookie's `maxAge` |
| `CLIENT_URL` | Exact frontend origin — CORS cannot use a wildcard with credentials |

`.env` is never committed; `.env.example` is the template.

## Endpoints

```text
/api/auth   POST register · POST login · POST logout · GET me
            POST forgot-password · POST reset-password/:token
/api/users  GET me · PUT me · PUT change-password
```

Sessions are an `httpOnly` cookie named `token`; identity is read from it and
never from a body, query or param.

## Password reset has no mail service

**There is no mail service in this project.** `POST /api/auth/forgot-password`
prints the reset link to the *server console* instead of sending it:

```text
Password reset link for someone@example.com: http://localhost:5173/reset-password/<token>
```

Copy that URL out of the terminal running the API to complete a reset. The
endpoint answers `200` whether or not the address is registered, so the response
itself never says which — the console is the only place the link appears.

Tokens are stored hashed with a 15-minute expiry and are cleared on use, so a
link works once and only within that window.
