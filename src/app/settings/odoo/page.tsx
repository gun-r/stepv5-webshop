"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Save, CheckCircle, Plug, AlertCircle, Loader2 } from "lucide-react";

interface OdooConfig {
  odooUrl: string;
  odooDatabase: string;
  odooUsername: string;
  odooApiKey: string;
}

type TestStatus = "idle" | "testing" | "success" | "failed";

export default function OdooSettingsPage() {
  const [config, setConfig] = useState<OdooConfig>({
    odooUrl: "",
    odooDatabase: "",
    odooUsername: "",
    odooApiKey: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [testStatus, setTestStatus] = useState<TestStatus>("idle");
  const [testResult, setTestResult] = useState<{ name?: string; uid?: number; error?: string } | null>(null);

  useEffect(() => {
    fetch("/api/settings/odoo")
      .then((r) => r.json())
      .then((data: OdooConfig) => { setConfig(data); setLoading(false); });
  }, []);

  function update(key: keyof OdooConfig, value: string) {
    setConfig((prev) => ({ ...prev, [key]: value }));
    setTestStatus("idle");
    setTestResult(null);
  }

  async function handleTest() {
    setTestStatus("testing");
    setTestResult(null);
    try {
      const res = await fetch("/api/settings/odoo/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      const data = await res.json() as { success?: boolean; name?: string; uid?: number; error?: string };
      if (res.ok && data.success) {
        setTestStatus("success");
        setTestResult({ name: data.name, uid: data.uid });
      } else {
        setTestStatus("failed");
        setTestResult({ error: data.error || "Connection failed" });
      }
    } catch {
      setTestStatus("failed");
      setTestResult({ error: "Network error — could not reach server" });
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError(""); setSaved(false);
    const res = await fetch("/api/settings/odoo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config),
    });
    setSaving(false);
    if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 3000); }
    else { const d = await res.json() as { error?: string }; setError(d.error || "Failed to save"); }
  }

  if (loading) return <div className="text-xs" style={{ color: "#605e5c" }}>Loading...</div>;

  return (
    <form onSubmit={handleSave} className="max-w-xl space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plug className="w-4 h-4" />Odoo On-Premise Integration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="p-3 text-xs rounded" style={{ backgroundColor: "#f0f6ff", border: "1px solid #0078d4", color: "#323130" }}>
            <p className="font-semibold mb-1" style={{ color: "#0078d4" }}>On-Premise Connection</p>
            <p>Connect to your self-hosted Odoo instance. Use your Odoo login credentials or an API key generated in <strong>Settings → Technical → API Keys</strong> (Odoo 14+).</p>
          </div>

          <Input
            label="Odoo URL"
            type="url"
            value={config.odooUrl}
            onChange={(e) => update("odooUrl", e.target.value)}
            placeholder="https://odoo.yourcompany.com"
            hint="Base URL of your Odoo instance (no trailing slash)"
          />
          <Input
            label="Database Name"
            value={config.odooDatabase}
            onChange={(e) => update("odooDatabase", e.target.value)}
            placeholder="my_odoo_db"
            hint="The PostgreSQL database name used by Odoo"
          />
          <Input
            label="Username (Email)"
            type="email"
            value={config.odooUsername}
            onChange={(e) => update("odooUsername", e.target.value)}
            placeholder="admin@yourcompany.com"
            hint="Your Odoo login email"
          />
          <Input
            label="Password / API Key"
            type="password"
            value={config.odooApiKey}
            onChange={(e) => update("odooApiKey", e.target.value)}
            placeholder="••••••••••••"
            hint="Your Odoo password or API key (Odoo 14+: Settings → Technical → API Keys)"
          />

          {/* Test connection button + result */}
          <div className="pt-1 space-y-2">
            <button
              type="button"
              onClick={handleTest}
              disabled={testStatus === "testing" || !config.odooUrl || !config.odooDatabase || !config.odooUsername || !config.odooApiKey}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-40"
              style={{ border: "1px solid #0078d4", color: "#0078d4", backgroundColor: "#fff" }}
            >
              {testStatus === "testing" ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Plug className="w-3.5 h-3.5" />
              )}
              {testStatus === "testing" ? "Testing…" : "Test Connection"}
            </button>

            {testStatus === "success" && testResult && (
              <div className="flex items-start gap-2 p-2.5 text-xs" style={{ backgroundColor: "#dff6dd", border: "1px solid #107c10", color: "#107c10" }}>
                <CheckCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold">Connected successfully!</p>
                  <p>Logged in as <strong>{testResult.name}</strong> (UID: {testResult.uid})</p>
                </div>
              </div>
            )}

            {testStatus === "failed" && testResult && (
              <div className="flex items-start gap-2 p-2.5 text-xs" style={{ backgroundColor: "#fde7e9", border: "1px solid #a4262c", color: "#a4262c" }}>
                <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold">Connection failed</p>
                  <p>{testResult.error}</p>
                </div>
              </div>
            )}
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
