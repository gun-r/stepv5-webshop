"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";
import { Pencil, Trash2, Plus, X, Check, ArrowLeft } from "lucide-react";

interface Term {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}

interface Attribute {
  id: string;
  name: string;
  slug: string;
  type: string;
}

function toSlug(str: string) {
  return str.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

const emptyForm = { name: "", slug: "", description: "" };

export default function TermsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const [attribute, setAttribute] = useState<Attribute | null>(null);
  const [terms, setTerms] = useState<Term[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fetch$ = async () => {
    setLoading(true);
    const [attrRes, termsRes] = await Promise.all([
      fetch(`/api/products/attributes/${id}`),
      fetch(`/api/products/attributes/${id}/terms`),
    ]);
    const attrData = await attrRes.json();
    const termsData = await termsRes.json();
    setAttribute(attrData.id ? attrData : null);
    setTerms(Array.isArray(termsData) ? termsData : []);
    setLoading(false);
  };

  useEffect(() => { fetch$(); }, [id]);

  const handleNameChange = (val: string) => {
    setForm((f) => ({ ...f, name: val, slug: editId ? f.slug : toSlug(val) }));
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) { setError("Name is required"); return; }
    setSaving(true);
    setError("");
    const method = editId ? "PUT" : "POST";
    const url = editId
      ? `/api/products/attributes/${id}/terms/${editId}`
      : `/api/products/attributes/${id}/terms`;
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!res.ok) {
      const text = await res.text();
      const d = text ? JSON.parse(text) : {};
      setError(d.error || "Failed to save");
    } else {
      setForm(emptyForm);
      setEditId(null);
      await fetch$();
    }
    setSaving(false);
  };

  const handleEdit = (term: Term) => {
    setEditId(term.id);
    setForm({ name: term.name, slug: term.slug, description: term.description || "" });
  };

  const handleDelete = async (termId: string) => {
    if (!confirm("Delete this term?")) return;
    await fetch(`/api/products/attributes/${id}/terms/${termId}`, { method: "DELETE" });
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
        <Header
          title={attribute ? `${attribute.name} — Terms` : "Terms"}
          subtitle="Manage terms for this attribute"
        />
        <main className="flex-1 p-4 space-y-3">
          {/* Back link */}
          <Link
            href="/products/attributes"
            className="inline-flex items-center gap-1 text-xs hover:underline"
            style={{ color: "#0078d4" }}
          >
            <ArrowLeft size={12} />Back to Attributes
          </Link>

          <div className="flex gap-4 items-start">
            {/* Add / Edit Form */}
            <Card className="w-64 shrink-0">
              <div className="px-3 py-2 border-b" style={{ borderColor: "#edebe9", backgroundColor: "#faf9f8" }}>
                <h3 className="text-xs font-semibold" style={{ color: "#323130" }}>
                  {editId ? "Edit Term" : "Add New Term"}
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
                    placeholder="e.g. Red, Large"
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
                    {editId ? <><Check size={12} />Update</> : <><Plus size={12} />Add Term</>}
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
                        <th className="text-right px-3 py-1.5 text-xs font-semibold uppercase tracking-wider" style={{ color: "#605e5c" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr><td colSpan={4} className="px-3 py-6 text-center text-xs" style={{ color: "#a19f9d" }}>Loading...</td></tr>
                      ) : terms.length === 0 ? (
                        <tr><td colSpan={4} className="px-3 py-8 text-center text-xs" style={{ color: "#a19f9d" }}>No terms yet. Add your first one.</td></tr>
                      ) : (
                        terms.map((term) => (
                          <tr
                            key={term.id}
                            style={{ borderBottom: "1px solid #f3f2f1" }}
                            onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.backgroundColor = "#faf9f8"}
                            onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.backgroundColor = ""}
                          >
                            <td className="px-3 py-1.5 text-xs font-medium" style={{ color: "#323130" }}>{term.name}</td>
                            <td className="px-3 py-1.5 text-xs hidden sm:table-cell" style={{ color: "#605e5c" }}>
                              {term.description || <span style={{ color: "#c8c6c4" }}>—</span>}
                            </td>
                            <td className="px-3 py-1.5 text-xs font-mono hidden md:table-cell" style={{ color: "#605e5c" }}>{term.slug}</td>
                            <td className="px-3 py-1.5 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => handleEdit(term)}
                                  className="inline-flex items-center gap-1 text-xs hover:underline"
                                  style={{ color: "#0078d4" }}
                                >
                                  <Pencil size={11} />Edit
                                </button>
                                <button
                                  onClick={() => handleDelete(term.id)}
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
