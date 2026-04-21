"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";
import {
  Search, AlertCircle, Package, RefreshCw,
  ChevronLeft, ChevronRight, Settings, Globe, X, Check, Loader2,
} from "lucide-react";

type OdooProduct = {
  id: number;
  name: string;
  default_code: string | false;
  list_price: number;
  type: string;
  categ_id: [number, string] | false;
  description_sale: string | false;
  image_1920: string | false;
  active: boolean;
  website_id: [number, string] | false;
  is_published: boolean;
};

type OdooWebsite = { id: number; name: string; domain: string | false };

const TYPE_LABELS: Record<string, string> = {
  consu: "Consumable",
  service: "Service",
  product: "Storable",
};

const TYPE_COLORS: Record<string, { bg: string; color: string }> = {
  consu:   { bg: "#fff4ce", color: "#a4520a" },
  service: { bg: "#ddf4ff", color: "#0969da" },
  product: { bg: "#e6f4ea", color: "#1a7f37" },
};

const PAGE_SIZE = 40;

// ── Publish Modal ──────────────────────────────────────────────────────────────
function PublishModal({
  product,
  websites,
  onClose,
  onSaved,
}: {
  product: OdooProduct;
  websites: OdooWebsite[];
  onClose: () => void;
  onSaved: (id: number, websiteId: number | false, isPublished: boolean) => void;
}) {
  const [websiteId, setWebsiteId] = useState<number | "">(
    product.website_id ? product.website_id[0] : ""
  );
  const [isPublished, setIsPublished] = useState(product.is_published);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/odoo/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          website_id: websiteId === "" ? null : websiteId,
          is_published: isPublished,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to save"); return; }
      onSaved(product.id, websiteId === "" ? false : websiteId, isPublished);
      onClose();
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-sm mx-4 rounded-sm shadow-xl" style={{ backgroundColor: "#ffffff" }}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid #edebe9" }}>
          <div className="flex items-center gap-2">
            <Globe size={15} style={{ color: "#0078d4" }} />
            <span className="text-sm font-semibold" style={{ color: "#323130" }}>Manage Publishing</span>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100">
            <X size={14} style={{ color: "#605e5c" }} />
          </button>
        </div>

        {/* Product name */}
        <div className="px-4 py-3" style={{ borderBottom: "1px solid #f3f2f1", backgroundColor: "#faf9f8" }}>
          <p className="text-xs font-medium truncate" style={{ color: "#323130" }}>{product.name}</p>
          {product.default_code && (
            <p className="text-xs mt-0.5" style={{ color: "#a19f9d" }}>Ref: {product.default_code}</p>
          )}
        </div>

        {/* Body */}
        <div className="px-4 py-4 space-y-4">
          {/* Website selector */}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "#323130" }}>
              Assign to Website
            </label>
            <select
              value={websiteId}
              onChange={(e) => setWebsiteId(e.target.value === "" ? "" : parseInt(e.target.value))}
              className="w-full px-2.5 py-1.5 text-xs focus:outline-none"
              style={{ border: "1px solid #8a8886", color: "#323130", backgroundColor: "#ffffff" }}
            >
              <option value="">— No website —</option>
              {websites.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}{w.domain ? ` (${w.domain})` : ""}
                </option>
              ))}
            </select>
            {websites.length === 0 && (
              <p className="mt-1 text-xs" style={{ color: "#a19f9d" }}>No websites found in Odoo.</p>
            )}
          </div>

          {/* Published toggle */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium" style={{ color: "#323130" }}>Published</p>
              <p className="text-xs mt-0.5" style={{ color: "#a19f9d" }}>
                {isPublished ? "Visible to visitors on the website" : "Hidden from visitors"}
              </p>
            </div>
            <button
              onClick={() => setIsPublished((v) => !v)}
              className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none"
              style={{ backgroundColor: isPublished ? "#0078d4" : "#c8c6c4" }}
            >
              <span
                className="inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform"
                style={{ transform: isPublished ? "translateX(18px)" : "translateX(2px)" }}
              />
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 px-3 py-2 rounded" style={{ backgroundColor: "#fde7e9" }}>
              <AlertCircle size={13} style={{ color: "#d32f2f", flexShrink: 0 }} />
              <p className="text-xs" style={{ color: "#d32f2f" }}>{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-4 py-3" style={{ borderTop: "1px solid #edebe9" }}>
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs"
            style={{ border: "1px solid #8a8886", color: "#323130", backgroundColor: "#ffffff" }}
          >
            Cancel
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-white disabled:opacity-60"
            style={{ backgroundColor: "#0078d4", border: "1px solid #0078d4" }}
          >
            {saving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function OdooProductsPage() {
  const [products, setProducts] = useState<OdooProduct[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [websites, setWebsites] = useState<OdooWebsite[]>([]);
  const [managing, setManaging] = useState<OdooProduct | null>(null);

  useEffect(() => {
    fetch("/api/odoo/websites")
      .then((r) => r.json())
      .then((d) => { if (d.websites) setWebsites(d.websites); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(0); }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        limit: String(PAGE_SIZE),
        offset: String(page * PAGE_SIZE),
      });
      if (debouncedSearch) params.set("search", debouncedSearch);
      const res = await fetch(`/api/odoo/products?${params}`);
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to load products"); return; }
      setProducts(data.products ?? []);
      setTotal(data.total ?? 0);
    } catch {
      setError("Network error — could not reach the server.");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, page]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  function handleSaved(id: number, websiteId: number | false, isPublished: boolean) {
    setProducts((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              website_id: websiteId
                ? [websiteId, websites.find((w) => w.id === websiteId)?.name ?? ""]
                : false,
              is_published: isPublished,
            }
          : p
      )
    );
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header
          title="Odoo Products"
          subtitle={total > 0 ? `${total.toLocaleString()} products from Odoo` : "Products from your Odoo instance"}
        />
        <main className="flex-1 p-4 space-y-3">
          {/* Toolbar */}
          <div className="flex gap-1.5 flex-wrap items-center">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: "#a19f9d" }} />
              <input
                type="text"
                placeholder="Search Odoo products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs focus:outline-none"
                style={{ border: "1px solid #8a8886", color: "#323130", backgroundColor: "#ffffff" }}
                onFocus={(e) => { e.target.style.borderColor = "#0078d4"; e.target.style.boxShadow = "0 0 0 1px #0078d4"; }}
                onBlur={(e) => { e.target.style.borderColor = "#8a8886"; e.target.style.boxShadow = ""; }}
              />
            </div>
            <button
              onClick={fetchProducts}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs"
              style={{ border: "1px solid #8a8886", color: "#323130", backgroundColor: "#ffffff" }}
            >
              <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>

          {/* Error state */}
          {error && (
            <Card>
              <div className="flex items-start gap-3 p-4">
                <AlertCircle size={18} style={{ color: "#d32f2f", flexShrink: 0 }} />
                <div className="flex-1">
                  <p className="text-xs font-medium" style={{ color: "#323130" }}>{error}</p>
                  {error.includes("not configured") && (
                    <Link
                      href="/settings/odoo"
                      className="inline-flex items-center gap-1 mt-2 text-xs"
                      style={{ color: "#0078d4" }}
                    >
                      <Settings size={11} />
                      Go to Odoo Settings
                    </Link>
                  )}
                </div>
              </div>
            </Card>
          )}

          {/* Loading skeleton */}
          {loading && !error && (
            <Card>
              <div className="space-y-0">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-2.5 border-b animate-pulse" style={{ borderColor: "#f3f2f1" }}>
                    <div className="w-10 h-10 rounded shrink-0" style={{ backgroundColor: "#f3f2f1" }} />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 rounded w-48" style={{ backgroundColor: "#f3f2f1" }} />
                      <div className="h-2.5 rounded w-24" style={{ backgroundColor: "#f3f2f1" }} />
                    </div>
                    <div className="h-3 rounded w-16" style={{ backgroundColor: "#f3f2f1" }} />
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Products table */}
          {!loading && !error && products.length > 0 && (
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr style={{ borderBottom: "1px solid #edebe9", backgroundColor: "#faf9f8" }}>
                      <th className="px-3 py-2 text-left font-semibold" style={{ color: "#605e5c", width: 52 }}>Image</th>
                      <th className="px-3 py-2 text-left font-semibold" style={{ color: "#605e5c" }}>Name</th>
                      <th className="px-3 py-2 text-left font-semibold" style={{ color: "#605e5c" }}>Internal Ref</th>
                      <th className="px-3 py-2 text-left font-semibold" style={{ color: "#605e5c" }}>Category</th>
                      <th className="px-3 py-2 text-left font-semibold" style={{ color: "#605e5c" }}>Type</th>
                      <th className="px-3 py-2 text-right font-semibold" style={{ color: "#605e5c" }}>Price</th>
                      <th className="px-3 py-2 text-left font-semibold" style={{ color: "#605e5c" }}>Website</th>
                      <th className="px-3 py-2 text-left font-semibold" style={{ color: "#605e5c" }}>Published</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((p, i) => {
                      const typeStyle = TYPE_COLORS[p.type] ?? { bg: "#f3f2f1", color: "#323130" };
                      const typeLabel = TYPE_LABELS[p.type] ?? p.type;
                      return (
                        <tr
                          key={p.id}
                          style={{ borderBottom: i < products.length - 1 ? "1px solid #f3f2f1" : undefined }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "#faf9f8"; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = ""; }}
                        >
                          {/* Image */}
                          <td className="px-3 py-2">
                            {p.image_1920 ? (
                              <img
                                src={`data:image/png;base64,${p.image_1920}`}
                                alt={p.name}
                                className="w-10 h-10 object-contain rounded"
                                style={{ border: "1px solid #edebe9" }}
                              />
                            ) : (
                              <div
                                className="w-10 h-10 flex items-center justify-center rounded"
                                style={{ border: "1px solid #edebe9", backgroundColor: "#f3f2f1" }}
                              >
                                <Package size={16} style={{ color: "#a19f9d" }} />
                              </div>
                            )}
                          </td>

                          {/* Name */}
                          <td className="px-3 py-2" style={{ color: "#323130" }}>
                            <div className="font-medium leading-snug">{p.name}</div>
                            {p.description_sale && (
                              <div className="mt-0.5 line-clamp-1" style={{ color: "#a19f9d", fontSize: "10px" }}>
                                {p.description_sale}
                              </div>
                            )}
                          </td>

                          {/* Internal Ref */}
                          <td className="px-3 py-2" style={{ color: "#605e5c" }}>
                            {p.default_code || <span style={{ color: "#c8c6c4" }}>—</span>}
                          </td>

                          {/* Category */}
                          <td className="px-3 py-2" style={{ color: "#605e5c" }}>
                            {p.categ_id ? p.categ_id[1] : <span style={{ color: "#c8c6c4" }}>—</span>}
                          </td>

                          {/* Type */}
                          <td className="px-3 py-2">
                            <span
                              className="inline-block px-1.5 py-0.5 rounded font-medium"
                              style={{ backgroundColor: typeStyle.bg, color: typeStyle.color, fontSize: "10px" }}
                            >
                              {typeLabel}
                            </span>
                          </td>

                          {/* Price */}
                          <td className="px-3 py-2 text-right tabular-nums" style={{ color: "#323130" }}>
                            {p.list_price.toFixed(2)}
                          </td>

                          {/* Website */}
                          <td className="px-3 py-2" style={{ color: "#605e5c" }}>
                            {p.website_id ? (
                              <span className="flex items-center gap-1">
                                <Globe size={11} style={{ color: "#0078d4", flexShrink: 0 }} />
                                {p.website_id[1]}
                              </span>
                            ) : (
                              <span style={{ color: "#c8c6c4" }}>—</span>
                            )}
                          </td>

                          {/* Published */}
                          <td className="px-3 py-2">
                            <button
                              onClick={() => setManaging(p)}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded font-medium transition-opacity hover:opacity-75"
                              style={{
                                backgroundColor: p.is_published ? "#e6f4ea" : "#f3f2f1",
                                color: p.is_published ? "#1a7f37" : "#605e5c",
                                fontSize: "10px",
                                border: `1px solid ${p.is_published ? "#b7e4c7" : "#edebe9"}`,
                              }}
                            >
                              <Globe size={10} />
                              {p.is_published ? "Published" : "Unpublished"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-2.5" style={{ borderTop: "1px solid #edebe9" }}>
                  <span className="text-xs" style={{ color: "#605e5c" }}>
                    {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} of {total.toLocaleString()}
                  </span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setPage((p) => Math.max(0, p - 1))}
                      disabled={page === 0}
                      className="flex items-center gap-1 px-2 py-1 text-xs disabled:opacity-40"
                      style={{ border: "1px solid #8a8886", color: "#323130", backgroundColor: "#ffffff" }}
                    >
                      <ChevronLeft size={12} /> Prev
                    </button>
                    <span className="px-2 py-1 text-xs" style={{ color: "#605e5c" }}>
                      {page + 1} / {totalPages}
                    </span>
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                      disabled={page >= totalPages - 1}
                      className="flex items-center gap-1 px-2 py-1 text-xs disabled:opacity-40"
                      style={{ border: "1px solid #8a8886", color: "#323130", backgroundColor: "#ffffff" }}
                    >
                      Next <ChevronRight size={12} />
                    </button>
                  </div>
                </div>
              )}
            </Card>
          )}

          {/* Empty state */}
          {!loading && !error && products.length === 0 && (
            <Card>
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <Package size={32} style={{ color: "#c8c6c4" }} />
                <p className="text-sm font-medium" style={{ color: "#323130" }}>No products found</p>
                <p className="text-xs" style={{ color: "#a19f9d" }}>
                  {debouncedSearch ? "Try a different search term." : "No products were returned from Odoo."}
                </p>
              </div>
            </Card>
          )}
        </main>
      </div>

      {/* Publish modal */}
      {managing && (
        <PublishModal
          product={managing}
          websites={websites}
          onClose={() => setManaging(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
