"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Lock, Mail } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Invalid email or password");
    } else {
      router.push("/dashboard");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: "#1b1b1b" }}>
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 mb-4">
            <img src="/logo.png" alt="STEPv5 WC Logo" width={56} height={56} className="object-contain" />
          </div>
          <h1 className="text-xl font-semibold text-white">STEPv5 WC</h1>
          <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.45)" }}>
            Multi-site WooCommerce Management
          </p>
        </div>

        {/* Card */}
        <div className="bg-white p-8" style={{ border: "1px solid #edebe9" }}>
          <h2 className="text-sm font-semibold mb-5" style={{ color: "#323130" }}>Sign in to your account</h2>

          {error && (
            <div className="mb-4 p-3 text-sm" style={{ backgroundColor: "#fde7e9", border: "1px solid #f1707b", color: "#a4262c" }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="block text-xs font-semibold" style={{ color: "#323130" }}>Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#a19f9d" }} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-1"
                  style={{ border: "1px solid #8a8886", color: "#323130" }}
                  onFocus={(e) => { e.target.style.borderColor = "#0078d4"; e.target.style.boxShadow = "0 0 0 1px #0078d4"; }}
                  onBlur={(e) => { e.target.style.borderColor = "#8a8886"; e.target.style.boxShadow = ""; }}
                  placeholder="admin@webshop.com"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold" style={{ color: "#323130" }}>Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#a19f9d" }} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-9 pr-3 py-2 text-sm focus:outline-none"
                  style={{ border: "1px solid #8a8886", color: "#323130" }}
                  onFocus={(e) => { e.target.style.borderColor = "#0078d4"; e.target.style.boxShadow = "0 0 0 1px #0078d4"; }}
                  onBlur={(e) => { e.target.style.borderColor = "#8a8886"; e.target.style.boxShadow = ""; }}
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 px-4 text-sm font-medium text-white flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              style={{ backgroundColor: loading ? "#106ebe" : "#0078d4" }}
              onMouseEnter={(e) => { if (!loading) (e.currentTarget as HTMLElement).style.backgroundColor = "#106ebe"; }}
              onMouseLeave={(e) => { if (!loading) (e.currentTarget as HTMLElement).style.backgroundColor = "#0078d4"; }}
            >
              {loading && (
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
