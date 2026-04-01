"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { Save, CheckCircle } from "lucide-react";

interface Config {
  libreTranslateUrl: string;
  libreTranslateApiKey: string;
  autoTranslate: boolean;
  defaultSourceLanguage: string;
}

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

export default function SetupPage() {
  const [config, setConfig] = useState<Config>({
    libreTranslateUrl: "https://libretranslate.com",
    libreTranslateApiKey: "",
    autoTranslate: false,
    defaultSourceLanguage: "en",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/setup")
      .then((r) => r.json())
      .then((data) => {
        setConfig(data);
        setLoading(false);
      });
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSaved(false);

    const res = await fetch("/api/setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config),
    });

    setSaving(false);

    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } else {
      const data = await res.json();
      setError(data.error || "Failed to save");
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Header title="Setup" subtitle="Configure application settings" />
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
        <Header title="Setup" subtitle="Configure application settings" />
        <main className="flex-1 p-6 max-w-2xl">
          <form onSubmit={handleSave} className="space-y-6">
            {/* Translation Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Translation Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  label="LibreTranslate URL"
                  type="url"
                  value={config.libreTranslateUrl}
                  onChange={(e) =>
                    setConfig({ ...config, libreTranslateUrl: e.target.value })
                  }
                  placeholder="https://libretranslate.com"
                  hint="The base URL of your LibreTranslate instance"
                />

                <Input
                  label="LibreTranslate API Key"
                  type="password"
                  value={config.libreTranslateApiKey}
                  onChange={(e) =>
                    setConfig({ ...config, libreTranslateApiKey: e.target.value })
                  }
                  placeholder="your-api-key"
                  hint="Leave empty if your instance doesn't require authentication"
                />

                <Select
                  label="Default Source Language"
                  value={config.defaultSourceLanguage}
                  onChange={(e) =>
                    setConfig({ ...config, defaultSourceLanguage: e.target.value })
                  }
                  hint="The primary language your products are written in"
                >
                  {LANGUAGES.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.label} ({lang.code})
                    </option>
                  ))}
                </Select>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={config.autoTranslate}
                    onClick={() =>
                      setConfig({
                        ...config,
                        autoTranslate: !config.autoTranslate,
                      })
                    }
                    className="relative inline-flex h-5 w-10 items-center transition-colors focus:outline-none"
                    style={{ backgroundColor: config.autoTranslate ? "#0078d4" : "#c8c6c4" }}
                  >
                    <span
                      className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                        config.autoTranslate ? "translate-x-5" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      Auto-translate on sync
                    </p>
                    <p className="text-xs text-gray-500">
                      Automatically translate products when syncing to sites
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                {error}
              </div>
            )}

            {saved && (
              <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Settings saved successfully!
              </div>
            )}

            <div className="flex gap-3">
              <Button type="submit" loading={saving}>
                <Save className="w-4 h-4" />
                Save Settings
              </Button>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}
