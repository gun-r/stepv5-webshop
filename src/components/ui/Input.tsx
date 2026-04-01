import React from "react";

const inputBase =
  "w-full px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-1 bg-white";
const inputNormal = "border-[#8a8886] hover:border-[#323130] focus:border-[#0078d4] focus:ring-[#0078d4]";
const inputError = "border-[#a4262c] bg-[#fde7e9] focus:ring-[#a4262c]";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export function Input({ label, error, hint, className = "", id, ...props }: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-semibold" style={{ color: "#323130" }}>
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`${inputBase} border ${error ? inputError : inputNormal} ${className}`}
        style={{ color: "#323130" }}
        {...props}
      />
      {hint && !error && <p className="text-xs" style={{ color: "#605e5c" }}>{hint}</p>}
      {error && <p className="text-xs" style={{ color: "#a4262c" }}>{error}</p>}
    </div>
  );
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export function Textarea({ label, error, hint, className = "", id, ...props }: TextareaProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-semibold" style={{ color: "#323130" }}>
          {label}
        </label>
      )}
      <textarea
        id={inputId}
        className={`${inputBase} border resize-y ${error ? inputError : inputNormal} ${className}`}
        style={{ color: "#323130" }}
        {...props}
      />
      {hint && !error && <p className="text-xs" style={{ color: "#605e5c" }}>{hint}</p>}
      {error && <p className="text-xs" style={{ color: "#a4262c" }}>{error}</p>}
    </div>
  );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export function Select({ label, error, hint, className = "", id, children, ...props }: SelectProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-semibold" style={{ color: "#323130" }}>
          {label}
        </label>
      )}
      <select
        id={inputId}
        className={`${inputBase} border ${error ? inputError : inputNormal} ${className}`}
        style={{ color: "#323130" }}
        {...props}
      >
        {children}
      </select>
      {hint && !error && <p className="text-xs" style={{ color: "#605e5c" }}>{hint}</p>}
      {error && <p className="text-xs" style={{ color: "#a4262c" }}>{error}</p>}
    </div>
  );
}
