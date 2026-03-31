import React from "react";

interface BadgeProps {
  variant?: "success" | "warning" | "danger" | "info" | "default";
  children: React.ReactNode;
  className?: string;
}

export function Badge({ variant = "default", children, className = "" }: BadgeProps) {
  const variants = {
    success: "bg-green-100 text-green-800",
    warning: "bg-yellow-100 text-yellow-800",
    danger: "bg-red-100 text-red-800",
    info: "bg-blue-100 text-blue-800",
    default: "bg-gray-100 text-gray-800",
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${className}`}
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
