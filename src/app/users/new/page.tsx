"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { ArrowLeft, Save, Search, User, X, ChevronDown } from "lucide-react";

interface UserRole { id: string; name: string; label: string; }

interface MssqlMapping {
  page: string;
  tableName: string;
  searchColumn: string;
  displayColumns: string;
  fieldMappings: string;
}

type FormState = {
  name: string; email: string; password: string; role: string; roleId: string;
  username: string; address: string; country: string; zip: string;
  telephone: string; mobile: string; position: string; positionNote: string;
  teamLeader: string; dateStarted: string; employeeStatus: string;
  motto: string; notes: string;
};

const EMPTY_FORM: FormState = {
  name: "", email: "", password: "", role: "user", roleId: "",
  username: "", address: "", country: "", zip: "",
  telephone: "", mobile: "", position: "", positionNote: "",
  teamLeader: "", dateStarted: "", employeeStatus: "Active",
  motto: "", notes: "",
};

export default function NewUserPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // MSSQL employee search
  const [mapping, setMapping] = useState<{ tableName: string; searchColumn: string; displayColumns: string[]; fieldMappings: Record<string, string> } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Record<string, unknown>[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [imported, setImported] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/roles").then((r) => r.json()),
      fetch("/api/settings/mssql/mappings").then((r) => r.json()),
    ]).then(([rolesData, mapData]: [unknown, { mappings?: MssqlMapping[] }]) => {
      if (Array.isArray(rolesData)) setRoles(rolesData as UserRole[]);
      const userMap = mapData.mappings?.find((m) => m.page === "users");
      if (userMap?.tableName && userMap?.searchColumn) {
        setMapping({
          tableName: userMap.tableName,
          searchColumn: userMap.searchColumn,
          displayColumns: JSON.parse(userMap.displayColumns || "[]"),
          fieldMappings: JSON.parse(userMap.fieldMappings || "{}"),
        });
      }
    }).catch(() => {});
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const doSearch = useCallback(async (q: string) => {
    if (!mapping || !q.trim()) { setSearchResults([]); setSearchOpen(false); return; }
    setSearching(true);
    try {
      const res = await fetch(
        `/api/settings/mssql/search?table=${encodeURIComponent(mapping.tableName)}&column=${encodeURIComponent(mapping.searchColumn)}&q=${encodeURIComponent(q)}`
      );
      const data = await res.json() as { rows?: Record<string, unknown>[] };
      setSearchResults(data.rows || []);
      setSearchOpen(true);
    } catch {
      setSearchResults([]);
    }
    setSearching(false);
  }, [mapping]);

  function handleSearchInput(val: string) {
    setSearchQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(val), 350);
  }

  function applyEmployee(row: Record<string, unknown>) {
    if (!mapping) return;
    setForm((prev) => {
      const next = { ...prev };
      Object.entries(mapping.fieldMappings).forEach(([field, col]) => {
        if (field in next && row[col] != null) {
          (next as Record<string, string>)[field] = String(row[col]);
        }
      });
      return next;
    });
    setSearchOpen(false);
    setSearchQuery("");
    setImported(true);
  }

  function update(key: keyof FormState, value: string) {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "roleId") {
        const role = roles.find((r) => r.id === value);
        if (role) next.role = role.name;
      }
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, roleId: form.roleId || null }),
    });
    if (res.ok) {
      router.push("/users");
    } else {
      let msg = "Failed to create user";
      try {
        const data = await res.json() as { error?: string };
        if (data.error) msg = data.error;
      } catch { /* empty body */ }
      setError(msg);
      setSaving(false);
    }
  }

  const displayCols = mapping?.displayColumns?.length ? mapping.displayColumns : (mapping ? [mapping.searchColumn] : []);

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header title="Add User" subtitle="Create a new user account" />
        <main className="flex-1 p-6 max-w-2xl">
          <Link href="/users" className="inline-flex items-center gap-1.5 text-sm mb-6" style={{ color: "#605e5c" }}>
            <ArrowLeft className="w-4 h-4" />Back to Users
          </Link>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* MSSQL Employee Search */}
            {mapping && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Search className="w-4 h-4" style={{ color: "#0078d4" }} />
                    Import from MSSQL Database
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs mb-3" style={{ color: "#a19f9d" }}>
                    Search for an employee in the connected MSSQL database to auto-fill the profile below.
                  </p>
                  <div ref={searchRef} className="relative">
                    <div className="flex items-center gap-2" style={{ border: "1px solid #c8c6c4", backgroundColor: "#fff" }}>
                      <Search className="w-3.5 h-3.5 ml-2.5 shrink-0" style={{ color: "#605e5c" }} />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => handleSearchInput(e.target.value)}
                        placeholder={`Search by ${mapping.searchColumn}…`}
                        className="flex-1 py-2 pr-2 text-sm outline-none bg-transparent"
                        style={{ color: "#323130" }}
                        autoComplete="off"
                      />
                      {searching && (
                        <span className="text-xs pr-2" style={{ color: "#605e5c" }}>Searching…</span>
                      )}
                      {searchQuery && (
                        <button type="button" onClick={() => { setSearchQuery(""); setSearchResults([]); setSearchOpen(false); }} className="pr-2">
                          <X className="w-3.5 h-3.5" style={{ color: "#605e5c" }} />
                        </button>
                      )}
                    </div>

                    {searchOpen && searchResults.length > 0 && (
                      <div
                        className="absolute z-50 w-full mt-0.5 overflow-hidden"
                        style={{ border: "1px solid #c8c6c4", backgroundColor: "#fff", boxShadow: "0 4px 12px rgba(0,0,0,0.12)", maxHeight: 280, overflowY: "auto" }}
                      >
                        {searchResults.map((row, i) => (
                          <button
                            key={i}
                            type="button"
                            className="w-full px-3 py-2 text-left text-xs flex items-start gap-3 transition-colors"
                            style={{ borderBottom: "1px solid #f3f2f1" }}
                            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "#f3f2f1")}
                            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "")}
                            onClick={() => applyEmployee(row)}
                          >
                            <User className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: "#0078d4" }} />
                            <div className="flex-1 min-w-0">
                              {displayCols.map((col) => (
                                <span key={col} className="block truncate">
                                  {col !== displayCols[0] && (
                                    <span className="font-medium" style={{ color: "#605e5c" }}>{col}: </span>
                                  )}
                                  <span style={{ color: col === displayCols[0] ? "#323130" : "#a19f9d" }}>
                                    {String(row[col] ?? "")}
                                  </span>
                                </span>
                              ))}
                            </div>
                            <ChevronDown className="w-3 h-3 -rotate-90 shrink-0 mt-0.5" style={{ color: "#a19f9d" }} />
                          </button>
                        ))}
                      </div>
                    )}
                    {searchOpen && !searching && searchResults.length === 0 && searchQuery && (
                      <div className="absolute z-50 w-full mt-0.5 px-3 py-2 text-xs" style={{ border: "1px solid #c8c6c4", backgroundColor: "#fff", color: "#a19f9d" }}>
                        No employees found for &ldquo;{searchQuery}&rdquo;
                      </div>
                    )}
                  </div>

                  {imported && (
                    <div className="mt-2 flex items-center gap-1.5 text-xs" style={{ color: "#107c10" }}>
                      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#107c10" }} />
                      Employee data imported — review and adjust below before saving
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Login Details */}
            <Card>
              <CardHeader><CardTitle>Login Details</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Full Name"
                    value={form.name}
                    onChange={(e) => update("name", e.target.value)}
                    required
                    placeholder="John Doe"
                  />
                  <Input
                    label="Username"
                    value={form.username}
                    onChange={(e) => update("username", e.target.value)}
                    placeholder="jdoe"
                  />
                </div>
                <Input
                  label="Email"
                  type="email"
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                  required
                  placeholder="john@example.com"
                />
                <Input
                  label="Password"
                  type="password"
                  value={form.password}
                  onChange={(e) => update("password", e.target.value)}
                  required
                  placeholder="Min. 6 characters"
                />
                <Select label="Role" value={form.roleId} onChange={(e) => update("roleId", e.target.value)}>
                  <option value="">— Select Role —</option>
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>{r.label}</option>
                  ))}
                </Select>
              </CardContent>
            </Card>

            {/* Employee Profile */}
            <Card>
              <CardHeader><CardTitle>Employee Profile</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <Input
                  label="Motto"
                  value={form.motto}
                  onChange={(e) => update("motto", e.target.value)}
                  placeholder="Employee motto or tagline"
                />

                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Position"
                    value={form.position}
                    onChange={(e) => update("position", e.target.value)}
                    placeholder="e.g. Customer Support"
                  />
                  <Input
                    label="Position Note"
                    value={form.positionNote}
                    onChange={(e) => update("positionNote", e.target.value)}
                    placeholder="Additional note"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Team Leader"
                    value={form.teamLeader}
                    onChange={(e) => update("teamLeader", e.target.value)}
                    placeholder="Manager name"
                  />
                  <Input
                    label="Date Started"
                    value={form.dateStarted}
                    onChange={(e) => update("dateStarted", e.target.value)}
                    placeholder="e.g. 06/10/2021"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Telephone"
                    value={form.telephone}
                    onChange={(e) => update("telephone", e.target.value)}
                    placeholder="+1 555 000 0000"
                  />
                  <Input
                    label="Mobile"
                    value={form.mobile}
                    onChange={(e) => update("mobile", e.target.value)}
                    placeholder="+1 555 000 0001"
                  />
                </div>

                <Input
                  label="Address"
                  value={form.address}
                  onChange={(e) => update("address", e.target.value)}
                  placeholder="Street address"
                />

                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Country"
                    value={form.country}
                    onChange={(e) => update("country", e.target.value)}
                    placeholder="e.g. PH"
                  />
                  <Input
                    label="Zip"
                    value={form.zip}
                    onChange={(e) => update("zip", e.target.value)}
                    placeholder="12345"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "#323130" }}>
                    Employee Status
                  </label>
                  <Select value={form.employeeStatus} onChange={(e) => update("employeeStatus", e.target.value)}>
                    <option value="Active">Active</option>
                    <option value="Stopped">Stopped</option>
                    <option value="On Leave">On Leave</option>
                  </Select>
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "#323130" }}>Notes</label>
                  <textarea
                    value={form.notes}
                    onChange={(e) => update("notes", e.target.value)}
                    rows={3}
                    placeholder="Additional notes about this employee"
                    className="w-full text-sm px-2.5 py-1.5 outline-none resize-none"
                    style={{ border: "1px solid #c8c6c4", color: "#323130", backgroundColor: "#fff" }}
                  />
                </div>
              </CardContent>
            </Card>

            {error && (
              <div className="p-3 text-sm" style={{ backgroundColor: "#fde7e9", border: "1px solid #a4262c", color: "#a4262c" }}>
                {error}
              </div>
            )}
            <div className="flex gap-3">
              <Button type="submit" loading={saving}><Save className="w-4 h-4" />Create User</Button>
              <Link href="/users"><Button type="button" variant="outline">Cancel</Button></Link>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}
