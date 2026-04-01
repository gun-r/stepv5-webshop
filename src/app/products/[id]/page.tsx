"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Select } from "@/components/ui/Input";
import { ImageUploader } from "@/components/ui/ImageUploader";
import { Badge, SyncStatusBadge } from "@/components/ui/Badge";
import {
  ArrowLeft,
  Save,
  Trash2,
  Languages,
  RefreshCw,
  Globe,
  ExternalLink,
} from "lucide-react";

const LANGUAGES = [
  { code: "es", label: "Spanish" },
  { code: "fr", label: "French" },
  { code: "de", label: "German" },
  { code: "it", label: "Italian" },
  { code: "pt", label: "Portuguese" },
  { code: "nl", label: "Dutch" },
  { code: "ru", label: "Russian" },
  { code: "zh", label: "Chinese" },
  { code: "ja", label: "Japanese" },
  { code: "ar", label: "Arabic" },
];

interface Translation {
  id: string;
  language: string;
  title: string;
  description: string | null;
}

interface SyncRecord {
  id: string;
  status: string;
  wooProductId: number | null;
  lastSyncedAt: string | null;
  errorMessage: string | null;
  site: { id: string; name: string; url: string; defaultLanguage: string };
}

interface Site {
  id: string;
  name: string;
  url: string;
  defaultLanguage: string;
}

interface Product {
  id: string;
  title: string;
  description: string | null;
  price: string;
  salePrice: string | null;
  sku: string | null;
  images: string;
  categories: string;
  tags: string;
  status: string;
  syncs: SyncRecord[];
  translations: Translation[];
}

type Tab = "details" | "translations" | "sync";

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [tab, setTab] = useState<Tab>("details");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  // Form state
  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "0",
    salePrice: "",
    sku: "",
    categories: "",
    tags: "",
    status: "draft",
  });
  const [images, setImages] = useState<string[]>([]);

  // Translation state
  const [targetLang, setTargetLang] = useState("es");
  const [translating, setTranslating] = useState(false);
  const [translateError, setTranslateError] = useState("");

  // Sync state
  const [sites, setSites] = useState<Site[]>([]);
  const [selectedSites, setSelectedSites] = useState<string[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [syncResults, setSyncResults] = useState<
    Array<{ siteId: string; siteName: string; success: boolean; error?: string }>
  >([]);

  const fetchProduct = useCallback(async () => {
    const res = await fetch(`/api/products/${id}`);
    const data: Product = await res.json();
    setProduct(data);

    const parsedImages = JSON.parse(data.images || "[]") as string[];
    const categories = (JSON.parse(data.categories || "[]") as string[]).join(", ");
    const tags = (JSON.parse(data.tags || "[]") as string[]).join(", ");

    setImages(parsedImages);
    setForm({
      title: data.title,
      description: data.description || "",
      price: data.price,
      salePrice: data.salePrice || "",
      sku: data.sku || "",
      categories,
      tags,
      status: data.status,
    });
    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchProduct();
    // Fetch sites for sync tab
    fetch("/api/sites").then((r) => r.json()).then(setSites);
  }, [fetchProduct]);

  function update(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const payload = {
      ...form,
      images: JSON.stringify(images),
      categories: JSON.stringify(
        form.categories.split(",").map((s) => s.trim()).filter(Boolean)
      ),
      tags: JSON.stringify(
        form.tags.split(",").map((s) => s.trim()).filter(Boolean)
      ),
      salePrice: form.salePrice || null,
      sku: form.sku || null,
    };

    const res = await fetch(`/api/products/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setSaving(false);

    if (res.ok) {
      await fetchProduct();
      setError("");
    } else {
      const data = await res.json();
      setError(data.error || "Failed to save");
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this product and all its sync records?")) return;
    setDeleting(true);
    const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
    if (res.ok) router.push("/products");
    else { setDeleting(false); setError("Failed to delete"); }
  }

  async function handleTranslate() {
    setTranslating(true);
    setTranslateError("");

    const res = await fetch(`/api/products/${id}/translate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetLanguage: targetLang }),
    });

    setTranslating(false);

    if (res.ok) {
      await fetchProduct();
    } else {
      const data = await res.json();
      setTranslateError(data.error || "Translation failed");
    }
  }

  async function handleSync() {
    if (selectedSites.length === 0) return;
    setSyncing(true);
    setSyncResults([]);

    const res = await fetch(`/api/products/${id}/sync`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ siteIds: selectedSites }),
    });

    const data = await res.json();
    setSyncResults(data.results || []);
    setSyncing(false);
    await fetchProduct();
  }

  function toggleSite(siteId: string) {
    setSelectedSites((prev) =>
      prev.includes(siteId) ? prev.filter((s) => s !== siteId) : [...prev, siteId]
    );
  }

  if (loading || !product) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Header title="Edit Product" />
          <main className="flex-1 p-6 flex items-center justify-center">
            <div className="text-gray-500">Loading...</div>
          </main>
        </div>
      </div>
    );
  }

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "details", label: "Details", icon: <Save className="w-4 h-4" /> },
    {
      id: "translations",
      label: `Translations (${product.translations.length})`,
      icon: <Languages className="w-4 h-4" />,
    },
    {
      id: "sync",
      label: `Sync (${product.syncs.length} sites)`,
      icon: <Globe className="w-4 h-4" />,
    },
  ];

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header
          title={product.title}
          subtitle="Edit product details, translations, and sync"
        />
        <main className="flex-1 p-6 max-w-4xl space-y-6">
          <Link
            href="/products"
            className="inline-flex items-center gap-1.5 text-sm" style={{ color: "#605e5c" }}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Products
          </Link>

          {/* Tabs */}
          <div style={{ borderBottom: "1px solid #edebe9" }}>
            <nav className="flex">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors"
                  style={tab === t.id
                    ? { borderBottomColor: "#0078d4", color: "#0078d4" }
                    : { borderBottomColor: "transparent", color: "#605e5c" }
                  }
                  onMouseEnter={(e) => { if (tab !== t.id) (e.currentTarget as HTMLElement).style.color = "#323130"; }}
                  onMouseLeave={(e) => { if (tab !== t.id) (e.currentTarget as HTMLElement).style.color = "#605e5c"; }}
                >
                  {t.icon}
                  {t.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Live links banner */}
          {product.syncs.some((s) => s.status === "synced" && s.wooProductId) && (
            <div className="flex flex-wrap items-center gap-3 px-4 py-2.5" style={{ backgroundColor: "#dff6dd", border: "1px solid #107c10" }}>
              <span className="text-xs font-semibold" style={{ color: "#107c10" }}>Live on:</span>
              {product.syncs
                .filter((s) => s.status === "synced" && s.wooProductId)
                .map((s) => (
                  <a
                    key={s.id}
                    href={`${s.site.url.replace(/\/$/, "")}/?p=${s.wooProductId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-medium hover:underline"
                    style={{ color: "#107c10" }}
                  >
                    <ExternalLink className="w-3 h-3" />
                    {s.site.name}
                  </a>
                ))}
            </div>
          )}

          {/* Details Tab */}
          {tab === "details" && (
            <form onSubmit={handleSave} className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Product Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Input
                    label="Title"
                    value={form.title}
                    onChange={(e) => update("title", e.target.value)}
                    required
                  />

                  <Textarea
                    label="Description"
                    value={form.description}
                    onChange={(e) => update("description", e.target.value)}
                    rows={6}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Regular Price"
                      value={form.price}
                      onChange={(e) => update("price", e.target.value)}
                      placeholder="29.99"
                    />
                    <Input
                      label="Sale Price"
                      value={form.salePrice}
                      onChange={(e) => update("salePrice", e.target.value)}
                      placeholder="19.99 (optional)"
                    />
                  </div>

                  <Input
                    label="SKU"
                    value={form.sku}
                    onChange={(e) => update("sku", e.target.value)}
                    placeholder="PROD-001"
                  />

                  <ImageUploader images={images} onChange={setImages} />

                  <Input
                    label="Categories"
                    value={form.categories}
                    onChange={(e) => update("categories", e.target.value)}
                    placeholder="Electronics, Gadgets"
                    hint="Comma-separated"
                  />

                  <Input
                    label="Tags"
                    value={form.tags}
                    onChange={(e) => update("tags", e.target.value)}
                    placeholder="new, sale"
                    hint="Comma-separated"
                  />

                  <Select
                    label="Status"
                    value={form.status}
                    onChange={(e) => update("status", e.target.value)}
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </Select>

                  {error && (
                    <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                      {error}
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <Button type="submit" loading={saving}>
                      <Save className="w-4 h-4" />
                      Save Changes
                    </Button>
                    <Button
                      type="button"
                      variant="danger"
                      loading={deleting}
                      onClick={handleDelete}
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </form>
          )}

          {/* Translations Tab */}
          {tab === "translations" && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Add Translation</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-3 items-end">
                    <div className="flex-1">
                      <Select
                        label="Target Language"
                        value={targetLang}
                        onChange={(e) => setTargetLang(e.target.value)}
                      >
                        {LANGUAGES.map((lang) => (
                          <option key={lang.code} value={lang.code}>
                            {lang.label} ({lang.code})
                          </option>
                        ))}
                      </Select>
                    </div>
                    <Button
                      type="button"
                      onClick={handleTranslate}
                      loading={translating}
                    >
                      <Languages className="w-4 h-4" />
                      Translate
                    </Button>
                  </div>

                  {translateError && (
                    <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                      {translateError}
                    </div>
                  )}

                  <p className="text-xs text-gray-500">
                    Translation uses LibreTranslate. Configure the URL and API key in Setup.
                  </p>
                </CardContent>
              </Card>

              {/* Existing Translations */}
              {product.translations.length > 0 ? (
                <div className="space-y-3">
                  {product.translations.map((t) => (
                    <Card key={t.id}>
                      <CardContent className="py-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Badge variant="info">
                            {LANGUAGES.find((l) => l.code === t.language)?.label ||
                              t.language}
                          </Badge>
                          <span className="text-xs text-gray-400 uppercase">
                            {t.language}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-gray-900 mb-1">
                          {t.title}
                        </p>
                        {t.description && (
                          <p className="text-sm text-gray-600 line-clamp-3">
                            {t.description}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400 text-sm">
                  No translations yet. Use the form above to add one.
                </div>
              )}
            </div>
          )}

          {/* Sync Tab */}
          {tab === "sync" && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Sync to Sites</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {sites.length === 0 ? (
                    <p className="text-sm text-gray-500">
                      No sites configured yet.{" "}
                      <Link href="/sites/new" className="text-indigo-600 hover:underline">
                        Add a site first
                      </Link>
                      .
                    </p>
                  ) : (
                    <>
                      <div className="space-y-2">
                        {sites.map((site) => {
                          const syncRecord = product.syncs.find(
                            (s) => s.site.id === site.id
                          );
                          const isSelected = selectedSites.includes(site.id);

                          return (
                            <div
                              key={site.id}
                              className="flex items-center justify-between p-3 transition-colors cursor-pointer"
                            style={isSelected
                              ? { border: "1px solid #0078d4", backgroundColor: "#f0f6ff" }
                              : { border: "1px solid #edebe9", backgroundColor: "#ffffff" }
                            }
                              onClick={() => toggleSite(site.id)}
                            >
                              <div className="flex items-center gap-3">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleSite(site.id)}
                                  className="w-4 h-4 rounded text-indigo-600"
                                  onClick={(e) => e.stopPropagation()}
                                />
                                <div>
                                  <p className="text-sm font-medium text-gray-900">
                                    {site.name}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {site.url} · Lang:{" "}
                                    <span className="uppercase font-medium">
                                      {site.defaultLanguage}
                                    </span>
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3 shrink-0">
                                {syncRecord ? (
                                  <>
                                    <SyncStatusBadge status={syncRecord.status} />
                                    {syncRecord.lastSyncedAt && (
                                      <span className="text-xs text-gray-400">
                                        {new Date(
                                          syncRecord.lastSyncedAt
                                        ).toLocaleDateString()}
                                      </span>
                                    )}
                                    {syncRecord.wooProductId && (
                                      <span className="text-xs text-gray-400">
                                        WC #{syncRecord.wooProductId}
                                      </span>
                                    )}
                                  </>
                                ) : (
                                  <Badge variant="default">Not synced</Badge>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="flex gap-3 pt-2">
                        <Button
                          type="button"
                          onClick={handleSync}
                          loading={syncing}
                          disabled={selectedSites.length === 0}
                        >
                          <RefreshCw className="w-4 h-4" />
                          Sync Selected ({selectedSites.length})
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() =>
                            setSelectedSites(sites.map((s) => s.id))
                          }
                        >
                          Select All
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => setSelectedSites([])}
                        >
                          Clear
                        </Button>
                      </div>
                    </>
                  )}

                  {/* Sync Results */}
                  {syncResults.length > 0 && (
                    <div className="space-y-2 pt-2">
                      <p className="text-sm font-medium text-gray-700">
                        Sync Results:
                      </p>
                      {syncResults.map((r) => (
                        <div
                          key={r.siteId}
                          className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
                            r.success
                              ? "bg-green-50 text-green-700"
                              : "bg-red-50 text-red-700"
                          }`}
                        >
                          <span className="font-medium">{r.siteName}:</span>
                          {r.success
                            ? "Synced successfully!"
                            : r.error || "Failed"}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Sync history */}
              {product.syncs.some((s) => s.errorMessage) && (
                <Card>
                  <CardHeader>
                    <CardTitle>Sync Errors</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {product.syncs
                      .filter((s) => s.errorMessage)
                      .map((s) => (
                        <div
                          key={s.id}
                          className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm"
                        >
                          <p className="font-medium text-red-800">
                            {s.site.name}
                          </p>
                          <p className="text-red-600 mt-1">{s.errorMessage}</p>
                        </div>
                      ))}
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
