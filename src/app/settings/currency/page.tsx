"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Save, CheckCircle, Plus, Trash2, RefreshCw } from "lucide-react";

interface Rate {
  from: string;
  to: string;
  rate: string;
  fetchedAt?: string;
}

const COMMON_PAIRS: { from: string; to: string }[] = [
  { from: "EUR", to: "USD" },
  { from: "EUR", to: "GBP" },
  { from: "USD", to: "EUR" },
  { from: "GBP", to: "EUR" },
];

async function fetchLiveRate(from: string, to: string): Promise<string | null> {
  try {
    const res = await fetch(
      `/api/settings/currency/live?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
    );
    if (!res.ok) return null;
    const data = await res.json() as { rate?: number };
    return data.rate != null ? data.rate.toFixed(6) : null;
  } catch {
    return null;
  }
}

export default function CurrencyRatesPage() {
  const [rates, setRates] = useState<Rate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [fetchingAll, setFetchingAll] = useState(false);
  const [fetchingRow, setFetchingRow] = useState<number | null>(null);
  const [lastSynced, setLastSynced] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/settings/currency")
      .then((r) => r.json())
      .then((data: { rates?: Rate[] }) => {
        setRates(data.rates || []);
        setLoading(false);
      });
  }, []);

  function addRow() {
    setRates((prev) => [...prev, { from: "EUR", to: "USD", rate: "1.00" }]);
  }

  function removeRow(i: number) {
    setRates((prev) => prev.filter((_, idx) => idx !== i));
  }

  function updateRow(i: number, key: keyof Rate, value: string) {
    setRates((prev) => prev.map((r, idx) => (idx === i ? { ...r, [key]: value } : r)));
  }

  const fetchRowRate = useCallback(async (i: number) => {
    const row = rates[i];
    if (!row.from || !row.to) return;
    setFetchingRow(i);
    const live = await fetchLiveRate(row.from, row.to);
    setFetchingRow(null);
    if (live != null) {
      setRates((prev) =>
        prev.map((r, idx) =>
          idx === i ? { ...r, rate: live, fetchedAt: new Date().toISOString() } : r
        )
      );
    } else {
      setError(`Could not fetch rate for ${row.from} → ${row.to}`);
      setTimeout(() => setError(""), 4000);
    }
  }, [rates]);

  const fetchAllRates = useCallback(async () => {
    if (rates.length === 0) return;
    setFetchingAll(true);
    setError("");
    const now = new Date().toISOString();
    const updated = await Promise.all(
      rates.map(async (row) => {
        if (!row.from || !row.to) return row;
        const live = await fetchLiveRate(row.from, row.to);
        return live != null ? { ...row, rate: live, fetchedAt: now } : row;
      })
    );
    setRates(updated);
    setFetchingAll(false);
    setLastSynced(now);
  }, [rates]);

  function loadCommonPairs() {
    setRates(COMMON_PAIRS.map((p) => ({ ...p, rate: "1.00" })));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError(""); setSaved(false);
    const res = await fetch("/api/settings/currency", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rates }),
    });
    setSaving(false);
    if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 3000); }
    else { const d = await res.json() as { error?: string }; setError(d.error || "Failed to save"); }
  }

  if (loading) return <div className="text-xs" style={{ color: "#605e5c" }}>Loading...</div>;

  return (
    <form onSubmit={handleSave} className="max-w-xl space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Currency Exchange Rates</CardTitle>
            {lastSynced && (
              <p className="text-xs mt-0.5" style={{ color: "#a19f9d" }}>
                Last synced: {new Date(lastSynced).toLocaleTimeString()}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {rates.length === 0 && (
              <button
                type="button"
                onClick={loadCommonPairs}
                className="inline-flex items-center gap-1 text-xs px-2 py-1"
                style={{ color: "#605e5c", border: "1px solid #c8c6c4" }}
              >
                Common Pairs
              </button>
            )}
            <button
              type="button"
              onClick={fetchAllRates}
              disabled={fetchingAll || rates.length === 0}
              className="inline-flex items-center gap-1 text-xs px-2 py-1 disabled:opacity-40"
              style={{ color: "#107c10", border: "1px solid #107c10" }}
            >
              <RefreshCw size={11} className={fetchingAll ? "animate-spin" : ""} />
              {fetchingAll ? "Fetching..." : "Fetch Live Rates"}
            </button>
            <button
              type="button"
              onClick={addRow}
              className="inline-flex items-center gap-1 text-xs px-2 py-1"
              style={{ color: "#0078d4", border: "1px solid #0078d4" }}
            >
              <Plus size={12} />Add Rate
            </button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-xs" style={{ color: "#a19f9d" }}>
            Exchange rates are fetched live from{" "}
            <span className="font-medium" style={{ color: "#605e5c" }}>Frankfurter (ECB)</span>.
            Click <span className="font-medium" style={{ color: "#107c10" }}>Fetch Live Rates</span> to auto-fill all rows, or use the per-row refresh button.
          </p>
          {rates.length === 0 ? (
            <p className="text-xs py-3 text-center" style={{ color: "#a19f9d" }}>
              No rates defined. Click "Add Rate" or load "Common Pairs" to start.
            </p>
          ) : (
            <div className="space-y-2 pt-1">
              <div className="grid grid-cols-[1fr_1fr_1fr_auto_auto] gap-2 text-xs font-semibold uppercase tracking-wider" style={{ color: "#605e5c" }}>
                <span>From</span><span>To</span><span>Rate</span><span /><span />
              </div>
              {rates.map((rate, i) => (
                <div key={i} className="grid grid-cols-[1fr_1fr_1fr_auto_auto] gap-2 items-center">
                  <Input
                    value={rate.from}
                    onChange={(e) => updateRow(i, "from", e.target.value.toUpperCase())}
                    placeholder="EUR"
                  />
                  <Input
                    value={rate.to}
                    onChange={(e) => updateRow(i, "to", e.target.value.toUpperCase())}
                    placeholder="USD"
                  />
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      step="0.000001"
                      value={rate.rate}
                      onChange={(e) => updateRow(i, "rate", e.target.value)}
                      placeholder="1.08"
                    />
                    {rate.fetchedAt && (
                      <span
                        className="text-[10px] font-medium px-1 py-0.5 rounded whitespace-nowrap"
                        style={{ color: "#107c10", backgroundColor: "#dff6dd", border: "1px solid #9fd89f" }}
                      >
                        live
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => fetchRowRate(i)}
                    disabled={fetchingRow === i}
                    className="p-1 hover:text-green-700 transition-colors disabled:opacity-40"
                    style={{ color: "#107c10" }}
                    title="Fetch live rate"
                  >
                    <RefreshCw size={13} className={fetchingRow === i ? "animate-spin" : ""} />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeRow(i)}
                    className="p-1 hover:text-red-600 transition-colors"
                    style={{ color: "#a19f9d" }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
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
      {saved && (
        <div className="p-2.5 text-xs flex items-center gap-2" style={{ backgroundColor: "#dff6dd", border: "1px solid #107c10", color: "#107c10" }}>
          <CheckCircle className="w-3.5 h-3.5" />Rates saved successfully!
        </div>
      )}
      <Button type="submit" loading={saving}>
        <Save className="w-3.5 h-3.5" />Save Rates
      </Button>
    </form>
  );
}
