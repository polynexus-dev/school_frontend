import React from "react";

const Button = ({
  type = "button",
  onClick,
  children,
  variant = "primary",
  size = "normal", // 'normal', 'compact', 'icon'
  disabled = false,
  loading = false,
  className = "",
  icon,
  ...props
}) => {
  const baseStyles =
    "font-sans font-semibold rounded-[10px] transition-all duration-150 inline-flex items-center justify-center gap-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 disabled:cursor-not-allowed";

  const variants = {
    primary: "bg-violet-700 text-white hover:bg-violet-800 active:bg-violet-900 disabled:bg-violet-100 disabled:text-violet-400 shadow-[0_6px_16px_rgba(109,40,217,.3)]",
    secondary: "bg-cn-surface text-violet-700 border border-cn-border-strong hover:bg-violet-50 hover:border-violet-500 disabled:bg-cn-surface disabled:text-violet-300 disabled:border-violet-100",
    outline: "bg-cn-surface text-violet-700 border border-cn-border hover:bg-violet-50 hover:border-violet-500 disabled:bg-cn-surface disabled:text-violet-300",
    ghost: "bg-transparent text-violet-700 hover:bg-violet-50 disabled:text-violet-300",
    destructive: "bg-cn-surface text-error-hex border border-red-200 hover:bg-red-50 hover:border-error-hex disabled:text-red-300 disabled:border-red-100",
    success: "bg-success-hex text-white hover:brightness-95 disabled:opacity-50",
  };

  const sizes = {
    normal: "h-[38px] px-[18px] text-[13.5px]",
    compact: "h-[32px] px-[13px] text-[12.5px] rounded-[8px]",
    icon: "w-[34px] h-[34px] p-0 rounded-[8px]",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${
        disabled || loading ? "opacity-60 cursor-not-allowed" : ""
      } ${className}`}
      {...props}
    >
      {loading && (
        <span className="w-[13px] h-[13px] border-2 border-current/30 border-t-current rounded-full animate-[cn-spin_0.7s_linear_infinite] inline-block"></span>
      )}
      {!loading && icon && <span className="inline-flex">{icon}</span>}
      {children}
    </button>
  );
};

export default Button;
