// src/pages/NotFound.jsx

import { useNavigate } from "react-router-dom";

import Button from "../components/ui/Button";

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="text-center">

        <p className="text-7xl font-bold text-indigo-600">
          404
        </p>

        <h1 className="mt-4 text-2xl font-bold text-gray-900">
          Page not found
        </h1>

        <p className="mt-2 text-sm text-gray-500">
          The page you're looking for doesn't
          exist or may have been moved.
        </p>

        <div className="mt-6 flex justify-center gap-3">
          <Button
            onClick={() =>
              navigate("/app/dashboard")
            }
          >
            Go to Dashboard
          </Button>

          <Button
            variant="outline"
            onClick={() => navigate(-1)}
          >
            Go Back
          </Button>
        </div>

      </div>
    </div>
  );
};

export default NotFound;