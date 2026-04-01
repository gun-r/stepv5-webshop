"use client";

import { signOut, useSession } from "next-auth/react";
import { LogOut, User } from "lucide-react";

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  const { data: session } = useSession();

  return (
    <header className="bg-white px-6 py-3 flex items-center justify-between" style={{ borderBottom: "1px solid #edebe9" }}>
      <div>
        <h1 className="text-base font-semibold" style={{ color: "#323130" }}>{title}</h1>
        {subtitle && <p className="text-xs mt-0.5" style={{ color: "#605e5c" }}>{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-sm" style={{ color: "#323130" }}>
          <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ backgroundColor: "#deecf9" }}>
            <User className="w-3.5 h-3.5" style={{ color: "#0078d4" }} />
          </div>
          <span className="text-sm font-medium">{session?.user?.name || "Admin"}</span>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-1.5 text-sm px-3 py-1.5 transition-colors"
          style={{ color: "#605e5c" }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.color = "#a4262c";
            (e.currentTarget as HTMLElement).style.backgroundColor = "#fde7e9";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.color = "#605e5c";
            (e.currentTarget as HTMLElement).style.backgroundColor = "";
          }}
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign out
        </button>
      </div>
    </header>
  );
}
