import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const categoryId = formData.get("categoryId") as string | null;
    const alt = formData.get("alt") as string | null;
    // When saveToLibrary=false the file is uploaded but NOT saved to the Image model
    const saveToLibrary = formData.get("saveToLibrary") !== "false";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "Only JPEG, PNG, WebP, and GIF are allowed" }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File must be under 5MB" }, { status: 400 });
    }

    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const filename = `${randomUUID()}.${ext}`;
    const uploadDir = join(process.cwd(), "public", "uploads");

    // Ensure uploads directory exists
    await mkdir(uploadDir, { recursive: true });

    const filepath = join(uploadDir, filename);
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filepath, buffer);

    const url = `/uploads/${filename}`;

    if (saveToLibrary) {
      const image = await prisma.image.create({
        data: {
          filename: file.name,
          url,
          alt: alt?.trim() || null,
          size: file.size,
          mimeType: file.type,
          categoryId: categoryId || null,
        },
        include: { category: true },
      });
      return NextResponse.json({ url, image }, { status: 201 });
    }

    return NextResponse.json({ url }, { status: 201 });
  } catch (err) {
    console.error("[upload] error:", err);
    const message = err instanceof Error ? err.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
