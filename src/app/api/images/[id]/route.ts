import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { unlink } from "fs/promises";
import { join } from "path";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const image = await prisma.image.findUnique({ where: { id }, include: { category: true } });
  if (!image) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(image);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { alt, categoryId } = body;

  const image = await prisma.image.update({
    where: { id },
    data: {
      alt: alt?.trim() || null,
      categoryId: categoryId || null,
    },
    include: { category: true },
  });

  return NextResponse.json(image);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const image = await prisma.image.findUnique({ where: { id } });
  if (!image) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Delete file from disk if it's a local upload
  if (image.url.startsWith("/uploads/")) {
    try {
      const filepath = join(process.cwd(), "public", image.url);
      await unlink(filepath);
    } catch {
      // File may already be gone — ignore
    }
  }

  await prisma.image.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
