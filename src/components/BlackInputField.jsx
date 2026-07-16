import React from "react";
import { Eye, EyeOff } from "lucide-react";

const BlackInputField = ({
  label,
  id,
  fieldName,
  type = "text",
  value,
  onChange,
  placeholder,
  showToggle,
  showPassword,
  onToggle,
  error,
  required = false,
  ...props
}) => {
  const handleInput = (e) => {
    if (id === "phone" || id === "contact_number") {
      const numericValue = e.target.value.replace(/\D/g, "").slice(0, 10);
      e.target.value = numericValue;
      onChange && onChange({ ...e, target: { ...e.target, value: numericValue } });
    }
  };

  return (
    <div className="mb-2 relative">
      <label htmlFor={id} className="block text-sm font-medium mb-1 text-dark">
        {label}
        {required && <span className="text-red-600 ml-1">*</span>}
      </label>

      <div className="relative">
        <input
          id={id}
          name={fieldName}
          type={type}
          value={value}
          onChange={onChange}
          onInput={handleInput}
          placeholder={placeholder}
          className={`w-full px-4 py-2 pr-10 border rounded-md bg-transparent text-[0.85rem] text-dark placeholder-black/50 outline-none focus:border-violet-500 ${
            error ? "border-error-hex" : "border-slate-300"
          }`}
          {...props}
        />

        {showToggle && (
          <button
            type="button"
            onClick={onToggle}
            className="absolute top-1/2 right-3 -translate-y-1/2 text-dark cursor-pointer"
          >
            {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
          </button>
        )}
      </div>

      {error && <p className="text-[0.7rem] text-error-hex mt-1">{error}</p>}
    </div>
  );
};

export default BlackInputField;
