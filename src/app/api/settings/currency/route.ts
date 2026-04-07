import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const record = await prisma.appConfig.findUnique({ where: { key: "currencyRates" } });
  const rates = record ? JSON.parse(record.value) : [];
  return NextResponse.json({ rates });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as { rates?: unknown };
  if (!Array.isArray(body.rates)) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  await prisma.appConfig.upsert({
    where: { key: "currencyRates" },
    update: { value: JSON.stringify(body.rates) },
    create: { key: "currencyRates", value: JSON.stringify(body.rates) },
  });

  return NextResponse.json({ success: true });
}
