import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getOdooSession, odooRpc } from "@/lib/odooClient";

export type OdooProduct = {
  id: number;
  name: string;
  default_code: string | false;
  list_price: number;
  type: string;
  categ_id: [number, string] | false;
  description_sale: string | false;
  image_1920: string | false;
  active: boolean;
  website_id: [number, string] | false;
  is_published: boolean;
};

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const limit = Math.min(parseInt(searchParams.get("limit") || "80"), 200);
  const offset = parseInt(searchParams.get("offset") || "0");
  const search = (searchParams.get("search") || "").trim();

  try {
    const odoo = await getOdooSession();
    const domain: unknown[] = search ? [["name", "ilike", search]] : [];

    const [products, total] = await Promise.all([
      odooRpc<OdooProduct[]>(odoo, 2, {
        model: "product.template",
        method: "search_read",
        args: [domain],
        kwargs: {
          fields: [
            "name", "default_code", "list_price", "type",
            "categ_id", "description_sale", "image_1920", "active",
            "website_id", "is_published",
          ],
          limit,
          offset,
          order: "name asc",
        },
      }),
      odooRpc<number>(odoo, 3, {
        model: "product.template",
        method: "search_count",
        args: [domain],
        kwargs: {},
      }),
    ]);

    return NextResponse.json({ products, total, limit, offset });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Could not reach Odoo server";
    const status = msg.includes("not configured") ? 400 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
