import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Parse User-Agent into device / browser / os — no external lib needed
function parseUA(ua: string): { device: string; browser: string; os: string } {
  const uaLow = ua.toLowerCase();

  // Device
  let device = "desktop";
  if (/mobile|iphone|android.*mobile|windows phone/.test(uaLow)) device = "mobile";
  else if (/ipad|tablet|android(?!.*mobile)/.test(uaLow)) device = "tablet";

  // Browser
  let browser = "Other";
  if (/edg\//.test(uaLow))        browser = "Edge";
  else if (/opr\/|opera/.test(uaLow)) browser = "Opera";
  else if (/chrome/.test(uaLow))  browser = "Chrome";
  else if (/safari/.test(uaLow))  browser = "Safari";
  else if (/firefox/.test(uaLow)) browser = "Firefox";
  else if (/msie|trident/.test(uaLow)) browser = "IE";

  // OS
  let os = "Other";
  if (/windows/.test(uaLow))      os = "Windows";
  else if (/mac os x/.test(uaLow) && !/iphone|ipad/.test(uaLow)) os = "macOS";
  else if (/iphone|ipad/.test(uaLow)) os = "iOS";
  else if (/android/.test(uaLow)) os = "Android";
  else if (/linux/.test(uaLow))   os = "Linux";

  return { device, browser, os };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { path?: string; referer?: string; visitorId?: string };
    const path = body.path || "/";
    const referer = body.referer || null;
    const visitorId = body.visitorId || null;
    const ua = req.headers.get("user-agent") || "";

    const { device, browser, os } = parseUA(ua);

    await prisma.pageView.create({
      data: { path, visitorId, device, browser, os, referer },
    });

    return NextResponse.json({ ok: true });
  } catch {
    // Best effort — never fail the page load
    return NextResponse.json({ ok: false });
  }
}
