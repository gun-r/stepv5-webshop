import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Client } from "basic-ftp";
import { Readable } from "stream";
import { randomUUID } from "crypto";

const FTP_HOST = process.env.FTP_HOST!;
const FTP_USER = process.env.FTP_USER!;
const FTP_PASS = process.env.FTP_PASS!;
const FTP_PORT = parseInt(process.env.FTP_PORT || "21");
const FTP_UPLOAD_DIR = process.env.FTP_UPLOAD_DIR || "/wc/images";
const FTP_PUBLIC_URL = process.env.FTP_PUBLIC_URL || "http://wc.stepv5.com/images";

async function uploadViaFtp(buffer: Buffer, filename: string): Promise<string> {
  const client = new Client();
  client.ftp.verbose = false;

  try {
    await client.access({
      host: FTP_HOST,
      user: FTP_USER,
      password: FTP_PASS,
      port: FTP_PORT,
      secure: false,
    });

    // Ensure upload directory exists
    await client.ensureDir(FTP_UPLOAD_DIR);

    // Upload file from buffer via readable stream
    const stream = Readable.from(buffer);
    await client.uploadFrom(stream, filename);

    return `${FTP_PUBLIC_URL.replace(/\/$/, "")}/${filename}`;
  } finally {
    client.close();
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const categoryId = formData.get("categoryId") as string | null;
    const alt = formData.get("alt") as string | null;
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
    const buffer = Buffer.from(await file.arrayBuffer());

    const url = await uploadViaFtp(buffer, filename);

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
