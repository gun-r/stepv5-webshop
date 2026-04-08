import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as {
    odooMode?: string;
    odooUrl?: string;
    odooDatabase?: string;
    odooUsername?: string;
    odooApiKey?: string;
    odooOnlineSubdomain?: string;
  };

  const { odooMode, odooUsername, odooApiKey } = body;
  const isOnline = odooMode === "online";

  const baseUrl = isOnline
    ? `https://${body.odooOnlineSubdomain?.trim().replace(/\.odoo\.com$/, "")}.odoo.com`
    : (body.odooUrl || "").replace(/\/$/, "");

  const odooDatabase = isOnline
    ? (body.odooOnlineSubdomain?.trim().replace(/\.odoo\.com$/, "") || "")
    : (body.odooDatabase || "");

  if (!baseUrl || !odooDatabase || !odooUsername || !odooApiKey) {
    return NextResponse.json({ error: "All fields are required to test the connection" }, { status: 400 });
  }

  try {
    // Use Odoo JSON-RPC session authenticate endpoint
    const res = await fetch(`${baseUrl}/web/session/authenticate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "call",
        id: 1,
        params: {
          db: odooDatabase,
          login: odooUsername,
          password: odooApiKey,
        },
      }),
    });

    if (!res.ok) {
      return NextResponse.json({ error: `Odoo server returned HTTP ${res.status}` }, { status: 400 });
    }

    const data = await res.json() as {
      result?: { uid?: number; name?: string; username?: string };
      error?: { data?: { message?: string }; message?: string };
    };

    if (data.error) {
      const msg = data.error.data?.message || data.error.message || "Authentication failed";
      return NextResponse.json({ error: msg }, { status: 401 });
    }

    if (!data.result?.uid) {
      return NextResponse.json({ error: "Invalid credentials or database name" }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      uid: data.result.uid,
      name: data.result.name || odooUsername,
      username: data.result.username || odooUsername,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Could not reach Odoo server";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
