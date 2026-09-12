import { useNavigate } from "react-router-dom";

import useAuthStore from "../../store/authStore";

const Navbar = ({ onMenuClick, user }) => {
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);

  const handleLogout = async () => {
    // logout never rejects: it clears the session locally whatever the API
    // says, so this navigation always happens.
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <header className="sticky top-0 z-30 border-b border-gray-200 bg-white">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onMenuClick}
            aria-label="Open navigation menu"
            className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 lg:hidden"
          >
            ☰
          </button>

          <h1 className="text-lg font-bold text-gray-900">
            Budpense
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-medium text-gray-900">
              {user?.name || "User"}
            </p>
            <p className="text-xs text-gray-500">
              {user?.email || ""}
            </p>
          </div>

          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 font-semibold text-indigo-600">
            {user?.name?.charAt(0)?.toUpperCase() || "U"}
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            Log out
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
