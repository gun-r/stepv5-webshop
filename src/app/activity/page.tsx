"use client";

import { useEffect, useState, useCallback } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";
import { Activity, ChevronLeft, ChevronRight } from "lucide-react";

interface User { id: string; name: string; email: string; }
interface LogEntry {
  id: string; action: string; details: string | null;
  createdAt: string; user: User;
}

const ACTION_COLORS: Record<string, { bg: string; text: string }> = {
  "product.create": { bg: "#dff6dd", text: "#107c10" },
  "product.update": { bg: "#deecf9", text: "#0078d4" },
  "product.delete": { bg: "#fde7e9", text: "#a4262c" },
  "product.import": { bg: "#f4f0ff", text: "#6b2fa0" },
  "user.create": { bg: "#dff6dd", text: "#107c10" },
  "user.update": { bg: "#deecf9", text: "#0078d4" },
  "user.delete": { bg: "#fde7e9", text: "#a4262c" },
};

export default function ActivityPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState("");

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("page", String(page));
    if (actionFilter) params.set("action", actionFilter);
    const res = await fetch(`/api/activity?${params}`);
    if (res.ok) {
      const data = await res.json() as { logs: LogEntry[]; total: number; pages: number };
      setLogs(data.logs);
      setTotal(data.total);
      setPages(data.pages);
    }
    setLoading(false);
  }, [page, actionFilter]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  function formatDetails(details: string | null): string {
    if (!details) return "";
    try {
      const obj = JSON.parse(details) as Record<string, unknown>;
      return Object.entries(obj).map(([k, v]) => `${k}: ${v}`).join(", ");
    } catch { return details; }
  }

  function formatAction(action: string): string {
    return action.replace(".", " › ");
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header title="Activity Log" subtitle="Track all user actions across the system" />
        <main className="flex-1 p-4 space-y-3">
          <div className="flex gap-2 flex-wrap items-center justify-between">
            <div className="flex gap-1.5 items-center">
              <Activity className="w-3.5 h-3.5" style={{ color: "#605e5c" }} />
              <span className="text-xs" style={{ color: "#605e5c" }}>{total} total entries</span>
            </div>
            <select
              value={actionFilter}
              onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
              className="px-2.5 py-1.5 text-xs focus:outline-none"
              style={{ border: "1px solid #8a8886", color: "#323130", backgroundColor: "#ffffff" }}
            >
              <option value="">All actions</option>
              <option value="product">Product actions</option>
              <option value="user">User actions</option>
            </select>
          </div>

          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: "1px solid #edebe9", backgroundColor: "#f3f2f1" }}>
                    <th className="text-left px-3 py-1.5 text-xs font-semibold uppercase tracking-wider" style={{ color: "#605e5c" }}>Time</th>
                    <th className="text-left px-3 py-1.5 text-xs font-semibold uppercase tracking-wider hidden sm:table-cell" style={{ color: "#605e5c" }}>User</th>
                    <th className="text-left px-3 py-1.5 text-xs font-semibold uppercase tracking-wider" style={{ color: "#605e5c" }}>Action</th>
                    <th className="text-left px-3 py-1.5 text-xs font-semibold uppercase tracking-wider hidden md:table-cell" style={{ color: "#605e5c" }}>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={4} className="px-3 py-6 text-center text-xs" style={{ color: "#a19f9d" }}>Loading...</td></tr>
                  ) : logs.length === 0 ? (
                    <tr><td colSpan={4} className="px-3 py-8 text-center text-xs" style={{ color: "#a19f9d" }}>No activity yet.</td></tr>
                  ) : (
                    logs.map((log) => {
                      const color = ACTION_COLORS[log.action] || { bg: "#f3f2f1", text: "#605e5c" };
                      return (
                        <tr key={log.id} className="transition-colors" style={{ borderBottom: "1px solid #f3f2f1" }}
                          onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.backgroundColor = "#faf9f8"}
                          onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.backgroundColor = ""}
                        >
                          <td className="px-3 py-1.5 text-xs whitespace-nowrap" style={{ color: "#605e5c" }}>
                            <div>{new Date(log.createdAt).toLocaleDateString()}</div>
                            <div style={{ color: "#a19f9d" }}>{new Date(log.createdAt).toLocaleTimeString()}</div>
                          </td>
                          <td className="px-3 py-1.5 hidden sm:table-cell">
                            <p className="text-xs font-medium" style={{ color: "#323130" }}>{log.user.name}</p>
                            <p className="text-xs" style={{ color: "#a19f9d" }}>{log.user.email}</p>
                          </td>
                          <td className="px-3 py-1.5">
                            <span className="inline-flex text-xs font-medium px-1.5 py-0.5" style={{ backgroundColor: color.bg, color: color.text }}>
                              {formatAction(log.action)}
                            </span>
                          </td>
                          <td className="px-3 py-1.5 text-xs max-w-xs truncate hidden md:table-cell" style={{ color: "#605e5c" }}>
                            {formatDetails(log.details)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {pages > 1 && (
            <div className="flex items-center justify-between">
              <span className="text-xs" style={{ color: "#605e5c" }}>Page {page} of {pages}</span>
              <div className="flex gap-1">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                  className="p-1 disabled:opacity-40" style={{ border: "1px solid #edebe9" }}>
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={page === pages}
                  className="p-1 disabled:opacity-40" style={{ border: "1px solid #edebe9" }}>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
