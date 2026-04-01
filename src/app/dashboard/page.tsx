import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { SyncStatusBadge } from "@/components/ui/Badge";
import { Globe, Package, CheckCircle, Clock } from "lucide-react";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const [totalSites, totalProducts, syncedCount, pendingCount, recentSyncs] =
    await Promise.all([
      prisma.site.count(),
      prisma.product.count(),
      prisma.productSync.count({ where: { status: "synced" } }),
      prisma.productSync.count({ where: { status: "pending" } }),
      prisma.productSync.findMany({
        take: 10,
        orderBy: { updatedAt: "desc" },
        include: {
          product: { select: { title: true } },
          site: { select: { name: true } },
        },
      }),
    ]);

  const stats = [
    {
      label: "Total Sites",
      value: totalSites,
      icon: Globe,
      iconStyle: { backgroundColor: "#deecf9", color: "#0078d4" },
    },
    {
      label: "Total Products",
      value: totalProducts,
      icon: Package,
      iconStyle: { backgroundColor: "#f4f0ff", color: "#6b2fa0" },
    },
    {
      label: "Synced",
      value: syncedCount,
      icon: CheckCircle,
      iconStyle: { backgroundColor: "#dff6dd", color: "#107c10" },
    },
    {
      label: "Pending",
      value: pendingCount,
      icon: Clock,
      iconStyle: { backgroundColor: "#fff4ce", color: "#8a6914" },
    },
  ];

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header
          title="Dashboard"
          subtitle="Overview of your WooCommerce sites and products"
        />
        <main className="flex-1 p-6 space-y-5">
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <Card key={stat.label}>
                  <CardContent className="flex items-center gap-4 py-4">
                    <div className="w-10 h-10 flex items-center justify-center shrink-0" style={stat.iconStyle}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold" style={{ color: "#323130" }}>{stat.value}</p>
                      <p className="text-xs" style={{ color: "#605e5c" }}>{stat.label}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Recent Syncs */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Sync Activity</CardTitle>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: "1px solid #edebe9", backgroundColor: "#f3f2f1" }}>
                    <th className="text-left px-5 py-2.5 text-xs font-semibold uppercase tracking-wider" style={{ color: "#605e5c" }}>Product</th>
                    <th className="text-left px-5 py-2.5 text-xs font-semibold uppercase tracking-wider" style={{ color: "#605e5c" }}>Site</th>
                    <th className="text-left px-5 py-2.5 text-xs font-semibold uppercase tracking-wider" style={{ color: "#605e5c" }}>Status</th>
                    <th className="text-left px-5 py-2.5 text-xs font-semibold uppercase tracking-wider" style={{ color: "#605e5c" }}>Last Synced</th>
                  </tr>
                </thead>
                <tbody style={{ borderTop: "1px solid #edebe9" }}>
                  {recentSyncs.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-5 py-8 text-center text-sm" style={{ color: "#a19f9d" }}>
                        No sync activity yet. Start by adding sites and products.
                      </td>
                    </tr>
                  ) : (
                    recentSyncs.map((sync) => (
                      <tr key={sync.id} className="hover:bg-[#faf9f8] transition-colors" style={{ borderBottom: "1px solid #f3f2f1" }}>
                        <td className="px-5 py-2.5 text-sm font-medium" style={{ color: "#323130" }}>{sync.product.title}</td>
                        <td className="px-5 py-2.5 text-sm" style={{ color: "#605e5c" }}>{sync.site.name}</td>
                        <td className="px-5 py-2.5"><SyncStatusBadge status={sync.status} /></td>
                        <td className="px-5 py-2.5 text-sm" style={{ color: "#605e5c" }}>
                          {sync.lastSyncedAt ? new Date(sync.lastSyncedAt).toLocaleDateString() : "Never"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </main>
      </div>
    </div>
  );
}
