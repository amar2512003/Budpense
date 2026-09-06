# Budpense

A modern **MERN-based budgeting and expense tracking application** that helps users manage expenses, income, budgets, and financial reports with secure authentication.

The repository is a monorepo: `frontend/` holds the React application, `backend/` the Express API.

## 🚀 Features

* 🔐 User authentication

  * Login
  * Registration
  * Forgot password
  * Reset password
* 📊 Financial dashboard

  * Total balance
  * Income
  * Expenses
  * Savings rate
* 💸 Expense management
* 💰 Income tracking
* 🎯 Budget management
* 📈 Financial reports and charts
* 👤 User profile
* 🛡️ Protected and public routes
* 📱 Responsive UI
* 🔄 Centralized state management with Zustand
* 🌐 API integration using Axios
* ✅ Form validation
* ❌ 404 error page

## 🛠️ Tech Stack

| Technology   | Purpose              |
| ------------ | -------------------- |
| React        | UI development       |
| Vite         | Frontend build tool  |
| React Router | Routing              |
| Tailwind CSS | Styling              |
| Zustand      | State management     |
| Axios        | API communication    |
| Recharts     | Data visualization   |
| JavaScript   | Programming language |

## 📁 Project Structure

```text
frontend/
│
├── public/
│
├── src/
│   ├── assets/
│   │
│   ├── components/
│   │   ├── ui/
│   │   ├── layout/
│   │   ├── expense/
│   │   ├── budget/
│   │   └── charts/
│   │
│   ├── pages/
│   │   ├── auth/
│   │   ├── dashboard/
│   │   ├── expenses/
│   │   ├── budgets/
│   │   ├── income/
│   │   ├── reports/
│   │   ├── profile/
│   │   └── NotFound.jsx
│   │
│   ├── store/
│   │   ├── authStore.js
│   │   ├── expenseStore.js
│   │   ├── budgetStore.js
│   │   └── uiStore.js
│   │
│   ├── services/
│   │   ├── api.js
│   │   ├── authService.js
│   │   ├── expenseService.js
│   │   ├── budgetService.js
│   │   └── incomeService.js
│   │
│   ├── hooks/
│   │   ├── useAuth.js
│   │   └── useDebounce.js
│   │
│   ├── routes/
│   │   ├── AppRoutes.jsx
│   │   ├── ProtectedRoute.jsx
│   │   └── PublicRoute.jsx
│   │
│   ├── utils/
│   │   ├── validators.js
│   │   ├── formatCurrency.js
│   │   └── formatDate.js
│   │
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
│
├── index.html
├── package.json
├── vite.config.js
└── .env
```

## 🏗️ Architecture

```text
React UI
   │
   ├── Pages
   │
   ├── Components
   │
   ├── Hooks
   │
   └── Routes
        │
        ▼
     Zustand
      Stores
        │
        ▼
    Service Layer
        │
        ▼
      Axios
        │
        ▼
   Express Backend
        │
        ▼
      MongoDB
```

## 📌 Routes

### Public

```text
/login
/register
/forgot-password
/reset-password/:token
```

### Protected

```text
/app/dashboard
/app/expenses
/app/expenses/add
/app/expenses/:id/edit
/app/income
/app/budgets
/app/reports
/app/profile
```

## ⚙️ Installation

Clone the repository and enter the frontend directory:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

The application will be available at the Vite URL, typically:

```text
http://localhost:5173
```

## 🔑 Environment Variables

Create a `.env` file inside `frontend/`:

```env
VITE_API_URL=http://localhost:5000/api
```

Adjust the API URL according to your backend configuration.

## 🖥️ Backend

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

`.env`:

```env
PORT=5000
NODE_ENV=development
MONGO_URI=your_mongodb_connection
JWT_SECRET=your_secret
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
```

The server refuses to start without `MONGO_URI` or `JWT_SECRET`. Check it is up:

```bash
curl http://localhost:5000/api/health
```

### Structure

```text
backend/src/
├── config/       env.js · db.js
├── controllers/
├── models/
├── routes/
├── middleware/
├── services/
├── utils/
├── validators/
├── app.js        builds and exports the Express app
└── server.js     connects to Mongo, then listens
```

Request path: `routes → controller → service → model → MongoDB`.

### Response shape

```json
{ "success": true, "data": {} }
{ "success": false, "message": "Route not found" }
```

Throw `ApiError(status, message)` for anything the client should see; anything else becomes a generic 500. Mongoose validation, cast and duplicate-key errors are converted centrally, so controllers need no try/catch.

Implementation plan: [`docs/backend-plan.md`](docs/backend-plan.md)

## 📊 Current Development Status

### Completed

* [x] React + Vite setup
* [x] Tailwind CSS
* [x] Application layout
* [x] Sidebar & Navbar
* [x] Routing
* [x] Protected/Public route structure
* [x] Authentication UI
* [x] Dashboard UI
* [x] Expense UI
* [x] Budget UI
* [x] Income UI
* [x] Reports UI
* [x] Profile UI
* [x] Charts
* [x] Reusable UI components
* [x] Zustand stores
* [x] API service layer
* [x] Validation utilities
* [x] 404 page

### In Progress

* [ ] Complete backend authentication integration
* [ ] Connect Income store to backend
* [ ] Replace dashboard mock data with real API data
* [ ] Replace report mock data with real API data
* [ ] End-to-end testing
* [ ] Production deployment

## 🗺️ Roadmap

```text
Phase 1 — Project Setup          ✅
Phase 2 — UI & Layout            ✅
Phase 3 — Expense Module         ✅
Phase 4 — Budget Module          ✅
Phase 5 — Dashboard & Reports    ✅
Phase 6 — Authentication         🟡
Phase 7 — Backend Integration    🟡
Phase 8 — Real Financial Data    ⚪
Phase 9 — Testing                ⚪
Phase 10 — Deployment            ⚪
```

## 👨‍💻 Development

Budpense follows a modular architecture where:

* **Components** handle reusable UI.
* **Pages** represent application screens.
* **Stores** manage client-side state.
* **Services** handle API communication.
* **Hooks** contain reusable React logic.
* **Routes** control application navigation.
* **Utils** contain shared helper functions.

## 📄 License

This project is currently developed as an academic/project application.
