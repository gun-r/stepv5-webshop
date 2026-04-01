"use client";

import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  className = "",
  children,
  disabled,
  style,
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed";

  const variants: Record<string, React.CSSProperties> = {
    primary: { backgroundColor: "#0078d4", color: "#ffffff" },
    secondary: { backgroundColor: "#f3f2f1", color: "#323130", border: "1px solid #edebe9" },
    danger: { backgroundColor: "#a4262c", color: "#ffffff" },
    ghost: { backgroundColor: "transparent", color: "#605e5c" },
    outline: { backgroundColor: "transparent", color: "#323130", border: "1px solid #8a8886" },
  };

  const hoverMap: Record<string, React.CSSProperties> = {
    primary: { backgroundColor: "#106ebe" },
    secondary: { backgroundColor: "#edebe9" },
    danger: { backgroundColor: "#8e1b1f" },
    ghost: { backgroundColor: "#f3f2f1" },
    outline: { backgroundColor: "#f3f2f1" },
  };

  const focusMap: Record<string, string> = {
    primary: "focus:ring-[#0078d4]",
    secondary: "focus:ring-[#8a8886]",
    danger: "focus:ring-[#a4262c]",
    ghost: "focus:ring-[#8a8886]",
    outline: "focus:ring-[#0078d4]",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs gap-1.5",
    md: "px-4 py-2 text-sm gap-2",
    lg: "px-5 py-2.5 text-sm gap-2",
  };

  const [hovered, setHovered] = React.useState(false);

  return (
    <button
      className={`${base} ${focusMap[variant]} ${sizes[size]} ${className}`}
      style={{ ...variants[variant], ...(hovered && !disabled && !loading ? hoverMap[variant] : {}), ...style }}
      disabled={disabled || loading}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  );
}
