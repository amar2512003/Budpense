# Frontend Plan

Reference document for the Budpense frontend. The frontend follows the
backend API contract and is organized to keep UI, state management,
routing, and API communication separated.

Tracking epic: #18

------------------------------------------------------------------------

## Structure

``` text
frontend/
├── public/
├── src/
│   ├── assets/
│   ├── components/
│   │   ├── ui/          Button · Input · Card · Modal · Select · Loader
│   │   ├── layout/      Navbar · Sidebar · AuthLayout · DashboardLayout
│   │   ├── expense/     ExpenseCard · ExpenseForm · ExpenseList · ExpenseFilters
│   │   ├── budget/      BudgetCard · BudgetForm · BudgetProgress
│   │   └── charts/      CategoryChart · ExpenseChart · IncomeExpenseChart
│   ├── pages/
│   │   ├── auth/        Login · Register · ForgotPassword · ResetPassword
│   │   ├── dashboard/   Dashboard
│   │   ├── expenses/    Expenses · AddExpense · EditExpense
│   │   ├── budgets/     Budgets
│   │   ├── income/      Income
│   │   ├── reports/     Reports
│   │   ├── profile/     Profile
│   │   └── NotFound
│   ├── routes/           AppRoutes · ProtectedRoute · PublicRoute
│   ├── store/            authStore · expenseStore · budgetStore · uiStore
│   ├── services/         api · authService · expenseService · budgetService · incomeService
│   ├── hooks/            useAuth · useDebounce
│   ├── utils/            validators · formatCurrency · formatDate · finance
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── .env
├── .env.example
├── .gitignore
├── index.html
├── package.json
└── vite.config.js
```

Layering rule:

``` text
pages/components → hooks/stores → services → API → backend
```

Pages should not contain direct Axios calls. Services handle HTTP
communication, stores handle client state, and reusable components
handle presentation.

  Folder                 Responsibility
  ---------------------- ----------------------------------------------
  `components/ui`        Reusable UI primitives
  `components/layout`    Application shell and navigation
  `components/expense`   Expense-specific UI
  `components/budget`    Budget-specific UI
  `components/charts`    Reusable financial visualizations
  `pages`                Route-level screens
  `routes`               Public/protected navigation and route guards
  `store`                Zustand state and async actions
  `services`             API requests
  `hooks`                Reusable React logic
  `utils`                Formatting, validation and finance helpers
  `assets`               Static frontend assets

------------------------------------------------------------------------

## Entry and application flow

``` text
index.html
   ↓
main.jsx
   ↓
BrowserRouter
   ↓
App.jsx
   ↓
AppRoutes.jsx
   ├── PublicRoute → AuthLayout → Login/Register/Password pages
   └── ProtectedRoute → DashboardLayout
                         ├── Navbar
                         ├── Sidebar
                         └── Outlet
                              ├── Dashboard
                              ├── Expenses
                              ├── Income
                              ├── Budgets
                              ├── Reports
                              └── Profile
```

`main.jsx` mounts the React application and imports the global
stylesheet. `App.jsx` should remain a thin entry component and delegate
routing to `AppRoutes.jsx`.

------------------------------------------------------------------------

## Routing

### Public routes

``` text
/login
/register
/forgot-password
/reset-password/:token
```

Public routes should redirect authenticated users to:

``` text
/app/dashboard
```

### Protected routes

``` text
/app
/app/dashboard
/app/expenses
/app/expenses/add
/app/expenses/:id/edit
/app/income
/app/budgets
/app/reports
/app/profile
```

`ProtectedRoute` checks authentication before rendering the application
shell. While `/auth/me` is being checked, it renders a loading state
rather than redirecting prematurely.

`NotFound.jsx` handles unknown routes.

------------------------------------------------------------------------

## Authentication

Authentication is session-based through the backend `httpOnly` cookie.

Frontend responsibilities:

-   Login with email and password.
-   Register a new account.
-   Check the current session using `/auth/me`.
-   Logout through the backend.
-   Support forgot-password and reset-password flows.
-   Never store the authentication token in `localStorage`.
-   Keep user authentication state in `authStore`.
-   Redirect unauthenticated users to `/login`.
-   Preserve the originally requested protected route where practical.

Expected flow:

``` text
App startup
   ↓
authStore.checkAuth()
   ↓
GET /api/auth/me
   ├── success → user + authenticated
   └── failure → unauthenticated
```

`authStore` must initialise `isLoading: true` when authentication
depends on an asynchronous `/auth/me` request. Both success and failure
paths must set `isLoading: false`.

------------------------------------------------------------------------

## API service layer

`services/api.js` owns the Axios instance.

Expected configuration:

``` text
baseURL = VITE_API_URL
withCredentials = true
```

The API layer should:

-   Send credentials for cookie-based authentication.
-   Centralize common Axios configuration.
-   Handle 401 responses consistently.
-   Avoid redirect loops for the login request itself.

Service responsibilities:

  -----------------------------------------------------------------------
  Service                             Responsibility
  ----------------------------------- -----------------------------------
  `authService.js`                    Login, register, logout, current
                                      session, password reset

  `expenseService.js`                 Expense CRUD and list/filter
                                      requests

  `incomeService.js`                  Income CRUD and list/filter
                                      requests

  `budgetService.js`                  Budget CRUD

  `api.js`                            Axios instance and shared HTTP
                                      behavior
  -----------------------------------------------------------------------

Frontend error handling should read the backend contract:

``` js
err.response?.data?.message
```

Validation errors may also expose:

``` js
err.response?.data?.errors
```

------------------------------------------------------------------------

## State management

Zustand is used for application state.

### `authStore`

``` text
user
isAuthenticated
isLoading
error
login()
register()
logout()
checkAuth()
clearError()
```

The store must not use `localStorage` for authentication tokens.

### `expenseStore`

Responsible for:

``` text
expenses
selectedExpense
loading
error
filters
fetchExpenses()
fetchExpense()
addExpense()
updateExpense()
deleteExpense()
```

Search, category, date range, month and sort should be sent to the
backend rather than filtering the complete dataset only on the client.

The existing `useDebounce` hook should debounce search input.

### `incomeStore`

Responsible for:

``` text
income
selectedIncome
loading
error
filters
fetchIncome()
fetchIncomeById()
addIncome()
updateIncome()
deleteIncome()
```

Income uses `source`, not `category`.

### `budgetStore`

Responsible for:

``` text
budgets
loading
error
fetchBudgets()
addBudget()
updateBudget()
deleteBudget()
```

Budget responses already contain:

``` text
spent
remaining
percentage
isOverBudget
```

The frontend should use those API values rather than deriving `spent`
locally.

### `uiStore`

Handles global UI state such as:

``` text
sidebar open/closed
modal state where needed
loading/notification state where appropriate
```

------------------------------------------------------------------------

## Expense UI

### Pages

``` text
Expenses.jsx
AddExpense.jsx
EditExpense.jsx
```

### Components

``` text
ExpenseCard.jsx
ExpenseForm.jsx
ExpenseList.jsx
ExpenseFilters.jsx
```

Supported expense categories:

``` text
food
transport
shopping
bills
entertainment
health
education
travel
other
```

Supported payment methods:

``` text
cash
upi
card
bank
```

Expense form fields:

``` text
title
amount
category
description
date
paymentMethod
```

The frontend should validate request shape before submitting while
treating backend validation as authoritative.

------------------------------------------------------------------------

## Income UI

### Page

``` text
Income.jsx
```

Income fields:

``` text
source
amount
date
description
```

Income source values:

``` text
salary
freelancing
business
investment
other
```

The income page should support:

-   Add income.
-   List income.
-   Search/filter income.
-   Edit income.
-   Delete income.
-   Display total income.

The backend represents income through the shared Expense model using:

``` text
type = "income"
```

The frontend should still use the dedicated `incomeService` and
`incomeStore` interface.

------------------------------------------------------------------------

## Budget UI

### Page

``` text
Budgets.jsx
```

### Components

``` text
BudgetCard.jsx
BudgetForm.jsx
BudgetProgress.jsx
```

Budget fields:

``` text
category
amount
month
year
```

The category list must match the shared backend enum:

``` text
food
transport
shopping
bills
entertainment
health
education
travel
other
```

The API returns:

``` json
{
  "category": "food",
  "amount": 8000,
  "month": "09",
  "year": 2026,
  "spent": 6500,
  "remaining": 1500,
  "percentage": 81.25,
  "isOverBudget": false
}
```

`BudgetCard.jsx` should:

-   Display budget amount.
-   Display actual spent amount.
-   Display remaining amount.
-   Display percentage.
-   Indicate over-budget status.
-   Clamp only the visual progress bar width; do not alter the actual
    percentage value.

------------------------------------------------------------------------

## Dashboard

`Dashboard.jsx` provides the main financial overview.

Expected API source:

``` text
GET /api/dashboard
```

Expected data:

``` text
totalIncome
totalExpense
balance
savingsRate
budgetUsed
categoryBreakdown
dailyExpense
monthlyTrend
recentExpenses
```

Dashboard cards:

``` text
Total Balance
Total Income
Total Expenses
Savings Rate
```

Charts:

``` text
IncomeExpenseChart
CategoryChart
ExpenseChart
```

Recent expenses should display the four most recent transactions
returned by the dashboard response.

The dashboard should not maintain hard-coded financial values once
backend integration begins.

------------------------------------------------------------------------

## Reports

`Reports.jsx` reuses the dashboard financial aggregation instead of
creating a separate reports endpoint.

Charts:

``` text
IncomeExpenseChart
CategoryChart
ExpenseChart
```

Reports should eventually request real backend data and display a wider
reporting range than the dashboard where appropriate.

------------------------------------------------------------------------

## Charts

### `IncomeExpenseChart`

Input:

``` json
[
  {
    "month": "2026-09",
    "income": 60000,
    "expense": 17500
  }
]
```

### `CategoryChart`

Input:

``` json
[
  {
    "name": "Bills",
    "value": 5500
  }
]
```

### `ExpenseChart`

Input:

``` json
[
  {
    "date": "2026-09-02",
    "amount": 450
  }
]
```

The backend returns ISO dates; the frontend formats them for display.

------------------------------------------------------------------------

## Profile

`Profile.jsx` handles user profile information.

Current profile scope:

``` text
name
email
```

Backend profile endpoints:

``` text
GET /api/users/me
PUT /api/users/me
PUT /api/users/change-password
```

The stored `currency` field is currently not exposed in the UI because
`formatCurrency.js` uses INR.

Profile updates should use `/api/users/*`, not `/api/auth/profile`.

------------------------------------------------------------------------

## Validation

`utils/validators.js` provides client-side validation for:

``` text
login
register
password
expense
budget
income
```

Client validation improves UX but does not replace backend validation.

Typical rules:

``` text
email → valid email format
password → minimum 8 characters
amount → greater than 0
required fields → non-empty
confirmPassword → matches password
```

------------------------------------------------------------------------

## Formatting utilities

### `formatCurrency.js`

The current UI uses INR:

``` text
₹65,000.00
```

### `formatDate.js`

Centralizes date presentation so pages and charts use consistent
formatting.

### `finance.js`

Contains shared financial display/calculation helpers where needed.
Backend aggregation should be verified against the same financial
definitions.

------------------------------------------------------------------------

## Responsive UI

The application should support:

``` text
mobile
tablet
desktop
```

The desktop shell uses:

``` text
Sidebar + Navbar + content
```

On smaller screens the sidebar should collapse into a mobile navigation
control.

Reusable components should avoid page-specific styling duplication.

------------------------------------------------------------------------

## Error and loading states

Every API-backed page must account for:

``` text
initial loading
empty state
API error
successful data
mutation loading
```

Examples:

``` text
No expenses found
No income found
No budgets yet
Unable to load dashboard
```

Buttons performing mutations should prevent duplicate submissions while
the request is in progress.

------------------------------------------------------------------------

## Backend integration checklist

  -----------------------------------------------------------------------
  Frontend area                       Required change
  ----------------------------------- -----------------------------------
  `authStore`                         Remove local authentication logic
                                      and connect to `authService`

  `ProtectedRoute`                    Wait for `checkAuth()` before
                                      redirecting

  `expenseStore`                      Replace local storage/mock data
                                      with `expenseService`

  `incomeStore`                       Add complete CRUD state/actions and
                                      connect to `incomeService`

  `budgetStore`                       Connect to `budgetService` and
                                      consume API `spent`

  `Dashboard`                         Replace mock data with
                                      `/api/dashboard`

  `Reports`                           Replace mock data with real API
                                      data

  `Profile`                           Connect to `/api/users/me`

  `api.js`                            Configure `VITE_API_URL` and
                                      credentialed requests

  `.env.example`                      Commit frontend API configuration
                                      template
  -----------------------------------------------------------------------

------------------------------------------------------------------------

## Environment

``` env
VITE_API_URL=http://localhost:5001/api
```

The frontend should read the backend URL through
`import.meta.env.VITE_API_URL`.

Never commit real secrets to the frontend `.env`.

A committed template should be:

``` env
VITE_API_URL=
```

------------------------------------------------------------------------

## Current implementation status

  Module                             Status
  ---------------------------------- ---------
  React + Vite setup                 Done
  Tailwind CSS                       Done
  Entry files                        Done
  Application layout                 Done
  Sidebar/Navbar                     Done
  Routing                            Done
  Public/Protected route structure   Done
  Authentication UI                  Done
  Expense UI                         Done
  Budget UI                          Done
  Income UI                          Done
  Dashboard UI                       Done
  Reports UI                         Done
  Profile UI                         Done
  Charts                             Done
  Reusable UI components             Done
  Zustand architecture               Done
  Service architecture               Done
  Validation utilities               Done
  404 page                           Done
  Real authentication                Pending
  Income store integration           Pending
  Real dashboard data                Pending
  Real reports data                  Pending
  End-to-end testing                 Pending
  Deployment                         Pending

------------------------------------------------------------------------

## Open decisions / integration notes

  -----------------------------------------------------------------------
  \#                      Issue                   Resolution
  ----------------------- ----------------------- -----------------------
  1                       Income has a dedicated  Keep `incomeService`
                          frontend service but    and `incomeStore`;
                          shares the backend      backend uses
                          Expense model           `type: "income"`

  2                       Profile service path    Use `/api/users/*` and
                          mismatch                update `authService.js`
                                                  accordingly

  3                       Category lists must     Use the shared
                          match backend           9-category list
                                                  everywhere

  4                       Budget month can arrive Form should normalize
                          as Number/string        values and display the
                                                  zero-padded API month

  5                       Dashboard/report data   Replace with
                          currently mocked        `GET /api/dashboard`
                                                  during integration

  6                       Auth loading on hard    Start `isLoading` as
                          refresh                 `true` and resolve it
                                                  through `checkAuth()`
  -----------------------------------------------------------------------

------------------------------------------------------------------------

## Development roadmap

``` text
Phase 1 — Project Setup              Done
Phase 2 — UI Components & Layout     Done
Phase 3 — Expense Module             Done
Phase 4 — Budget Module              Done
Phase 5 — Income Module              Done
Phase 6 — Dashboard & Reports        Done
Phase 7 — Authentication Integration Pending
Phase 8 — Backend API Integration    Pending
Phase 9 — Real Dashboard Data        Pending
Phase 10 — Testing                   Pending
Phase 11 — Deployment                Pending
```

## Deployment

Frontend deployment target:

``` text
Vercel
```

Production environment:

``` env
VITE_API_URL=https://<backend-domain>/api
```

Production authentication depends on the backend cookie configuration.
The frontend must use credentialed requests, and the backend must allow
the exact frontend origin.

Before deployment verify:

-   `VITE_API_URL` points to the production API.
-   Backend CORS allows the frontend origin.
-   Credentialed cookies work across the deployed frontend/backend.
-   No secrets are included in frontend environment variables.
-   All protected routes work after a hard refresh.
