import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createMssqlPool } from "@/lib/mssql";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as {
    host: string; port: number; database: string;
    username: string; password: string; encrypt: boolean; trustCert: boolean;
  };

  try {
    const pool = await createMssqlPool(body);
    await pool.request().query("SELECT 1");
    await pool.close();
    return NextResponse.json({ success: true, message: "Connection successful" });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, message });
  }
}
