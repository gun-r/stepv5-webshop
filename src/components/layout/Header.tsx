"use client";

import { signOut, useSession } from "next-auth/react";
import { LogOut, User, Menu } from "lucide-react";
import { useMobileSidebar } from "./MobileSidebarContext";

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  const { data: session } = useSession();
  const { toggle } = useMobileSidebar();

  return (
    <header className="bg-white px-3 py-2 flex items-center justify-between shrink-0" style={{ borderBottom: "1px solid #edebe9" }}>
      <div className="flex items-center gap-2 min-w-0">
        <button
          onClick={toggle}
          className="md:hidden p-1.5 rounded transition-colors shrink-0"
          style={{ color: "#605e5c" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "#f3f2f1"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = ""; }}
          aria-label="Toggle menu"
        >
          <Menu className="w-4 h-4" />
        </button>
        <div className="min-w-0">
          <h1 className="text-sm font-semibold truncate" style={{ color: "#323130" }}>{title}</h1>
          {subtitle && <p className="text-xs truncate" style={{ color: "#605e5c" }}>{subtitle}</p>}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <div className="hidden sm:flex items-center gap-1.5 text-sm" style={{ color: "#323130" }}>
          <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: "#deecf9" }}>
            <User className="w-3 h-3" style={{ color: "#0078d4" }} />
          </div>
          <span className="text-xs font-medium">{session?.user?.name || "Admin"}</span>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-1 text-xs px-2 py-1 transition-colors rounded"
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
          <span className="hidden sm:inline">Sign out</span>
        </button>
      </div>
    </header>
  );
}
