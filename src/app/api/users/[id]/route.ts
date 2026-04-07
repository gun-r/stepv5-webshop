import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";
import bcrypt from "bcryptjs";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  role: z.string().optional(),
  roleId: z.string().nullable().optional(),
  username: z.string().optional(),
  address: z.string().optional(),
  country: z.string().optional(),
  zip: z.string().optional(),
  telephone: z.string().optional(),
  mobile: z.string().optional(),
  position: z.string().optional(),
  positionNote: z.string().optional(),
  teamLeader: z.string().optional(),
  dateStarted: z.string().optional(),
  employeeStatus: z.string().optional(),
  motto: z.string().optional(),
  notes: z.string().optional(),
  avatarUrl: z.string().optional(),
});

const PROFILE_SELECT = {
  id: true, email: true, name: true, role: true, roleId: true,
  username: true, address: true, country: true, zip: true,
  telephone: true, mobile: true, position: true, positionNote: true,
  teamLeader: true, dateStarted: true, employeeStatus: true,
  motto: true, notes: true, avatarUrl: true,
  createdAt: true, updatedAt: true,
  userRole: { select: { id: true, name: true, label: true } },
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const sessionUser = session.user as { id?: string; role?: string };
  if (sessionUser.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const user = await prisma.user.findUnique({
    where: { id },
    select: PROFILE_SELECT,
  });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(user);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const sessionUser = session.user as { id?: string; role?: string };
  if (sessionUser.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();
  const result = updateSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
  }

  const { password, roleId, ...fields } = result.data;
  const data: Record<string, unknown> = { ...fields };
  if (password) data.password = await bcrypt.hash(password, 12);
  if ("roleId" in result.data) {
    data.userRole = roleId ? { connect: { id: roleId } } : { disconnect: true };
  }

  let user;
  try {
    user = await prisma.user.update({
      where: { id },
      data,
      select: PROFILE_SELECT,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Database error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  if (sessionUser.id) {
    await logActivity(sessionUser.id, "user.update", { targetId: id });
  }

  return NextResponse.json(user);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const sessionUser = session.user as { id?: string; role?: string };
  if (sessionUser.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  if (sessionUser.id === id) {
    return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 });
  }

  await prisma.user.delete({ where: { id } });

  if (sessionUser.id) {
    await logActivity(sessionUser.id, "user.delete", { targetId: id });
  }

  return NextResponse.json({ success: true });
}
