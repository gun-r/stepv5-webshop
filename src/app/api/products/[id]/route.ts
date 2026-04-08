import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";
import { syncProductToSite } from "@/lib/woocommerce";
import { z } from "zod";

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  shortDescription: z.string().nullable().optional(),
  productType: z.enum(["simple", "variable"]).optional(),
  price: z.string().optional(),
  salePrice: z.string().nullable().optional(),
  sku: z.string().nullable().optional(),
  manageStock: z.boolean().optional(),
  stockQuantity: z.number().nullable().optional(),
  images: z.string().optional(),
  categories: z.string().optional(),
  tags: z.string().optional(),
  attributes: z.string().optional(),
  variations: z.string().optional(),
  status: z.enum(["draft", "published"]).optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      syncs: { include: { site: true } },
      translations: true,
    },
  });

  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(product);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const sessionUser = session.user as { id?: string };

  const { id } = await params;
  const body = await req.json();
  const result = updateSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
  }

  const product = await prisma.product.update({
    where: { id },
    data: result.data,
    include: {
      syncs: { include: { site: true } },
      translations: true,
    },
  });

  if (sessionUser.id) {
    await logActivity(sessionUser.id, "product.update", { productId: id });
  }

  // Auto-sync to all sites that have a "synced" record (fire and forget)
  const syncedRecords = product.syncs.filter((s) => s.status === "synced" && s.wooProductId);
  if (syncedRecords.length > 0) {
    Promise.all(
      syncedRecords.map(async (syncRecord) => {
        const translation = product.translations.find(
          (t) => t.language === syncRecord.site.defaultLanguage
        ) || null;
        const syncResult = await syncProductToSite(
          product,
          syncRecord.site,
          syncRecord.wooProductId,
          translation
        );
        await prisma.productSync.update({
          where: { id: syncRecord.id },
          data: syncResult.success
            ? { status: "synced", lastSyncedAt: new Date(), errorMessage: null }
            : { status: "failed", errorMessage: syncResult.error },
        });
      })
    ).catch(() => { /* best effort */ });
  }

  return NextResponse.json(product);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const sessionUser = session.user as { id?: string };

  const { id } = await params;
  await prisma.product.delete({ where: { id } });

  if (sessionUser.id) {
    await logActivity(sessionUser.id, "product.delete", { productId: id });
  }

  return NextResponse.json({ success: true });
}
