"use client";

import { useEffect, useState } from "react";
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
  { code: "en", label: "English" }, { code: "da", label: "Danish" },
  { code: "es", label: "Spanish" }, { code: "fr", label: "French" },
  { code: "de", label: "German" }, { code: "it", label: "Italian" },
  { code: "pt", label: "Portuguese" }, { code: "nl", label: "Dutch" },
  { code: "ru", label: "Russian" }, { code: "zh", label: "Chinese" },
  { code: "ja", label: "Japanese" }, { code: "ar", label: "Arabic" },
];

export default function TranslationSettingsPage() {
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
      .then((data: Config) => { setConfig(data); setLoading(false); });
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError(""); setSaved(false);
    const res = await fetch("/api/setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config),
    });
    setSaving(false);
    if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 3000); }
    else { const data = await res.json() as { error?: string }; setError(data.error || "Failed to save"); }
  }

  if (loading) return <div className="text-xs" style={{ color: "#605e5c" }}>Loading...</div>;

  return (
    <form onSubmit={handleSave} className="max-w-xl space-y-4">
      <Card>
        <CardHeader><CardTitle>Translation Settings</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Input
            label="LibreTranslate URL"
            type="url"
            value={config.libreTranslateUrl}
            onChange={(e) => setConfig({ ...config, libreTranslateUrl: e.target.value })}
            placeholder="https://libretranslate.com"
            hint="Base URL of your LibreTranslate instance"
          />
          <Input
            label="LibreTranslate API Key"
            type="password"
            value={config.libreTranslateApiKey}
            onChange={(e) => setConfig({ ...config, libreTranslateApiKey: e.target.value })}
            placeholder="your-api-key"
            hint="Leave empty if authentication is not required"
          />
          <Select
            label="Default Source Language"
            value={config.defaultSourceLanguage}
            onChange={(e) => setConfig({ ...config, defaultSourceLanguage: e.target.value })}
            hint="Primary language your products are written in"
          >
            {LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code}>{lang.label} ({lang.code})</option>
            ))}
          </Select>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              role="switch"
              aria-checked={config.autoTranslate}
              onClick={() => setConfig({ ...config, autoTranslate: !config.autoTranslate })}
              className="relative inline-flex h-4 w-8 items-center transition-colors focus:outline-none shrink-0"
              style={{ backgroundColor: config.autoTranslate ? "#0078d4" : "#c8c6c4" }}
            >
              <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${config.autoTranslate ? "translate-x-4" : "translate-x-0.5"}`} />
            </button>
            <div>
              <p className="text-xs font-medium" style={{ color: "#323130" }}>Auto-translate on sync</p>
              <p className="text-xs" style={{ color: "#605e5c" }}>Automatically translate products when syncing to sites</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="p-2.5 text-xs" style={{ backgroundColor: "#fde7e9", border: "1px solid #a4262c", color: "#a4262c" }}>
          {error}
        </div>
      )}
      {saved && (
        <div className="p-2.5 text-xs flex items-center gap-2" style={{ backgroundColor: "#dff6dd", border: "1px solid #107c10", color: "#107c10" }}>
          <CheckCircle className="w-3.5 h-3.5" />Settings saved successfully!
        </div>
      )}
      <Button type="submit" loading={saving}>
        <Save className="w-3.5 h-3.5" />Save Settings
      </Button>
    </form>
  );
}
