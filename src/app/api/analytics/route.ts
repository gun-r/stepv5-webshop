import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const siteId = searchParams.get("siteId") || undefined;

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const syncWhere = siteId ? { siteId } : {};

  // Core queries — these tables always exist
  const [
    totalProducts,
    publishedProducts,
    draftProducts,
    syncStats,
    recentSyncs,
    syncTrendRaw,
    activityBreakdown,
    sites,
  ] = await Promise.all([
    prisma.product.count(),
    prisma.product.count({ where: { status: "published" } }),
    prisma.product.count({ where: { status: "draft" } }),
    prisma.productSync.groupBy({
      by: ["status"],
      where: syncWhere,
      _count: { status: true },
    }),
    prisma.productSync.findMany({
      where: { ...syncWhere, lastSyncedAt: { not: null } },
      orderBy: { lastSyncedAt: "desc" },
      take: 10,
      include: {
        product: { select: { title: true } },
        site: { select: { name: true } },
      },
    }),
    prisma.productSync.findMany({
      where: { ...syncWhere, lastSyncedAt: { gte: thirtyDaysAgo } },
      select: { lastSyncedAt: true, status: true },
    }),
    prisma.activityLog.groupBy({
      by: ["action"],
      where: { createdAt: { gte: thirtyDaysAgo } },
      _count: { action: true },
      orderBy: { _count: { action: "desc" } },
    }),
    prisma.site.findMany({
      select: {
        id: true,
        name: true,
        url: true,
        status: true,
        _count: { select: { syncs: true } },
      },
      orderBy: { name: "asc" },
    }),
  ]);

  // PageView queries — may fail if table hasn't been migrated on this DB yet
  const [deviceRes, browserRes, osRes, topPagesRes, totalViewsRes] =
    await Promise.allSettled([
      prisma.pageView.groupBy({
        by: ["device"],
        where: { createdAt: { gte: thirtyDaysAgo } },
        _count: { device: true },
        orderBy: { _count: { device: "desc" } },
      }),
      prisma.pageView.groupBy({
        by: ["browser"],
        where: { createdAt: { gte: thirtyDaysAgo } },
        _count: { browser: true },
        orderBy: { _count: { browser: "desc" } },
      }),
      prisma.pageView.groupBy({
        by: ["os"],
        where: { createdAt: { gte: thirtyDaysAgo } },
        _count: { os: true },
        orderBy: { _count: { os: "desc" } },
      }),
      prisma.pageView.groupBy({
        by: ["path"],
        where: { createdAt: { gte: thirtyDaysAgo } },
        _count: { path: true },
        orderBy: { _count: { path: "desc" } },
        take: 10,
      }),
      prisma.pageView.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    ]);

  const deviceBreakdown = deviceRes.status === "fulfilled" ? deviceRes.value : [];
  const browserBreakdown = browserRes.status === "fulfilled" ? browserRes.value : [];
  const osBreakdown = osRes.status === "fulfilled" ? osRes.value : [];
  const totalPageViews = totalViewsRes.status === "fulfilled" ? totalViewsRes.value : 0;

  // Compute unique & returning visitors per top path
  type TopPageEntry = { path: string; count: number; unique: number; returning: number };
  let topPages: TopPageEntry[] = [];
  if (topPagesRes.status === "fulfilled" && topPagesRes.value.length > 0) {
    const rawTopPages = topPagesRes.value;
    const topPaths = rawTopPages.map((p) => p.path);
    const visitorRows = await prisma.pageView.findMany({
      where: { createdAt: { gte: thirtyDaysAgo }, path: { in: topPaths } },
      select: { path: true, visitorId: true },
    }).catch(() => [] as { path: string; visitorId: string | null }[]);

    const pathVisitors: Record<string, Set<string>> = {};
    for (const row of visitorRows) {
      if (!pathVisitors[row.path]) pathVisitors[row.path] = new Set();
      if (row.visitorId) pathVisitors[row.path].add(row.visitorId);
    }

    topPages = rawTopPages.map((p) => {
      const unique = pathVisitors[p.path]?.size ?? 0;
      return { path: p.path, count: p._count.path, unique, returning: Math.max(0, p._count.path - unique) };
    });
  }

  // Build 30-day trend buckets
  const trendByDate: Record<string, { synced: number; error: number }> = {};
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    trendByDate[d.toISOString().slice(0, 10)] = { synced: 0, error: 0 };
  }
  for (const sync of syncTrendRaw) {
    if (!sync.lastSyncedAt) continue;
    const key = sync.lastSyncedAt.toISOString().slice(0, 10);
    if (!trendByDate[key]) continue;
    if (sync.status === "synced") trendByDate[key].synced++;
    else if (sync.status === "error") trendByDate[key].error++;
  }

  return NextResponse.json({
    products: {
      total: totalProducts,
      published: publishedProducts,
      draft: draftProducts,
    },
    syncs: {
      stats: Object.fromEntries(syncStats.map((s) => [s.status, s._count.status])),
      recent: recentSyncs,
    },
    trend: Object.entries(trendByDate).map(([date, counts]) => ({ date, ...counts })),
    activity: activityBreakdown.map((a) => ({ action: a.action, count: a._count.action })),
    sites,
    pageViews: {
      total: totalPageViews,
      devices: deviceBreakdown.map((d) => ({ name: d.device, count: d._count.device })),
      browsers: browserBreakdown.map((b) => ({ name: b.browser ?? "Other", count: b._count.browser })),
      os: osBreakdown.map((o) => ({ name: o.os ?? "Other", count: o._count.os })),
      topPages,
    },
  });
}
