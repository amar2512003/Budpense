import { Outlet } from "react-router-dom";

const AuthLayout = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
            Budpense
          </h1>

          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Manage your money. Track your future.
          </p>
        </div>

        <Outlet />
      </div>
    </div>
  );
};

export default AuthLayout;