import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { testSiteConnection } from "@/lib/woocommerce";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const site = await prisma.site.findUnique({ where: { id } });
  if (!site) return NextResponse.json({ error: "Site not found" }, { status: 404 });

  const result = await testSiteConnection(site);
  return NextResponse.json(result);
}
