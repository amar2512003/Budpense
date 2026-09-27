// src/pages/auth/VerifyOtp.jsx

import { useState } from "react";
import {
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";

import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";

import {
  forgotPassword,
  verifyResetOtp,
} from "../../services/authService";

const VerifyOtp = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;

  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [resent, setResent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  // This page only makes sense right after ForgotPassword hands it an
  // email; landing here any other way (a refresh, a bookmarked link) has
  // nothing to verify.
  if (!email) {
    return (
      <Card className="p-6 sm:p-8">
        <p className="text-sm text-gray-600">
          Start by entering the email address on your account.
        </p>

        <Link
          to="/forgot-password"
          className="mt-4 inline-block text-sm font-medium text-indigo-600 hover:text-indigo-700"
        >
          ← Back to Forgot password
        </Link>
      </Card>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    if (!/^\d{6}$/.test(otp)) {
      setError("Enter the 6-digit code from your email.");
      return;
    }

    setLoading(true);

    try {
      const { data } = await verifyResetOtp(email, otp);

      navigate("/reset-password", {
        state: { email, resetToken: data.resetToken },
      });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to verify that code."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    setResent(false);
    setResending(true);

    try {
      await forgotPassword(email);
      setResent(true);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to resend the code."
      );
    } finally {
      setResending(false);
    }
  };

  return (
    <Card className="p-6 sm:p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          Enter the code
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          We sent a 6-digit code to {email}. It expires in 10 minutes.
        </p>
      </div>

      {error && (
        <div className="mb-5 rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {resent && (
        <div className="mb-5 rounded-lg bg-green-50 p-3 text-sm text-green-600">
          A new code has been sent.
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-5"
      >
        <Input
          label="6-digit code"
          name="otp"
          type="text"
          inputMode="numeric"
          maxLength={6}
          placeholder="123456"
          value={otp}
          onChange={(e) =>
            setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
          }
          required
        />

        <Button
          type="submit"
          className="w-full"
          loading={loading}
        >
          Verify Code
        </Button>
      </form>

      <div className="mt-6 flex items-center justify-between text-sm">
        <Link
          to="/login"
          className="font-medium text-indigo-600 hover:text-indigo-700"
        >
          ← Back to Login
        </Link>

        <button
          type="button"
          onClick={handleResend}
          disabled={resending}
          className="font-medium text-indigo-600 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {resending ? "Resending…" : "Resend code"}
        </button>
      </div>
    </Card>
  );
};

export default VerifyOtp;
