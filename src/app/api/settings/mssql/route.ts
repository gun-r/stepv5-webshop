import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { invalidatePool } from "@/lib/mssql";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const conn = await prisma.mssqlConnection.findFirst();
  if (!conn) {
    return NextResponse.json({
      host: "", port: 1433, database: "", username: "", password: "",
      encrypt: true, trustCert: true,
    });
  }
  return NextResponse.json(conn);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as {
    host: string; port: number; database: string;
    username: string; password: string; encrypt: boolean; trustCert: boolean;
  };

  const existing = await prisma.mssqlConnection.findFirst();
  const data = {
    host: body.host,
    port: Number(body.port) || 1433,
    database: body.database,
    username: body.username,
    password: body.password,
    encrypt: Boolean(body.encrypt),
    trustCert: Boolean(body.trustCert),
  };

  if (existing) {
    await prisma.mssqlConnection.update({ where: { id: existing.id }, data });
  } else {
    await prisma.mssqlConnection.create({ data });
  }

  // Force pool recreation so next search uses updated credentials
  await invalidatePool();

  return NextResponse.json({ success: true });
}
