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
  Monitor,
  Smartphone,
  Tablet,
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
interface PageViewsData {
  total: number;
  devices: { name: string; count: number }[];
  browsers: { name: string; count: number }[];
  os: { name: string; count: number }[];
  topPages: { path: string; count: number; unique: number; returning: number }[];
}
interface InternalData {
  products: { total: number; published: number; draft: number };
  syncs: { stats: Record<string, number>; recent: SyncRecent[] };
  trend: TrendPoint[];
  activity: ActivityEntry[];
  sites: Site[];
  pageViews: PageViewsData;
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
interface WooData {
  totalOrders: number | null;
  sales: { total_sales: string; net_revenue: string; total_orders: number; total_items: number } | null;
  totalCustomers: number | null;
  totalWooProducts: number | null;
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

const DEVICE_COLORS: Record<string, string> = {
  desktop: "#0078d4", mobile: "#107c10", tablet: "#6b2fa0",
};
const DEVICE_ICONS: Record<string, React.ElementType> = {
  desktop: Monitor, mobile: Smartphone, tablet: Tablet,
};

function statusColor(s: string) {
  return STATUS_COLOR[s] ?? { bg: "#f3f2f1", text: "#605e5c" };
}

function BarRow({
  label, value, max, color = "#0078d4",
}: { label: string; value: number; max: number; color?: string }) {
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
  fetch('${appUrl}/api/analytics/track-site',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({siteId:'${siteId}',path:location.pathname,visitorId:v,referer:document.referrer||null})
  }).catch(function(){});
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
        style={copied
          ? { backgroundColor: "#107c10", color: "#fff" }
          : { backgroundColor: "#0078d4", color: "#fff" }}
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

  const trend     = internal?.trend ?? [];
  const maxTrend  = Math.max(...trend.map((t) => t.synced + t.error), 1);
  const maxActivity = Math.max(...(internal?.activity.map((a) => a.count) ?? [1]), 1);

  const pv         = internal?.pageViews;
  const totalViews = pv?.total ?? 0;
  const maxDevice  = Math.max(...(pv?.devices.map((d) => d.count) ?? [1]), 1);
  const maxBrowser = Math.max(...(pv?.browsers.map((b) => b.count) ?? [1]), 1);
  const maxOs      = Math.max(...(pv?.os.map((o) => o.count) ?? [1]), 1);
  const activeTopPages = siteId ? (woo?.topPages ?? []) : (pv?.topPages ?? []);
  const maxPage = Math.max(...activeTopPages.map((p) => p.count), 1);

  const maxLocation = Math.max(...(woo?.orderLocations.map((l) => l.count) ?? [1]), 1);
  const maxViewed   = Math.max(...(woo?.mostViewedProducts.map((p) => p.sales) ?? [1]), 1);

  const dash = loadingInternal ? "—" : undefined;

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header title="Analytics" subtitle="Site activity, sync performance, and WooCommerce insights" />
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

          {/* ── Internal stat cards ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
            {[
              { label: "Total Products", value: dash ?? internal?.products.total, sub: `${internal?.products.published ?? 0} published · ${internal?.products.draft ?? 0} draft`, icon: Package, iconStyle: { backgroundColor: "#f4f0ff", color: "#6b2fa0" } },
              { label: "Synced",  value: dash ?? synced,  sub: "successful syncs",  icon: CheckCircle, iconStyle: { backgroundColor: "#dff6dd", color: "#107c10" } },
              { label: "Pending", value: dash ?? pending, sub: "awaiting sync",     icon: Clock,       iconStyle: { backgroundColor: "#fff4ce", color: "#8a6914" } },
              { label: "Errors",  value: dash ?? errors,  sub: "failed syncs",      icon: XCircle,     iconStyle: { backgroundColor: "#fde7e9", color: "#a4262c" } },
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

          {/* ── WooCommerce stat cards ── */}
          {siteId && (
            <>
              <div className="flex items-center gap-2">
                <Globe size={12} style={{ color: "#0078d4" }} />
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#0078d4" }}>
                  WooCommerce Store
                </span>
                {loadingWoo && <span className="text-xs" style={{ color: "#a19f9d" }}>Loading…</span>}
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                {[
                  { label: "Total Orders",   value: loadingWoo ? "—" : (woo?.totalOrders ?? "—"),    icon: ShoppingCart, iconStyle: { backgroundColor: "#deecf9", color: "#0078d4" } },
                  { label: "Revenue (30 d)", value: loadingWoo ? "—" : (woo?.sales ? parseFloat(woo.sales.total_sales).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "—"), icon: DollarSign, iconStyle: { backgroundColor: "#dff6dd", color: "#107c10" } },
                  { label: "Customers",      value: loadingWoo ? "—" : (woo?.totalCustomers ?? "—"),  icon: Users,       iconStyle: { backgroundColor: "#f4f0ff", color: "#6b2fa0" } },
                  { label: "Live Products",  value: loadingWoo ? "—" : (woo?.totalWooProducts ?? "—"),icon: TrendingUp,  iconStyle: { backgroundColor: "#fff4ce", color: "#8a6914" } },
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
              {wooError && <p className="text-xs" style={{ color: "#a4262c" }}>{wooError}</p>}
            </>
          )}

          {/* ── Sync trend chart ── */}
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

          {/* ── Device / Browser / OS breakdown ── */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Monitor size={12} style={{ color: "#605e5c" }} />
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#605e5c" }}>
                Admin App Usage — Last 30 Days
              </span>
              <span className="text-xs" style={{ color: "#a19f9d" }}>
                ({totalViews} page views)
              </span>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">

              {/* Device */}
              <Card>
                <CardHeader><CardTitle>Device</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {!pv?.devices.length ? (
                    <p className="text-xs" style={{ color: "#a19f9d" }}>No data yet.</p>
                  ) : (
                    pv.devices.map((d) => {
                      const Icon = DEVICE_ICONS[d.name] ?? Monitor;
                      const color = DEVICE_COLORS[d.name] ?? "#8a8886";
                      const pct = Math.round((d.count / totalViews) * 100);
                      return (
                        <div key={d.name}>
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-1.5">
                              <Icon size={12} style={{ color }} />
                              <span className="text-xs capitalize" style={{ color: "#323130" }}>{d.name}</span>
                            </div>
                            <span className="text-xs font-semibold" style={{ color: "#323130" }}>{d.count} <span style={{ color: "#a19f9d", fontWeight: 400 }}>({pct}%)</span></span>
                          </div>
                          <div className="h-1.5 w-full" style={{ backgroundColor: "#f3f2f1" }}>
                            <div className="h-1.5" style={{ width: `${(d.count / maxDevice) * 100}%`, backgroundColor: color }} />
                          </div>
                        </div>
                      );
                    })
                  )}
                </CardContent>
              </Card>

              {/* Browser */}
              <Card>
                <CardHeader><CardTitle>Browser</CardTitle></CardHeader>
                <CardContent className="space-y-2.5">
                  {!pv?.browsers.length ? (
                    <p className="text-xs" style={{ color: "#a19f9d" }}>No data yet.</p>
                  ) : (
                    pv.browsers.map((b, i) => (
                      <BarRow
                        key={b.name}
                        label={b.name}
                        value={b.count}
                        max={maxBrowser}
                        color={["#0078d4", "#107c10", "#6b2fa0", "#8a6914", "#a4262c"][i % 5]}
                      />
                    ))
                  )}
                </CardContent>
              </Card>

              {/* OS */}
              <Card>
                <CardHeader><CardTitle>Operating System</CardTitle></CardHeader>
                <CardContent className="space-y-2.5">
                  {!pv?.os.length ? (
                    <p className="text-xs" style={{ color: "#a19f9d" }}>No data yet.</p>
                  ) : (
                    pv.os.map((o, i) => (
                      <BarRow
                        key={o.name}
                        label={o.name}
                        value={o.count}
                        max={maxOs}
                        color={["#0078d4", "#107c10", "#6b2fa0", "#8a6914", "#a4262c"][i % 5]}
                      />
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* ── Top pages ── */}
          {siteId ? (
            !loadingWoo && (
              woo && woo.topPages.length > 0 ? (
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Eye size={12} style={{ color: "#0078d4" }} />
                      <CardTitle>Top Pages — {internal?.sites.find((s) => s.id === siteId)?.name} (Last 30 Days)</CardTitle>
                    </div>
                  </CardHeader>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr style={{ borderBottom: "1px solid #edebe9", backgroundColor: "#f3f2f1" }}>
                          <th className="text-left px-4 py-2 text-xs font-semibold uppercase tracking-wider" style={{ color: "#605e5c" }}>Page</th>
                          <th className="text-right px-4 py-2 text-xs font-semibold uppercase tracking-wider" style={{ color: "#605e5c" }}>Total</th>
                          <th className="text-right px-4 py-2 text-xs font-semibold uppercase tracking-wider" style={{ color: "#0078d4" }}>Unique</th>
                          <th className="text-right px-4 py-2 text-xs font-semibold uppercase tracking-wider" style={{ color: "#107c10" }}>Returning</th>
                          <th className="px-4 py-2 w-32"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {woo.topPages.map((p) => (
                          <tr key={p.path} style={{ borderBottom: "1px solid #f3f2f1" }}>
                            <td className="px-4 py-2 text-xs font-mono" style={{ color: "#323130" }}>{p.path}</td>
                            <td className="px-4 py-2 text-xs text-right font-semibold" style={{ color: "#323130" }}>{p.count}</td>
                            <td className="px-4 py-2 text-xs text-right font-semibold" style={{ color: "#0078d4" }}>{p.unique}</td>
                            <td className="px-4 py-2 text-xs text-right font-semibold" style={{ color: "#107c10" }}>{p.returning}</td>
                            <td className="px-4 py-2">
                              <div className="h-1.5 w-full" style={{ backgroundColor: "#f3f2f1" }}>
                                <div className="h-1.5" style={{ width: `${(p.count / maxPage) * 100}%`, backgroundColor: "#0078d4" }} />
                              </div>
                            </td>
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
                      WordPress does not expose page view data via its REST API. Add the snippet below to your WooCommerce site to start tracking real page views.
                    </p>
                    <p className="text-xs font-semibold" style={{ color: "#323130" }}>
                      In WordPress admin → Appearance → Theme File Editor → <span className="font-mono">functions.php</span> — paste at the bottom:
                    </p>
                    <TrackingSnippet siteId={siteId} />
                    <p className="text-xs" style={{ color: "#a19f9d" }}>
                      Once added, page views will appear here within minutes. Data is stored per visitor using localStorage.
                    </p>
                  </CardContent>
                </Card>
              )
            )
          ) : (
            !!pv?.topPages.length && (
              <Card>
                <CardHeader><CardTitle>Top Pages — Admin App (Last 30 Days)</CardTitle></CardHeader>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr style={{ borderBottom: "1px solid #edebe9", backgroundColor: "#f3f2f1" }}>
                        <th className="text-left px-4 py-2 text-xs font-semibold uppercase tracking-wider" style={{ color: "#605e5c" }}>Page</th>
                        <th className="text-right px-4 py-2 text-xs font-semibold uppercase tracking-wider" style={{ color: "#605e5c" }}>Total</th>
                        <th className="text-right px-4 py-2 text-xs font-semibold uppercase tracking-wider" style={{ color: "#0078d4" }}>Unique</th>
                        <th className="text-right px-4 py-2 text-xs font-semibold uppercase tracking-wider" style={{ color: "#107c10" }}>Returning</th>
                        <th className="px-4 py-2 w-32"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {pv.topPages.map((p) => (
                        <tr key={p.path} style={{ borderBottom: "1px solid #f3f2f1" }}>
                          <td className="px-4 py-2 text-xs font-mono" style={{ color: "#323130" }}>{p.path}</td>
                          <td className="px-4 py-2 text-xs text-right font-semibold" style={{ color: "#323130" }}>{p.count}</td>
                          <td className="px-4 py-2 text-xs text-right font-semibold" style={{ color: "#0078d4" }}>{p.unique}</td>
                          <td className="px-4 py-2 text-xs text-right font-semibold" style={{ color: "#107c10" }}>{p.returning}</td>
                          <td className="px-4 py-2">
                            <div className="h-1.5 w-full" style={{ backgroundColor: "#f3f2f1" }}>
                              <div className="h-1.5" style={{ width: `${(p.count / maxPage) * 100}%`, backgroundColor: "#0078d4" }} />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )
          )}

          {/* ── WooCommerce: location + most viewed + abandoned ── */}
          {siteId && !loadingWoo && woo && (
            <>
              {/* Order Locations */}
              {woo.orderLocations.length > 0 && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <MapPin size={12} style={{ color: "#0078d4" }} />
                      <CardTitle>Order Locations (Last 300 Orders)</CardTitle>
                    </div>
                  </CardHeader>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
                    <div className="overflow-x-auto" style={{ borderRight: "1px solid #edebe9" }}>
                      <table className="w-full">
                        <thead>
                          <tr style={{ borderBottom: "1px solid #edebe9", backgroundColor: "#f3f2f1" }}>
                            <th className="text-left px-3 py-1.5 text-xs font-semibold uppercase tracking-wider" style={{ color: "#605e5c" }}>Country</th>
                            <th className="text-left px-3 py-1.5 text-xs font-semibold uppercase tracking-wider" style={{ color: "#605e5c" }}>Orders</th>
                            <th className="text-left px-3 py-1.5 text-xs font-semibold uppercase tracking-wider" style={{ color: "#605e5c" }}>Share</th>
                          </tr>
                        </thead>
                        <tbody>
                          {woo.orderLocations.map((loc) => {
                            const total = woo.orderLocations.reduce((s, l) => s + l.count, 0);
                            const pct = Math.round((loc.count / total) * 100);
                            return (
                              <tr key={loc.country}
                                style={{ borderBottom: "1px solid #f3f2f1" }}
                                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "#faf9f8")}
                                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "")}
                              >
                                <td className="px-3 py-1.5 text-xs font-medium" style={{ color: "#323130" }}>{loc.country}</td>
                                <td className="px-3 py-1.5 text-xs font-semibold" style={{ color: "#323130" }}>{loc.count}</td>
                                <td className="px-3 py-1.5 text-xs" style={{ color: "#605e5c" }}>{pct}%</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    <CardContent className="space-y-2.5">
                      {woo.orderLocations.map((loc, i) => (
                        <BarRow
                          key={loc.country}
                          label={loc.country}
                          value={loc.count}
                          max={maxLocation}
                          color={["#0078d4", "#107c10", "#6b2fa0", "#8a6914", "#a4262c", "#00b7c3", "#d83b01"][i % 7]}
                        />
                      ))}
                    </CardContent>
                  </div>
                </Card>
              )}

              {/* Most Viewed Products */}
              {woo.mostViewedProducts.length > 0 && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Eye size={12} style={{ color: "#6b2fa0" }} />
                      <CardTitle>Most Popular Products (by Sales Volume)</CardTitle>
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

              {/* Abandoned Cart Report */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <AlertTriangle size={12} style={{ color: "#8a6914" }} />
                      <CardTitle>Abandoned Carts</CardTitle>
                    </div>
                    <span
                      className="text-xs font-semibold px-2 py-0.5"
                      style={
                        woo.abandonedCarts.count > 0
                          ? { backgroundColor: "#fff4ce", color: "#8a6914" }
                          : { backgroundColor: "#dff6dd", color: "#107c10" }
                      }
                    >
                      {woo.abandonedCarts.count > 0
                        ? `${woo.abandonedCarts.count} pending order${woo.abandonedCarts.count !== 1 ? "s" : ""} > 1h`
                        : "No abandoned carts"}
                    </span>
                  </div>
                </CardHeader>
                {woo.abandonedCarts.orders.length === 0 ? (
                  <CardContent>
                    <p className="text-xs" style={{ color: "#a19f9d" }}>
                      No pending orders older than 1 hour. Great!
                    </p>
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
                          <tr
                            key={order.id}
                            style={{ borderBottom: "1px solid #f3f2f1" }}
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
                            <td className="px-3 py-1.5 text-xs font-semibold" style={{ color: "#323130" }}>
                              {order.currency} {order.total}
                            </td>
                            <td className="px-3 py-1.5">
                              <span
                                className="inline-flex text-xs font-medium px-1.5 py-0.5"
                                style={
                                  order.hoursAgo > 24
                                    ? { backgroundColor: "#fde7e9", color: "#a4262c" }
                                    : { backgroundColor: "#fff4ce", color: "#8a6914" }
                                }
                              >
                                {order.hoursAgo}h ago
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            </>
          )}

          {/* ── Recent syncs + Activity breakdown ── */}
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
                          <tr key={sync.id}
                            style={{ borderBottom: "1px solid #f3f2f1" }}
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

          {/* ── WooCommerce recent orders ── */}
          {siteId && !loadingWoo && woo && woo.recentOrders.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Recent WooCommerce Orders</CardTitle></CardHeader>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr style={{ borderBottom: "1px solid #edebe9", backgroundColor: "#f3f2f1" }}>
                      <th className="text-left px-3 py-1.5 text-xs font-semibold uppercase tracking-wider" style={{ color: "#605e5c" }}>Order #</th>
                      <th className="text-left px-3 py-1.5 text-xs font-semibold uppercase tracking-wider hidden sm:table-cell" style={{ color: "#605e5c" }}>Customer</th>
                      <th className="text-left px-3 py-1.5 text-xs font-semibold uppercase tracking-wider" style={{ color: "#605e5c" }}>Status</th>
                      <th className="text-left px-3 py-1.5 text-xs font-semibold uppercase tracking-wider" style={{ color: "#605e5c" }}>Total</th>
                      <th className="text-left px-3 py-1.5 text-xs font-semibold uppercase tracking-wider hidden md:table-cell" style={{ color: "#605e5c" }}>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {woo.recentOrders.map((order) => {
                      const c = statusColor(order.status);
                      return (
                        <tr key={order.id}
                          style={{ borderBottom: "1px solid #f3f2f1" }}
                          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "#faf9f8")}
                          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "")}
                        >
                          <td className="px-3 py-1.5 text-xs font-semibold" style={{ color: "#0078d4" }}>#{order.number}</td>
                          <td className="px-3 py-1.5 text-xs hidden sm:table-cell" style={{ color: "#323130" }}>{order.customerName}</td>
                          <td className="px-3 py-1.5">
                            <span className="inline-flex text-xs font-medium px-1.5 py-0.5" style={{ backgroundColor: c.bg, color: c.text }}>{order.status}</span>
                          </td>
                          <td className="px-3 py-1.5 text-xs font-semibold" style={{ color: "#323130" }}>{order.currency} {order.total}</td>
                          <td className="px-3 py-1.5 text-xs hidden md:table-cell" style={{ color: "#605e5c" }}>{new Date(order.date).toLocaleDateString()}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* ── Top-selling products ── */}
          {siteId && !loadingWoo && woo && woo.topProducts.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Top-Selling Products This Month</CardTitle></CardHeader>
              <CardContent className="space-y-2.5">
                {(() => {
                  const maxQty = Math.max(...woo.topProducts.map((p) => p.quantity), 1);
                  return woo.topProducts.map((p, i) => (
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
                  ));
                })()}
              </CardContent>
            </Card>
          )}

          {/* ── Sites overview (all-sites view) ── */}
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
                        <tr key={site.id}
                          style={{ borderBottom: "1px solid #f3f2f1" }}
                          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "#faf9f8")}
                          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "")}
                        >
                          <td className="px-3 py-1.5 text-xs font-medium" style={{ color: "#323130" }}>{site.name}</td>
                          <td className="px-3 py-1.5 text-xs hidden sm:table-cell" style={{ color: "#605e5c" }}>{site.url}</td>
                          <td className="px-3 py-1.5">
                            <span className="inline-flex text-xs font-medium px-1.5 py-0.5"
                              style={site.status === "active"
                                ? { backgroundColor: "#dff6dd", color: "#107c10" }
                                : { backgroundColor: "#f3f2f1", color: "#605e5c" }}
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
