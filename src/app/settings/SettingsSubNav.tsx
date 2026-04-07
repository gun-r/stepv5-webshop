"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Languages, Database, RefreshCw } from "lucide-react";

const items = [
  { href: "/settings/translation", label: "Translation", icon: Languages },
  { href: "/settings/database", label: "Database Connection", icon: Database },
  { href: "/settings/currency", label: "Currency Rates", icon: RefreshCw },
];

export function SettingsSubNav() {
  const pathname = usePathname();

  return (
    <nav
      className="w-44 shrink-0 border-r py-2"
      style={{ borderColor: "rgba(0,0,0,0.07)", backgroundColor: "#faf9f8" }}
    >
      {items.map((item) => {
        const Icon = item.icon;
        const isActive =
          pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-2 px-3 py-1.5 text-xs transition-colors"
            style={
              isActive
                ? {
                    color: "#0078d4",
                    backgroundColor: "#e5f0fb",
                    fontWeight: 600,
                    borderLeft: "3px solid #0078d4",
                    paddingLeft: "9px",
                  }
                : {
                    color: "#605e5c",
                    borderLeft: "3px solid transparent",
                    paddingLeft: "9px",
                  }
            }
            onMouseEnter={(e) => {
              if (!isActive) {
                (e.currentTarget as HTMLElement).style.backgroundColor = "#edebe9";
                (e.currentTarget as HTMLElement).style.color = "#323130";
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                (e.currentTarget as HTMLElement).style.backgroundColor = "";
                (e.currentTarget as HTMLElement).style.color = "#605e5c";
              }
            }}
          >
            <Icon size={13} className="shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
