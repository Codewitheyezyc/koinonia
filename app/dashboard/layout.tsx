"use client";

import DashboardSidebar from "@/components/DashboardSidebar";
import FloatingMeetingRoom from "@/components/FloatingMeetingRoom";
import { MobileSidebarProvider } from "@/lib/context/MobileSidebarContext";
import { UnreadNotificationProvider } from "@/lib/context/UnreadNotificationContext";
import { MeetingProvider } from "@/lib/context/MeetingContext";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MobileSidebarProvider>
      <UnreadNotificationProvider>
        <MeetingProvider>
          <div className="flex h-screen w-screen bg-slate-950 text-slate-100 antialiased overflow-hidden">
            <DashboardSidebar />
            <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
              {children}
            </main>
          </div>
          {/* Floating meeting room — persists across all dashboard routes */}
          <FloatingMeetingRoom />
        </MeetingProvider>
      </UnreadNotificationProvider>
    </MobileSidebarProvider>
  );
}
