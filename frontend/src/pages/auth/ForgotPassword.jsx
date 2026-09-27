// src/pages/auth/ForgotPassword.jsx

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";

import { isValidEmail } from "../../utils/validators";

import { forgotPassword } from "../../services/authService";

const ForgotPassword = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    if (!isValidEmail(email)) {
      setError(
        "Please enter a valid email address."
      );
      return;
    }

    setLoading(true);

    try {
      await forgotPassword(email);

      // The API answers the same way whether or not the address is
      // registered, so we move on to the OTP step regardless — there is
      // nothing more specific to tell the user here.
      navigate("/verify-otp", { state: { email } });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to process your request."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6 sm:p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          Forgot password?
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          Enter your email and we'll send you a
          6-digit code to reset your password.
        </p>
      </div>

      {error && (
        <div className="mb-5 rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-5"
      >
        <Input
          label="Email"
          name="email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) =>
            setEmail(e.target.value)
          }
          required
        />

        <Button
          type="submit"
          className="w-full"
          loading={loading}
        >
          Send Reset Code
        </Button>
      </form>

      <div className="mt-6 text-center">
        <Link
          to="/login"
          className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
        >
          ← Back to Login
        </Link>
      </div>
    </Card>
  );
};

export default ForgotPassword;
