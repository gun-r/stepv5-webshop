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
import { VariationsEditor, VariationsData } from "@/components/ui/VariationsEditor";
import { Badge, SyncStatusBadge } from "@/components/ui/Badge";
import {
  ArrowLeft, Save, Trash2, RefreshCw, ExternalLink, Sparkles, Globe,
} from "lucide-react";

const EMPTY_VARIATIONS: VariationsData = { attributes: [], items: [] };

const LANGUAGES: Record<string, string> = {
  en: "English", da: "Danish", es: "Spanish", fr: "French",
  de: "German", it: "Italian", pt: "Portuguese", nl: "Dutch",
  sv: "Swedish", nb: "Norwegian", fi: "Finnish", pl: "Polish",
  ru: "Russian", zh: "Chinese", ja: "Japanese", ar: "Arabic",
};

interface Translation {
  id: string;
  language: string;
  title: string;
  shortDescription: string | null;
  description: string | null;
  price: string | null;
  salePrice: string | null;
}

interface SyncRecord {
  id: string; status: string; wooProductId: number | null;
  lastSyncedAt: string | null; errorMessage: string | null;
  site: { id: string; name: string; url: string; defaultLanguage: string; currency: string };
}

interface Site {
  id: string; name: string; url: string; defaultLanguage: string; currency: string;
}

interface Product {
  id: string; title: string; description: string | null;
  shortDescription: string | null; productType: string;
  price: string; salePrice: string | null; sku: string | null;
  manageStock: boolean; stockQuantity: number | null;
  images: string; categories: string; tags: string; variations: string;
  status: string; syncs: SyncRecord[]; translations: Translation[];
}

interface TransFields {
  title: string;
  shortDescription: string;
  description: string;
  price: string;
  salePrice: string;
}

type Tab = "details" | "inventory" | "sync";

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

  const [form, setForm] = useState({
    title: "", description: "", shortDescription: "",
    productType: "simple" as "simple" | "variable",
    price: "0", salePrice: "", sku: "",
    categories: "", tags: "", status: "draft",
    manageStock: false, stockQuantity: "",
  });
  const [images, setImages] = useState<string[]>([]);
  const [variations, setVariations] = useState<VariationsData>(EMPTY_VARIATIONS);

  // Translation state
  const [activeLang, setActiveLang] = useState<string | null>(null);
  const [transFields, setTransFields] = useState<Record<string, TransFields>>({});
  const [savingTrans, setSavingTrans] = useState(false);
  const [transError, setTransError] = useState("");
  const [aiLoading, setAiLoading] = useState<string | null>(null); // field name or "all"

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

    let parsedVariations: VariationsData = EMPTY_VARIATIONS;
    try { parsedVariations = JSON.parse(data.variations || "[]") as VariationsData; } catch { /* */ }
    if (!parsedVariations?.attributes) parsedVariations = EMPTY_VARIATIONS;

    setImages(parsedImages);
    setVariations(parsedVariations);
    setForm({
      title: data.title,
      description: data.description || "",
      shortDescription: data.shortDescription || "",
      productType: (data.productType || "simple") as "simple" | "variable",
      price: data.price,
      salePrice: data.salePrice || "",
      sku: data.sku || "",
      categories, tags,
      status: data.status,
      manageStock: data.manageStock || false,
      stockQuantity: data.stockQuantity !== null ? String(data.stockQuantity) : "",
    });

    // Load translations into transFields map
    const map: Record<string, TransFields> = {};
    for (const t of data.translations) {
      map[t.language] = {
        title: t.title,
        shortDescription: t.shortDescription || "",
        description: t.description || "",
        price: t.price || "",
        salePrice: t.salePrice || "",
      };
    }
    setTransFields(map);

    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchProduct();
    fetch("/api/sites").then((r) => r.json()).then((d: unknown) => {
      if (Array.isArray(d)) setSites(d as Site[]);
    });
  }, [fetchProduct]);

  function update(key: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function updateTrans(field: keyof TransFields, value: string) {
    if (!activeLang) return;
    setTransFields((prev) => ({
      ...prev,
      [activeLang]: { ...(prev[activeLang] || { title: "", shortDescription: "", description: "", price: "", salePrice: "" }), [field]: value },
    }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const payload = {
      ...form,
      images: JSON.stringify(images),
      categories: JSON.stringify(form.categories.split(",").map((s) => s.trim()).filter(Boolean)),
      tags: JSON.stringify(form.tags.split(",").map((s) => s.trim()).filter(Boolean)),
      salePrice: form.salePrice || null,
      sku: form.sku || null,
      stockQuantity: form.manageStock && form.stockQuantity ? parseInt(form.stockQuantity) : null,
      variations: JSON.stringify(variations),
    };

    const res = await fetch(`/api/products/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setSaving(false);
    if (res.ok) { await fetchProduct(); setError(""); }
    else { const data = await res.json() as { error?: string }; setError(data.error || "Failed to save"); }
  }

  async function handleDelete() {
    if (!confirm("Delete this product and all its sync records?")) return;
    setDeleting(true);
    const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
    if (res.ok) router.push("/products");
    else { setDeleting(false); setError("Failed to delete"); }
  }

  async function handleSaveTranslation() {
    if (!activeLang) return;
    setSavingTrans(true);
    setTransError("");
    const fields = transFields[activeLang] || { title: "", shortDescription: "", description: "", price: "", salePrice: "" };

    const res = await fetch(`/api/products/${id}/translate`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        language: activeLang,
        title: fields.title || product?.title || "",
        shortDescription: fields.shortDescription || null,
        description: fields.description || null,
        price: fields.price || null,
        salePrice: fields.salePrice || null,
      }),
    });

    setSavingTrans(false);
    if (res.ok) await fetchProduct();
    else { const data = await res.json() as { error?: string }; setTransError(data.error || "Failed to save"); }
  }

  async function handleAiTranslate(field?: keyof TransFields) {
    if (!activeLang) return;
    const loadingKey = field || "all";
    setAiLoading(loadingKey);
    setTransError("");

    const fields = field ? [field] : (["title", "shortDescription", "description"] as (keyof TransFields)[]);

    const res = await fetch(`/api/products/${id}/translate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetLanguage: activeLang, fields }),
    });

    setAiLoading(null);

    if (res.ok) {
      const saved = await res.json() as Translation;
      setTransFields((prev) => ({
        ...prev,
        [activeLang]: {
          title: saved.title,
          shortDescription: saved.shortDescription || "",
          description: saved.description || "",
          price: saved.price || prev[activeLang]?.price || "",
          salePrice: saved.salePrice || prev[activeLang]?.salePrice || "",
        },
      }));
      await fetchProduct();
    } else {
      const data = await res.json() as { error?: string };
      setTransError(data.error || "AI translation failed");
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
    const data = await res.json() as { results?: typeof syncResults };
    setSyncResults(data.results || []);
    setSyncing(false);
    await fetchProduct();
  }

  function toggleSite(siteId: string) {
    setSelectedSites((prev) => prev.includes(siteId) ? prev.filter((s) => s !== siteId) : [...prev, siteId]);
  }

  // Unique site languages (excluding base "en" to avoid confusion — show all connected langs)
  const siteLangs = sites.reduce<{ lang: string; siteName: string; currency: string }[]>((acc, site) => {
    if (!acc.find((x) => x.lang === site.defaultLanguage)) {
      acc.push({ lang: site.defaultLanguage, siteName: site.name, currency: site.currency });
    }
    return acc;
  }, []);

  const activeLangData = activeLang ? siteLangs.find((x) => x.lang === activeLang) : null;
  const currentTrans = activeLang ? (transFields[activeLang] || { title: "", shortDescription: "", description: "", price: "", salePrice: "" }) : null;

  if (loading || !product) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Header title="Edit Product" />
          <main className="flex-1 p-6 flex items-center justify-center">
            <div style={{ color: "#605e5c" }}>Loading...</div>
          </main>
        </div>
      </div>
    );
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "details", label: "Details" },
    { id: "inventory", label: "Inventory & Variations" },
    { id: "sync", label: `Sync (${product.syncs.length} sites)` },
  ];

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header title={product.title} subtitle="Edit product details, translations, and sync" />
        <main className="flex-1 p-4 max-w-4xl space-y-4">
          <Link href="/products" className="inline-flex items-center gap-1.5 text-sm" style={{ color: "#605e5c" }}>
            <ArrowLeft className="w-4 h-4" />Back to Products
          </Link>

          {/* Tabs */}
          <div style={{ borderBottom: "1px solid #edebe9" }}>
            <nav className="flex">
              {tabs.map((t) => (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className="px-4 py-2.5 text-sm font-medium border-b-2 transition-colors"
                  style={tab === t.id
                    ? { borderBottomColor: "#0078d4", color: "#0078d4" }
                    : { borderBottomColor: "transparent", color: "#605e5c" }
                  }
                  onMouseEnter={(e) => { if (tab !== t.id) (e.currentTarget as HTMLElement).style.color = "#323130"; }}
                  onMouseLeave={(e) => { if (tab !== t.id) (e.currentTarget as HTMLElement).style.color = "#605e5c"; }}
                >
                  {t.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Live links banner */}
          {product.syncs.some((s) => s.status === "synced" && s.wooProductId) && (
            <div className="flex flex-wrap items-center gap-3 px-4 py-2.5" style={{ backgroundColor: "#dff6dd", border: "1px solid #107c10" }}>
              <span className="text-xs font-semibold" style={{ color: "#107c10" }}>Live on:</span>
              {product.syncs.filter((s) => s.status === "synced" && s.wooProductId).map((s) => (
                <a key={s.id} href={`${s.site.url.replace(/\/$/, "")}/?p=${s.wooProductId}`}
                  target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-medium hover:underline" style={{ color: "#107c10" }}>
                  <ExternalLink className="w-3 h-3" />{s.site.name}
                </a>
              ))}
            </div>
          )}

          {/* Details Tab */}
          {tab === "details" && (
            <form onSubmit={handleSave} className="space-y-6">
              <Card>
                <CardHeader><CardTitle>Product Type</CardTitle></CardHeader>
                <CardContent>
                  <Select label="Type" value={form.productType} onChange={(e) => update("productType", e.target.value as "simple" | "variable")}>
                    <option value="simple">Simple Product</option>
                    <option value="variable">Variable Product</option>
                  </Select>
                </CardContent>
              </Card>

              {/* Product Information with inline translation */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <CardTitle>Product Information</CardTitle>
                    {/* Language switcher */}
                    {siteLangs.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Globe className="w-3.5 h-3.5 shrink-0" style={{ color: "#605e5c" }} />
                        <button
                          type="button"
                          onClick={() => setActiveLang(null)}
                          className="px-2.5 py-1 text-xs font-medium rounded transition-colors"
                          style={activeLang === null
                            ? { backgroundColor: "#0078d4", color: "#fff" }
                            : { backgroundColor: "#f3f2f1", color: "#323130" }
                          }
                        >
                          Base
                        </button>
                        {siteLangs.map((sl) => (
                          <button
                            key={sl.lang}
                            type="button"
                            onClick={() => setActiveLang(sl.lang)}
                            className="px-2.5 py-1 text-xs font-medium rounded transition-colors"
                            style={activeLang === sl.lang
                              ? { backgroundColor: "#0078d4", color: "#fff" }
                              : {
                                  backgroundColor: transFields[sl.lang] ? "#dff6dd" : "#f3f2f1",
                                  color: transFields[sl.lang] ? "#107c10" : "#323130",
                                }
                            }
                            title={`${sl.siteName} · ${sl.currency}`}
                          >
                            {sl.lang.toUpperCase()}
                            {transFields[sl.lang] ? " ✓" : ""}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Translation mode banner */}
                  {activeLang && activeLangData && (
                    <div className="flex items-center justify-between gap-3 px-3 py-2 rounded"
                      style={{ backgroundColor: "#f0f6ff", border: "1px solid #0078d4" }}>
                      <div>
                        <span className="text-xs font-semibold" style={{ color: "#0078d4" }}>
                          Editing: {LANGUAGES[activeLang] || activeLang} ({activeLang.toUpperCase()})
                        </span>
                        <span className="text-xs ml-2" style={{ color: "#605e5c" }}>
                          {activeLangData.siteName} · {activeLangData.currency}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={aiLoading === "all"}
                          onClick={() => handleAiTranslate()}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded transition-colors disabled:opacity-50"
                          style={{ backgroundColor: "#fff", border: "1px solid #0078d4", color: "#0078d4" }}
                        >
                          <Sparkles className="w-3 h-3" />
                          {aiLoading === "all" ? "Translating…" : "AI Translate All"}
                        </button>
                        <button
                          type="button"
                          disabled={savingTrans}
                          onClick={handleSaveTranslation}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded transition-colors disabled:opacity-50"
                          style={{ backgroundColor: "#0078d4", color: "#fff" }}
                        >
                          {savingTrans ? "Saving…" : "Save Translation"}
                        </button>
                      </div>
                    </div>
                  )}

                  {transError && (
                    <div className="p-3 text-xs rounded" style={{ backgroundColor: "#fde7e9", border: "1px solid #a4262c", color: "#a4262c" }}>
                      {transError}
                    </div>
                  )}

                  {/* Title field */}
                  <div className="space-y-1">
                    {activeLang && currentTrans ? (
                      <div className="relative">
                        <Input
                          label={`Title (${activeLang.toUpperCase()})`}
                          value={currentTrans.title}
                          onChange={(e) => updateTrans("title", e.target.value)}
                          required={false}
                          placeholder={`${form.title} — translate here`}
                        />
                        <button
                          type="button"
                          disabled={aiLoading === "title"}
                          onClick={() => handleAiTranslate("title")}
                          className="absolute right-2 top-7 inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded transition-colors disabled:opacity-50"
                          style={{ backgroundColor: "#f3f2f1", color: "#605e5c" }}
                          title="AI translate this field"
                        >
                          <Sparkles className="w-3 h-3" />
                          {aiLoading === "title" ? "…" : "AI"}
                        </button>
                      </div>
                    ) : (
                      <Input label="Title" value={form.title} onChange={(e) => update("title", e.target.value)} required />
                    )}
                  </div>

                  {/* Short Description field */}
                  <div className="space-y-1">
                    {activeLang && currentTrans ? (
                      <div className="relative">
                        <Textarea
                          label={`Short Description (${activeLang.toUpperCase()})`}
                          value={currentTrans.shortDescription}
                          onChange={(e) => updateTrans("shortDescription", e.target.value)}
                          rows={2}
                          placeholder={form.shortDescription || "Brief summary…"}
                        />
                        <button
                          type="button"
                          disabled={aiLoading === "shortDescription"}
                          onClick={() => handleAiTranslate("shortDescription")}
                          className="absolute right-2 top-7 inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded transition-colors disabled:opacity-50"
                          style={{ backgroundColor: "#f3f2f1", color: "#605e5c" }}
                          title="AI translate this field"
                        >
                          <Sparkles className="w-3 h-3" />
                          {aiLoading === "shortDescription" ? "…" : "AI"}
                        </button>
                      </div>
                    ) : (
                      <Textarea label="Short Description" value={form.shortDescription} onChange={(e) => update("shortDescription", e.target.value)} rows={2} placeholder="Brief summary..." />
                    )}
                  </div>

                  {/* Description field */}
                  <div className="space-y-1">
                    {activeLang && currentTrans ? (
                      <div className="relative">
                        <Textarea
                          label={`Description (${activeLang.toUpperCase()})`}
                          value={currentTrans.description}
                          onChange={(e) => updateTrans("description", e.target.value)}
                          rows={6}
                          placeholder={form.description || "Full description…"}
                        />
                        <button
                          type="button"
                          disabled={aiLoading === "description"}
                          onClick={() => handleAiTranslate("description")}
                          className="absolute right-2 top-7 inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded transition-colors disabled:opacity-50"
                          style={{ backgroundColor: "#f3f2f1", color: "#605e5c" }}
                          title="AI translate this field"
                        >
                          <Sparkles className="w-3 h-3" />
                          {aiLoading === "description" ? "…" : "AI"}
                        </button>
                      </div>
                    ) : (
                      <Textarea label="Description" value={form.description} onChange={(e) => update("description", e.target.value)} rows={6} />
                    )}
                  </div>

                  {/* Base-only fields: pricing, SKU, images, categories, tags */}
                  {!activeLang && (
                    <>
                      {form.productType === "simple" && (
                        <div className="grid grid-cols-2 gap-4">
                          <Input label="Regular Price" value={form.price} onChange={(e) => update("price", e.target.value)} placeholder="29.99" />
                          <Input label="Sale Price" value={form.salePrice} onChange={(e) => update("salePrice", e.target.value)} placeholder="19.99 (optional)" />
                        </div>
                      )}
                      <Input label="SKU" value={form.sku} onChange={(e) => update("sku", e.target.value)} placeholder="PROD-001" />
                      <ImageUploader images={images} onChange={setImages} />
                      <Input label="Categories" value={form.categories} onChange={(e) => update("categories", e.target.value)} placeholder="Electronics, Gadgets" hint="Comma-separated — synced to WooCommerce" />
                      <Input label="Tags" value={form.tags} onChange={(e) => update("tags", e.target.value)} placeholder="new, sale" hint="Comma-separated — synced to WooCommerce" />
                      <Select label="Status" value={form.status} onChange={(e) => update("status", e.target.value)}>
                        <option value="draft">Draft</option>
                        <option value="published">Published</option>
                      </Select>
                    </>
                  )}

                  {/* Per-site pricing in translation mode */}
                  {activeLang && activeLangData && currentTrans && form.productType === "simple" && (
                    <div className="space-y-3 pt-1">
                      <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#605e5c" }}>
                        Pricing ({activeLangData.currency})
                      </p>
                      <div className="grid grid-cols-2 gap-4">
                        <Input
                          label={`Regular Price (${activeLangData.currency})`}
                          value={currentTrans.price}
                          onChange={(e) => updateTrans("price", e.target.value)}
                          placeholder={form.price || "0.00"}
                          hint={`Base: ${form.price || "0"}`}
                        />
                        <Input
                          label={`Sale Price (${activeLangData.currency})`}
                          value={currentTrans.salePrice}
                          onChange={(e) => updateTrans("salePrice", e.target.value)}
                          placeholder={form.salePrice || "optional"}
                          hint={form.salePrice ? `Base: ${form.salePrice}` : "optional"}
                        />
                      </div>
                    </div>
                  )}

                  {/* Non-pricing fields hint in translation mode */}
                  {activeLang && (
                    <p className="text-xs" style={{ color: "#a19f9d" }}>
                      SKU, images, categories, and tags are shared across all languages. Switch to Base to edit them.
                    </p>
                  )}

                  {error && (
                    <div className="p-3 text-sm" style={{ backgroundColor: "#fde7e9", border: "1px solid #a4262c", color: "#a4262c" }}>
                      {error}
                    </div>
                  )}

                  {!activeLang && (
                    <div className="flex gap-3 pt-2">
                      <Button type="submit" loading={saving}><Save className="w-4 h-4" />Save Changes</Button>
                      <Button type="button" variant="danger" loading={deleting} onClick={handleDelete}>
                        <Trash2 className="w-4 h-4" />Delete
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </form>
          )}

          {/* Inventory & Variations Tab */}
          {tab === "inventory" && (
            <form onSubmit={handleSave} className="space-y-6">
              {form.productType === "simple" && (
                <Card>
                  <CardHeader><CardTitle>Stock Management</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" checked={form.manageStock}
                        onChange={(e) => update("manageStock", e.target.checked)}
                        className="w-4 h-4 accent-blue-600" />
                      <span className="text-sm font-medium" style={{ color: "#323130" }}>
                        Track stock quantity for this product
                      </span>
                    </label>
                    {form.manageStock && (
                      <Input label="Stock Quantity" type="number" value={form.stockQuantity}
                        onChange={(e) => update("stockQuantity", e.target.value)} placeholder="0" />
                    )}
                  </CardContent>
                </Card>
              )}

              {form.productType === "variable" && (
                <Card>
                  <CardHeader><CardTitle>Variations</CardTitle></CardHeader>
                  <CardContent>
                    <VariationsEditor value={variations} onChange={setVariations} />
                  </CardContent>
                </Card>
              )}

              {form.productType === "simple" && !form.manageStock && (
                <div className="text-sm p-4" style={{ backgroundColor: "#fff4ce", border: "1px solid #8a6914", color: "#8a6914" }}>
                  Enable stock tracking above to manage inventory quantity.
                </div>
              )}

              <div className="flex gap-3">
                <Button type="submit" loading={saving}><Save className="w-4 h-4" />Save Changes</Button>
              </div>
            </form>
          )}

          {/* Sync Tab */}
          {tab === "sync" && (
            <div className="space-y-4">
              <Card>
                <CardHeader><CardTitle>Sync to Sites</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  {sites.length === 0 ? (
                    <p className="text-sm" style={{ color: "#605e5c" }}>
                      No sites configured.{" "}
                      <Link href="/sites/new" style={{ color: "#0078d4" }} className="hover:underline">Add a site first</Link>.
                    </p>
                  ) : (
                    <>
                      <div className="space-y-2">
                        {sites.map((site) => {
                          const syncRecord = product.syncs.find((s) => s.site.id === site.id);
                          const isSelected = selectedSites.includes(site.id);
                          return (
                            <div key={site.id}
                              className="flex items-center justify-between p-3 cursor-pointer"
                              style={isSelected ? { border: "1px solid #0078d4", backgroundColor: "#f0f6ff" } : { border: "1px solid #edebe9" }}
                              onClick={() => toggleSite(site.id)}
                            >
                              <div className="flex items-center gap-3">
                                <input type="checkbox" checked={isSelected} onChange={() => toggleSite(site.id)}
                                  className="w-4 h-4 accent-blue-600" onClick={(e) => e.stopPropagation()} />
                                <div>
                                  <p className="text-sm font-medium" style={{ color: "#323130" }}>{site.name}</p>
                                  <p className="text-xs" style={{ color: "#a19f9d" }}>
                                    {site.url} · <span className="uppercase font-medium">{site.defaultLanguage}</span>
                                    {site.currency && <span> · {site.currency}</span>}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3 shrink-0">
                                {syncRecord ? (
                                  <>
                                    <SyncStatusBadge status={syncRecord.status} />
                                    {syncRecord.lastSyncedAt && (
                                      <span className="text-xs" style={{ color: "#a19f9d" }}>
                                        {new Date(syncRecord.lastSyncedAt).toLocaleDateString()}
                                      </span>
                                    )}
                                    {syncRecord.wooProductId && (
                                      <span className="text-xs" style={{ color: "#a19f9d" }}>WC #{syncRecord.wooProductId}</span>
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
                        <Button type="button" onClick={handleSync} loading={syncing} disabled={selectedSites.length === 0}>
                          <RefreshCw className="w-4 h-4" />Sync Selected ({selectedSites.length})
                        </Button>
                        <Button type="button" variant="outline" onClick={() => setSelectedSites(sites.map((s) => s.id))}>
                          Select All
                        </Button>
                        <Button type="button" variant="ghost" onClick={() => setSelectedSites([])}>Clear</Button>
                      </div>
                    </>
                  )}

                  {syncResults.length > 0 && (
                    <div className="space-y-2 pt-2">
                      <p className="text-sm font-medium" style={{ color: "#323130" }}>Sync Results:</p>
                      {syncResults.map((r) => (
                        <div key={r.siteId} className="flex items-center gap-2 p-3 text-sm"
                          style={r.success ? { backgroundColor: "#dff6dd", color: "#107c10" } : { backgroundColor: "#fde7e9", color: "#a4262c" }}
                        >
                          <span className="font-medium">{r.siteName}:</span>
                          {r.success ? "Synced successfully!" : r.error || "Failed"}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {product.syncs.some((s) => s.errorMessage) && (
                <Card>
                  <CardHeader><CardTitle>Sync Errors</CardTitle></CardHeader>
                  <CardContent>
                    {product.syncs.filter((s) => s.errorMessage).map((s) => (
                      <div key={s.id} className="p-3 mb-2 text-sm" style={{ backgroundColor: "#fde7e9", border: "1px solid #a4262c" }}>
                        <p className="font-medium" style={{ color: "#a4262c" }}>{s.site.name}</p>
                        <p style={{ color: "#a4262c" }}>{s.errorMessage}</p>
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
