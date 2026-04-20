"use client";

import { useEffect, useState, useCallback } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import {
  Package,
  CheckCircle,
  Clock,
  XCircle,
  ShoppingCart,
  DollarSign,
  Users,
  Globe,
  RefreshCw,
  TrendingUp,
  MapPin,
  Eye,
  AlertTriangle,
  Mail,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────

interface Site {
  id: string; name: string; url: string; status: string;
  _count: { syncs: number };
}
interface SyncRecent {
  id: string; status: string; lastSyncedAt: string | null;
  product: { title: string }; site: { name: string };
}
interface TrendPoint { date: string; synced: number; error: number }
interface ActivityEntry { action: string; count: number }
interface InternalData {
  products: { total: number; published: number; draft: number };
  syncs: { stats: Record<string, number>; recent: SyncRecent[] };
  trend: TrendPoint[];
  activity: ActivityEntry[];
  sites: Site[];
}

interface WooOrder {
  id: number; number: string; status: string; total: string;
  currency: string; customerName: string; date: string;
}
interface TopProduct { title: string; productId: number; quantity: number }
interface LocationEntry { country: string; count: number }
interface MostViewed { id: number; name: string; sales: number }
interface AbandonedOrder {
  id: number; number: string; total: string; currency: string;
  customerName: string; email: string;
  items: { name: string; quantity: number }[];
  date: string; hoursAgo: number;
}
interface TrafficPoint { date: string; pageViews: number; visitors: number }
interface AvgTimePage { path: string; avgMs: number; count: number }
interface WooData {
  totalOrders: number | null;
  sales: { total_sales: string; net_revenue: string; total_orders: number; total_items: number } | null;
  totalCustomers: number | null;
  totalWooProducts: number | null;
  totalVisitors: number;
  totalPageViews: number;
  productsCommissioned: number | null;
  trafficTrend: TrafficPoint[];
  avgTimePerPage: AvgTimePage[];
  recentOrders: WooOrder[];
  topProducts: TopProduct[];
  orderLocations: LocationEntry[];
  topPages: { path: string; count: number; unique: number; returning: number }[];
  mostViewedProducts: MostViewed[];
  abandonedCarts: { count: number; orders: AbandonedOrder[] };
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const STATUS_COLOR: Record<string, { bg: string; text: string }> = {
  synced:     { bg: "#dff6dd", text: "#107c10" },
  pending:    { bg: "#fff4ce", text: "#8a6914" },
  error:      { bg: "#fde7e9", text: "#a4262c" },
  completed:  { bg: "#dff6dd", text: "#107c10" },
  processing: { bg: "#deecf9", text: "#0078d4" },
  "on-hold":  { bg: "#f4f0ff", text: "#6b2fa0" },
  cancelled:  { bg: "#fde7e9", text: "#a4262c" },
  refunded:   { bg: "#f3f2f1", text: "#605e5c" },
};

const ACTION_COLOR: Record<string, string> = {
  "product.create": "#107c10", "product.update": "#0078d4",
  "product.delete": "#a4262c", "product.import": "#6b2fa0",
  "user.create": "#107c10",   "user.update": "#0078d4",
  "user.delete": "#a4262c",
};

const PI_COLORS = ["#0078d4", "#107c10", "#6b2fa0", "#8a6914", "#a4262c", "#00b7c3", "#d83b01", "#038387", "#ca5010", "#8764b8"];

function statusColor(s: string) {
  return STATUS_COLOR[s] ?? { bg: "#f3f2f1", text: "#605e5c" };
}

function fmtDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return rem > 0 ? `${m}m ${rem}s` : `${m}m`;
}

function SectionLabel({ icon: Icon, label, sub }: { icon: React.ElementType; label: string; sub?: string }) {
  return (
    <div className="flex items-center gap-2 pt-2">
      <Icon size={12} style={{ color: "#605e5c" }} />
      <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#605e5c" }}>{label}</span>
      {sub && <span className="text-xs" style={{ color: "#a19f9d" }}>{sub}</span>}
    </div>
  );
}

function BarRow({ label, value, max, color = "#0078d4" }: { label: string; value: number; max: number; color?: string }) {
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-xs" style={{ color: "#323130" }}>{label}</span>
        <span className="text-xs font-semibold" style={{ color: "#323130" }}>{value}</span>
      </div>
      <div className="h-1.5 w-full" style={{ backgroundColor: "#f3f2f1" }}>
        <div className="h-1.5" style={{ width: `${(value / Math.max(max, 1)) * 100}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

// ── Tracking Snippet ───────────────────────────────────────────────────────────

function TrackingSnippet({ siteId }: { siteId: string }) {
  const [copied, setCopied] = useState(false);
  const appUrl = typeof window !== "undefined" ? window.location.origin : "https://your-webshop-app.com";
  const snippet = `add_action('wp_footer', function() { ?>
<script>
(function(){
  var v=localStorage.getItem('_wsv')||(function(){
    var i=Math.random().toString(36).slice(2)+Date.now().toString(36);
    localStorage.setItem('_wsv',i);return i;
  })();
  var t=Date.now(),sent=false;
  function send(){
    if(sent)return;sent=true;
    var d=Math.round(Date.now()-t);
    var u='${appUrl}/api/analytics/track-site';
    var b=JSON.stringify({siteId:'${siteId}',path:location.pathname,visitorId:v,referer:document.referrer||null,duration:d});
    if(navigator.sendBeacon){navigator.sendBeacon(u,new Blob([b],{type:'application/json'}));}
    else{fetch(u,{method:'POST',headers:{'Content-Type':'application/json'},body:b,keepalive:true}).catch(function(){});}
  }
  document.addEventListener('visibilitychange',function(){if(document.visibilityState==='hidden')send();});
  window.addEventListener('pagehide',send);
})();
</script>
<?php }, 99);`;

  function copy() {
    navigator.clipboard.writeText(snippet).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="relative">
      <pre
        className="text-xs p-3 overflow-x-auto"
        style={{ backgroundColor: "#1e1e1e", color: "#d4d4d4", fontFamily: "monospace", whiteSpace: "pre" }}
      >
        {snippet}
      </pre>
      <button
        onClick={copy}
        className="absolute top-2 right-2 px-2 py-1 text-xs font-medium"
        style={copied ? { backgroundColor: "#107c10", color: "#fff" } : { backgroundColor: "#0078d4", color: "#fff" }}
      >
        {copied ? "Copied!" : "Copy"}
      </button>
    </div>
  );
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [siteId, setSiteId] = useState("");
  const [internal, setInternal] = useState<InternalData | null>(null);
  const [woo, setWoo] = useState<WooData | null>(null);
  const [loadingInternal, setLoadingInternal] = useState(true);
  const [loadingWoo, setLoadingWoo] = useState(false);
  const [wooError, setWooError] = useState<string | null>(null);

  const fetchInternal = useCallback(async (sid: string) => {
    setLoadingInternal(true);
    const qs = sid ? `?siteId=${sid}` : "";
    const res = await fetch(`/api/analytics${qs}`);
    if (res.ok) setInternal((await res.json()) as InternalData);
    setLoadingInternal(false);
  }, []);

  const fetchWoo = useCallback(async (sid: string) => {
    if (!sid) { setWoo(null); return; }
    setLoadingWoo(true);
    setWooError(null);
    const res = await fetch(`/api/analytics/woo?siteId=${sid}`);
    if (res.ok) setWoo((await res.json()) as WooData);
    else { setWooError("Could not reach WooCommerce store. Check API credentials."); setWoo(null); }
    setLoadingWoo(false);
  }, []);

  useEffect(() => {
    fetchInternal(siteId);
    if (siteId) fetchWoo(siteId);
    else setWoo(null);
  }, [siteId, fetchInternal, fetchWoo]);

  const synced  = internal?.syncs.stats["synced"]  ?? 0;
  const pending = internal?.syncs.stats["pending"] ?? 0;
  const errors  = internal?.syncs.stats["error"]   ?? 0;
  const trend   = internal?.trend ?? [];
  const maxTrend    = Math.max(...trend.map((t) => t.synced + t.error), 1);
  const maxActivity = Math.max(...(internal?.activity.map((a) => a.count) ?? [1]), 1);
  const maxLocation = Math.max(...(woo?.orderLocations.map((l) => l.count) ?? [1]), 1);
  const maxViewed   = Math.max(...(woo?.mostViewedProducts.map((p) => p.sales) ?? [1]), 1);
  const dash = loadingInternal ? "—" : undefined;
  const siteName = internal?.sites.find((s) => s.id === siteId)?.name ?? "";

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header title="Analytics" subtitle="Store performance, traffic, and sync insights" />
        <main className="flex-1 p-4 space-y-4">

          {/* ── Site selector ── */}
          <div className="flex items-center gap-3 flex-wrap">
            <label className="text-xs font-medium" style={{ color: "#605e5c" }}>Viewing:</label>
            <select
              value={siteId}
              onChange={(e) => setSiteId(e.target.value)}
              className="px-2.5 py-1.5 text-xs focus:outline-none"
              style={{ border: "1px solid #8a8886", color: "#323130", backgroundColor: "#ffffff", minWidth: 190 }}
            >
              <option value="">All Sites</option>
              {internal?.sites.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <button
              onClick={() => { fetchInternal(siteId); if (siteId) fetchWoo(siteId); }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium transition-opacity hover:opacity-80"
              style={{ border: "1px solid #0078d4", color: "#0078d4", backgroundColor: "#ffffff" }}
            >
              <RefreshCw size={11} />
              Refresh
            </button>
          </div>

          {/* ── Sync stats ── */}
          <SectionLabel icon={Package} label="Product Sync" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
            {[
              { label: "Total Products", value: dash ?? internal?.products.total, sub: `${internal?.products.published ?? 0} published · ${internal?.products.draft ?? 0} draft`, icon: Package,      iconStyle: { backgroundColor: "#f4f0ff", color: "#6b2fa0" } },
              { label: "Synced",         value: dash ?? synced,                   sub: "successful syncs",                                                                          icon: CheckCircle, iconStyle: { backgroundColor: "#dff6dd", color: "#107c10" } },
              { label: "Pending",        value: dash ?? pending,                  sub: "awaiting sync",                                                                             icon: Clock,       iconStyle: { backgroundColor: "#fff4ce", color: "#8a6914" } },
              { label: "Errors",         value: dash ?? errors,                   sub: "failed syncs",                                                                              icon: XCircle,     iconStyle: { backgroundColor: "#fde7e9", color: "#a4262c" } },
            ].map((stat) => {
              const Icon = stat.icon;
              return (
                <Card key={stat.label}>
                  <CardContent className="flex items-center gap-3">
                    <div className="w-8 h-8 flex items-center justify-center shrink-0" style={stat.iconStyle}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-lg font-bold leading-tight" style={{ color: "#323130" }}>{stat.value ?? "—"}</p>
                      <p className="text-xs font-medium" style={{ color: "#323130" }}>{stat.label}</p>
                      <p className="text-xs" style={{ color: "#a19f9d" }}>{stat.sub}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* ── WooCommerce section (site selected only) ── */}
          {siteId && (
            <>
              {/* Store KPIs */}
              <SectionLabel icon={Globe} label={`WooCommerce — ${siteName}`} sub={loadingWoo ? "Loading…" : undefined} />
              {wooError && <p className="text-xs" style={{ color: "#a4262c" }}>{wooError}</p>}

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                {[
                  { label: "Total Orders",      value: loadingWoo ? "—" : (woo?.totalOrders ?? "—"),       icon: ShoppingCart, iconStyle: { backgroundColor: "#deecf9", color: "#0078d4" } },
                  { label: "Revenue (30 d)",    value: loadingWoo ? "—" : (woo?.sales ? parseFloat(woo.sales.total_sales).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "—"), icon: DollarSign, iconStyle: { backgroundColor: "#dff6dd", color: "#107c10" } },
                  { label: "Net Revenue (30 d)",value: loadingWoo ? "—" : (woo?.sales ? parseFloat(woo.sales.net_revenue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "—"),  icon: TrendingUp, iconStyle: { backgroundColor: "#fff4ce", color: "#8a6914" } },
                  { label: "Customers",         value: loadingWoo ? "—" : (woo?.totalCustomers ?? "—"),    icon: Users,        iconStyle: { backgroundColor: "#f4f0ff", color: "#6b2fa0" } },
                ].map((stat) => {
                  const Icon = stat.icon;
                  return (
                    <Card key={stat.label}>
                      <CardContent className="flex items-center gap-3">
                        <div className="w-8 h-8 flex items-center justify-center shrink-0" style={stat.iconStyle}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-lg font-bold leading-tight" style={{ color: "#323130" }}>{stat.value}</p>
                          <p className="text-xs font-medium" style={{ color: "#323130" }}>{stat.label}</p>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Traffic KPIs */}
              <SectionLabel icon={Eye} label="Traffic — Last 30 Days" />
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                {[
                  { label: "Page Views",         value: loadingWoo ? "—" : (woo?.totalPageViews ?? 0),        icon: Eye,         iconStyle: { backgroundColor: "#deecf9", color: "#0078d4" } },
                  { label: "Unique Visitors",    value: loadingWoo ? "—" : (woo?.totalVisitors ?? 0),         icon: Users,       iconStyle: { backgroundColor: "#dff6dd", color: "#107c10" } },
                  { label: "Products Ordered",   value: loadingWoo ? "—" : (woo?.productsCommissioned ?? "—"),icon: Package,     iconStyle: { backgroundColor: "#f4f0ff", color: "#6b2fa0" } },
                  { label: "Live Products",      value: loadingWoo ? "—" : (woo?.totalWooProducts ?? "—"),    icon: TrendingUp,  iconStyle: { backgroundColor: "#fff4ce", color: "#8a6914" } },
                ].map((stat) => {
                  const Icon = stat.icon;
                  return (
                    <Card key={stat.label}>
                      <CardContent className="flex items-center gap-3">
                        <div className="w-8 h-8 flex items-center justify-center shrink-0" style={stat.iconStyle}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-lg font-bold leading-tight" style={{ color: "#323130" }}>{stat.value}</p>
                          <p className="text-xs font-medium" style={{ color: "#323130" }}>{stat.label}</p>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Traffic chart */}
              {!loadingWoo && woo && (() => {
                const maxPV = Math.max(...woo.trafficTrend.map((t) => t.pageViews), 1);
                return (
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <CardTitle>Traffic Trend — Last 30 Days</CardTitle>
                        <div className="flex gap-4">
                          <span className="text-xs font-semibold" style={{ color: "#323130" }}>{woo.totalPageViews.toLocaleString()} views</span>
                          <span className="text-xs font-semibold" style={{ color: "#107c10" }}>{woo.totalVisitors.toLocaleString()} unique visitors</span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-end gap-px" style={{ height: 96 }}>
                        {woo.trafficTrend.map((point) => {
                          const heightPct = point.pageViews === 0 ? 0 : Math.max((point.pageViews / maxPV) * 100, 4);
                          const visitorPct = point.pageViews === 0 ? 0 : Math.min((point.visitors / point.pageViews) * 100, 100);
                          return (
                            <div key={point.date} className="flex-1 flex flex-col justify-end group relative cursor-default">
                              <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 hidden group-hover:block z-10 pointer-events-none">
                                <div className="px-2 py-1 whitespace-nowrap text-center" style={{ backgroundColor: "#323130", color: "#fff", fontSize: 10 }}>
                                  <div style={{ color: "#edebe9" }}>{point.date}</div>
                                  <div style={{ color: "#9bd89a" }}>{point.visitors} visitors</div>
                                  <div style={{ color: "#9bbce8" }}>{point.pageViews} views</div>
                                </div>
                              </div>
                              {point.pageViews > 0 ? (
                                <div className="w-full overflow-hidden" style={{ height: `${heightPct}%` }}>
                                  <div style={{ height: `${visitorPct}%`, backgroundColor: "#107c10", minHeight: point.visitors > 0 ? 2 : 0 }} />
                                  <div style={{ height: `${100 - visitorPct}%`, backgroundColor: "#0078d4", minHeight: 2 }} />
                                </div>
                              ) : (
                                <div className="w-full" style={{ height: 2, backgroundColor: "#edebe9" }} />
                              )}
                            </div>
                          );
                        })}
                      </div>
                      <div className="flex gap-4 mt-2.5">
                        <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5" style={{ backgroundColor: "#107c10" }} /><span className="text-xs" style={{ color: "#605e5c" }}>Unique Visitors</span></div>
                        <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5" style={{ backgroundColor: "#0078d4" }} /><span className="text-xs" style={{ color: "#605e5c" }}>Page Views</span></div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })()}

              {/* Top Pages + Avg Time side by side */}
              {!loadingWoo && woo && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {/* Top Pages */}
                  {woo.topPages.length > 0 ? (
                    <Card>
                      <CardHeader>
                        <div className="flex items-center gap-2">
                          <Eye size={12} style={{ color: "#0078d4" }} />
                          <CardTitle>Top Pages</CardTitle>
                        </div>
                      </CardHeader>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr style={{ borderBottom: "1px solid #edebe9", backgroundColor: "#f3f2f1" }}>
                              <th className="text-left px-3 py-2 text-xs font-semibold uppercase tracking-wider" style={{ color: "#605e5c" }}>Page</th>
                              <th className="text-right px-3 py-2 text-xs font-semibold uppercase tracking-wider" style={{ color: "#605e5c" }}>Total</th>
                              <th className="text-right px-3 py-2 text-xs font-semibold uppercase tracking-wider" style={{ color: "#0078d4" }}>Unique</th>
                              <th className="text-right px-3 py-2 text-xs font-semibold uppercase tracking-wider" style={{ color: "#107c10" }}>Return</th>
                            </tr>
                          </thead>
                          <tbody>
                            {woo.topPages.map((p) => (
                              <tr key={p.path} style={{ borderBottom: "1px solid #f3f2f1" }}>
                                <td className="px-3 py-1.5 text-xs font-mono truncate max-w-[140px]" style={{ color: "#323130" }}>{p.path}</td>
                                <td className="px-3 py-1.5 text-xs text-right font-semibold" style={{ color: "#323130" }}>{p.count}</td>
                                <td className="px-3 py-1.5 text-xs text-right font-semibold" style={{ color: "#0078d4" }}>{p.unique}</td>
                                <td className="px-3 py-1.5 text-xs text-right font-semibold" style={{ color: "#107c10" }}>{p.returning}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </Card>
                  ) : (
                    <Card>
                      <CardHeader>
                        <div className="flex items-center gap-2">
                          <Eye size={12} style={{ color: "#0078d4" }} />
                          <CardTitle>Top Pages — Setup Required</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <p className="text-xs" style={{ color: "#605e5c" }}>
                          Add the snippet below to your WordPress site to start tracking page views.
                        </p>
                        <p className="text-xs font-semibold" style={{ color: "#323130" }}>
                          WordPress admin → Appearance → Theme File Editor → <span className="font-mono">functions.php</span>
                        </p>
                        <TrackingSnippet siteId={siteId} />
                      </CardContent>
                    </Card>
                  )}

                  {/* Average Time on Page */}
                  {woo.avgTimePerPage.length > 0 ? (
                    <Card>
                      <CardHeader>
                        <div className="flex items-center gap-2">
                          <Clock size={12} style={{ color: "#6b2fa0" }} />
                          <CardTitle>Avg Time on Page</CardTitle>
                        </div>
                      </CardHeader>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr style={{ borderBottom: "1px solid #edebe9", backgroundColor: "#f3f2f1" }}>
                              <th className="text-left px-3 py-2 text-xs font-semibold uppercase tracking-wider" style={{ color: "#605e5c" }}>Page</th>
                              <th className="text-right px-3 py-2 text-xs font-semibold uppercase tracking-wider" style={{ color: "#605e5c" }}>Views</th>
                              <th className="text-right px-3 py-2 text-xs font-semibold uppercase tracking-wider" style={{ color: "#6b2fa0" }}>Avg Time</th>
                            </tr>
                          </thead>
                          <tbody>
                            {woo.avgTimePerPage.map((p) => (
                              <tr key={p.path} style={{ borderBottom: "1px solid #f3f2f1" }}>
                                <td className="px-3 py-1.5 text-xs font-mono truncate max-w-[140px]" style={{ color: "#323130" }}>{p.path}</td>
                                <td className="px-3 py-1.5 text-xs text-right font-semibold" style={{ color: "#323130" }}>{p.count}</td>
                                <td className="px-3 py-1.5 text-xs text-right font-semibold" style={{ color: "#6b2fa0" }}>{fmtDuration(p.avgMs)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </Card>
                  ) : (
                    <Card>
                      <CardHeader>
                        <div className="flex items-center gap-2">
                          <Clock size={12} style={{ color: "#6b2fa0" }} />
                          <CardTitle>Avg Time on Page</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-xs" style={{ color: "#a19f9d" }}>
                          No time data yet. Update your tracking snippet to enable duration tracking.
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {/* PI Mapping */}
              {!loadingWoo && woo && woo.topPages.length > 0 && (() => {
                const totalImpressions = woo.topPages.reduce((s, p) => s + p.count, 0);
                return (
                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <Eye size={12} style={{ color: "#d83b01" }} />
                        <CardTitle>PI Mapping — Page Impression Distribution</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex flex-wrap gap-1" style={{ minHeight: 72 }}>
                        {woo.topPages.map((p, i) => {
                          const pct = (p.count / totalImpressions) * 100;
                          const color = PI_COLORS[i % PI_COLORS.length];
                          return (
                            <div
                              key={p.path}
                              className="flex items-center justify-center overflow-hidden cursor-default group relative"
                              style={{ backgroundColor: color, minWidth: 40, height: 52, flexGrow: pct, flexShrink: 0, width: `${Math.max(pct * 2, 5)}%` }}
                            >
                              <div className="absolute inset-0 hidden group-hover:flex flex-col items-center justify-center px-1" style={{ backgroundColor: "rgba(0,0,0,0.55)" }}>
                                <span className="text-white font-semibold text-center leading-tight" style={{ fontSize: 10 }}>{p.path}</span>
                                <span className="text-white" style={{ fontSize: 9 }}>{p.count} views · {pct.toFixed(1)}%</span>
                              </div>
                              {pct >= 8 && (
                                <span className="text-white font-semibold text-center px-1 leading-tight truncate max-w-full" style={{ fontSize: 10 }}>
                                  {p.path.length > 20 ? p.path.slice(0, 18) + "…" : p.path}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                        {woo.topPages.map((p, i) => (
                          <div key={p.path} className="flex items-center gap-1.5">
                            <div className="w-2.5 h-2.5 shrink-0" style={{ backgroundColor: PI_COLORS[i % PI_COLORS.length] }} />
                            <span className="text-xs font-mono" style={{ color: "#323130" }}>{p.path}</span>
                            <span className="text-xs font-semibold" style={{ color: "#605e5c" }}>{((p.count / totalImpressions) * 100).toFixed(1)}%</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              })()}

              {/* Order Locations + Most Popular Products */}
              {!loadingWoo && woo && (woo.orderLocations.length > 0 || woo.mostViewedProducts.length > 0) && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {woo.orderLocations.length > 0 && (
                    <Card>
                      <CardHeader>
                        <div className="flex items-center gap-2">
                          <MapPin size={12} style={{ color: "#0078d4" }} />
                          <CardTitle>Order Locations</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-2.5">
                        {woo.orderLocations.map((loc, i) => {
                          const total = woo.orderLocations.reduce((s, l) => s + l.count, 0);
                          const pct = Math.round((loc.count / total) * 100);
                          return (
                            <div key={loc.country}>
                              <div className="flex justify-between mb-1">
                                <span className="text-xs" style={{ color: "#323130" }}>{loc.country}</span>
                                <span className="text-xs font-semibold" style={{ color: "#323130" }}>{loc.count} <span style={{ color: "#a19f9d", fontWeight: 400 }}>({pct}%)</span></span>
                              </div>
                              <div className="h-1.5 w-full" style={{ backgroundColor: "#f3f2f1" }}>
                                <div className="h-1.5" style={{ width: `${(loc.count / maxLocation) * 100}%`, backgroundColor: ["#0078d4", "#107c10", "#6b2fa0", "#8a6914", "#a4262c", "#00b7c3", "#d83b01"][i % 7] }} />
                              </div>
                            </div>
                          );
                        })}
                      </CardContent>
                    </Card>
                  )}

                  {woo.mostViewedProducts.length > 0 && (
                    <Card>
                      <CardHeader>
                        <div className="flex items-center gap-2">
                          <TrendingUp size={12} style={{ color: "#6b2fa0" }} />
                          <CardTitle>Most Popular Products</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-2.5">
                        {woo.mostViewedProducts.map((p, i) => (
                          <div key={p.id}>
                            <div className="flex justify-between mb-1">
                              <span className="text-xs" style={{ color: "#323130" }}>
                                <span className="font-semibold mr-1.5" style={{ color: "#a19f9d" }}>#{i + 1}</span>
                                {p.name}
                              </span>
                              <span className="text-xs font-semibold" style={{ color: "#323130" }}>{p.sales} sold</span>
                            </div>
                            <div className="h-1.5 w-full" style={{ backgroundColor: "#f3f2f1" }}>
                              <div className="h-1.5" style={{ width: `${(p.sales / maxViewed) * 100}%`, backgroundColor: "#6b2fa0" }} />
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {/* Abandoned Carts */}
              {!loadingWoo && woo && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <AlertTriangle size={12} style={{ color: "#8a6914" }} />
                        <CardTitle>Abandoned Carts</CardTitle>
                      </div>
                      <span
                        className="text-xs font-semibold px-2 py-0.5"
                        style={woo.abandonedCarts.count > 0
                          ? { backgroundColor: "#fff4ce", color: "#8a6914" }
                          : { backgroundColor: "#dff6dd", color: "#107c10" }}
                      >
                        {woo.abandonedCarts.count > 0
                          ? `${woo.abandonedCarts.count} pending order${woo.abandonedCarts.count !== 1 ? "s" : ""} > 1h`
                          : "No abandoned carts"}
                      </span>
                    </div>
                  </CardHeader>
                  {woo.abandonedCarts.orders.length === 0 ? (
                    <CardContent>
                      <p className="text-xs" style={{ color: "#a19f9d" }}>No pending orders older than 1 hour.</p>
                    </CardContent>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr style={{ borderBottom: "1px solid #edebe9", backgroundColor: "#f3f2f1" }}>
                            <th className="text-left px-3 py-1.5 text-xs font-semibold uppercase tracking-wider" style={{ color: "#605e5c" }}>Order #</th>
                            <th className="text-left px-3 py-1.5 text-xs font-semibold uppercase tracking-wider hidden sm:table-cell" style={{ color: "#605e5c" }}>Customer</th>
                            <th className="text-left px-3 py-1.5 text-xs font-semibold uppercase tracking-wider hidden md:table-cell" style={{ color: "#605e5c" }}>Items</th>
                            <th className="text-left px-3 py-1.5 text-xs font-semibold uppercase tracking-wider" style={{ color: "#605e5c" }}>Total</th>
                            <th className="text-left px-3 py-1.5 text-xs font-semibold uppercase tracking-wider" style={{ color: "#605e5c" }}>Idle</th>
                          </tr>
                        </thead>
                        <tbody>
                          {woo.abandonedCarts.orders.map((order) => (
                            <tr key={order.id} style={{ borderBottom: "1px solid #f3f2f1" }}
                              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "#faf9f8")}
                              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "")}
                            >
                              <td className="px-3 py-1.5 text-xs font-semibold" style={{ color: "#0078d4" }}>#{order.number}</td>
                              <td className="px-3 py-1.5 hidden sm:table-cell">
                                <p className="text-xs font-medium" style={{ color: "#323130" }}>{order.customerName}</p>
                                {order.email && (
                                  <a href={`mailto:${order.email}`} className="flex items-center gap-1 text-xs hover:underline" style={{ color: "#0078d4" }}>
                                    <Mail size={10} />{order.email}
                                  </a>
                                )}
                              </td>
                              <td className="px-3 py-1.5 text-xs hidden md:table-cell" style={{ color: "#605e5c" }}>
                                {order.items.map((it) => `${it.quantity}× ${it.name}`).join(", ")}
                              </td>
                              <td className="px-3 py-1.5 text-xs font-semibold" style={{ color: "#323130" }}>{order.currency} {order.total}</td>
                              <td className="px-3 py-1.5">
                                <span className="inline-flex text-xs font-medium px-1.5 py-0.5"
                                  style={order.hoursAgo > 24 ? { backgroundColor: "#fde7e9", color: "#a4262c" } : { backgroundColor: "#fff4ce", color: "#8a6914" }}
                                >{order.hoursAgo}h ago</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </Card>
              )}

              {/* Recent Orders + Top Sellers */}
              {!loadingWoo && woo && (woo.recentOrders.length > 0 || woo.topProducts.length > 0) && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {woo.recentOrders.length > 0 && (
                    <Card>
                      <CardHeader><CardTitle>Recent Orders</CardTitle></CardHeader>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr style={{ borderBottom: "1px solid #edebe9", backgroundColor: "#f3f2f1" }}>
                              <th className="text-left px-3 py-1.5 text-xs font-semibold uppercase tracking-wider" style={{ color: "#605e5c" }}>Order #</th>
                              <th className="text-left px-3 py-1.5 text-xs font-semibold uppercase tracking-wider hidden sm:table-cell" style={{ color: "#605e5c" }}>Customer</th>
                              <th className="text-left px-3 py-1.5 text-xs font-semibold uppercase tracking-wider" style={{ color: "#605e5c" }}>Status</th>
                              <th className="text-left px-3 py-1.5 text-xs font-semibold uppercase tracking-wider" style={{ color: "#605e5c" }}>Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {woo.recentOrders.map((order) => {
                              const c = statusColor(order.status);
                              return (
                                <tr key={order.id} style={{ borderBottom: "1px solid #f3f2f1" }}
                                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "#faf9f8")}
                                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "")}
                                >
                                  <td className="px-3 py-1.5 text-xs font-semibold" style={{ color: "#0078d4" }}>#{order.number}</td>
                                  <td className="px-3 py-1.5 text-xs hidden sm:table-cell" style={{ color: "#323130" }}>{order.customerName}</td>
                                  <td className="px-3 py-1.5">
                                    <span className="inline-flex text-xs font-medium px-1.5 py-0.5" style={{ backgroundColor: c.bg, color: c.text }}>{order.status}</span>
                                  </td>
                                  <td className="px-3 py-1.5 text-xs font-semibold" style={{ color: "#323130" }}>{order.currency} {order.total}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </Card>
                  )}

                  {woo.topProducts.length > 0 && (() => {
                    const maxQty = Math.max(...woo.topProducts.map((p) => p.quantity), 1);
                    return (
                      <Card>
                        <CardHeader><CardTitle>Top-Selling Products (This Month)</CardTitle></CardHeader>
                        <CardContent className="space-y-2.5">
                          {woo.topProducts.map((p, i) => (
                            <div key={p.productId}>
                              <div className="flex justify-between mb-1">
                                <span className="text-xs" style={{ color: "#323130" }}>
                                  <span className="font-semibold mr-1.5" style={{ color: "#a19f9d" }}>#{i + 1}</span>
                                  {p.title}
                                </span>
                                <span className="text-xs font-semibold" style={{ color: "#323130" }}>{p.quantity} sold</span>
                              </div>
                              <div className="h-1.5 w-full" style={{ backgroundColor: "#f3f2f1" }}>
                                <div className="h-1.5" style={{ width: `${(p.quantity / maxQty) * 100}%`, backgroundColor: "#0078d4" }} />
                              </div>
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    );
                  })()}
                </div>
              )}
            </>
          )}

          {/* ── Sync activity ── */}
          <SectionLabel icon={CheckCircle} label="Sync Activity" />
          <Card>
            <CardHeader><CardTitle>Sync Activity — Last 30 Days</CardTitle></CardHeader>
            <CardContent>
              <div className="flex items-end gap-px" style={{ height: 96 }}>
                {trend.map((point) => {
                  const total = point.synced + point.error;
                  const heightPct = total === 0 ? 0 : Math.max((total / maxTrend) * 100, 4);
                  const syncedPct = total === 0 ? 0 : (point.synced / total) * 100;
                  return (
                    <div key={point.date} className="flex-1 flex flex-col justify-end group relative cursor-default">
                      <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 hidden group-hover:block z-10 pointer-events-none">
                        <div className="px-2 py-1 whitespace-nowrap text-center" style={{ backgroundColor: "#323130", color: "#fff", fontSize: 10 }}>
                          <div style={{ color: "#edebe9" }}>{point.date}</div>
                          <div style={{ color: "#9bd89a" }}>{point.synced} synced</div>
                          {point.error > 0 && <div style={{ color: "#f4b8b8" }}>{point.error} errors</div>}
                        </div>
                      </div>
                      {total > 0 ? (
                        <div className="w-full overflow-hidden" style={{ height: `${heightPct}%` }}>
                          <div style={{ height: `${syncedPct}%`, backgroundColor: "#107c10", minHeight: point.synced > 0 ? 2 : 0 }} />
                          <div style={{ height: `${100 - syncedPct}%`, backgroundColor: "#a4262c", minHeight: point.error > 0 ? 2 : 0 }} />
                        </div>
                      ) : (
                        <div className="w-full" style={{ height: 2, backgroundColor: "#edebe9" }} />
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="flex gap-4 mt-2.5">
                <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5" style={{ backgroundColor: "#107c10" }} /><span className="text-xs" style={{ color: "#605e5c" }}>Synced</span></div>
                <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5" style={{ backgroundColor: "#a4262c" }} /><span className="text-xs" style={{ color: "#605e5c" }}>Errors</span></div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Syncs + Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <Card>
              <CardHeader><CardTitle>Recent Syncs</CardTitle></CardHeader>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr style={{ borderBottom: "1px solid #edebe9", backgroundColor: "#f3f2f1" }}>
                      <th className="text-left px-3 py-1.5 text-xs font-semibold uppercase tracking-wider" style={{ color: "#605e5c" }}>Product</th>
                      {!siteId && <th className="text-left px-3 py-1.5 text-xs font-semibold uppercase tracking-wider hidden sm:table-cell" style={{ color: "#605e5c" }}>Site</th>}
                      <th className="text-left px-3 py-1.5 text-xs font-semibold uppercase tracking-wider" style={{ color: "#605e5c" }}>Status</th>
                      <th className="text-left px-3 py-1.5 text-xs font-semibold uppercase tracking-wider" style={{ color: "#605e5c" }}>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingInternal ? (
                      <tr><td colSpan={4} className="px-3 py-6 text-center text-xs" style={{ color: "#a19f9d" }}>Loading…</td></tr>
                    ) : !internal?.syncs.recent.length ? (
                      <tr><td colSpan={4} className="px-3 py-6 text-center text-xs" style={{ color: "#a19f9d" }}>No syncs yet.</td></tr>
                    ) : (
                      internal.syncs.recent.map((sync) => {
                        const c = statusColor(sync.status);
                        return (
                          <tr key={sync.id} style={{ borderBottom: "1px solid #f3f2f1" }}
                            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "#faf9f8")}
                            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "")}
                          >
                            <td className="px-3 py-1.5 text-xs font-medium max-w-[130px] truncate" style={{ color: "#323130" }}>{sync.product.title}</td>
                            {!siteId && <td className="px-3 py-1.5 text-xs hidden sm:table-cell" style={{ color: "#605e5c" }}>{sync.site.name}</td>}
                            <td className="px-3 py-1.5">
                              <span className="inline-flex text-xs font-medium px-1.5 py-0.5" style={{ backgroundColor: c.bg, color: c.text }}>{sync.status}</span>
                            </td>
                            <td className="px-3 py-1.5 text-xs whitespace-nowrap" style={{ color: "#605e5c" }}>
                              {sync.lastSyncedAt ? new Date(sync.lastSyncedAt).toLocaleDateString() : "Never"}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </Card>

            <Card>
              <CardHeader><CardTitle>Activity Breakdown — Last 30 Days</CardTitle></CardHeader>
              <CardContent className="space-y-2.5">
                {loadingInternal ? (
                  <p className="text-xs" style={{ color: "#a19f9d" }}>Loading…</p>
                ) : !internal?.activity.length ? (
                  <p className="text-xs" style={{ color: "#a19f9d" }}>No activity in the last 30 days.</p>
                ) : (
                  internal.activity.map((entry) => (
                    <BarRow
                      key={entry.action}
                      label={entry.action.replace(".", " › ")}
                      value={entry.count}
                      max={maxActivity}
                      color={ACTION_COLOR[entry.action] ?? "#8a8886"}
                    />
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sites overview (all-sites view only) */}
          {!siteId && internal && (
            <Card>
              <CardHeader><CardTitle>Sites Overview</CardTitle></CardHeader>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr style={{ borderBottom: "1px solid #edebe9", backgroundColor: "#f3f2f1" }}>
                      <th className="text-left px-3 py-1.5 text-xs font-semibold uppercase tracking-wider" style={{ color: "#605e5c" }}>Site</th>
                      <th className="text-left px-3 py-1.5 text-xs font-semibold uppercase tracking-wider hidden sm:table-cell" style={{ color: "#605e5c" }}>URL</th>
                      <th className="text-left px-3 py-1.5 text-xs font-semibold uppercase tracking-wider" style={{ color: "#605e5c" }}>Status</th>
                      <th className="text-left px-3 py-1.5 text-xs font-semibold uppercase tracking-wider" style={{ color: "#605e5c" }}>Syncs</th>
                    </tr>
                  </thead>
                  <tbody>
                    {internal.sites.length === 0 ? (
                      <tr><td colSpan={4} className="px-3 py-6 text-center text-xs" style={{ color: "#a19f9d" }}>No sites configured.</td></tr>
                    ) : (
                      internal.sites.map((site) => (
                        <tr key={site.id} style={{ borderBottom: "1px solid #f3f2f1" }}
                          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "#faf9f8")}
                          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "")}
                        >
                          <td className="px-3 py-1.5 text-xs font-medium" style={{ color: "#323130" }}>{site.name}</td>
                          <td className="px-3 py-1.5 text-xs hidden sm:table-cell" style={{ color: "#605e5c" }}>{site.url}</td>
                          <td className="px-3 py-1.5">
                            <span className="inline-flex text-xs font-medium px-1.5 py-0.5"
                              style={site.status === "active" ? { backgroundColor: "#dff6dd", color: "#107c10" } : { backgroundColor: "#f3f2f1", color: "#605e5c" }}
                            >{site.status}</span>
                          </td>
                          <td className="px-3 py-1.5 text-xs font-semibold" style={{ color: "#323130" }}>{site._count.syncs}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

        </main>
      </div>
    </div>
  );
}
