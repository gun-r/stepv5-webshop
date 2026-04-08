"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";
import { Pencil, Trash2, Plus, X, Check } from "lucide-react";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parentId: string | null;
  parent: { id: string; name: string } | null;
  children: { id: string }[];
  createdAt: string;
}

function toSlug(str: string) {
  return str.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

const emptyForm = { name: "", slug: "", description: "", parentId: "" };

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fetch$ = async () => {
    setLoading(true);
    const res = await fetch("/api/products/categories");
    const data = await res.json();
    setCategories(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  useEffect(() => { fetch$(); }, []);

  const handleNameChange = (val: string) => {
    setForm((f) => ({ ...f, name: val, slug: editId ? f.slug : toSlug(val) }));
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) { setError("Name is required"); return; }
    setSaving(true);
    setError("");
    const method = editId ? "PUT" : "POST";
    const url = editId ? `/api/products/categories/${editId}` : "/api/products/categories";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, parentId: form.parentId || null }),
    });
    if (!res.ok) {
      const d = await res.json();
      setError(d.error || "Failed to save");
    } else {
      setForm(emptyForm);
      setEditId(null);
      await fetch$();
    }
    setSaving(false);
  };

  const handleEdit = (cat: Category) => {
    setEditId(cat.id);
    setForm({ name: cat.name, slug: cat.slug, description: cat.description || "", parentId: cat.parentId || "" });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this category?")) return;
    await fetch(`/api/products/categories/${id}`, { method: "DELETE" });
    await fetch$();
  };

  const handleCancel = () => { setEditId(null); setForm(emptyForm); setError(""); };

  const inputStyle = {
    width: "100%",
    border: "1px solid #8a8886",
    color: "#323130",
    backgroundColor: "#ffffff",
    padding: "5px 8px",
    fontSize: "12px",
    outline: "none",
  };

  const rootCategories = categories.filter((c) => !c.parentId);

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header title="Categories" subtitle="Manage product categories" />
        <main className="flex-1 p-4">
          <div className="flex gap-4 items-start">
            {/* Add / Edit Form */}
            <Card className="w-64 shrink-0">
              <div className="px-3 py-2 border-b" style={{ borderColor: "#edebe9", backgroundColor: "#faf9f8" }}>
                <h3 className="text-xs font-semibold" style={{ color: "#323130" }}>
                  {editId ? "Edit Category" : "Add New Category"}
                </h3>
              </div>
              <div className="p-3 space-y-2.5">
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "#323130" }}>Name</label>
                  <input
                    style={inputStyle}
                    value={form.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    onFocus={(e) => { e.target.style.borderColor = "#0078d4"; e.target.style.boxShadow = "0 0 0 1px #0078d4"; }}
                    onBlur={(e) => { e.target.style.borderColor = "#8a8886"; e.target.style.boxShadow = ""; }}
                    placeholder="Category name"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "#323130" }}>Slug</label>
                  <input
                    style={inputStyle}
                    value={form.slug}
                    onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                    onFocus={(e) => { e.target.style.borderColor = "#0078d4"; e.target.style.boxShadow = "0 0 0 1px #0078d4"; }}
                    onBlur={(e) => { e.target.style.borderColor = "#8a8886"; e.target.style.boxShadow = ""; }}
                    placeholder="auto-generated"
                  />
                  <p className="text-xs mt-0.5" style={{ color: "#a19f9d" }}>URL-friendly name</p>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "#323130" }}>Parent Category</label>
                  <select
                    style={{ ...inputStyle }}
                    value={form.parentId}
                    onChange={(e) => setForm((f) => ({ ...f, parentId: e.target.value }))}
                  >
                    <option value="">None</option>
                    {rootCategories
                      .filter((c) => c.id !== editId)
                      .map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "#323130" }}>Description</label>
                  <textarea
                    style={{ ...inputStyle, resize: "vertical", minHeight: "60px" }}
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    onFocus={(e) => { e.target.style.borderColor = "#0078d4"; e.target.style.boxShadow = "0 0 0 1px #0078d4"; }}
                    onBlur={(e) => { e.target.style.borderColor = "#8a8886"; e.target.style.boxShadow = ""; }}
                    placeholder="Optional description"
                  />
                </div>
                {error && <p className="text-xs" style={{ color: "#a4262c" }}>{error}</p>}
                <div className="flex gap-1.5">
                  <button
                    onClick={handleSubmit}
                    disabled={saving}
                    className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-white"
                    style={{ backgroundColor: saving ? "#c8c6c4" : "#0078d4" }}
                  >
                    {editId ? <><Check size={12} />Update</> : <><Plus size={12} />Add Category</>}
                  </button>
                  {editId && (
                    <button
                      onClick={handleCancel}
                      className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium"
                      style={{ border: "1px solid #8a8886", color: "#323130", backgroundColor: "#ffffff" }}
                    >
                      <X size={12} />Cancel
                    </button>
                  )}
                </div>
              </div>
            </Card>

            {/* Table */}
            <div className="flex-1">
              <Card>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr style={{ borderBottom: "1px solid #edebe9", backgroundColor: "#f3f2f1" }}>
                        <th className="text-left px-3 py-1.5 text-xs font-semibold uppercase tracking-wider" style={{ color: "#605e5c" }}>Name</th>
                        <th className="text-left px-3 py-1.5 text-xs font-semibold uppercase tracking-wider hidden sm:table-cell" style={{ color: "#605e5c" }}>Description</th>
                        <th className="text-left px-3 py-1.5 text-xs font-semibold uppercase tracking-wider hidden md:table-cell" style={{ color: "#605e5c" }}>Slug</th>
                        <th className="text-left px-3 py-1.5 text-xs font-semibold uppercase tracking-wider hidden md:table-cell" style={{ color: "#605e5c" }}>Parent</th>
                        <th className="text-left px-3 py-1.5 text-xs font-semibold uppercase tracking-wider" style={{ color: "#605e5c" }}>Sub</th>
                        <th className="text-right px-3 py-1.5 text-xs font-semibold uppercase tracking-wider" style={{ color: "#605e5c" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr><td colSpan={6} className="px-3 py-6 text-center text-xs" style={{ color: "#a19f9d" }}>Loading...</td></tr>
                      ) : categories.length === 0 ? (
                        <tr><td colSpan={6} className="px-3 py-8 text-center text-xs" style={{ color: "#a19f9d" }}>No categories yet. Add your first one.</td></tr>
                      ) : (
                        categories.map((cat) => (
                          <tr
                            key={cat.id}
                            style={{ borderBottom: "1px solid #f3f2f1" }}
                            onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.backgroundColor = "#faf9f8"}
                            onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.backgroundColor = ""}
                          >
                            <td className="px-3 py-1.5 text-xs font-medium" style={{ color: "#323130" }}>{cat.name}</td>
                            <td className="px-3 py-1.5 text-xs hidden sm:table-cell" style={{ color: "#605e5c" }}>
                              {cat.description || <span style={{ color: "#c8c6c4" }}>—</span>}
                            </td>
                            <td className="px-3 py-1.5 text-xs font-mono hidden md:table-cell" style={{ color: "#605e5c" }}>{cat.slug}</td>
                            <td className="px-3 py-1.5 text-xs hidden md:table-cell" style={{ color: "#605e5c" }}>
                              {cat.parent ? cat.parent.name : <span style={{ color: "#c8c6c4" }}>—</span>}
                            </td>
                            <td className="px-3 py-1.5 text-xs" style={{ color: "#605e5c" }}>{cat.children.length}</td>
                            <td className="px-3 py-1.5 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => handleEdit(cat)}
                                  className="inline-flex items-center gap-1 text-xs hover:underline"
                                  style={{ color: "#0078d4" }}
                                >
                                  <Pencil size={11} />Edit
                                </button>
                                <button
                                  onClick={() => handleDelete(cat.id)}
                                  className="inline-flex items-center gap-1 text-xs hover:underline"
                                  style={{ color: "#a4262c" }}
                                >
                                  <Trash2 size={11} />Delete
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
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
