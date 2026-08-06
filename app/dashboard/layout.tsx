"use client";

import DashboardSidebar from "@/components/DashboardSidebar";
import { MobileSidebarProvider } from "@/lib/context/MobileSidebarContext";
import { UnreadNotificationProvider } from "@/lib/context/UnreadNotificationContext";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MobileSidebarProvider>
      <UnreadNotificationProvider>
        <div className="flex h-screen w-screen bg-slate-950 text-slate-100 antialiased overflow-hidden">
          <DashboardSidebar />
          <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
            {children}
          </main>
        </div>
      </UnreadNotificationProvider>
    </MobileSidebarProvider>
  );
}
