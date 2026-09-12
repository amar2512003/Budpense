import { useState } from "react";

const Input = ({
  label,
  name,
  type = "text",
  placeholder = "",
  value,
  onChange,
  error,
  required = false,
  disabled = false,
  className = "",
  ...props
}) => {
  const [revealed, setRevealed] = useState(false);

  // Password fields get a reveal toggle: a masked field gives the user no way
  // to see a stray space or a mistyped character, which is exactly what they
  // need when a form tells them two passwords do not match.
  const isPassword = type === "password";
  const inputType = isPassword && revealed ? "text" : type;

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={name}
          className="mb-1.5 block text-sm font-medium text-gray-700"
        >
          {label}
          {required && <span className="ml-1 text-red-500">*</span>}
        </label>
      )}

      <div className="relative">
        <input
          id={name}
          name={name}
          type={inputType}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className={`w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition
            ${isPassword ? "pr-16" : ""}
            ${
              error
                ? "border-red-500 focus:ring-2 focus:ring-red-200"
                : "border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            }
            disabled:bg-gray-100 disabled:cursor-not-allowed
            ${className}`}
          {...props}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setRevealed((current) => !current)}
            disabled={disabled}
            aria-label={revealed ? "Hide password" : "Show password"}
            aria-pressed={revealed}
            className="absolute inset-y-0 right-0 px-3 text-xs font-medium text-gray-500 transition hover:text-gray-700 disabled:cursor-not-allowed"
          >
            {revealed ? "Hide" : "Show"}
          </button>
        )}
      </div>

      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
};

export default Input;
