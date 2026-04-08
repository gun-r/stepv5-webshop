import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function toSlug(str: string) {
  return str.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const terms = await prisma.productAttributeTerm.findMany({
    where: { attributeId: id },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(terms);
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const body = await req.json();
    const { name, slug, description } = body;
    if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

    const finalSlug = slug ? toSlug(slug) : toSlug(name);
    const term = await prisma.productAttributeTerm.create({
      data: { attributeId: id, name, slug: finalSlug, description: description || null },
    });
    return NextResponse.json(term, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to create term";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
