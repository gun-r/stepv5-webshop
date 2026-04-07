import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from")?.toUpperCase();
  const to = searchParams.get("to")?.toUpperCase();

  if (!from || !to) {
    return NextResponse.json({ error: "from and to params required" }, { status: 400 });
  }

  if (!/^[A-Z]{3}$/.test(from) || !/^[A-Z]{3}$/.test(to)) {
    return NextResponse.json({ error: "Invalid currency code" }, { status: 400 });
  }

  try {
    const res = await fetch(
      `https://api.frankfurter.app/latest?from=${from}&to=${to}`,
      { next: { revalidate: 3600 } } // cache 1 hour server-side
    );
    if (!res.ok) {
      return NextResponse.json({ error: "Exchange rate API unavailable" }, { status: 502 });
    }
    const data = await res.json() as { rates?: Record<string, number> };
    const rate = data.rates?.[to];
    if (rate == null) {
      return NextResponse.json({ error: `Rate not found for ${from}→${to}` }, { status: 404 });
    }
    return NextResponse.json({ from, to, rate });
  } catch {
    return NextResponse.json({ error: "Failed to fetch exchange rate" }, { status: 502 });
  }
}
