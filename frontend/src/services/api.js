import axios from "axios";

const api = axios.create({
  // The API listens on 5001. :5173 and :5001 are same-site, so the session
  // cookie travels over plain HTTP in development.
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5001/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Paths where a 401 means "those credentials are wrong", not "your session has
// expired". Redirecting on these would bounce the user off the very form that
// is telling them what went wrong — and on change-password it would log out
// someone who simply mistyped their current password.
const CREDENTIAL_PATHS = ["/auth/login", "/auth/register", "/auth/me", "/users/change-password"];

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const path = error.config?.url ?? "";
    const isCredentialCall = CREDENTIAL_PATHS.some((credential) => path.startsWith(credential));

    if (error.response?.status === 401 && !isCredentialCall) {
      // The cookie has expired or been cleared elsewhere. Send the user to the
      // login form once, rather than leaving every page showing an error.
      if (window.location.pathname !== "/login") {
        window.location.assign("/login");
      }
    }

    return Promise.reject(error);
  },
);

export default api;
