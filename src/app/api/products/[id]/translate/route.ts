import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { translateProduct } from "@/lib/translation";
import { z } from "zod";

const aiTranslateSchema = z.object({
  targetLanguage: z.string().min(2).max(5),
  fields: z.array(z.enum(["title", "description", "shortDescription"])).optional(),
});

const manualSaveSchema = z.object({
  language: z.string().min(2).max(5),
  title: z.string().min(1),
  shortDescription: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  price: z.string().nullable().optional(),
  salePrice: z.string().nullable().optional(),
});

// POST: AI translate and save
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const result = aiTranslateSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues[0].message },
      { status: 400 }
    );
  }

  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

  const configs = await prisma.appConfig.findMany();
  const configMap: Record<string, string> = {};
  for (const c of configs) configMap[c.key] = c.value;

  const libreTranslateUrl = configMap.libreTranslateUrl || "";
  const libreTranslateApiKey = configMap.libreTranslateApiKey || "";
  const sourceLang = configMap.defaultSourceLanguage || "en";

  if (!libreTranslateUrl) {
    return NextResponse.json(
      { error: "LibreTranslate URL not configured. Please go to Setup." },
      { status: 400 }
    );
  }

  const translation = await translateProduct(
    product,
    result.data.targetLanguage,
    sourceLang,
    { libreTranslateUrl, libreTranslateApiKey },
    result.data.fields
  );

  if (!translation.success) {
    return NextResponse.json({ error: translation.error }, { status: 500 });
  }

  // Load existing translation to merge partial field updates
  const existing = await prisma.productTranslation.findUnique({
    where: { productId_language: { productId: id, language: result.data.targetLanguage } },
  });

  const saved = await prisma.productTranslation.upsert({
    where: { productId_language: { productId: id, language: result.data.targetLanguage } },
    update: {
      ...(translation.title !== undefined && { title: translation.title }),
      ...(translation.shortDescription !== undefined && { shortDescription: translation.shortDescription }),
      ...(translation.description !== undefined && { description: translation.description }),
    },
    create: {
      productId: id,
      language: result.data.targetLanguage,
      title: translation.title || existing?.title || product.title,
      shortDescription: translation.shortDescription ?? existing?.shortDescription ?? null,
      description: translation.description ?? existing?.description ?? null,
    },
  });

  return NextResponse.json(saved);
}

// PUT: Save manual translation
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const result = manualSaveSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues[0].message },
      { status: 400 }
    );
  }

  const { language, title, shortDescription, description, price, salePrice } = result.data;

  const saved = await prisma.productTranslation.upsert({
    where: { productId_language: { productId: id, language } },
    update: {
      title,
      shortDescription: shortDescription ?? null,
      description: description ?? null,
      price: price ?? null,
      salePrice: salePrice ?? null,
    },
    create: {
      productId: id,
      language,
      title,
      shortDescription: shortDescription ?? null,
      description: description ?? null,
      price: price ?? null,
      salePrice: salePrice ?? null,
    },
  });

  return NextResponse.json(saved);
}
