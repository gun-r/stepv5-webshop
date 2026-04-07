import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { searchTable } from "@/lib/mssql";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const table = req.nextUrl.searchParams.get("table");
  const column = req.nextUrl.searchParams.get("column");
  const q = req.nextUrl.searchParams.get("q") || "";

  if (!table || !column) {
    return NextResponse.json({ error: "table and column params required" }, { status: 400 });
  }

  const conn = await prisma.mssqlConnection.findFirst();
  if (!conn || !conn.host) return NextResponse.json({ error: "No MSSQL connection configured" }, { status: 400 });

  try {
    const rows = await searchTable(conn, table, column, q);
    return NextResponse.json({ rows });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
