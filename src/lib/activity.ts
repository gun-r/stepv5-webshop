import { prisma } from "@/lib/prisma";

export async function logActivity(
  userId: string,
  action: string,
  details?: Record<string, unknown>
) {
  try {
    await prisma.activityLog.create({
      data: {
        userId,
        action,
        details: details ? JSON.stringify(details) : null,
      },
    });
  } catch {
    // Never throw — activity logging is best-effort
  }
}
