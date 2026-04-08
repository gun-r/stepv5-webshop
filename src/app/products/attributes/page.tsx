"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";
import { Pencil, Trash2, Plus, X, Check, Settings2 } from "lucide-react";

interface Attribute {
  id: string;
  name: string;
  slug: string;
  type: string;
  terms: { id: string }[];
  createdAt: string;
}

function toSlug(str: string) {
  return str.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

const emptyForm = { name: "", slug: "", type: "select" };

const TYPE_LABELS: Record<string, string> = {
  select: "Select",
  color: "Color",
  button: "Button",
};

export default function AttributesPage() {
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fetch$ = async () => {
    setLoading(true);
    const res = await fetch("/api/products/attributes");
    const data = await res.json();
    setAttributes(Array.isArray(data) ? data : []);
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
    const url = editId ? `/api/products/attributes/${editId}` : "/api/products/attributes";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
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

  const handleEdit = (attr: Attribute) => {
    setEditId(attr.id);
    setForm({ name: attr.name, slug: attr.slug, type: attr.type });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this attribute and all its terms?")) return;
    await fetch(`/api/products/attributes/${id}`, { method: "DELETE" });
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

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header title="Attributes" subtitle="Manage product attributes and their terms" />
        <main className="flex-1 p-4">
          <div className="flex gap-4 items-start">
            {/* Add / Edit Form */}
            <Card className="w-64 shrink-0">
              <div className="px-3 py-2 border-b" style={{ borderColor: "#edebe9", backgroundColor: "#faf9f8" }}>
                <h3 className="text-xs font-semibold" style={{ color: "#323130" }}>
                  {editId ? "Edit Attribute" : "Add New Attribute"}
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
                    placeholder="e.g. Color, Size"
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
                  <label className="block text-xs font-medium mb-1" style={{ color: "#323130" }}>Type</label>
                  <select
                    style={{ ...inputStyle }}
                    value={form.type}
                    onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                  >
                    <option value="select">Select</option>
                    <option value="color">Color</option>
                    <option value="button">Button</option>
                  </select>
                  <p className="text-xs mt-0.5" style={{ color: "#a19f9d" }}>How terms are shown on the product page</p>
                </div>
                {error && <p className="text-xs" style={{ color: "#a4262c" }}>{error}</p>}
                <div className="flex gap-1.5">
                  <button
                    onClick={handleSubmit}
                    disabled={saving}
                    className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-white"
                    style={{ backgroundColor: saving ? "#c8c6c4" : "#0078d4" }}
                  >
                    {editId ? <><Check size={12} />Update</> : <><Plus size={12} />Add Attribute</>}
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
                        <th className="text-left px-3 py-1.5 text-xs font-semibold uppercase tracking-wider hidden md:table-cell" style={{ color: "#605e5c" }}>Slug</th>
                        <th className="text-left px-3 py-1.5 text-xs font-semibold uppercase tracking-wider" style={{ color: "#605e5c" }}>Type</th>
                        <th className="text-left px-3 py-1.5 text-xs font-semibold uppercase tracking-wider" style={{ color: "#605e5c" }}>Terms</th>
                        <th className="text-right px-3 py-1.5 text-xs font-semibold uppercase tracking-wider" style={{ color: "#605e5c" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr><td colSpan={5} className="px-3 py-6 text-center text-xs" style={{ color: "#a19f9d" }}>Loading...</td></tr>
                      ) : attributes.length === 0 ? (
                        <tr><td colSpan={5} className="px-3 py-8 text-center text-xs" style={{ color: "#a19f9d" }}>No attributes yet. Add your first one.</td></tr>
                      ) : (
                        attributes.map((attr) => (
                          <tr
                            key={attr.id}
                            style={{ borderBottom: "1px solid #f3f2f1" }}
                            onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.backgroundColor = "#faf9f8"}
                            onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.backgroundColor = ""}
                          >
                            <td className="px-3 py-1.5 text-xs font-medium" style={{ color: "#323130" }}>{attr.name}</td>
                            <td className="px-3 py-1.5 text-xs font-mono hidden md:table-cell" style={{ color: "#605e5c" }}>{attr.slug}</td>
                            <td className="px-3 py-1.5 text-xs" style={{ color: "#605e5c" }}>{TYPE_LABELS[attr.type] ?? attr.type}</td>
                            <td className="px-3 py-1.5 text-xs" style={{ color: "#605e5c" }}>{attr.terms.length}</td>
                            <td className="px-3 py-1.5 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Link
                                  href={`/products/attributes/${attr.id}/terms`}
                                  className="inline-flex items-center gap-1 text-xs hover:underline"
                                  style={{ color: "#0078d4" }}
                                >
                                  <Settings2 size={11} />Configure Terms
                                </Link>
                                <button
                                  onClick={() => handleEdit(attr)}
                                  className="inline-flex items-center gap-1 text-xs hover:underline"
                                  style={{ color: "#0078d4" }}
                                >
                                  <Pencil size={11} />Edit
                                </button>
                                <button
                                  onClick={() => handleDelete(attr.id)}
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
