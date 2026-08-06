"use client";

import React, { createContext, useContext, useState } from "react";

interface MobileSidebarContextType {
  isMobileOpen: boolean;
  openMobileSidebar: () => void;
  closeMobileSidebar: () => void;
  toggleMobileSidebar: () => void;
}

const MobileSidebarContext = createContext<MobileSidebarContextType>({
  isMobileOpen: false,
  openMobileSidebar: () => {},
  closeMobileSidebar: () => {},
  toggleMobileSidebar: () => {},
});

export function MobileSidebarProvider({ children }: { children: React.ReactNode }) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <MobileSidebarContext.Provider
      value={{
        isMobileOpen,
        openMobileSidebar: () => setIsMobileOpen(true),
        closeMobileSidebar: () => setIsMobileOpen(false),
        toggleMobileSidebar: () => setIsMobileOpen((prev: boolean) => !prev),
      }}
    >
      {children}
    </MobileSidebarContext.Provider>
  );
}

export function useMobileSidebar() {
  return useContext(MobileSidebarContext);
}
