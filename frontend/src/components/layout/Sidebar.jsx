import { NavLink } from "react-router-dom";

const Sidebar = ({ isOpen, onClose }) => {
  const links = [
    { name: "Dashboard", path: "/app/dashboard", icon: "▦" },
    { name: "Expenses", path: "/app/expenses", icon: "↘" },
    { name: "Income", path: "/app/income", icon: "↗" },
    { name: "Budgets", path: "/app/budgets", icon: "◫" },
    { name: "Reports", path: "/app/reports", icon: "▥" },
    { name: "Profile", path: "/app/profile", icon: "◯" },
  ];

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 transform border-r border-gray-200 bg-white transition-transform duration-200 lg:static lg:translate-x-0
          ${isOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex h-16 items-center border-b px-6">
          <span className="text-xl font-bold text-indigo-600">
            Budpense
          </span>
        </div>

        <nav className="space-y-1 p-4">
          {links.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition
                ${
                  isActive
                    ? "bg-indigo-50 text-indigo-600"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`
              }
            >
              <span className="w-5 text-center">{link.icon}</span>
              {link.name}
            </NavLink>
          ))}
        </nav>

        <div className="absolute bottom-0 w-full border-t p-4">
          <button className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50">
            <span>↪</span>
            Logout
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;