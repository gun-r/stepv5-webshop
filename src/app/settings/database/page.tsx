"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { Save, CheckCircle, Wifi, ChevronDown, ChevronRight, Plus } from "lucide-react";

interface ConnForm {
  host: string;
  port: string;
  database: string;
  username: string;
  password: string;
  encrypt: boolean;
  trustCert: boolean;
}

interface PageMapping {
  page: string;
  label: string;
  tableName: string;
  searchColumn: string;
  displayColumns: string[];
  fieldMappings: Record<string, string>;
}

const PAGE_OPTIONS = [
  { page: "products", label: "Products Page" },
  { page: "users", label: "Users Page" },
  { page: "sites", label: "Sites Page" },
  { page: "activity", label: "Activity Page" },
];

// Product form fields that can be populated from DB
const PRODUCT_FIELDS = [
  "title", "shortDescription", "description", "price", "salePrice", "sku",
  "categories", "tags", "stockQuantity",
];

// User/employee form fields that can be populated from DB
const USER_FIELDS = [
  "name", "email", "username", "address", "country", "zip",
  "telephone", "mobile", "position", "positionNote", "teamLeader",
  "dateStarted", "employeeStatus", "motto", "notes",
];

export default function DatabaseConnectionPage() {
  const [conn, setConn] = useState<ConnForm>({
    host: "", port: "1433", database: "", username: "", password: "",
    encrypt: true, trustCert: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [error, setError] = useState("");

  // Tables & columns fetched after successful connection
  const [tables, setTables] = useState<string[]>([]);
  const [tablesLoading, setTablesLoading] = useState(false);

  // Per-page mappings
  const [mappings, setMappings] = useState<PageMapping[]>(
    PAGE_OPTIONS.map((p) => ({ ...p, tableName: "", searchColumn: "", displayColumns: [], fieldMappings: {} }))
  );
  const [mappingSaving, setMappingSaving] = useState<Record<string, boolean>>({});
  const [mappingSaved, setMappingSaved] = useState<Record<string, boolean>>({});
  const [expandedPage, setExpandedPage] = useState<string | null>("products");
  const [pageColumns, setPageColumns] = useState<Record<string, string[]>>({});

  useEffect(() => {
    Promise.all([
      fetch("/api/settings/mssql").then((r) => r.json()),
      fetch("/api/settings/mssql/mappings").then((r) => r.json()),
    ]).then(([connData, mapData]: [
      { host: string; port: number; database: string; username: string; password: string; encrypt: boolean; trustCert: boolean },
      { mappings: Array<{ page: string; tableName: string; searchColumn: string; displayColumns: string; fieldMappings: string }> }
    ]) => {
      setConn({
        host: connData.host || "",
        port: String(connData.port || 1433),
        database: connData.database || "",
        username: connData.username || "",
        password: connData.password || "",
        encrypt: connData.encrypt ?? true,
        trustCert: connData.trustCert ?? true,
      });
      if (mapData.mappings) {
        setMappings(PAGE_OPTIONS.map((p) => {
          const saved = mapData.mappings.find((m) => m.page === p.page);
          return {
            ...p,
            tableName: saved?.tableName || "",
            searchColumn: saved?.searchColumn || "",
            displayColumns: saved ? JSON.parse(saved.displayColumns) : [],
            fieldMappings: saved ? JSON.parse(saved.fieldMappings) : {},
          };
        }));
      }
      setLoading(false);
    });
  }, []);

  const fetchTables = useCallback(async () => {
    setTablesLoading(true);
    const res = await fetch("/api/settings/mssql/tables");
    const data = await res.json() as { tables?: string[]; error?: string };
    setTablesLoading(false);
    if (data.tables) setTables(data.tables);
  }, []);

  async function handleTest() {
    setTesting(true);
    setTestResult(null);
    const res = await fetch("/api/settings/mssql/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...conn, port: Number(conn.port) }),
    });
    const data = await res.json() as { success: boolean; message: string };
    setTestResult(data);
    setTesting(false);
    if (data.success) fetchTables();
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError(""); setSaved(false);
    const res = await fetch("/api/settings/mssql", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...conn, port: Number(conn.port) }),
    });
    setSaving(false);
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      fetchTables();
    } else {
      const d = await res.json() as { error?: string };
      setError(d.error || "Failed to save");
    }
  }

  async function fetchColumnsForPage(page: string, tableName: string) {
    if (!tableName) return;
    const res = await fetch(`/api/settings/mssql/columns?table=${encodeURIComponent(tableName)}`);
    const data = await res.json() as { columns?: string[] };
    if (data.columns) setPageColumns((prev) => ({ ...prev, [page]: data.columns! }));
  }

  function updateMapping(page: string, key: keyof PageMapping, value: unknown) {
    setMappings((prev) =>
      prev.map((m) => {
        if (m.page !== page) return m;
        const updated = { ...m, [key]: value };
        if (key === "tableName") {
          fetchColumnsForPage(page, value as string);
          updated.searchColumn = "";
          updated.displayColumns = [];
          updated.fieldMappings = {};
        }
        return updated;
      })
    );
  }

  function toggleDisplayColumn(page: string, col: string) {
    setMappings((prev) =>
      prev.map((m) => {
        if (m.page !== page) return m;
        const cols = m.displayColumns.includes(col)
          ? m.displayColumns.filter((c) => c !== col)
          : [...m.displayColumns, col];
        return { ...m, displayColumns: cols };
      })
    );
  }

  function updateFieldMapping(page: string, field: string, dbCol: string) {
    setMappings((prev) =>
      prev.map((m) => {
        if (m.page !== page) return m;
        return { ...m, fieldMappings: { ...m.fieldMappings, [field]: dbCol } };
      })
    );
  }

  async function saveMapping(page: string) {
    const m = mappings.find((x) => x.page === page);
    if (!m) return;
    setMappingSaving((prev) => ({ ...prev, [page]: true }));
    await fetch("/api/settings/mssql/mappings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(m),
    });
    setMappingSaving((prev) => ({ ...prev, [page]: false }));
    setMappingSaved((prev) => ({ ...prev, [page]: true }));
    setTimeout(() => setMappingSaved((prev) => ({ ...prev, [page]: false })), 2500);
  }

  if (loading) return <div className="text-xs" style={{ color: "#605e5c" }}>Loading...</div>;

  return (
    <div className="max-w-2xl space-y-4">
      {/* Connection Settings */}
      <form onSubmit={handleSave}>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>MS SQL Server Connection</CardTitle>
            <Button type="button" variant="outline" size="sm" loading={testing} onClick={handleTest}>
              <Wifi className="w-3.5 h-3.5" />Test Connection
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {testResult && (
              <div
                className="p-2.5 text-xs flex items-center gap-2"
                style={testResult.success
                  ? { backgroundColor: "#dff6dd", border: "1px solid #107c10", color: "#107c10" }
                  : { backgroundColor: "#fde7e9", border: "1px solid #a4262c", color: "#a4262c" }}
              >
                {testResult.message}
              </div>
            )}

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <Input
                  label="Server Host"
                  value={conn.host}
                  onChange={(e) => setConn({ ...conn, host: e.target.value })}
                  placeholder="192.168.1.100 or server.domain.com"
                />
              </div>
              <Input
                label="Port"
                type="number"
                value={conn.port}
                onChange={(e) => setConn({ ...conn, port: e.target.value })}
                placeholder="1433"
              />
            </div>

            <Input
              label="Database Name"
              value={conn.database}
              onChange={(e) => setConn({ ...conn, database: e.target.value })}
              placeholder="MyDatabase"
            />

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Username"
                value={conn.username}
                onChange={(e) => setConn({ ...conn, username: e.target.value })}
                placeholder="sa"
              />
              <Input
                label="Password"
                type="password"
                value={conn.password}
                onChange={(e) => setConn({ ...conn, password: e.target.value })}
                placeholder="••••••••"
              />
            </div>

            <div className="flex gap-6 pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={conn.encrypt}
                  onChange={(e) => setConn({ ...conn, encrypt: e.target.checked })}
                  className="w-3.5 h-3.5 accent-blue-600"
                />
                <span className="text-xs" style={{ color: "#323130" }}>Encrypt connection</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={conn.trustCert}
                  onChange={(e) => setConn({ ...conn, trustCert: e.target.checked })}
                  className="w-3.5 h-3.5 accent-blue-600"
                />
                <span className="text-xs" style={{ color: "#323130" }}>Trust server certificate</span>
              </label>
            </div>

            {error && (
              <div className="p-2.5 text-xs" style={{ backgroundColor: "#fde7e9", border: "1px solid #a4262c", color: "#a4262c" }}>
                {error}
              </div>
            )}
            {saved && (
              <div className="p-2.5 text-xs flex items-center gap-2" style={{ backgroundColor: "#dff6dd", border: "1px solid #107c10", color: "#107c10" }}>
                <CheckCircle className="w-3.5 h-3.5" />Connection settings saved!
              </div>
            )}
          </CardContent>
        </Card>
        <div className="mt-3">
          <Button type="submit" loading={saving}>
            <Save className="w-3.5 h-3.5" />Save Connection
          </Button>
        </div>
      </form>

      {/* Page Table Mappings */}
      <Card>
        <CardHeader><CardTitle>Page Table Assignments</CardTitle></CardHeader>
        <CardContent className="space-y-1 p-0">
          <p className="text-xs px-4 pb-2" style={{ color: "#a19f9d" }}>
            Assign a database table to each page, pick the search column, and map DB columns to form fields.
          </p>
          {mappings.map((m) => {
            const cols = pageColumns[m.page] || [];
            const isOpen = expandedPage === m.page;
            return (
              <div key={m.page} style={{ borderTop: "1px solid #edebe9" }}>
                {/* Accordion header */}
                <button
                  type="button"
                  onClick={() => setExpandedPage(isOpen ? null : m.page)}
                  className="w-full flex items-center justify-between px-4 py-2 text-xs font-medium transition-colors text-left"
                  style={{ color: "#323130" }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "#faf9f8")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "")}
                >
                  <span className="flex items-center gap-2">
                    {isOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                    {m.label}
                    {m.tableName && (
                      <span className="font-mono" style={{ color: "#0078d4" }}>→ {m.tableName}</span>
                    )}
                  </span>
                  {mappingSaved[m.page] && (
                    <span className="flex items-center gap-1" style={{ color: "#107c10" }}>
                      <CheckCircle size={12} />Saved
                    </span>
                  )}
                </button>

                {isOpen && (
                  <div className="px-4 pb-4 space-y-3">
                    {tables.length === 0 && !tablesLoading && (
                      <p className="text-xs" style={{ color: "#a4262c" }}>
                        Save and test connection first to load tables.
                      </p>
                    )}
                    {tablesLoading && (
                      <p className="text-xs" style={{ color: "#605e5c" }}>Loading tables...</p>
                    )}

                    {tables.length > 0 && (
                      <>
                        <Select
                          label="Database Table"
                          value={m.tableName}
                          onChange={(e) => updateMapping(m.page, "tableName", e.target.value)}
                        >
                          <option value="">— Select table —</option>
                          {tables.map((t) => <option key={t} value={t}>{t}</option>)}
                        </Select>

                        {m.tableName && cols.length > 0 && (
                          <>
                            <Select
                              label="Search Column (shown in search bar)"
                              value={m.searchColumn}
                              onChange={(e) => updateMapping(m.page, "searchColumn", e.target.value)}
                            >
                              <option value="">— Select column —</option>
                              {cols.map((c) => <option key={c} value={c}>{c}</option>)}
                            </Select>

                            <div>
                              <p className="text-xs font-medium mb-1.5" style={{ color: "#323130" }}>
                                Columns to display in search results
                              </p>
                              <div className="flex flex-wrap gap-1.5">
                                {cols.map((c) => (
                                  <label key={c} className="flex items-center gap-1 cursor-pointer px-2 py-0.5 text-xs"
                                    style={m.displayColumns.includes(c)
                                      ? { backgroundColor: "#e5f0fb", border: "1px solid #0078d4", color: "#0078d4" }
                                      : { border: "1px solid #edebe9", color: "#605e5c" }
                                    }
                                  >
                                    <input
                                      type="checkbox"
                                      className="sr-only"
                                      checked={m.displayColumns.includes(c)}
                                      onChange={() => toggleDisplayColumn(m.page, c)}
                                    />
                                    {c}
                                  </label>
                                ))}
                              </div>
                            </div>

                            {/* Field Mappings — products and users pages */}
                            {(m.page === "products" || m.page === "users") && (
                              <div>
                                <p className="text-xs font-medium mb-1.5" style={{ color: "#323130" }}>
                                  Map DB columns → {m.page === "products" ? "Product" : "Employee"} fields
                                </p>
                                <div className="space-y-1.5">
                                  {(m.page === "products" ? PRODUCT_FIELDS : USER_FIELDS).map((field) => (
                                    <div key={field} className="grid grid-cols-2 gap-2 items-center">
                                      <span className="text-xs font-mono" style={{ color: "#605e5c" }}>{field}</span>
                                      <Select
                                        value={m.fieldMappings[field] || ""}
                                        onChange={(e) => updateFieldMapping(m.page, field, e.target.value)}
                                      >
                                        <option value="">— not mapped —</option>
                                        {cols.map((c) => <option key={c} value={c}>{c}</option>)}
                                      </Select>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </>
                        )}

                        {m.tableName && cols.length === 0 && (
                          <div className="flex">
                            <button
                              type="button"
                              onClick={() => fetchColumnsForPage(m.page, m.tableName)}
                              className="inline-flex items-center gap-1 text-xs px-2 py-1"
                              style={{ color: "#0078d4", border: "1px solid #0078d4" }}
                            >
                              <Plus size={12} />Load Columns
                            </button>
                          </div>
                        )}

                        <div className="pt-1">
                          <Button
                            type="button"
                            size="sm"
                            loading={mappingSaving[m.page]}
                            onClick={() => saveMapping(m.page)}
                          >
                            <Save className="w-3 h-3" />Save Mapping
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
