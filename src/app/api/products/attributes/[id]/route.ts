import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function toSlug(str: string) {
  return str.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const attribute = await prisma.productAttribute.findUnique({
    where: { id },
    include: { terms: { orderBy: { name: "asc" } } },
  });
  if (!attribute) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(attribute);
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const { name, slug, type } = body;
  if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

  const finalSlug = slug ? toSlug(slug) : toSlug(name);
  const attribute = await prisma.productAttribute.update({
    where: { id },
    data: { name, slug: finalSlug, type: type || "select" },
  });
  return NextResponse.json(attribute);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.productAttribute.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
