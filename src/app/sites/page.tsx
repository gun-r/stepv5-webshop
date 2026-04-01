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
              className="inline-flex items-center gap-2 px-4 py-2 text-white text-sm font-medium transition-colors hover:bg-[#106ebe]"
              style={{ backgroundColor: "#0078d4" }}
            >
              <Plus className="w-4 h-4" />
              Add Site
            </Link>
          </div>

          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: "1px solid #edebe9", backgroundColor: "#f3f2f1" }}>
                    <th className="text-left px-5 py-2.5 text-xs font-semibold uppercase tracking-wider" style={{ color: "#605e5c" }}>Name</th>
                    <th className="text-left px-5 py-2.5 text-xs font-semibold uppercase tracking-wider" style={{ color: "#605e5c" }}>URL</th>
                    <th className="text-left px-5 py-2.5 text-xs font-semibold uppercase tracking-wider" style={{ color: "#605e5c" }}>Language</th>
                    <th className="text-left px-5 py-2.5 text-xs font-semibold uppercase tracking-wider" style={{ color: "#605e5c" }}>Syncs</th>
                    <th className="text-left px-5 py-2.5 text-xs font-semibold uppercase tracking-wider" style={{ color: "#605e5c" }}>Status</th>
                    <th className="text-right px-5 py-2.5 text-xs font-semibold uppercase tracking-wider" style={{ color: "#605e5c" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sites.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-12 text-center text-sm" style={{ color: "#a19f9d" }}>
                        No sites yet.{" "}
                        <Link href="/sites/new" className="hover:underline" style={{ color: "#0078d4" }}>
                          Add your first site
                        </Link>
                        .
                      </td>
                    </tr>
                  ) : (
                    sites.map((site) => (
                      <tr key={site.id} className="hover:bg-[#faf9f8] transition-colors" style={{ borderBottom: "1px solid #f3f2f1" }}>
                        <td className="px-5 py-2.5 text-sm font-medium" style={{ color: "#323130" }}>{site.name}</td>
                        <td className="px-5 py-2.5 text-sm" style={{ color: "#605e5c" }}>
                          <a href={site.url} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1 transition-colors hover:underline" style={{ color: "#0078d4" }}>
                            {site.url.replace(/^https?:\/\//, "")}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </td>
                        <td className="px-5 py-2.5 text-sm uppercase" style={{ color: "#605e5c" }}>{site.defaultLanguage}</td>
                        <td className="px-5 py-2.5 text-sm" style={{ color: "#605e5c" }}>{site._count.syncs}</td>
                        <td className="px-5 py-2.5">
                          <Badge variant={site.status === "active" ? "success" : "default"}>{site.status}</Badge>
                        </td>
                        <td className="px-5 py-2.5 text-right">
                          <Link href={`/sites/${site.id}`}
                            className="inline-flex items-center gap-1.5 text-sm font-medium hover:underline" style={{ color: "#0078d4" }}>
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
