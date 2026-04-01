"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";
import { Badge, SyncStatusBadge } from "@/components/ui/Badge";
import { Plus, Search, Pencil, ExternalLink } from "lucide-react";

interface SyncRecord {
  id: string;
  status: string;
  wooProductId: number | null;
  site: { name: string; url: string };
}

interface Product {
  id: string;
  title: string;
  price: string;
  sku: string | null;
  status: string;
  syncs: SyncRecord[];
  updatedAt: string;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (statusFilter) params.set("status", statusFilter);

    const res = await fetch(`/api/products?${params}`);
    const data = await res.json();
    setProducts(data);
    setLoading(false);
  }, [search, statusFilter]);

  useEffect(() => {
    const debounce = setTimeout(fetchProducts, 300);
    return () => clearTimeout(debounce);
  }, [fetchProducts]);

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header title="Products" subtitle="Manage and sync your product catalog" />
        <main className="flex-1 p-6 space-y-4">
          {/* Toolbar */}
          <div className="flex gap-2 flex-wrap">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#a19f9d" }} />
              <input
                type="text"
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm focus:outline-none"
                style={{ border: "1px solid #8a8886", color: "#323130", backgroundColor: "#ffffff" }}
                onFocus={(e) => { e.target.style.borderColor = "#0078d4"; e.target.style.boxShadow = "0 0 0 1px #0078d4"; }}
                onBlur={(e) => { e.target.style.borderColor = "#8a8886"; e.target.style.boxShadow = ""; }}
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-sm focus:outline-none"
              style={{ border: "1px solid #8a8886", color: "#323130", backgroundColor: "#ffffff" }}
            >
              <option value="">All statuses</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
            <Link
              href="/products/new"
              className="inline-flex items-center gap-2 px-4 py-2 text-white text-sm font-medium transition-colors"
              style={{ backgroundColor: "#0078d4" }}
              onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.backgroundColor = "#106ebe"}
              onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.backgroundColor = "#0078d4"}
            >
              <Plus className="w-4 h-4" />
              Add Product
            </Link>
          </div>

          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: "1px solid #edebe9", backgroundColor: "#f3f2f1" }}>
                    <th className="text-left px-5 py-2.5 text-xs font-semibold uppercase tracking-wider" style={{ color: "#605e5c" }}>Product</th>
                    <th className="text-left px-5 py-2.5 text-xs font-semibold uppercase tracking-wider" style={{ color: "#605e5c" }}>SKU</th>
                    <th className="text-left px-5 py-2.5 text-xs font-semibold uppercase tracking-wider" style={{ color: "#605e5c" }}>Price</th>
                    <th className="text-left px-5 py-2.5 text-xs font-semibold uppercase tracking-wider" style={{ color: "#605e5c" }}>Status</th>
                    <th className="text-left px-5 py-2.5 text-xs font-semibold uppercase tracking-wider" style={{ color: "#605e5c" }}>Sync Status</th>
                    <th className="text-left px-5 py-2.5 text-xs font-semibold uppercase tracking-wider" style={{ color: "#605e5c" }}>Live On</th>
                    <th className="text-right px-5 py-2.5 text-xs font-semibold uppercase tracking-wider" style={{ color: "#605e5c" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-8 text-center text-sm" style={{ color: "#a19f9d" }}>
                        Loading...
                      </td>
                    </tr>
                  ) : products.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-12 text-center text-sm" style={{ color: "#a19f9d" }}>
                        No products found.{" "}
                        <Link href="/products/new" className="hover:underline" style={{ color: "#0078d4" }}>
                          Add your first product
                        </Link>
                        .
                      </td>
                    </tr>
                  ) : (
                    products.map((product) => (
                      <tr key={product.id} className="transition-colors" style={{ borderBottom: "1px solid #f3f2f1" }}
                        onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.backgroundColor = "#faf9f8"}
                        onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.backgroundColor = ""}
                      >
                        <td className="px-5 py-2.5">
                          <p className="text-sm font-medium" style={{ color: "#323130" }}>{product.title}</p>
                          <p className="text-xs mt-0.5" style={{ color: "#a19f9d" }}>
                            {new Date(product.updatedAt).toLocaleDateString()}
                          </p>
                        </td>
                        <td className="px-5 py-2.5 text-sm" style={{ color: "#605e5c" }}>
                          {product.sku || <span style={{ color: "#c8c6c4" }}>—</span>}
                        </td>
                        <td className="px-5 py-2.5 text-sm" style={{ color: "#605e5c" }}>
                          ${product.price}
                        </td>
                        <td className="px-5 py-2.5">
                          <Badge variant={product.status === "published" ? "success" : "default"}>
                            {product.status}
                          </Badge>
                        </td>
                        <td className="px-5 py-2.5">
                          <div className="flex flex-wrap gap-1">
                            {product.syncs.length === 0 ? (
                              <span className="text-xs" style={{ color: "#a19f9d" }}>Not synced</span>
                            ) : (
                              product.syncs.map((sync) => (
                                <div key={sync.id} className="flex items-center gap-1">
                                  <SyncStatusBadge status={sync.status} />
                                  <span className="text-xs" style={{ color: "#605e5c" }}>{sync.site.name}</span>
                                </div>
                              ))
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-2.5">
                          <div className="flex flex-col gap-1">
                            {product.syncs
                              .filter((s) => s.status === "synced" && s.wooProductId)
                              .map((sync) => (
                                <a
                                  key={sync.id}
                                  href={`${sync.site.url.replace(/\/$/, "")}/?p=${sync.wooProductId}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-xs hover:underline"
                                  style={{ color: "#0078d4" }}
                                >
                                  <ExternalLink className="w-3 h-3" />
                                  {sync.site.name}
                                </a>
                              ))}
                            {product.syncs.filter((s) => s.status === "synced" && s.wooProductId).length === 0 && (
                              <span className="text-xs" style={{ color: "#c8c6c4" }}>—</span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-2.5 text-right">
                          <Link
                            href={`/products/${product.id}`}
                            className="inline-flex items-center gap-1.5 text-sm font-medium hover:underline" style={{ color: "#0078d4" }}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            Edit
                          </Link>
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
