// src/components/layout/Sidebar.jsx

import { NavLink } from "react-router-dom";

const Sidebar = ({
  isOpen = false,
  onClose,
}) => {
  const navItems = [
    {
      name: "Dashboard",
      path: "/app/dashboard",
      icon: "▣",
    },
    {
      name: "Expenses",
      path: "/app/expenses",
      icon: "↘",
    },
    {
      name: "Income",
      path: "/app/income",
      icon: "↗",
    },
    {
      name: "Budgets",
      path: "/app/budgets",
      icon: "▣",
    },
    {
      name: "Reports",
      path: "/app/reports",
      icon: "▤",
    },
    {
      name: "Profile",
      path: "/app/profile",
      icon: "○",
    },
  ];

  return (
    <aside
      className={`
        fixed left-0 top-0 z-40
        flex h-screen w-64 flex-col
        border-r border-gray-200
        bg-white
        transition-transform
        duration-300
        lg:translate-x-0
        ${
          isOpen
            ? "translate-x-0"
            : "-translate-x-full"
        }
      `}
    >
      {/* Logo */}
      <div className="flex h-20 items-center border-b border-gray-200 px-6">
        <NavLink
          to="/app/dashboard"
          className="text-2xl font-bold text-indigo-600"
          onClick={onClose}
        >
          Budpense
        </NavLink>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-2 px-4 py-5">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={onClose}
            className={({ isActive }) =>
              `
              flex items-center gap-3
              rounded-lg px-4 py-3
              text-sm font-medium
              transition
              ${
                isActive
                  ? "bg-indigo-50 text-indigo-600"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }
              `
            }
          >
            <span className="w-5 text-center">
              {item.icon}
            </span>

            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
