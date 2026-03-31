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
          <div className="flex gap-3 flex-wrap">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All statuses</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
            <Link
              href="/products/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Product
            </Link>
          </div>

          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      SKU
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sync Status
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Live On
                    </th>
                    <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-gray-400 text-sm">
                        Loading...
                      </td>
                    </tr>
                  ) : products.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-gray-400 text-sm">
                        No products found.{" "}
                        <Link href="/products/new" className="text-indigo-600 hover:underline">
                          Add your first product
                        </Link>
                        .
                      </td>
                    </tr>
                  ) : (
                    products.map((product) => (
                      <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-3">
                          <p className="text-sm font-medium text-gray-900">{product.title}</p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {new Date(product.updatedAt).toLocaleDateString()}
                          </p>
                        </td>
                        <td className="px-6 py-3 text-sm text-gray-600">
                          {product.sku || <span className="text-gray-300">—</span>}
                        </td>
                        <td className="px-6 py-3 text-sm text-gray-600">
                          ${product.price}
                        </td>
                        <td className="px-6 py-3">
                          <Badge variant={product.status === "published" ? "success" : "default"}>
                            {product.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-3">
                          <div className="flex flex-wrap gap-1">
                            {product.syncs.length === 0 ? (
                              <span className="text-xs text-gray-400">Not synced</span>
                            ) : (
                              product.syncs.map((sync) => (
                                <div key={sync.id} className="flex items-center gap-1">
                                  <SyncStatusBadge status={sync.status} />
                                  <span className="text-xs text-gray-500">{sync.site.name}</span>
                                </div>
                              ))
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-3">
                          <div className="flex flex-col gap-1">
                            {product.syncs
                              .filter((s) => s.status === "synced" && s.wooProductId)
                              .map((sync) => (
                                <a
                                  key={sync.id}
                                  href={`${sync.site.url.replace(/\/$/, "")}/?p=${sync.wooProductId}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 hover:underline"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                  {sync.site.name}
                                </a>
                              ))}
                            {product.syncs.filter((s) => s.status === "synced" && s.wooProductId).length === 0 && (
                              <span className="text-xs text-gray-300">—</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-3 text-right">
                          <Link
                            href={`/products/${product.id}`}
                            className="inline-flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
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
