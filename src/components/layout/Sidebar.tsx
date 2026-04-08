"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Globe,
  Package,
  Settings,
  BookOpen,
  Users,
  Activity,
  Images,
  BarChart2,
} from "lucide-react";
import { useMobileSidebar } from "./MobileSidebarContext";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/sites", label: "Sites", icon: Globe },
  { href: "/products", label: "Products", icon: Package },
  { href: "/images", label: "Images", icon: Images },
  { href: "/analytics", label: "Analytics", icon: BarChart2 },
  { href: "/users", label: "Users", icon: Users },
  { href: "/activity", label: "Activity", icon: Activity },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/docs", label: "Documentation", icon: BookOpen },
];

export function Sidebar() {
  const pathname = usePathname();
  const { isOpen, close } = useMobileSidebar();

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={close}
        />
      )}

      <aside
        className={[
          "fixed md:sticky md:top-0 left-0 z-50 md:z-auto",
          "h-screen w-48 flex flex-col shrink-0 self-start",
          "transition-transform duration-200 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        ].join(" ")}
        style={{ backgroundColor: "#1b1b1b" }}
      >
        {/* Logo */}
        <div className="px-3 py-3 border-b" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 flex items-center justify-center shrink-0">
              <img src="/logo.png" alt="STEPv5 WC Logo" width={28} height={28} className="object-contain" />
            </div>
            <div>
              <h1 className="text-white font-semibold text-xs leading-tight">STEPv5 WC</h1>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)", fontSize: "10px" }}>WooCommerce Manager</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={close}
                className="flex items-center gap-2.5 px-3 py-2 text-xs transition-colors"
                style={
                  isActive
                    ? {
                        color: "#ffffff",
                        backgroundColor: "rgba(0,120,212,0.2)",
                        borderLeft: "3px solid #0078d4",
                        paddingLeft: "9px",
                      }
                    : {
                        color: "rgba(255,255,255,0.55)",
                        borderLeft: "3px solid transparent",
                        paddingLeft: "9px",
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
                <Icon size={14} className="shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-3 py-2 border-t" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
          <p style={{ color: "rgba(255,255,255,0.25)", fontSize: "10px" }}>v1.0.0</p>
        </div>
      </aside>
    </>
  );
}
