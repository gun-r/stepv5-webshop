"use client";

import { SessionProvider } from "next-auth/react";
import { MobileSidebarProvider } from "@/components/layout/MobileSidebarContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <MobileSidebarProvider>{children}</MobileSidebarProvider>
    </SessionProvider>
  );
}
