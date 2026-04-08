import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function toSlug(str: string) {
  return str.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const { name, slug, description } = body;
  if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

  const finalSlug = slug ? toSlug(slug) : toSlug(name);
  const tag = await prisma.productTag.update({
    where: { id },
    data: { name, slug: finalSlug, description: description || null },
  });
  return NextResponse.json(tag);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.productTag.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
