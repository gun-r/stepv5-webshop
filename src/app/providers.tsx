"use client";

import { SessionProvider } from "next-auth/react";
import { MobileSidebarProvider } from "@/components/layout/MobileSidebarContext";
import { PageTracker } from "@/components/ui/PageTracker";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <MobileSidebarProvider>
        <PageTracker />
        {children}
      </MobileSidebarProvider>
    </SessionProvider>
  );
}
