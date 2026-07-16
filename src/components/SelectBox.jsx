import React from "react";

const SelectBox = ({
  id,
  label,
  fieldName,
  value,
  onChange,
  options = [],
  error,
  labelColor = "text-dark",
  borderColor = "border-slate-300",
  required = false,
  labelClassName = "",
  className = "",
}) => {
  const baseClasses = `w-full px-4 py-2 pr-10 rounded-md bg-white text-base border ${borderColor} focus:outline-none focus:border-violet-500 cursor-pointer`;

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && (
        <label htmlFor={id} className={`text-sm ${labelColor} ${labelClassName}`}>
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <select id={id} name={fieldName} value={value} onChange={onChange} className={baseClasses}>
        {!value && (
          <option value="" disabled hidden>
            Select
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
};

export default SelectBox;
