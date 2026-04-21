import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getOdooSession, odooRpc } from "@/lib/odooClient";

export type OdooWebsite = { id: number; name: string; domain: string | false };

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const odoo = await getOdooSession();
    const websites = await odooRpc<OdooWebsite[]>(odoo, 2, {
      model: "website",
      method: "search_read",
      args: [[]],
      kwargs: { fields: ["name", "domain"], order: "name asc" },
    });
    return NextResponse.json({ websites });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Could not reach Odoo server";
    const status = msg.includes("not configured") ? 400 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
