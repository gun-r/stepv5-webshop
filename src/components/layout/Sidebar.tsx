"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Globe,
  Package,
  Settings,
  ShoppingCart,
  BookOpen,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/sites", label: "Sites", icon: Globe },
  { href: "/products", label: "Products", icon: Package },
  { href: "/setup", label: "Setup", icon: Settings },
  { href: "/docs", label: "Documentation", icon: BookOpen },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 min-h-screen flex flex-col shrink-0" style={{ backgroundColor: "#1b1b1b" }}>
      {/* Logo */}
      <div className="px-4 py-4 border-b" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 flex items-center justify-center" style={{ backgroundColor: "#0078d4" }}>
            <ShoppingCart className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-white font-semibold text-sm leading-tight">WebShop</h1>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>WooCommerce Manager</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors"
              style={
                isActive
                  ? {
                      color: "#ffffff",
                      backgroundColor: "rgba(0,120,212,0.2)",
                      borderLeft: "3px solid #0078d4",
                      paddingLeft: "13px",
                    }
                  : {
                      color: "rgba(255,255,255,0.55)",
                      borderLeft: "3px solid transparent",
                      paddingLeft: "13px",
                    }
              }
              onMouseEnter={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(255,255,255,0.06)";
                  (e.currentTarget as HTMLElement).style.color = "#ffffff";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLElement).style.backgroundColor = "";
                  (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.55)";
                }
              }}
            >
              <Icon size={16} className="shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
        <p className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>v1.0.0</p>
      </div>
    </aside>
  );
}
