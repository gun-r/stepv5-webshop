import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1).regex(/^[a-z_]+$/, "Name must be lowercase letters/underscores"),
  label: z.string().min(1),
  permissions: z.array(z.string()).default([]),
});

export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = session.user as { role?: string };
  if (user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const roles = await prisma.userRole.findMany({
    orderBy: { createdAt: "asc" },
    include: { _count: { select: { users: true } } },
  });

  return NextResponse.json(roles.map((r) => ({
    ...r,
    permissions: JSON.parse(r.permissions) as string[],
    userCount: r._count.users,
  })));
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = session.user as { role?: string };
  if (user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const result = createSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
  }

  const existing = await prisma.userRole.findUnique({ where: { name: result.data.name } });
  if (existing) {
    return NextResponse.json({ error: "Role name already exists" }, { status: 409 });
  }

  const role = await prisma.userRole.create({
    data: {
      name: result.data.name,
      label: result.data.label,
      permissions: JSON.stringify(result.data.permissions),
    },
  });

  return NextResponse.json({ ...role, permissions: result.data.permissions }, { status: 201 });
}
