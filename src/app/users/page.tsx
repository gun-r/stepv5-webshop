"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";
import { Plus, Pencil, Trash2, Search, ShieldCheck } from "lucide-react";

interface UserRole { id: string; name: string; label: string; }
interface User {
  id: string; name: string; email: string;
  role: string; roleId: string | null; createdAt: string;
  userRole: UserRole | null;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    const res = await fetch(`/api/users?${params}`);
    if (res.ok) setUsers(await res.json());
    setLoading(false);
  }, [search]);

  useEffect(() => {
    const t = setTimeout(fetchUsers, 300);
    return () => clearTimeout(t);
  }, [fetchUsers]);

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete user "${name}"? This cannot be undone.`)) return;
    setDeletingId(id);
    const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
    if (res.ok) setUsers((prev) => prev.filter((u) => u.id !== id));
    else { const data = await res.json() as { error?: string }; alert(data.error || "Failed to delete"); }
    setDeletingId(null);
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header title="Users" subtitle="Manage user accounts and roles" />
        <main className="flex-1 p-4 space-y-3">
          <div className="flex gap-1.5 flex-wrap">
            <div className="relative flex-1 min-w-40">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: "#a19f9d" }} />
              <input
                type="text"
                placeholder="Search users..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs focus:outline-none"
                style={{ border: "1px solid #8a8886", color: "#323130", backgroundColor: "#ffffff" }}
                onFocus={(e) => { e.target.style.borderColor = "#0078d4"; e.target.style.boxShadow = "0 0 0 1px #0078d4"; }}
                onBlur={(e) => { e.target.style.borderColor = "#8a8886"; e.target.style.boxShadow = ""; }}
              />
            </div>
            <Link href="/users/new"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-white text-xs font-medium"
              style={{ backgroundColor: "#0078d4" }}
              onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.backgroundColor = "#106ebe"}
              onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.backgroundColor = "#0078d4"}
            >
              <Plus className="w-3.5 h-3.5" />Add User
            </Link>
            <Link href="/roles"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium"
              style={{ border: "1px solid #8a8886", color: "#323130", backgroundColor: "#ffffff" }}
              onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.backgroundColor = "#f3f2f1"}
              onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.backgroundColor = "#ffffff"}
            >
              <ShieldCheck className="w-3.5 h-3.5" />Manage Roles
            </Link>
          </div>

          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: "1px solid #edebe9", backgroundColor: "#f3f2f1" }}>
                    <th className="text-left px-3 py-1.5 text-xs font-semibold uppercase tracking-wider" style={{ color: "#605e5c" }}>Name</th>
                    <th className="text-left px-3 py-1.5 text-xs font-semibold uppercase tracking-wider hidden sm:table-cell" style={{ color: "#605e5c" }}>Email</th>
                    <th className="text-left px-3 py-1.5 text-xs font-semibold uppercase tracking-wider" style={{ color: "#605e5c" }}>Role</th>
                    <th className="text-left px-3 py-1.5 text-xs font-semibold uppercase tracking-wider hidden md:table-cell" style={{ color: "#605e5c" }}>Joined</th>
                    <th className="text-right px-3 py-1.5 text-xs font-semibold uppercase tracking-wider" style={{ color: "#605e5c" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={5} className="px-3 py-6 text-center text-xs" style={{ color: "#a19f9d" }}>Loading...</td></tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-3 py-8 text-center text-xs" style={{ color: "#a19f9d" }}>
                        No users found.{" "}
                        <Link href="/users/new" style={{ color: "#0078d4" }} className="hover:underline">Add one</Link>.
                      </td>
                    </tr>
                  ) : (
                    users.map((u) => (
                      <tr key={u.id} className="transition-colors" style={{ borderBottom: "1px solid #f3f2f1" }}
                        onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.backgroundColor = "#faf9f8"}
                        onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.backgroundColor = ""}
                      >
                        <td className="px-3 py-1.5 text-xs font-medium" style={{ color: "#323130" }}>{u.name}</td>
                        <td className="px-3 py-1.5 text-xs hidden sm:table-cell" style={{ color: "#605e5c" }}>{u.email}</td>
                        <td className="px-3 py-1.5">
                          <span className="inline-flex items-center px-1.5 py-0.5 text-xs font-medium"
                            style={u.role === "admin"
                              ? { backgroundColor: "#deecf9", color: "#0078d4" }
                              : u.role === "manager"
                              ? { backgroundColor: "#f4f0ff", color: "#6b2fa0" }
                              : { backgroundColor: "#f3f2f1", color: "#605e5c" }
                            }
                          >
                            {u.userRole?.label || u.role}
                          </span>
                        </td>
                        <td className="px-3 py-1.5 text-xs hidden md:table-cell" style={{ color: "#605e5c" }}>
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-3 py-1.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link href={`/users/${u.id}`}
                              className="inline-flex items-center gap-1 text-xs font-medium hover:underline"
                              style={{ color: "#0078d4" }}>
                              <Pencil className="w-3 h-3" />Edit
                            </Link>
                            <button onClick={() => handleDelete(u.id, u.name)} disabled={deletingId === u.id}
                              className="inline-flex items-center gap-1 text-xs font-medium hover:underline"
                              style={{ color: "#a4262c" }}>
                              <Trash2 className="w-3 h-3" />
                              {deletingId === u.id ? "…" : "Delete"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </main>
      </div>
    </div>
  );
}
