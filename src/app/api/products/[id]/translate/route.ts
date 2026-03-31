import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { translateProduct } from "@/lib/translation";
import { z } from "zod";

const translateSchema = z.object({
  targetLanguage: z.string().min(2).max(5),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const result = translateSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues[0].message },
      { status: 400 }
    );
  }

  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

  // Get config
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
    { libreTranslateUrl, libreTranslateApiKey }
  );

  if (!translation.success) {
    return NextResponse.json({ error: translation.error }, { status: 500 });
  }

  // Upsert translation
  const saved = await prisma.productTranslation.upsert({
    where: {
      productId_language: {
        productId: id,
        language: result.data.targetLanguage,
      },
    },
    update: {
      title: translation.title!,
      description: translation.description || null,
    },
    create: {
      productId: id,
      language: result.data.targetLanguage,
      title: translation.title!,
      description: translation.description || null,
    },
  });

  return NextResponse.json(saved);
}
