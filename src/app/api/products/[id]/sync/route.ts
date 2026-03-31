import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { syncProductToSite } from "@/lib/woocommerce";
import { z } from "zod";

const syncSchema = z.object({
  siteIds: z.array(z.string()).min(1, "Select at least one site"),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const result = syncSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues[0].message },
      { status: 400 }
    );
  }

  const product = await prisma.product.findUnique({
    where: { id },
    include: { translations: true },
  });

  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

  const configs = await prisma.appConfig.findMany();
  const configMap: Record<string, string> = {};
  for (const c of configs) configMap[c.key] = c.value;

  const results: Array<{
    siteId: string;
    siteName: string;
    success: boolean;
    error?: string;
  }> = [];

  for (const siteId of result.data.siteIds) {
    const site = await prisma.site.findUnique({ where: { id: siteId } });
    if (!site) {
      results.push({ siteId, siteName: "Unknown", success: false, error: "Site not found" });
      continue;
    }

    // Find existing sync record
    const existingSync = await prisma.productSync.findUnique({
      where: { productId_siteId: { productId: id, siteId } },
    });

    // Find translation matching site's default language
    const translation = product.translations.find(
      (t) => t.language === site.defaultLanguage
    ) || null;

    const syncResult = await syncProductToSite(
      product,
      site,
      existingSync?.wooProductId || null,
      translation
    );

    if (syncResult.success) {
      await prisma.productSync.upsert({
        where: { productId_siteId: { productId: id, siteId } },
        update: {
          status: "synced",
          wooProductId: syncResult.wooProductId,
          lastSyncedAt: new Date(),
          errorMessage: null,
        },
        create: {
          productId: id,
          siteId,
          status: "synced",
          wooProductId: syncResult.wooProductId,
          lastSyncedAt: new Date(),
        },
      });
    } else {
      await prisma.productSync.upsert({
        where: { productId_siteId: { productId: id, siteId } },
        update: {
          status: "failed",
          errorMessage: syncResult.error,
        },
        create: {
          productId: id,
          siteId,
          status: "failed",
          errorMessage: syncResult.error,
        },
      });
    }

    results.push({
      siteId,
      siteName: site.name,
      success: syncResult.success,
      error: syncResult.error,
    });
  }

  return NextResponse.json({ results });
}
