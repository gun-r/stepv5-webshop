import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";
import bcrypt from "bcryptjs";
import { z } from "zod";

const createSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  password: z.string().min(6),
  role: z.string().default("user"),
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

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = session.user as { role?: string };
  if (user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";

  const users = await prisma.user.findMany({
    where: search ? {
      OR: [
        { name: { contains: search } },
        { email: { contains: search } },
      ],
    } : undefined,
    orderBy: { createdAt: "desc" },
    select: PROFILE_SELECT,
  });

  return NextResponse.json(users);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const sessionUser = session.user as { id?: string; role?: string };
  if (sessionUser.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const result = createSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email: result.data.email } });
  if (existing) {
    return NextResponse.json({ error: "Email already in use" }, { status: 409 });
  }

  const hashed = await bcrypt.hash(result.data.password, 12);

  let user;
  try {
    user = await prisma.user.create({
      data: {
        email: result.data.email,
        name: result.data.name,
        password: hashed,
        role: result.data.role,
        ...(result.data.roleId ? { userRole: { connect: { id: result.data.roleId } } } : {}),
        username: result.data.username || null,
        address: result.data.address || null,
        country: result.data.country || null,
        zip: result.data.zip || null,
        telephone: result.data.telephone || null,
        mobile: result.data.mobile || null,
        position: result.data.position || null,
        positionNote: result.data.positionNote || null,
        teamLeader: result.data.teamLeader || null,
        dateStarted: result.data.dateStarted || null,
        employeeStatus: result.data.employeeStatus || null,
        motto: result.data.motto || null,
        notes: result.data.notes || null,
        avatarUrl: result.data.avatarUrl || null,
      },
      select: PROFILE_SELECT,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Database error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  if (sessionUser.id) {
    await logActivity(sessionUser.id, "user.create", { targetEmail: user.email });
  }

  return NextResponse.json(user, { status: 201 });
}
