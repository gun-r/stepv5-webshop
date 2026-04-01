import React from "react";

interface BadgeProps {
  variant?: "success" | "warning" | "danger" | "info" | "default";
  children: React.ReactNode;
  className?: string;
}

const variantStyles: Record<string, React.CSSProperties> = {
  success: { backgroundColor: "#dff6dd", color: "#107c10" },
  warning: { backgroundColor: "#fff4ce", color: "#8a6914" },
  danger: { backgroundColor: "#fde7e9", color: "#a4262c" },
  info: { backgroundColor: "#deecf9", color: "#0078d4" },
  default: { backgroundColor: "#f3f2f1", color: "#605e5c" },
};

export function Badge({ variant = "default", children, className = "" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-xs font-medium ${className}`}
      style={variantStyles[variant]}
    >
      {children}
    </span>
  );
}

export function SyncStatusBadge({ status }: { status: string }) {
  const map: Record<string, { variant: BadgeProps["variant"]; label: string }> = {
    synced: { variant: "success", label: "Synced" },
    pending: { variant: "warning", label: "Pending" },
    failed: { variant: "danger", label: "Failed" },
  };

  const config = map[status] || { variant: "default", label: status };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
