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
    include: { _count: { select: { syncs: true } } },
  });

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header title="Sites" subtitle="Manage your WooCommerce sites" />
        <main className="flex-1 p-4 space-y-3">
          <div className="flex justify-end">
            <Link
              href="/sites/new"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-white text-xs font-medium transition-colors bg-[#0078d4] hover:bg-[#106ebe]"
            >
              <Plus className="w-3.5 h-3.5" />Add Site
            </Link>
          </div>

          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: "1px solid #edebe9", backgroundColor: "#f3f2f1" }}>
                    <th className="text-left px-3 py-1.5 text-xs font-semibold uppercase tracking-wider" style={{ color: "#605e5c" }}>Name</th>
                    <th className="text-left px-3 py-1.5 text-xs font-semibold uppercase tracking-wider hidden sm:table-cell" style={{ color: "#605e5c" }}>URL</th>
                    <th className="text-left px-3 py-1.5 text-xs font-semibold uppercase tracking-wider hidden md:table-cell" style={{ color: "#605e5c" }}>Lang / Currency</th>
                    <th className="text-left px-3 py-1.5 text-xs font-semibold uppercase tracking-wider hidden sm:table-cell" style={{ color: "#605e5c" }}>Syncs</th>
                    <th className="text-left px-3 py-1.5 text-xs font-semibold uppercase tracking-wider" style={{ color: "#605e5c" }}>Status</th>
                    <th className="text-right px-3 py-1.5 text-xs font-semibold uppercase tracking-wider" style={{ color: "#605e5c" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sites.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-3 py-8 text-center text-xs" style={{ color: "#a19f9d" }}>
                        No sites yet.{" "}
                        <Link href="/sites/new" className="hover:underline" style={{ color: "#0078d4" }}>Add your first site</Link>.
                      </td>
                    </tr>
                  ) : (
                    sites.map((site) => (
                      <tr key={site.id} className="hover:bg-[#faf9f8] transition-colors" style={{ borderBottom: "1px solid #f3f2f1" }}>
                        <td className="px-3 py-1.5 text-xs font-medium" style={{ color: "#323130" }}>{site.name}</td>
                        <td className="px-3 py-1.5 text-xs hidden sm:table-cell" style={{ color: "#605e5c" }}>
                          <a href={site.url} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 hover:underline" style={{ color: "#0078d4" }}>
                            {site.url.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </td>
                        <td className="px-3 py-1.5 text-xs hidden md:table-cell" style={{ color: "#605e5c" }}>
                          <span className="uppercase">{site.defaultLanguage}</span>
                          {site.currency && <span className="ml-1 text-xs" style={{ color: "#a19f9d" }}>· {site.currency}</span>}
                        </td>
                        <td className="px-3 py-1.5 text-xs hidden sm:table-cell" style={{ color: "#605e5c" }}>{site._count.syncs}</td>
                        <td className="px-3 py-1.5">
                          <Badge variant={site.status === "active" ? "success" : "default"}>{site.status}</Badge>
                        </td>
                        <td className="px-3 py-1.5 text-right">
                          <Link href={`/sites/${site.id}`}
                            className="inline-flex items-center gap-1 text-xs font-medium hover:underline"
                            style={{ color: "#0078d4" }}>
                            <Pencil className="w-3 h-3" />Edit
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
