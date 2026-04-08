import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function toSlug(str: string) {
  return str.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string; termId: string }> }) {
  const { termId } = await params;
  try {
    const body = await req.json();
    const { name, slug, description } = body;
    if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

    const finalSlug = slug ? toSlug(slug) : toSlug(name);
    const term = await prisma.productAttributeTerm.update({
      where: { id: termId },
      data: { name, slug: finalSlug, description: description || null },
    });
    return NextResponse.json(term);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to update term";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string; termId: string }> }) {
  const { termId } = await params;
  try {
    await prisma.productAttributeTerm.delete({ where: { id: termId } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to delete term";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
