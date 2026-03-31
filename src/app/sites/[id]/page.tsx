"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { ArrowLeft, Save, Trash2, Wifi } from "lucide-react";

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

interface SiteData {
  id: string;
  name: string;
  url: string;
  consumerKey: string;
  consumerSecret: string;
  defaultLanguage: string;
  status: string;
}

export default function EditSitePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [form, setForm] = useState<SiteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/sites/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setForm(data);
        setLoading(false);
      });
  }, [id]);

  function update(key: string, value: string) {
    setForm((prev) => prev ? { ...prev, [key]: value } : null);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const res = await fetch(`/api/sites/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    setSaving(false);

    if (res.ok) {
      router.push("/sites");
    } else {
      const data = await res.json();
      setError(data.error || "Failed to save");
    }
  }

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this site? All sync records will be removed."))
      return;

    setDeleting(true);
    const res = await fetch(`/api/sites/${id}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/sites");
    } else {
      setDeleting(false);
      setError("Failed to delete site");
    }
  }

  async function handleTest() {
    setTesting(true);
    setTestResult(null);

    const res = await fetch(`/api/sites/${id}/test`, { method: "POST" });
    const data = await res.json();
    setTestResult(data);
    setTesting(false);
  }

  if (loading || !form) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Header title="Edit Site" />
          <main className="flex-1 p-6 flex items-center justify-center">
            <div className="text-gray-500">Loading...</div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header title={`Edit: ${form.name}`} subtitle="Update site configuration" />
        <main className="flex-1 p-6 max-w-2xl space-y-6">
          <Link
            href="/sites"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Sites
          </Link>

          <form onSubmit={handleSave}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Site Details</CardTitle>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  loading={testing}
                  onClick={handleTest}
                >
                  <Wifi className="w-4 h-4" />
                  Test Connection
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {testResult && (
                  <div
                    className={`p-3 rounded-lg border text-sm flex items-center gap-2 ${
                      testResult.success
                        ? "bg-green-50 border-green-200 text-green-700"
                        : "bg-red-50 border-red-200 text-red-700"
                    }`}
                  >
                    {testResult.message}
                  </div>
                )}

                <Input
                  label="Site Name"
                  value={form.name}
                  onChange={(e) => update("name", e.target.value)}
                  required
                />

                <Input
                  label="Site URL"
                  type="url"
                  value={form.url}
                  onChange={(e) => update("url", e.target.value)}
                  required
                />

                <Input
                  label="Consumer Key"
                  value={form.consumerKey}
                  onChange={(e) => update("consumerKey", e.target.value)}
                  required
                />

                <Input
                  label="Consumer Secret"
                  type="password"
                  value={form.consumerSecret}
                  onChange={(e) => update("consumerSecret", e.target.value)}
                  required
                />

                <Select
                  label="Default Language"
                  value={form.defaultLanguage}
                  onChange={(e) => update("defaultLanguage", e.target.value)}
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
