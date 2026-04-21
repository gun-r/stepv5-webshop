import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getOdooSession, odooRpc } from "@/lib/odooClient";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const productId = parseInt(id);
  if (isNaN(productId)) return NextResponse.json({ error: "Invalid product id" }, { status: 400 });

  const body = await req.json() as { website_id?: number | null; is_published?: boolean };

  const values: Record<string, unknown> = {};
  if ("website_id" in body) values.website_id = body.website_id ?? false;
  if ("is_published" in body) values.is_published = body.is_published;

  if (Object.keys(values).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  try {
    const odoo = await getOdooSession();
    const result = await odooRpc<boolean>(odoo, 2, {
      model: "product.template",
      method: "write",
      args: [[productId], values],
      kwargs: {},
    });
    return NextResponse.json({ ok: result });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Could not reach Odoo server";
    const status = msg.includes("not configured") ? 400 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
