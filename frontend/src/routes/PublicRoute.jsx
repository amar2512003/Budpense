// src/routes/PublicRoute.jsx

import { Navigate, Outlet } from "react-router-dom";
import Loader from "../components/ui/Loader";
import useAuthStore from "../store/authStore";

const PublicRoute = () => {
  const user = useAuthStore((state) => state.user);

  const isAuthenticated = useAuthStore(
    (state) => state.isAuthenticated
  );

  const isLoading = useAuthStore(
    (state) => state.isLoading
  );

  // Wait until authentication status is determined
  if (isLoading) {
    return <Loader fullScreen />;
  }

  // Already logged in
  if (isAuthenticated && user) {
    return (
      <Navigate
        to="/app/dashboard"
        replace
      />
    );
  }

  // Not logged in
  return <Outlet />;
};

export default PublicRoute;