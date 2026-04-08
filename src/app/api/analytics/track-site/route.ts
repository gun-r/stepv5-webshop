import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

// Preflight
export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

function parseUA(ua: string): { device: string; browser: string; os: string } {
  const uaLow = ua.toLowerCase();

  let device = "desktop";
  if (/mobile|iphone|android.*mobile|windows phone/.test(uaLow)) device = "mobile";
  else if (/ipad|tablet|android(?!.*mobile)/.test(uaLow)) device = "tablet";

  let browser = "Other";
  if (/edg\//.test(uaLow))             browser = "Edge";
  else if (/opr\/|opera/.test(uaLow))  browser = "Opera";
  else if (/chrome/.test(uaLow))       browser = "Chrome";
  else if (/safari/.test(uaLow))       browser = "Safari";
  else if (/firefox/.test(uaLow))      browser = "Firefox";
  else if (/msie|trident/.test(uaLow)) browser = "IE";

  let os = "Other";
  if (/windows/.test(uaLow))                                        os = "Windows";
  else if (/mac os x/.test(uaLow) && !/iphone|ipad/.test(uaLow))   os = "macOS";
  else if (/iphone|ipad/.test(uaLow))                               os = "iOS";
  else if (/android/.test(uaLow))                                   os = "Android";
  else if (/linux/.test(uaLow))                                     os = "Linux";

  return { device, browser, os };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      siteId?: string;
      path?: string;
      visitorId?: string;
      referer?: string;
    };

    const siteId = body.siteId?.trim();
    if (!siteId) {
      return NextResponse.json({ ok: false }, { status: 400, headers: CORS_HEADERS });
    }

    const path = body.path || "/";
    const visitorId = body.visitorId || null;
    const referer = body.referer || null;
    const ua = req.headers.get("user-agent") || "";
    const { device, browser, os } = parseUA(ua);

    await prisma.wooPageView.create({
      data: { siteId, path, visitorId, device, browser, os, referer },
    });

    return NextResponse.json({ ok: true }, { headers: CORS_HEADERS });
  } catch {
    return NextResponse.json({ ok: false }, { headers: CORS_HEADERS });
  }
}
