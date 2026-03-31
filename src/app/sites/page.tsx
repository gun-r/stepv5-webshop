import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Plus, ExternalLink, Pencil } from "lucide-react";

export default async function SitesPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const sites = await prisma.site.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { syncs: true } },
    },
  });

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header
          title="Sites"
          subtitle="Manage your WooCommerce sites"
        />
        <main className="flex-1 p-6 space-y-4">
          <div className="flex justify-end">
            <Link
              href="/sites/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Site
            </Link>
          </div>

          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      URL
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Language
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Syncs
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {sites.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-6 py-12 text-center text-gray-400 text-sm"
                      >
                        No sites yet.{" "}
                        <Link
                          href="/sites/new"
                          className="text-indigo-600 hover:underline"
                        >
                          Add your first site
                        </Link>
                        .
                      </td>
                    </tr>
                  ) : (
                    sites.map((site) => (
                      <tr
                        key={site.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-3 text-sm font-medium text-gray-900">
                          {site.name}
                        </td>
                        <td className="px-6 py-3 text-sm text-gray-600">
                          <a
                            href={site.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 hover:text-indigo-600 transition-colors"
                          >
                            {site.url.replace(/^https?:\/\//, "")}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </td>
                        <td className="px-6 py-3 text-sm text-gray-600 uppercase">
                          {site.defaultLanguage}
                        </td>
                        <td className="px-6 py-3 text-sm text-gray-600">
                          {site._count.syncs}
                        </td>
                        <td className="px-6 py-3">
                          <Badge
                            variant={
                              site.status === "active" ? "success" : "default"
                            }
                          >
                            {site.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-3 text-right">
                          <Link
                            href={`/sites/${site.id}`}
                            className="inline-flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            Edit
                          </Link>
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
