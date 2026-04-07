import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";
import { z } from "zod";

const productSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  shortDescription: z.string().optional(),
  productType: z.enum(["simple", "variable"]).default("simple"),
  price: z.string().default("0"),
  salePrice: z.string().optional(),
  sku: z.string().optional(),
  manageStock: z.boolean().default(false),
  stockQuantity: z.number().nullable().optional(),
  images: z.string().default("[]"),
  categories: z.string().default("[]"),
  tags: z.string().default("[]"),
  variations: z.string().default("[]"),
  status: z.enum(["draft", "published"]).default("draft"),
});

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") || "";

  const products = await prisma.product.findMany({
    where: {
      AND: [
        search ? { title: { contains: search } } : {},
        status ? { status } : {},
      ],
    },
    orderBy: { createdAt: "desc" },
    include: {
      syncs: {
        include: { site: { select: { id: true, name: true, url: true } } },
      },
    },
  });

  return NextResponse.json(products);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const sessionUser = session.user as { id?: string };

  const body = await req.json();
  const result = productSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
  }

  const product = await prisma.product.create({ data: result.data });

  if (sessionUser.id) {
    await logActivity(sessionUser.id, "product.create", { productId: product.id, title: product.title });
  }

  return NextResponse.json(product, { status: 201 });
}
