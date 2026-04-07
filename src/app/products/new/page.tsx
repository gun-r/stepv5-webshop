"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Select } from "@/components/ui/Input";
import { ImagePicker } from "@/components/ui/ImagePicker";
import { VariationsEditor, VariationsData } from "@/components/ui/VariationsEditor";
import { ArrowLeft, Save, Globe, Database, Search, X, CheckCircle, ChevronRight } from "lucide-react";

interface Site { id: string; name: string; url: string; status: string; }

const EMPTY_VARIATIONS: VariationsData = { attributes: [], items: [] };

interface DbMapping {
  tableName: string;
  searchColumn: string;
  displayColumns: string[];
  fieldMappings: Record<string, string>;
}

interface DbRow { [key: string]: unknown }

// Product form fields that can be auto-populated
const PRODUCT_FIELDS = [
  "title", "shortDescription", "description", "price", "salePrice", "sku",
  "categories", "tags", "stockQuantity",
] as const;

export default function NewProductPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: "",
    description: "",
    shortDescription: "",
    productType: "simple" as "simple" | "variable",
    price: "0",
    salePrice: "",
    sku: "",
    categories: "",
    tags: "",
    status: "draft",
    manageStock: false,
    stockQuantity: "",
  });
  const [images, setImages] = useState<string[]>([]);
  const [variations, setVariations] = useState<VariationsData>(EMPTY_VARIATIONS);
  const [sites, setSites] = useState<Site[]>([]);
  const [selectedSites, setSelectedSites] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // DB Search state
  const [dbMapping, setDbMapping] = useState<DbMapping | null>(null);
  const [dbQuery, setDbQuery] = useState("");
  const [dbResults, setDbResults] = useState<DbRow[]>([]);
  const [dbSearching, setDbSearching] = useState(false);
  const [dbSearchError, setDbSearchError] = useState("");
  const [dbPopulated, setDbPopulated] = useState(false);
  const [unmappedCols, setUnmappedCols] = useState<string[]>([]);
  const [selectedRow, setSelectedRow] = useState<DbRow | null>(null);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/sites")
      .then((r) => r.json())
      .then((data: unknown) =>
        setSites(Array.isArray(data) ? (data as Site[]).filter((s) => s.status === "active") : [])
      )
      .catch(() => {});

    // Load products page mapping
    fetch("/api/settings/mssql/mappings")
      .then((r) => r.json())
      .then((data: { mappings?: Array<{ page: string; tableName: string; searchColumn: string; displayColumns: string; fieldMappings: string }> }) => {
        const m = data.mappings?.find((x) => x.page === "products");
        if (m && m.tableName && m.searchColumn) {
          setDbMapping({
            tableName: m.tableName,
            searchColumn: m.searchColumn,
            displayColumns: JSON.parse(m.displayColumns),
            fieldMappings: JSON.parse(m.fieldMappings),
          });
        }
      })
      .catch(() => {});
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Debounced DB search
  useEffect(() => {
    if (!dbMapping || !dbQuery.trim()) {
      setDbResults([]);
      setDbSearchError("");
      return;
    }
    const t = setTimeout(async () => {
      setDbSearching(true);
      setDbSearchError("");
      try {
        const res = await fetch(
          `/api/settings/mssql/search?table=${encodeURIComponent(dbMapping.tableName)}&column=${encodeURIComponent(dbMapping.searchColumn)}&q=${encodeURIComponent(dbQuery)}`
        );
        const data = await res.json() as { rows?: DbRow[]; error?: string };
        if (!res.ok || data.error) {
          setDbSearchError(data.error || "Search failed");
          setDbResults([]);
        } else {
          setDbResults(data.rows || []);
        }
      } catch {
        setDbSearchError("Network error — could not reach server");
        setDbResults([]);
      }
      setDbSearching(false);
      setShowResults(true);
    }, 350);
    return () => clearTimeout(t);
  }, [dbQuery, dbMapping]);

  function populateFromRow(row: DbRow) {
    if (!dbMapping) return;
    const updates: Partial<typeof form> = {};
    const unmapped: string[] = [];

    for (const [field, dbCol] of Object.entries(dbMapping.fieldMappings)) {
      if (!dbCol) continue;
      const val = row[dbCol];
      if (val == null) continue;
      const strVal = String(val);
      if (PRODUCT_FIELDS.includes(field as typeof PRODUCT_FIELDS[number])) {
        (updates as Record<string, string>)[field] = strVal;
      }
    }

    // Detect DB columns that are not mapped to any field
    for (const col of Object.keys(row)) {
      const isMapped = Object.values(dbMapping.fieldMappings).includes(col);
      if (!isMapped) unmapped.push(col);
    }

    setForm((prev) => ({ ...prev, ...updates }));
    setSelectedRow(row);
    setUnmappedCols(unmapped);
    setDbPopulated(true);
    setShowResults(false);
    setDbQuery("");
  }

  function clearDbData() {
    setDbPopulated(false);
    setSelectedRow(null);
    setUnmappedCols([]);
    setDbQuery("");
    setDbResults([]);
  }

  function toggleSite(id: string) {
    setSelectedSites((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  }

  function update(key: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const payload = {
      ...form,
      images: JSON.stringify(images),
      categories: JSON.stringify(form.categories.split(",").map((s) => s.trim()).filter(Boolean)),
      tags: JSON.stringify(form.tags.split(",").map((s) => s.trim()).filter(Boolean)),
      salePrice: form.salePrice || undefined,
      sku: form.sku || undefined,
      stockQuantity: form.manageStock && form.stockQuantity ? parseInt(form.stockQuantity) : null,
      variations: JSON.stringify(variations),
    };

    const res = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      setSaving(false);
      const data = await res.json() as { error?: string };
      setError(data.error || "Failed to create product");
      return;
    }

    const product = await res.json() as { id: string };

    if (selectedSites.length > 0) {
      await fetch(`/api/products/${product.id}/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ siteIds: selectedSites }),
      });
    }

    setSaving(false);
    router.push(`/products/${product.id}`);
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header title="Add Product" subtitle="Create a new product" />
        <main className="flex-1 p-4 overflow-y-auto">
          <div className="w-full">
          <Link href="/products" className="inline-flex items-center gap-1.5 text-xs mb-4" style={{ color: "#605e5c" }}>
            <ArrowLeft className="w-3.5 h-3.5" />Back to Products
          </Link>

          {/* DB Search — full width above the 2-col layout */}
          {dbMapping && (
            <div className="mb-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="w-3.5 h-3.5" />Import from Database
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-xs" style={{ color: "#605e5c" }}>
                    Search <span className="font-mono font-semibold">{dbMapping.tableName}</span> by{" "}
                    <span className="font-mono font-semibold">{dbMapping.searchColumn}</span> and auto-fill the form.
                  </p>

                  {dbPopulated && selectedRow ? (
                    <div className="p-2.5 text-xs flex items-start gap-2" style={{ backgroundColor: "#dff6dd", border: "1px solid #107c10", color: "#107c10" }}>
                      <CheckCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                      <div className="flex-1">
                        <span>Form populated from row: <strong>{String(selectedRow[dbMapping.searchColumn] ?? "")}</strong></span>
                        <button type="button" onClick={clearDbData} className="ml-2 underline text-xs" style={{ color: "#a4262c" }}>
                          Clear
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div ref={searchRef} className="relative">
                      <div className="relative">
                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: "#a19f9d" }} />
                        <input
                          type="text"
                          value={dbQuery}
                          onChange={(e) => setDbQuery(e.target.value)}
                          placeholder={`Search by ${dbMapping.searchColumn}…`}
                          className="w-full text-xs pl-7 pr-8 py-1.5 border outline-none focus:ring-1"
                          style={{ border: "1px solid #c8c6c4", color: "#323130" }}
                          onFocus={() => dbResults.length > 0 && setShowResults(true)}
                        />
                        {dbQuery && (
                          <button type="button" onClick={() => { setDbQuery(""); setDbResults([]); setShowResults(false); }}
                            className="absolute right-2 top-1/2 -translate-y-1/2">
                            <X className="w-3 h-3" style={{ color: "#a19f9d" }} />
                          </button>
                        )}
                      </div>

                      {/* Results dropdown */}
                      {showResults && (
                        <div className="absolute z-50 w-full mt-1 shadow-lg border overflow-hidden"
                          style={{ backgroundColor: "#ffffff", border: "1px solid #edebe9", maxHeight: "240px", overflowY: "auto" }}>
                          {dbSearching ? (
                            <div className="px-3 py-2 text-xs" style={{ color: "#a19f9d" }}>Searching…</div>
                          ) : dbSearchError ? (
                            <div className="px-3 py-2 text-xs" style={{ color: "#a4262c" }}>⚠ {dbSearchError}</div>
                          ) : dbResults.length === 0 ? (
                            <div className="px-3 py-2 text-xs" style={{ color: "#a19f9d" }}>No results found</div>
                          ) : (
                            dbResults.map((row, i) => {
                              const displayCols = dbMapping.displayColumns.length > 0
                                ? dbMapping.displayColumns
                                : [dbMapping.searchColumn];
                              return (
                                <button
                                  key={i}
                                  type="button"
                                  onClick={() => populateFromRow(row)}
                                  className="w-full flex items-center gap-2 px-3 py-1.5 text-left text-xs transition-colors"
                                  style={{ borderBottom: "1px solid #f3f2f1" }}
                                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "#f3f2f1")}
                                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "")}
                                >
                                  <ChevronRight className="w-3 h-3 shrink-0" style={{ color: "#0078d4" }} />
                                  <div className="flex gap-3 flex-wrap">
                                    {displayCols.map((col) => (
                                      <span key={col}>
                                        <span className="font-mono" style={{ color: "#a19f9d" }}>{col}: </span>
                                        <span style={{ color: "#323130" }}>{String(row[col] ?? "")}</span>
                                      </span>
                                    ))}
                                  </div>
                                </button>
                              );
                            })
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* 2-column layout: form (left 60%) + unmapped panel (right 40%) */}
          <div className="flex gap-4 items-start">

            {/* LEFT — WooCommerce form (60%) */}
            <form onSubmit={handleSubmit} className="space-y-4" style={{ width: "60%" }}>

              {/* Product Type */}
              <Card>
                <CardHeader><CardTitle>Product Type</CardTitle></CardHeader>
                <CardContent>
                  <Select label="Type" value={form.productType} onChange={(e) => update("productType", e.target.value as "simple" | "variable")}>
                    <option value="simple">Simple Product</option>
                    <option value="variable">Variable Product</option>
                  </Select>
                </CardContent>
              </Card>

              {/* Product Information */}
              <Card>
                <CardHeader><CardTitle>Product Information</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <Input label="Title" value={form.title} onChange={(e) => update("title", e.target.value)} required placeholder="Product name" />
                  <Textarea label="Short Description" value={form.shortDescription} onChange={(e) => update("shortDescription", e.target.value)} rows={2} placeholder="Brief summary shown in product listings..." />
                  <Textarea label="Description" value={form.description} onChange={(e) => update("description", e.target.value)} rows={4} placeholder="Full product description..." />
                  {form.productType === "simple" && (
                    <div className="grid grid-cols-2 gap-3">
                      <Input label="Regular Price" type="text" value={form.price} onChange={(e) => update("price", e.target.value)} placeholder="29.99" />
                      <Input label="Sale Price" type="text" value={form.salePrice} onChange={(e) => update("salePrice", e.target.value)} placeholder="19.99 (optional)" />
                    </div>
                  )}
                  <Input label="SKU" value={form.sku} onChange={(e) => update("sku", e.target.value)} placeholder="PROD-001 (optional)" />
                  <ImagePicker images={images} onChange={setImages} />
                  <Input label="Categories" value={form.categories} onChange={(e) => update("categories", e.target.value)} placeholder="Electronics, Gadgets" hint="Comma-separated" />
                  <Input label="Tags" value={form.tags} onChange={(e) => update("tags", e.target.value)} placeholder="new, sale, featured" hint="Comma-separated" />
                  <Select label="Status" value={form.status} onChange={(e) => update("status", e.target.value)}>
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </Select>
                </CardContent>
              </Card>

              {/* Inventory */}
              {form.productType === "simple" && (
                <Card>
                  <CardHeader><CardTitle>Inventory</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input type="checkbox" checked={form.manageStock} onChange={(e) => update("manageStock", e.target.checked)} className="w-3.5 h-3.5 accent-blue-600" />
                      <span className="text-xs font-medium" style={{ color: "#323130" }}>Track stock quantity for this product</span>
                    </label>
                    {form.manageStock && (
                      <Input label="Stock Quantity" type="number" value={form.stockQuantity} onChange={(e) => update("stockQuantity", e.target.value)} placeholder="0" />
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Variations */}
              {form.productType === "variable" && (
                <Card>
                  <CardHeader><CardTitle>Variations</CardTitle></CardHeader>
                  <CardContent>
                    <VariationsEditor value={variations} onChange={setVariations} />
                  </CardContent>
                </Card>
              )}

              {/* Publish to Sites */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="w-3.5 h-3.5" />Publish to Websites
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {sites.length === 0 ? (
                    <p className="text-xs" style={{ color: "#605e5c" }}>
                      No active sites.{" "}
                      <Link href="/sites/new" style={{ color: "#0078d4" }} className="hover:underline">Add a site</Link> first.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {sites.map((site) => (
                        <label key={site.id} className="flex items-center gap-2.5 p-2.5 cursor-pointer"
                          style={selectedSites.includes(site.id)
                            ? { border: "1px solid #0078d4", backgroundColor: "#f0f6ff" }
                            : { border: "1px solid #edebe9" }
                          }
                        >
                          <input type="checkbox" checked={selectedSites.includes(site.id)} onChange={() => toggleSite(site.id)} className="w-3.5 h-3.5 accent-blue-600" />
                          <div className="min-w-0">
                            <div className="text-xs font-medium truncate" style={{ color: "#323130" }}>{site.name}</div>
                            <div className="text-xs truncate" style={{ color: "#a19f9d" }}>{site.url}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {error && (
                <div className="p-2.5 text-xs" style={{ backgroundColor: "#fde7e9", border: "1px solid #a4262c", color: "#a4262c" }}>
                  {error}
                </div>
              )}

              <div className="flex gap-3 pb-6">
                <Button type="submit" loading={saving}><Save className="w-3.5 h-3.5" />Create Product</Button>
                <Link href="/products"><Button type="button" variant="outline">Cancel</Button></Link>
              </div>
            </form>

            {/* RIGHT — Unmapped DB columns (sticky, only visible after a row is selected) */}
            {dbPopulated && unmappedCols.length > 0 && selectedRow && (
              <div className="sticky top-4" style={{ width: "40%" }}>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Database className="w-3.5 h-3.5" />Unmapped Columns
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <p className="text-xs px-3 pt-1 pb-2" style={{ color: "#a19f9d" }}>
                      Not auto-filled. Apply manually to a product field.
                    </p>
                    <div style={{ overflowY: "auto", maxHeight: "70vh" }}>
                      {unmappedCols.slice(0, 30).map((col) => (
                        <div
                          key={col}
                          className="px-3 py-2"
                          style={{ borderTop: "1px solid #f3f2f1" }}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-medium shrink-0 truncate" style={{ color: "#323130", maxWidth: "45%" }} title={col}>
                              {col}
                            </span>
                            <select
                              className="flex-1 text-xs py-1 px-1.5 outline-none min-w-0"
                              style={{ border: "1px solid #c8c6c4", color: "#323130", backgroundColor: "#fff" }}
                              onChange={(e) => {
                                const field = e.target.value;
                                if (field && selectedRow[col] != null) {
                                  update(field, String(selectedRow[col]));
                                }
                              }}
                              defaultValue=""
                            >
                              <option value="">— apply to —</option>
                              {PRODUCT_FIELDS.map((f) => (
                                <option key={f} value={f}>{f}</option>
                              ))}
                            </select>
                          </div>
                          <p className="text-xs mt-1 break-words" style={{ color: "#a19f9d" }}>
                            {String(selectedRow[col] ?? "—")}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
          </div>
        </main>
      </div>
    </div>
  );
}
