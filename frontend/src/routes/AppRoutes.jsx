// src/routes/AppRoutes.jsx

import {
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import AuthLayout from "../components/layout/AuthLayout";
import DashboardLayout from "../components/layout/DashboardLayout";

import ProtectedRoute from "./ProtectedRoute";
import PublicRoute from "./PublicRoute";

// Auth
import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";
import ForgotPassword from "../pages/auth/ForgotPassword";
import ResetPassword from "../pages/auth/ResetPassword";

// App
import Dashboard from "../pages/dashboard/Dashboard";
import Expenses from "../pages/expenses/Expenses";
import AddExpense from "../pages/expenses/AddExpense";
import EditExpense from "../pages/expenses/EditExpense";
import Budgets from "../pages/budgets/Budgets";
import Income from "../pages/income/Income";
import Reports from "../pages/reports/Reports";
import Profile from "../pages/profile/Profile";

import NotFound from "../pages/NotFound";

const AppRoutes = () => {
  return (
    <Routes>

      {/* =========================
          PUBLIC ROUTES
      ========================= */}

      <Route element={<PublicRoute />}>
        <Route element={<AuthLayout />}>

          <Route
            path="/login"
            element={<Login />}
          />

          <Route
            path="/register"
            element={<Register />}
          />

          <Route
            path="/forgot-password"
            element={<ForgotPassword />}
          />

          <Route
            path="/reset-password/:token"
            element={<ResetPassword />}
          />

        </Route>
      </Route>


      {/* =========================
          PROTECTED ROUTES
      ========================= */}

      <Route element={<ProtectedRoute />}>

        <Route
          path="/app"
          element={<DashboardLayout />}
        >

          <Route
            index
            element={
              <Navigate
                to="/app/dashboard"
                replace
              />
            }
          />

          <Route
            path="dashboard"
            element={<Dashboard />}
          />

          <Route
            path="expenses"
            element={<Expenses />}
          />

          <Route
            path="expenses/add"
            element={<AddExpense />}
          />

          <Route
            path="expenses/:id/edit"
            element={<EditExpense />}
          />

          <Route
            path="income"
            element={<Income />}
          />

          <Route
            path="budgets"
            element={<Budgets />}
          />

          <Route
            path="reports"
            element={<Reports />}
          />

          <Route
            path="profile"
            element={<Profile />}
          />

        </Route>

      </Route>


      {/* =========================
          ROOT
      ========================= */}

      <Route
        path="/"
        element={
          <Navigate
            to="/app/dashboard"
            replace
          />
        }
      />


      {/* =========================
          404
      ========================= */}

      <Route
        path="*"
        element={<NotFound />}
      />

    </Routes>
  );
};

export default AppRoutes;