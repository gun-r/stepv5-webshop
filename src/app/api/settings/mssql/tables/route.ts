import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { listTables } from "@/lib/mssql";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const conn = await prisma.mssqlConnection.findFirst();
  if (!conn || !conn.host) return NextResponse.json({ error: "No MSSQL connection configured" }, { status: 400 });

  try {
    const tables = await listTables(conn);
    return NextResponse.json({ tables });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
