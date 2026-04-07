"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Plus, Save, Trash2, ShieldCheck } from "lucide-react";

const ALL_PERMISSIONS = [
  { key: "users.view", label: "View Users" },
  { key: "users.manage", label: "Manage Users" },
  { key: "products.view", label: "View Products" },
  { key: "products.manage", label: "Manage Products" },
  { key: "sites.view", label: "View Sites" },
  { key: "sites.manage", label: "Manage Sites" },
  { key: "setup.view", label: "View Setup" },
  { key: "setup.manage", label: "Manage Setup" },
  { key: "activity.view", label: "View Activity" },
];

interface Role {
  id: string;
  name: string;
  label: string;
  permissions: string[];
  userCount: number;
}

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ label: string; permissions: string[] }>({ label: "", permissions: [] });
  const [saving, setSaving] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [newForm, setNewForm] = useState({ name: "", label: "", permissions: [] as string[] });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  async function fetchRoles() {
    setLoading(true);
    const res = await fetch("/api/roles");
    if (res.ok) setRoles(await res.json());
    setLoading(false);
  }

  useEffect(() => { fetchRoles(); }, []);

  function startEdit(role: Role) {
    setEditingId(role.id);
    setEditForm({ label: role.label, permissions: [...role.permissions] });
    setError("");
  }

  function togglePerm(perms: string[], key: string): string[] {
    return perms.includes(key) ? perms.filter((p) => p !== key) : [...perms, key];
  }

  async function handleSave(id: string) {
    setSaving(true);
    setError("");
    const res = await fetch(`/api/roles/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    });
    if (res.ok) {
      await fetchRoles();
      setEditingId(null);
    } else {
      const data = await res.json() as { error?: string };
      setError(data.error || "Failed to save");
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this role?")) return;
    const res = await fetch(`/api/roles/${id}`, { method: "DELETE" });
    if (res.ok) setRoles((prev) => prev.filter((r) => r.id !== id));
    else {
      const data = await res.json() as { error?: string };
      alert(data.error || "Failed to delete");
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError("");
    const res = await fetch("/api/roles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newForm),
    });
    if (res.ok) {
      await fetchRoles();
      setShowNew(false);
      setNewForm({ name: "", label: "", permissions: [] });
    } else {
      const data = await res.json() as { error?: string };
      setError(data.error || "Failed to create role");
    }
    setCreating(false);
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header title="Roles & Permissions" subtitle="Manage access rights for each role" />
        <main className="flex-1 p-6 space-y-4 max-w-4xl">
          <div className="flex justify-end">
            <Button onClick={() => { setShowNew(!showNew); setError(""); }}>
              <Plus className="w-4 h-4" />New Role
            </Button>
          </div>

          {error && (
            <div className="p-3 text-sm" style={{ backgroundColor: "#fde7e9", border: "1px solid #a4262c", color: "#a4262c" }}>
              {error}
            </div>
          )}

          {/* New Role Form */}
          {showNew && (
            <Card>
              <CardHeader><CardTitle>Create New Role</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={handleCreate} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Input label="Role Name (slug)" value={newForm.name} onChange={(e) => setNewForm((p) => ({ ...p, name: e.target.value }))} placeholder="e.g. content_editor" required />
                    <Input label="Display Label" value={newForm.label} onChange={(e) => setNewForm((p) => ({ ...p, label: e.target.value }))} placeholder="e.g. Content Editor" required />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "#605e5c" }}>Permissions</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {ALL_PERMISSIONS.map((p) => (
                        <label key={p.key} className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: "#323130" }}>
                          <input
                            type="checkbox"
                            checked={newForm.permissions.includes(p.key)}
                            onChange={() => setNewForm((prev) => ({ ...prev, permissions: togglePerm(prev.permissions, p.key) }))}
                            className="w-4 h-4 accent-blue-600"
                          />
                          {p.label}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button type="submit" loading={creating}><Save className="w-4 h-4" />Create Role</Button>
                    <Button type="button" variant="outline" onClick={() => setShowNew(false)}>Cancel</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Existing Roles */}
          {loading ? (
            <div className="text-center py-10 text-sm" style={{ color: "#a19f9d" }}>Loading...</div>
          ) : (
            <div className="space-y-3">
              {roles.map((role) => (
                <Card key={role.id}>
                  <CardContent className="py-4">
                    {editingId === role.id ? (
                      <div className="space-y-4">
                        <Input label="Display Label" value={editForm.label} onChange={(e) => setEditForm((p) => ({ ...p, label: e.target.value }))} />
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "#605e5c" }}>Permissions</p>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {ALL_PERMISSIONS.map((p) => (
                              <label key={p.key} className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: "#323130" }}>
                                <input
                                  type="checkbox"
                                  checked={editForm.permissions.includes(p.key)}
                                  onChange={() => setEditForm((prev) => ({ ...prev, permissions: togglePerm(prev.permissions, p.key) }))}
                                  className="w-4 h-4 accent-blue-600"
                                />
                                {p.label}
                              </label>
                            ))}
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <Button loading={saving} onClick={() => handleSave(role.id)}><Save className="w-4 h-4" />Save</Button>
                          <Button variant="outline" onClick={() => setEditingId(null)}>Cancel</Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <ShieldCheck className="w-4 h-4" style={{ color: "#0078d4" }} />
                            <span className="text-sm font-semibold" style={{ color: "#323130" }}>{role.label}</span>
                            <code className="text-xs px-1.5 py-0.5" style={{ backgroundColor: "#f3f2f1", color: "#605e5c" }}>{role.name}</code>
                            <span className="text-xs" style={{ color: "#a19f9d" }}>{role.userCount} user{role.userCount !== 1 ? "s" : ""}</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {role.permissions.length === 0 ? (
                              <span className="text-xs" style={{ color: "#a19f9d" }}>No permissions</span>
                            ) : (
                              role.permissions.map((perm) => (
                                <span key={perm} className="inline-flex text-xs px-2 py-0.5" style={{ backgroundColor: "#deecf9", color: "#0078d4" }}>
                                  {ALL_PERMISSIONS.find((p) => p.key === perm)?.label || perm}
                                </span>
                              ))
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <Button variant="outline" onClick={() => startEdit(role)}>Edit</Button>
                          {role.userCount === 0 && (
                            <Button variant="danger" onClick={() => handleDelete(role.id)}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
