import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const categoryId = searchParams.get("categoryId") || "";

  const images = await prisma.image.findMany({
    where: {
      ...(search ? { OR: [{ filename: { contains: search, mode: "insensitive" } }, { alt: { contains: search, mode: "insensitive" } }] } : {}),
      ...(categoryId === "uncategorized" ? { categoryId: null } : categoryId ? { categoryId } : {}),
    },
    include: { category: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(images);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { filename, url, alt, size, mimeType, width, height, categoryId } = body;

  if (!filename || !url) {
    return NextResponse.json({ error: "filename and url are required" }, { status: 400 });
  }

  const image = await prisma.image.create({
    data: {
      filename,
      url,
      alt: alt?.trim() || null,
      size: size || null,
      mimeType: mimeType || null,
      width: width || null,
      height: height || null,
      categoryId: categoryId || null,
    },
    include: { category: true },
  });

  return NextResponse.json(image, { status: 201 });
}
