import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateSchema = z.object({
  label: z.string().min(1).optional(),
  permissions: z.array(z.string()).optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = session.user as { role?: string };
  if (user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const role = await prisma.userRole.findUnique({ where: { id } });
  if (!role) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ ...role, permissions: JSON.parse(role.permissions) as string[] });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = session.user as { role?: string };
  if (user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();
  const result = updateSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
  }

  const data: Record<string, string> = {};
  if (result.data.label) data.label = result.data.label;
  if (result.data.permissions !== undefined) data.permissions = JSON.stringify(result.data.permissions);

  const role = await prisma.userRole.update({ where: { id }, data });
  return NextResponse.json({ ...role, permissions: JSON.parse(role.permissions) as string[] });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = session.user as { role?: string };
  if (user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const role = await prisma.userRole.findUnique({
    where: { id },
    include: { _count: { select: { users: true } } },
  });
  if (!role) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (role._count.users > 0) {
    return NextResponse.json(
      { error: `Cannot delete role with ${role._count.users} assigned user(s)` },
      { status: 400 }
    );
  }

  await prisma.userRole.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
