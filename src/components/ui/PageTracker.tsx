"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

function getVisitorId(): string {
  const match = document.cookie.match(/(?:^|; )_vid=([^;]*)/);
  if (match) return decodeURIComponent(match[1]);
  const id = Math.random().toString(36).slice(2) + Date.now().toString(36);
  document.cookie = `_vid=${id};path=/;max-age=${60 * 60 * 24 * 365};SameSite=Lax`;
  return id;
}

export function PageTracker() {
  const pathname = usePathname();
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    if (lastPath.current === pathname) return;
    lastPath.current = pathname;

    const visitorId = getVisitorId();

    // Fire and forget — never block navigation
    fetch("/api/analytics/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: pathname,
        referer: document.referrer || null,
        visitorId,
      }),
    }).catch(() => {});
  }, [pathname]);

  return null;
}
