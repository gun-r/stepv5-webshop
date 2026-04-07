import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";
import { syncProductToSite } from "@/lib/woocommerce";

interface ImportRow {
  title: string;
  description?: string;
  shortDescription?: string;
  productType?: string;
  price?: string;
  salePrice?: string;
  sku?: string;
  categories?: string;
  tags?: string;
  status?: string;
  manageStock?: string;
  stockQuantity?: string;
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const sessionUser = session.user as { id?: string };

  const body = await req.json() as { rows: ImportRow[]; siteIds?: string[] };
  const { rows, siteIds = [] } = body;

  if (!Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: "No rows provided" }, { status: 400 });
  }

  const results: Array<{ title: string; success: boolean; error?: string }> = [];

  for (const row of rows) {
    if (!row.title?.trim()) {
      results.push({ title: row.title || "(empty)", success: false, error: "Title is required" });
      continue;
    }

    try {
      const categories = row.categories
        ? JSON.stringify(row.categories.split(";").map((s) => s.trim()).filter(Boolean))
        : "[]";
      const tags = row.tags
        ? JSON.stringify(row.tags.split(";").map((s) => s.trim()).filter(Boolean))
        : "[]";

      const product = await prisma.product.create({
        data: {
          title: row.title.trim(),
          description: row.description || null,
          shortDescription: row.shortDescription || null,
          productType: row.productType === "variable" ? "variable" : "simple",
          price: row.price || "0",
          salePrice: row.salePrice || null,
          sku: row.sku || null,
          manageStock: row.manageStock === "yes",
          stockQuantity: row.stockQuantity ? parseInt(row.stockQuantity) : null,
          categories,
          tags,
          status: row.status === "published" ? "published" : "draft",
        },
      });

      // Sync to selected sites
      if (siteIds.length > 0) {
        for (const siteId of siteIds) {
          const site = await prisma.site.findUnique({ where: { id: siteId } });
          if (!site) continue;
          const syncResult = await syncProductToSite(product, site, null, null);
          await prisma.productSync.create({
            data: {
              productId: product.id,
              siteId,
              status: syncResult.success ? "synced" : "failed",
              wooProductId: syncResult.wooProductId ?? null,
              lastSyncedAt: syncResult.success ? new Date() : null,
              errorMessage: syncResult.error ?? null,
            },
          });
        }
      }

      results.push({ title: row.title, success: true });
    } catch (err) {
      results.push({
        title: row.title,
        success: false,
        error: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

  const created = results.filter((r) => r.success).length;
  if (sessionUser.id) {
    await logActivity(sessionUser.id, "product.import", { count: created, total: rows.length });
  }

  return NextResponse.json({ results, created, total: rows.length });
}
