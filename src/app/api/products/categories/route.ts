import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function toSlug(str: string) {
  return str.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

export async function GET() {
  try {
    const categories = await prisma.productCategory.findMany({
      include: { parent: { select: { id: true, name: true } }, children: { select: { id: true } } },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(categories);
  } catch (e) {
    console.error("[categories GET]", e);
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, slug, description, parentId } = body;
    if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

    const finalSlug = slug ? toSlug(slug) : toSlug(name);
    const category = await prisma.productCategory.create({
      data: { name, slug: finalSlug, description: description || null, parentId: parentId || null },
    });
    return NextResponse.json(category, { status: 201 });
  } catch (e) {
    console.error("[categories POST]", e);
    return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
  }
}
