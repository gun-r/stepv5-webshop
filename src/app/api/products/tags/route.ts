import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function toSlug(str: string) {
  return str.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

export async function GET() {
  try {
    const tags = await prisma.productTag.findMany({ orderBy: { name: "asc" } });
    return NextResponse.json(tags);
  } catch (e) {
    console.error("[tags GET]", e);
    return NextResponse.json({ error: "Failed to fetch tags" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, slug, description } = body;
    if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

    const finalSlug = slug ? toSlug(slug) : toSlug(name);
    const tag = await prisma.productTag.create({
      data: { name, slug: finalSlug, description: description || null },
    });
    return NextResponse.json(tag, { status: 201 });
  } catch (e) {
    console.error("[tags POST]", e);
    return NextResponse.json({ error: "Failed to create tag" }, { status: 500 });
  }
}
