import React from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className = "" }: CardProps) {
  return (
    <div className={`bg-white ${className}`} style={{ border: "1px solid #edebe9" }}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className = "" }: CardProps) {
  return (
    <div className={`px-5 py-3 ${className}`} style={{ borderBottom: "1px solid #edebe9", backgroundColor: "#faf9f8" }}>
      {children}
    </div>
  );
}

export function CardContent({ children, className = "" }: CardProps) {
  return <div className={`px-5 py-4 ${className}`}>{children}</div>;
}

export function CardTitle({ children, className = "" }: CardProps) {
  return (
    <h3 className={`text-sm font-semibold ${className}`} style={{ color: "#323130" }}>
      {children}
    </h3>
  );
}
