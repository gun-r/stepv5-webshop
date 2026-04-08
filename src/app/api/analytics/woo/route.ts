import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function authHeader(key: string, secret: string) {
  return `Basic ${Buffer.from(`${key}:${secret}`).toString("base64")}`;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function dateMinus(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

// Fetch all pages of a WC endpoint (up to maxPages) to build aggregated data
async function fetchAllPages<T>(
  url: string,
  headers: HeadersInit,
  perPage = 100,
  maxPages = 5
): Promise<T[]> {
  const results: T[] = [];
  for (let page = 1; page <= maxPages; page++) {
    const sep = url.includes("?") ? "&" : "?";
    const res = await fetch(`${url}${sep}per_page=${perPage}&page=${page}`, { headers }).catch(() => null);
    if (!res || !res.ok) break;
    const data = (await res.json()) as T[];
    results.push(...data);
    const total = parseInt(res.headers.get("X-WP-TotalPages") || "1");
    if (page >= total) break;
  }
  return results;
}

// Aggregate an array of billing.country strings into sorted country counts
function aggregateLocations(orders: { billing?: { country?: string; city?: string } }[]) {
  const countryMap: Record<string, number> = {};
  for (const o of orders) {
    const country = o.billing?.country?.trim();
    if (country) countryMap[country] = (countryMap[country] ?? 0) + 1;
  }
  return Object.entries(countryMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([country, count]) => ({ country, count }));
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const siteId = searchParams.get("siteId");
  if (!siteId) return NextResponse.json({ error: "siteId required" }, { status: 400 });

  const site = await prisma.site.findUnique({ where: { id: siteId } });
  if (!site) return NextResponse.json({ error: "Site not found" }, { status: 404 });

  const base = site.url.replace(/\/$/, "");
  const auth = authHeader(site.consumerKey, site.consumerSecret);
  const headers = { Authorization: auth };

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // One hour ago (for abandoned cart threshold)
  const abandonedBefore = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  // ── WooPageView top pages (our own tracking) ──
  const topPagesRaw = await prisma.wooPageView.groupBy({
    by: ["path"],
    where: { siteId, createdAt: { gte: thirtyDaysAgo } },
    _count: { path: true },
    orderBy: { _count: { path: "desc" } },
    take: 10,
  }).catch(() => [] as { path: string; _count: { path: number } }[]);

  let topPages: { path: string; count: number; unique: number; returning: number }[] = [];
  if (topPagesRaw.length > 0) {
    const topPaths = topPagesRaw.map((p) => p.path);
    const visitorRows = await prisma.wooPageView.findMany({
      where: { siteId, createdAt: { gte: thirtyDaysAgo }, path: { in: topPaths } },
      select: { path: true, visitorId: true },
    }).catch(() => [] as { path: string; visitorId: string | null }[]);

    const pathVisitors: Record<string, Set<string>> = {};
    for (const row of visitorRows) {
      if (!pathVisitors[row.path]) pathVisitors[row.path] = new Set();
      if (row.visitorId) pathVisitors[row.path].add(row.visitorId);
    }
    topPages = topPagesRaw.map((p) => {
      const unique = pathVisitors[p.path]?.size ?? 0;
      return { path: p.path, count: p._count.path, unique, returning: Math.max(0, p._count.path - unique) };
    });
  }

  const [
    ordersRes,
    salesRes,
    customersRes,
    productsRes,
    recentOrdersRes,
    topProductsRes,
    locationOrdersRes,
    mostViewedRes,
    abandonedRes,
  ] = await Promise.allSettled([
    fetch(`${base}/wp-json/wc/v3/orders?per_page=1&status=any`, { headers }),
    fetch(`${base}/wp-json/wc/v3/reports/sales?date_min=${dateMinus(30)}&date_max=${today()}`, { headers }),
    fetch(`${base}/wp-json/wc/v3/customers?per_page=1`, { headers }),
    fetch(`${base}/wp-json/wc/v3/products?per_page=1&status=publish`, { headers }),
    fetch(`${base}/wp-json/wc/v3/orders?per_page=5&orderby=date&order=desc`, { headers }),
    fetch(`${base}/wp-json/wc/v3/reports/top_sellers?period=month&limit=10`, { headers }),
    // Fetch last 300 orders for location aggregation (3 pages × 100)
    fetchAllPages<{ billing?: { country?: string; city?: string } }>(
      `${base}/wp-json/wc/v3/orders?status=any&orderby=date&order=desc`,
      headers,
      100,
      3
    ),
    // Most viewed = ordered by popularity (WC stores total_sales as popularity proxy)
    fetch(`${base}/wp-json/wc/v3/products?per_page=10&orderby=popularity&order=desc&status=publish`, { headers }),
    // Abandoned carts = pending orders older than 1 hour
    fetch(
      `${base}/wp-json/wc/v3/orders?status=pending&before=${abandonedBefore}&per_page=20&orderby=date&order=desc`,
      { headers }
    ),
  ]);

  // ── Total orders ──
  const totalOrders =
    ordersRes.status === "fulfilled" && ordersRes.value.ok
      ? parseInt(ordersRes.value.headers.get("X-WP-Total") || "0")
      : null;

  // ── Sales report ──
  type SalesReport = { total_sales: string; net_revenue: string; total_orders: number; total_items: number };
  const salesData: SalesReport | null =
    salesRes.status === "fulfilled" && salesRes.value.ok
      ? ((await salesRes.value.json()) as SalesReport[])[0] ?? null
      : null;

  // ── Customers ──
  const totalCustomers =
    customersRes.status === "fulfilled" && customersRes.value.ok
      ? parseInt(customersRes.value.headers.get("X-WP-Total") || "0")
      : null;

  // ── Live products ──
  const totalWooProducts =
    productsRes.status === "fulfilled" && productsRes.value.ok
      ? parseInt(productsRes.value.headers.get("X-WP-Total") || "0")
      : null;

  // ── Recent orders ──
  type WooOrder = {
    id: number; number: string; status: string; total: string; currency: string;
    billing: { first_name: string; last_name: string; country?: string };
    date_created: string; customer_user_agent?: string;
  };
  const rawOrders: WooOrder[] =
    recentOrdersRes.status === "fulfilled" && recentOrdersRes.value.ok
      ? ((await recentOrdersRes.value.json()) as WooOrder[])
      : [];

  // ── Top sellers ──
  type TopSeller = { title: string; product_id: number; quantity: number };
  const topProducts: TopSeller[] =
    topProductsRes.status === "fulfilled" && topProductsRes.value.ok
      ? ((await topProductsRes.value.json()) as TopSeller[])
      : [];

  // ── Locations ──
  const locationOrders =
    locationOrdersRes.status === "fulfilled" ? locationOrdersRes.value : [];
  const orderLocations = aggregateLocations(locationOrders);

  // ── Most viewed products ──
  type WooProduct = { id: number; name: string; total_sales: number; permalink: string };
  const mostViewedProducts: { id: number; name: string; sales: number }[] =
    mostViewedRes.status === "fulfilled" && mostViewedRes.value.ok
      ? ((await mostViewedRes.value.json()) as WooProduct[]).slice(0, 10).map((p) => ({
          id: p.id,
          name: p.name,
          sales: p.total_sales,
        }))
      : [];

  // ── Abandoned carts (pending orders > 1h old) ──
  type AbandonedOrder = {
    id: number; number: string; total: string; currency: string;
    billing: { first_name: string; last_name: string; email?: string };
    line_items: { name: string; quantity: number }[];
    date_created: string;
  };
  const abandonedOrders: {
    id: number; number: string; total: string; currency: string;
    customerName: string; email: string;
    items: { name: string; quantity: number }[];
    date: string; hoursAgo: number;
  }[] =
    abandonedRes.status === "fulfilled" && abandonedRes.value.ok
      ? ((await abandonedRes.value.json()) as AbandonedOrder[]).slice(0, 20).map((o) => {
          const hoursAgo = Math.round(
            (Date.now() - new Date(o.date_created).getTime()) / 36e5
          );
          return {
            id: o.id,
            number: o.number,
            total: o.total,
            currency: o.currency,
            customerName: `${o.billing?.first_name ?? ""} ${o.billing?.last_name ?? ""}`.trim() || "Guest",
            email: o.billing?.email ?? "",
            items: (o.line_items ?? []).slice(0, 3),
            date: o.date_created,
            hoursAgo,
          };
        })
      : [];

  return NextResponse.json({
    totalOrders,
    sales: salesData,
    totalCustomers,
    totalWooProducts,
    recentOrders: rawOrders.slice(0, 5).map((o) => ({
      id: o.id,
      number: o.number,
      status: o.status,
      total: o.total,
      currency: o.currency,
      customerName: `${o.billing?.first_name ?? ""} ${o.billing?.last_name ?? ""}`.trim() || "Guest",
      date: o.date_created,
    })),
    topProducts: topProducts.slice(0, 5).map((p) => ({
      title: p.title,
      productId: p.product_id,
      quantity: p.quantity,
    })),
    orderLocations,
    topPages,
    mostViewedProducts,
    abandonedCarts: {
      count: abandonedOrders.length,
      orders: abandonedOrders,
    },
  });
}
