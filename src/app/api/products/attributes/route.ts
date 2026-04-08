import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function toSlug(str: string) {
  return str.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

export async function GET() {
  try {
    const attributes = await prisma.productAttribute.findMany({
      include: { terms: { select: { id: true } } },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(attributes);
  } catch (e) {
    console.error("[attributes GET]", e);
    return NextResponse.json({ error: "Failed to fetch attributes" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, slug, type } = body;
    if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

    const finalSlug = slug ? toSlug(slug) : toSlug(name);
    const attribute = await prisma.productAttribute.create({
      data: { name, slug: finalSlug, type: type || "select" },
    });
    return NextResponse.json(attribute, { status: 201 });
  } catch (e) {
    console.error("[attributes POST]", e);
    return NextResponse.json({ error: "Failed to create attribute" }, { status: 500 });
  }
}
