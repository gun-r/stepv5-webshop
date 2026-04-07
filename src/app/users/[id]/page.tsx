"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { ArrowLeft, Save } from "lucide-react";

interface UserRole { id: string; name: string; label: string; }

interface UserData {
  id: string; name: string; email: string; role: string; roleId: string | null;
  username: string | null; address: string | null; country: string | null; zip: string | null;
  telephone: string | null; mobile: string | null; position: string | null;
  positionNote: string | null; teamLeader: string | null; dateStarted: string | null;
  employeeStatus: string | null; motto: string | null; notes: string | null;
}

type FormState = {
  name: string; email: string; password: string; role: string; roleId: string;
  username: string; address: string; country: string; zip: string;
  telephone: string; mobile: string; position: string; positionNote: string;
  teamLeader: string; dateStarted: string; employeeStatus: string;
  motto: string; notes: string;
};

export default function EditUserPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const [form, setForm] = useState<FormState>({
    name: "", email: "", password: "", role: "user", roleId: "",
    username: "", address: "", country: "", zip: "",
    telephone: "", mobile: "", position: "", positionNote: "",
    teamLeader: "", dateStarted: "", employeeStatus: "Active",
    motto: "", notes: "",
  });
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`/api/users/${id}`).then((r) => r.json()),
      fetch("/api/roles").then((r) => r.json()),
    ]).then(([user, rolesData]: [UserData, unknown]) => {
      setForm({
        name: user.name || "",
        email: user.email || "",
        password: "",
        role: user.role || "user",
        roleId: user.roleId || "",
        username: user.username || "",
        address: user.address || "",
        country: user.country || "",
        zip: user.zip || "",
        telephone: user.telephone || "",
        mobile: user.mobile || "",
        position: user.position || "",
        positionNote: user.positionNote || "",
        teamLeader: user.teamLeader || "",
        dateStarted: user.dateStarted || "",
        employeeStatus: user.employeeStatus || "Active",
        motto: user.motto || "",
        notes: user.notes || "",
      });
      if (Array.isArray(rolesData)) setRoles(rolesData as UserRole[]);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

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
    setSaved(false);
    const payload: Record<string, unknown> = {
      name: form.name, email: form.email, role: form.role,
      roleId: form.roleId || null,
      username: form.username, address: form.address, country: form.country,
      zip: form.zip, telephone: form.telephone, mobile: form.mobile,
      position: form.position, positionNote: form.positionNote,
      teamLeader: form.teamLeader, dateStarted: form.dateStarted,
      employeeStatus: form.employeeStatus, motto: form.motto, notes: form.notes,
    };
    if (form.password) payload.password = form.password;

    const res = await fetch(`/api/users/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      setSaved(true);
      setTimeout(() => { setSaved(false); router.push("/users"); }, 1200);
    } else {
      let msg = "Failed to update user";
      try {
        const data = await res.json() as { error?: string };
        if (data.error) msg = data.error;
      } catch { /* empty body */ }
      setError(msg);
      setSaving(false);
    }
  }

  if (loading) return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header title="Edit User" />
        <main className="flex-1 p-6 flex items-center justify-center">
          <div style={{ color: "#605e5c" }}>Loading...</div>
        </main>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header title="Edit User" subtitle="Update user details and profile" />
        <main className="flex-1 p-6 max-w-2xl">
          <Link href="/users" className="inline-flex items-center gap-1.5 text-sm mb-6" style={{ color: "#605e5c" }}>
            <ArrowLeft className="w-4 h-4" />Back to Users
          </Link>

          <form onSubmit={handleSubmit} className="space-y-4">
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
                  />
                  <Input
                    label="Username"
                    value={form.username}
                    onChange={(e) => update("username", e.target.value)}
                    placeholder="Short login name"
                  />
                </div>
                <Input
                  label="Email"
                  type="email"
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                  required
                />
                <Input
                  label="New Password"
                  type="password"
                  value={form.password}
                  onChange={(e) => update("password", e.target.value)}
                  placeholder="Leave blank to keep current"
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
            {saved && (
              <div className="p-3 text-sm" style={{ backgroundColor: "#dff6dd", border: "1px solid #107c10", color: "#107c10" }}>
                User updated successfully!
              </div>
            )}
            <div className="flex gap-3">
              <Button type="submit" loading={saving}><Save className="w-4 h-4" />Save Changes</Button>
              <Link href="/users"><Button type="button" variant="outline">Cancel</Button></Link>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}
