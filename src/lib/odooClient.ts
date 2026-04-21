import { prisma } from "@/lib/prisma";

const KEYS = ["odooMode", "odooUrl", "odooDatabase", "odooUsername", "odooApiKey", "odooOnlineSubdomain"];

type OdooRpcResponse<T> = {
  result?: T;
  error?: { data?: { message?: string }; message?: string };
};

export type OdooSession = { baseUrl: string; cookie: string };

export async function getOdooSession(): Promise<OdooSession> {
  const configs = await prisma.appConfig.findMany({ where: { key: { in: KEYS } } });
  const cfg: Record<string, string> = {};
  for (const c of configs) cfg[c.key] = c.value;

  const isOnline = cfg.odooMode === "online";
  const baseUrl = isOnline
    ? `https://${(cfg.odooOnlineSubdomain || "").replace(/\.odoo\.com$/, "")}.odoo.com`
    : (cfg.odooUrl || "").replace(/\/$/, "");
  const db = isOnline
    ? (cfg.odooOnlineSubdomain || "").replace(/\.odoo\.com$/, "")
    : cfg.odooDatabase || "";

  if (!baseUrl || !db || !cfg.odooUsername || !cfg.odooApiKey) {
    throw new Error("Odoo is not configured. Please go to Settings → Odoo to set it up.");
  }

  const authRes = await fetch(`${baseUrl}/web/session/authenticate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0", method: "call", id: 1,
      params: { db, login: cfg.odooUsername, password: cfg.odooApiKey },
    }),
  });

  if (!authRes.ok) throw new Error(`Odoo authentication failed: HTTP ${authRes.status}`);

  const authData = (await authRes.json()) as OdooRpcResponse<{ uid?: number }>;
  if (authData.error || !authData.result?.uid) {
    throw new Error(authData.error?.data?.message || authData.error?.message || "Invalid credentials");
  }

  return { baseUrl, cookie: authRes.headers.get("set-cookie") || "" };
}

export async function odooRpc<T>(session: OdooSession, id: number, params: unknown): Promise<T> {
  const res = await fetch(`${session.baseUrl}/web/dataset/call_kw`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(session.cookie ? { Cookie: session.cookie } : {}),
    },
    body: JSON.stringify({ jsonrpc: "2.0", method: "call", id, params }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = (await res.json()) as OdooRpcResponse<T>;
  if (data.error) throw new Error(data.error.data?.message || data.error.message || "RPC error");
  return data.result as T;
}
