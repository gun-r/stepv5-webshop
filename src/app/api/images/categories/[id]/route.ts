import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { name, description } = body;

  if (!name?.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const slug = name.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

  const existing = await prisma.imageCategory.findFirst({
    where: { OR: [{ name: name.trim() }, { slug }], NOT: { id } },
  });
  if (existing) {
    return NextResponse.json({ error: "Category name already exists" }, { status: 409 });
  }

  const category = await prisma.imageCategory.update({
    where: { id },
    data: { name: name.trim(), slug, description: description?.trim() || null },
  });

  return NextResponse.json(category);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await prisma.imageCategory.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
