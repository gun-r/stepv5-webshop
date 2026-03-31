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
      color: "bg-blue-50 text-blue-600",
    },
    {
      label: "Total Products",
      value: totalProducts,
      icon: Package,
      color: "bg-purple-50 text-purple-600",
    },
    {
      label: "Synced",
      value: syncedCount,
      icon: CheckCircle,
      color: "bg-green-50 text-green-600",
    },
    {
      label: "Pending",
      value: pendingCount,
      icon: Clock,
      color: "bg-yellow-50 text-yellow-600",
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
        <main className="flex-1 p-6 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <Card key={stat.label}>
                  <CardContent className="flex items-center gap-4 py-5">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.color}`}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">
                        {stat.value}
                      </p>
                      <p className="text-sm text-gray-500">{stat.label}</p>
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
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Site
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Synced
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {recentSyncs.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-6 py-8 text-center text-gray-400 text-sm"
                      >
                        No sync activity yet. Start by adding sites and products.
                      </td>
                    </tr>
                  ) : (
                    recentSyncs.map((sync) => (
                      <tr key={sync.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-3 text-sm font-medium text-gray-900">
                          {sync.product.title}
                        </td>
                        <td className="px-6 py-3 text-sm text-gray-600">
                          {sync.site.name}
                        </td>
                        <td className="px-6 py-3">
                          <SyncStatusBadge status={sync.status} />
                        </td>
                        <td className="px-6 py-3 text-sm text-gray-500">
                          {sync.lastSyncedAt
                            ? new Date(sync.lastSyncedAt).toLocaleDateString()
                            : "Never"}
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
