"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, Upload, Download, CheckCircle, XCircle } from "lucide-react";

interface Site { id: string; name: string; url: string; status: string; }
interface ImportRow { [key: string]: string; }
interface ImportResult { title: string; success: boolean; error?: string; }

const PRODUCT_FIELDS = [
  { key: "title", label: "Title *" },
  { key: "description", label: "Description" },
  { key: "shortDescription", label: "Short Description" },
  { key: "productType", label: "Product Type" },
  { key: "price", label: "Price" },
  { key: "salePrice", label: "Sale Price" },
  { key: "sku", label: "SKU" },
  { key: "categories", label: "Categories (;-separated)" },
  { key: "tags", label: "Tags (;-separated)" },
  { key: "status", label: "Status" },
  { key: "manageStock", label: "Manage Stock (yes/no)" },
  { key: "stockQuantity", label: "Stock Quantity" },
  { key: "_skip", label: "— Skip column —" },
];

function parseCSV(text: string): { headers: string[]; rows: ImportRow[] } {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return { headers: [], rows: [] };

  function parseLine(line: string): string[] {
    const cells: string[] = [];
    let cur = "", inQuote = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuote && line[i + 1] === '"') { cur += '"'; i++; }
        else inQuote = !inQuote;
      } else if (ch === "," && !inQuote) { cells.push(cur); cur = ""; }
      else cur += ch;
    }
    cells.push(cur);
    return cells;
  }

  const headers = parseLine(lines[0]);
  const rows = lines.slice(1).map((line) => {
    const cells = parseLine(line);
    const row: ImportRow = {};
    headers.forEach((h, i) => { row[h] = cells[i] || ""; });
    return row;
  });
  return { headers, rows };
}

export default function ImportPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [sites, setSites] = useState<Site[]>([]);
  const [selectedSites, setSelectedSites] = useState<string[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [step, setStep] = useState<"upload" | "map" | "results">("upload");
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState<ImportResult[]>([]);

  useEffect(() => {
    fetch("/api/sites")
      .then((r) => r.json())
      .then((data: unknown) => {
        if (Array.isArray(data)) setSites((data as Site[]).filter((s) => s.status === "active"));
      });
  }, []);

  function handleFile(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const parsed = parseCSV(text);
      setHeaders(parsed.headers);
      setRows(parsed.rows);
      // Auto-map matching headers
      const autoMap: Record<string, string> = {};
      for (const h of parsed.headers) {
        const match = PRODUCT_FIELDS.find((f) => f.key.toLowerCase() === h.toLowerCase() || f.label.toLowerCase().startsWith(h.toLowerCase()));
        autoMap[h] = match?.key || "_skip";
      }
      setMapping(autoMap);
      setStep("map");
    };
    reader.readAsText(file);
  }

  function toggleSite(id: string) {
    setSelectedSites((prev) => prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]);
  }

  async function handleImport() {
    setImporting(true);
    const mappedRows = rows.map((row) => {
      const mapped: ImportRow = {};
      for (const [csvHeader, fieldKey] of Object.entries(mapping)) {
        if (fieldKey !== "_skip" && fieldKey) {
          mapped[fieldKey] = row[csvHeader] || "";
        }
      }
      return mapped;
    });

    const res = await fetch("/api/products/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rows: mappedRows, siteIds: selectedSites }),
    });

    const data = await res.json() as { results: ImportResult[] };
    setResults(data.results);
    setStep("results");
    setImporting(false);
  }

  function downloadTemplate() {
    const headers = "title,description,shortDescription,productType,price,salePrice,sku,categories,tags,status,manageStock,stockQuantity";
    const example = '"Example Product","Full description","Short desc","simple","29.99","","PROD-001","Shoes; Clothing","new; sale","draft","no",""';
    const csv = `${headers}\n${example}`;
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "import-template.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header title="Import Products" subtitle="Import products from a CSV file" />
        <main className="flex-1 p-6 max-w-3xl space-y-5">
          <Link href="/products" className="inline-flex items-center gap-1.5 text-sm" style={{ color: "#605e5c" }}>
            <ArrowLeft className="w-4 h-4" />Back to Products
          </Link>

          {/* Step: Upload */}
          {step === "upload" && (
            <div className="space-y-4">
              <Card>
                <CardHeader><CardTitle>Step 1: Upload CSV File</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="w-full flex flex-col items-center justify-center gap-3 py-10 transition-colors"
                    style={{ border: "2px dashed #8a8886", backgroundColor: "#faf9f8" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#0078d4"; (e.currentTarget as HTMLElement).style.backgroundColor = "#f0f6ff"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#8a8886"; (e.currentTarget as HTMLElement).style.backgroundColor = "#faf9f8"; }}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
                  >
                    <Upload className="w-8 h-8" style={{ color: "#0078d4" }} />
                    <span className="text-sm font-medium" style={{ color: "#323130" }}>
                      Click to upload or drag & drop
                    </span>
                    <span className="text-xs" style={{ color: "#a19f9d" }}>CSV files only</span>
                  </button>
                  <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
                  <div className="flex items-center gap-3 pt-2" style={{ borderTop: "1px solid #edebe9" }}>
                    <span className="text-sm" style={{ color: "#605e5c" }}>Need a template?</span>
                    <button onClick={downloadTemplate} className="inline-flex items-center gap-1.5 text-sm hover:underline" style={{ color: "#0078d4" }}>
                      <Download className="w-4 h-4" />Download CSV Template
                    </button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step: Map + Configure */}
          {step === "map" && (
            <div className="space-y-4">
              <Card>
                <CardHeader><CardTitle>Step 2: Map Columns ({rows.length} rows found)</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm" style={{ color: "#605e5c" }}>
                    Map each CSV column to the corresponding product field.
                  </p>
                  <div className="space-y-2">
                    {headers.map((h) => (
                      <div key={h} className="flex items-center gap-3">
                        <span className="text-sm font-medium w-40 shrink-0 truncate" style={{ color: "#323130" }}>{h}</span>
                        <span className="text-xs" style={{ color: "#a19f9d" }}>→</span>
                        <select
                          value={mapping[h] || "_skip"}
                          onChange={(e) => setMapping((prev) => ({ ...prev, [h]: e.target.value }))}
                          className="flex-1 px-2 py-1.5 text-sm focus:outline-none"
                          style={{ border: "1px solid #8a8886" }}
                        >
                          {PRODUCT_FIELDS.map((f) => (
                            <option key={f.key} value={f.key}>{f.label}</option>
                          ))}
                        </select>
                        <span className="text-xs w-28 truncate" style={{ color: "#a19f9d" }}>
                          e.g. {rows[0]?.[h] || "—"}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Site selection */}
              {sites.length > 0 && (
                <Card>
                  <CardHeader><CardTitle>Publish to Sites (optional)</CardTitle></CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {sites.map((site) => (
                        <label key={site.id} className="flex items-center gap-3 p-3 cursor-pointer"
                          style={selectedSites.includes(site.id)
                            ? { border: "1px solid #0078d4", backgroundColor: "#f0f6ff" }
                            : { border: "1px solid #edebe9" }
                          }
                        >
                          <input type="checkbox" checked={selectedSites.includes(site.id)} onChange={() => toggleSite(site.id)} className="w-4 h-4 accent-blue-600" />
                          <div>
                            <div className="text-sm font-medium" style={{ color: "#323130" }}>{site.name}</div>
                            <div className="text-xs" style={{ color: "#a19f9d" }}>{site.url}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="flex gap-3">
                <Button loading={importing} onClick={handleImport}>
                  <Upload className="w-4 h-4" />
                  Import {rows.length} Products
                </Button>
                <Button variant="outline" onClick={() => setStep("upload")}>Back</Button>
              </div>
            </div>
          )}

          {/* Step: Results */}
          {step === "results" && (
            <Card>
              <CardHeader>
                <CardTitle>
                  Import Complete — {results.filter((r) => r.success).length}/{results.length} succeeded
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1 max-h-96 overflow-y-auto">
                  {results.map((r, i) => (
                    <div key={i} className="flex items-center gap-3 p-2 text-sm"
                      style={{ backgroundColor: r.success ? "#dff6dd" : "#fde7e9" }}
                    >
                      {r.success
                        ? <CheckCircle className="w-4 h-4 shrink-0" style={{ color: "#107c10" }} />
                        : <XCircle className="w-4 h-4 shrink-0" style={{ color: "#a4262c" }} />
                      }
                      <span className="font-medium" style={{ color: r.success ? "#107c10" : "#a4262c" }}>{r.title}</span>
                      {r.error && <span style={{ color: "#a4262c" }}>— {r.error}</span>}
                    </div>
                  ))}
                </div>
                <div className="flex gap-3 pt-2">
                  <Link href="/products"><Button>View Products</Button></Link>
                  <Button variant="outline" onClick={() => { setStep("upload"); setRows([]); setHeaders([]); setResults([]); }}>
                    Import More
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </div>
  );
}
