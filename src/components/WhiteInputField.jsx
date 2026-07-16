import React from "react";
import { Eye, EyeOff } from "lucide-react";

const WhiteInputField = ({
  label,
  id,
  type = "text",
  value,
  onChange,
  placeholder,
  showToggle,
  showPassword,
  onToggle,
  error,
}) => {
  return (
    <div className="mb-5 relative">
      <label htmlFor={id} className="block text-sm font-medium mb-1 text-white">
        {label}
      </label>

      <div className="relative">
        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`w-full px-4 py-2 pr-10 border rounded-md bg-transparent text-[0.85rem] text-white placeholder-white/50 ${
            error ? "border-error-hex" : "border-white"
          }`}
        />

        {showToggle && (
          <button
            type="button"
            onClick={onToggle}
            className="absolute top-1/2 right-3 -translate-y-1/2 text-white cursor-pointer"
          >
            {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
          </button>
        )}
      </div>

      {error && <p className="text-xs text-error-hex mt-1">{error}</p>}
    </div>
  );
};

export default WhiteInputField;
