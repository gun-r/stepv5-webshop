import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const siteSchema = z.object({
  name: z.string().min(1, "Name is required"),
  url: z.string().url("Must be a valid URL"),
  consumerKey: z.string().min(1, "Consumer key is required"),
  consumerSecret: z.string().min(1, "Consumer secret is required"),
  defaultLanguage: z.string().default("en"),
  status: z.enum(["active", "inactive"]).default("active"),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sites = await prisma.site.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { syncs: true } },
    },
  });

  return NextResponse.json(sites);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const result = siteSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues[0].message },
      { status: 400 }
    );
  }

  const site = await prisma.site.create({ data: result.data });
  return NextResponse.json(site, { status: 201 });
}
