import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const mappings = await prisma.mssqlTableMapping.findMany();
  return NextResponse.json({ mappings });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as {
    page: string;
    tableName: string;
    searchColumn: string;
    displayColumns: string[];
    fieldMappings: Record<string, string>;
  };

  const data = {
    tableName: body.tableName,
    searchColumn: body.searchColumn,
    displayColumns: JSON.stringify(body.displayColumns || []),
    fieldMappings: JSON.stringify(body.fieldMappings || {}),
  };

  const mapping = await prisma.mssqlTableMapping.upsert({
    where: { page: body.page },
    update: data,
    create: { page: body.page, ...data },
  });

  return NextResponse.json(mapping);
}
