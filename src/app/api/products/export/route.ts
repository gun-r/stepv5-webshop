import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ALL_FIELDS = [
  "title", "shortDescription", "description", "productType",
  "price", "salePrice", "sku", "manageStock", "stockQuantity",
  "categories", "tags", "status",
];

function escapeCSV(value: unknown): string {
  const str = value === null || value === undefined ? "" : String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const fieldsParam = searchParams.get("fields");
  const fields = fieldsParam
    ? fieldsParam.split(",").filter((f) => ALL_FIELDS.includes(f))
    : ALL_FIELDS;

  const products = await prisma.product.findMany({ orderBy: { createdAt: "desc" } });

  const rows: string[] = [fields.join(",")];

  for (const p of products) {
    const row = fields.map((field) => {
      switch (field) {
        case "categories":
          return escapeCSV((JSON.parse(p.categories || "[]") as string[]).join("; "));
        case "tags":
          return escapeCSV((JSON.parse(p.tags || "[]") as string[]).join("; "));
        case "manageStock":
          return escapeCSV(p.manageStock ? "yes" : "no");
        case "stockQuantity":
          return escapeCSV(p.stockQuantity ?? "");
        case "shortDescription":
          return escapeCSV(p.shortDescription ?? "");
        case "salePrice":
          return escapeCSV(p.salePrice ?? "");
        case "sku":
          return escapeCSV(p.sku ?? "");
        default:
          return escapeCSV((p as Record<string, unknown>)[field]);
      }
    });
    rows.push(row.join(","));
  }

  const csv = rows.join("\n");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="products-${Date.now()}.csv"`,
    },
  });
}
