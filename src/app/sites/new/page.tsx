"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { ArrowLeft, Save } from "lucide-react";

const LANGUAGES = [
  { code: "en", label: "English" },
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

export default function NewSitePage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    url: "",
    consumerKey: "",
    consumerSecret: "",
    wpUsername: "",
    wpAppPassword: "",
    defaultLanguage: "en",
    status: "active",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function update(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const res = await fetch("/api/sites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    setSaving(false);

    if (res.ok) {
      router.push("/sites");
    } else {
      const data = await res.json();
      setError(data.error || "Failed to create site");
    }
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header title="Add Site" subtitle="Connect a new WooCommerce site" />
        <main className="flex-1 p-6 max-w-2xl">
          <Link
            href="/sites"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Sites
          </Link>

          <form onSubmit={handleSubmit}>
            <Card>
              <CardHeader>
                <CardTitle>Site Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  label="Site Name"
                  value={form.name}
                  onChange={(e) => update("name", e.target.value)}
                  required
                  placeholder="My WooCommerce Store"
                />

                <Input
                  label="Site URL"
                  type="url"
                  value={form.url}
                  onChange={(e) => update("url", e.target.value)}
                  required
                  placeholder="https://mystore.com"
                  hint="The base URL of your WordPress site"
                />

                <Input
                  label="Consumer Key"
                  value={form.consumerKey}
                  onChange={(e) => update("consumerKey", e.target.value)}
                  required
                  placeholder="ck_xxxxxxxxxxxxxxxxxxxx"
                  hint="WooCommerce REST API consumer key"
                />

                <Input
                  label="Consumer Secret"
                  type="password"
                  value={form.consumerSecret}
                  onChange={(e) => update("consumerSecret", e.target.value)}
                  required
                  placeholder="cs_xxxxxxxxxxxxxxxxxxxx"
                  hint="WooCommerce REST API consumer secret"
                />

                <div className="pt-2 pb-1">
                  <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#605e5c" }}>
                    WordPress Media Upload (for product images)
                  </p>
                  <p className="text-xs mt-1" style={{ color: "#a19f9d" }}>
                    Required to upload images directly to the WordPress media library.
                    Generate an Application Password in WordPress under Users › Profile › Application Passwords.
                  </p>
                </div>

                <Input
                  label="WP Username"
                  value={form.wpUsername}
                  onChange={(e) => update("wpUsername", e.target.value)}
                  placeholder="your-wp-username (optional)"
                />

                <Input
                  label="WP Application Password"
                  type="password"
                  value={form.wpAppPassword}
                  onChange={(e) => update("wpAppPassword", e.target.value)}
                  placeholder="xxxx xxxx xxxx xxxx xxxx xxxx (optional)"
                  hint="WordPress Application Password — not your login password"
                />

                <Select
                  label="Default Language"
                  value={form.defaultLanguage}
                  onChange={(e) => update("defaultLanguage", e.target.value)}
                  hint="Products synced to this site will use this language translation"
                >
                  {LANGUAGES.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.label} ({lang.code})
                    </option>
                  ))}
                </Select>

                <Select
                  label="Status"
                  value={form.status}
                  onChange={(e) => update("status", e.target.value)}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </Select>

                {error && (
                  <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                    {error}
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <Button type="submit" loading={saving}>
                    <Save className="w-4 h-4" />
                    Create Site
                  </Button>
                  <Link href="/sites">
                    <Button type="button" variant="outline">
                      Cancel
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </form>
        </main>
      </div>
    </div>
  );
}
