import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const KEYS = ["odooMode", "odooUrl", "odooDatabase", "odooUsername", "odooApiKey", "odooOnlineSubdomain"] as const;

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const configs = await prisma.appConfig.findMany({ where: { key: { in: [...KEYS] } } });
  const map: Record<string, string> = {};
  for (const c of configs) map[c.key] = c.value;

  return NextResponse.json({
    odooMode: map.odooMode || "onpremise",
    odooUrl: map.odooUrl || "",
    odooDatabase: map.odooDatabase || "",
    odooUsername: map.odooUsername || "",
    odooApiKey: map.odooApiKey || "",
    odooOnlineSubdomain: map.odooOnlineSubdomain || "",
  });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as Record<string, string>;

  for (const key of KEYS) {
    const value = body[key] ?? "";
    await prisma.appConfig.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
  }

  return NextResponse.json({ success: true });
}
