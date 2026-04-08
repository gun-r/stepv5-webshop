import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const configSchema = z.object({
  myMemoryEmail: z.string().email().or(z.literal("")).optional(),
  autoTranslate: z.boolean(),
  defaultSourceLanguage: z.string().min(2).max(5),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const configs = await prisma.appConfig.findMany();
  const configMap: Record<string, string> = {};
  for (const c of configs) {
    configMap[c.key] = c.value;
  }

  return NextResponse.json({
    myMemoryEmail: configMap.myMemoryEmail || "",
    autoTranslate: configMap.autoTranslate === "true",
    defaultSourceLanguage: configMap.defaultSourceLanguage || "en",
  });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const result = configSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues[0].message },
      { status: 400 }
    );
  }

  const { myMemoryEmail, autoTranslate, defaultSourceLanguage } = result.data;

  const updates = [
    { key: "myMemoryEmail", value: myMemoryEmail || "" },
    { key: "autoTranslate", value: autoTranslate.toString() },
    { key: "defaultSourceLanguage", value: defaultSourceLanguage },
  ];

  for (const update of updates) {
    await prisma.appConfig.upsert({
      where: { key: update.key },
      update: { value: update.value },
      create: { key: update.key, value: update.value },
    });
  }

  return NextResponse.json({ success: true });
}
