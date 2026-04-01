"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Select } from "@/components/ui/Input";
import { ImageUploader } from "@/components/ui/ImageUploader";
import { ArrowLeft, Save, Globe } from "lucide-react";

interface Site {
  id: string;
  name: string;
  url: string;
  status: string;
}

export default function NewProductPage() {
  const router = useRouter();
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
  const [sites, setSites] = useState<Site[]>([]);
  const [selectedSites, setSelectedSites] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/sites")
      .then((r) => r.json())
      .then((data) => setSites(Array.isArray(data) ? data.filter((s: Site) => s.status === "active") : []))
      .catch(() => {});
  }, []);

  function toggleSite(id: string) {
    setSelectedSites((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  }

  function update(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const payload = {
      ...form,
      images: JSON.stringify(images),
      categories: JSON.stringify(
        form.categories
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      ),
      tags: JSON.stringify(
        form.tags
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      ),
      salePrice: form.salePrice || undefined,
      sku: form.sku || undefined,
    };

    const res = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      setSaving(false);
      const data = await res.json();
      setError(data.error || "Failed to create product");
      return;
    }

    const product = await res.json();

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
        <main className="flex-1 p-6 max-w-3xl">
          <Link
            href="/products"
            className="inline-flex items-center gap-1.5 text-sm mb-6" style={{ color: "#605e5c" }}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Products
          </Link>

          <form onSubmit={handleSubmit} className="space-y-6">
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
                  placeholder="Product name"
                />

                <Textarea
                  label="Description"
                  value={form.description}
                  onChange={(e) => update("description", e.target.value)}
                  rows={5}
                  placeholder="Product description..."
                />

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Regular Price"
                    type="text"
                    value={form.price}
                    onChange={(e) => update("price", e.target.value)}
                    placeholder="29.99"
                  />
                  <Input
                    label="Sale Price"
                    type="text"
                    value={form.salePrice}
                    onChange={(e) => update("salePrice", e.target.value)}
                    placeholder="19.99 (optional)"
                  />
                </div>

                <Input
                  label="SKU"
                  value={form.sku}
                  onChange={(e) => update("sku", e.target.value)}
                  placeholder="PROD-001 (optional)"
                />

                <ImageUploader images={images} onChange={setImages} />

                <Input
                  label="Categories"
                  value={form.categories}
                  onChange={(e) => update("categories", e.target.value)}
                  placeholder="Electronics, Gadgets"
                  hint="Comma-separated category names"
                />

                <Input
                  label="Tags"
                  value={form.tags}
                  onChange={(e) => update("tags", e.target.value)}
                  placeholder="new, sale, featured"
                  hint="Comma-separated tags"
                />

                <Select
                  label="Status"
                  value={form.status}
                  onChange={(e) => update("status", e.target.value)}
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </Select>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  Publish to Websites
                </CardTitle>
              </CardHeader>
              <CardContent>
                {sites.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    No active sites found.{" "}
                    <Link href="/sites/new" className="hover:underline" style={{ color: "#0078d4" }}>
                      Add a site
                    </Link>{" "}
                    first.
                  </p>
                ) : (
                  <div className="space-y-3">
                    <p className="text-xs" style={{ color: "#605e5c" }}>
                      Select which websites to sync this product to after creation.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {sites.map((site) => (
                        <label
                          key={site.id}
                          className="flex items-center gap-3 p-3 cursor-pointer transition-colors"
                          style={selectedSites.includes(site.id)
                            ? { border: "1px solid #0078d4", backgroundColor: "#f0f6ff" }
                            : { border: "1px solid #edebe9", backgroundColor: "#ffffff" }
                          }
                        >
                          <input
                            type="checkbox"
                            checked={selectedSites.includes(site.id)}
                            onChange={() => toggleSite(site.id)}
                            className="w-4 h-4 rounded accent-blue-600"
                          />
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-gray-900 truncate">{site.name}</div>
                            <div className="text-xs text-gray-400 truncate">{site.url}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <Button type="submit" loading={saving}>
                <Save className="w-4 h-4" />
                Create Product
              </Button>
              <Link href="/products">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}
