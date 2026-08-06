"use client";

import { createContext, useContext, useState, useRef, useEffect, useCallback, ReactNode } from "react";

interface ActiveMeeting {
  fellowshipId: string;
  fellowshipName: string;
  token: string;
  wsUrl: string;
}

interface MeetingContextType {
  activeMeeting: ActiveMeeting | null;
  isMinimized: boolean;
  isModalOpen: boolean;
  startMeeting: (fellowshipId: string, fellowshipName: string) => void;
  minimizeMeeting: () => void;
  maximizeMeeting: () => void;
  leaveMeeting: () => void;
  openForFellowship: (fellowshipId: string, fellowshipName: string) => void;
}

const MeetingContext = createContext<MeetingContextType>({
  activeMeeting: null,
  isMinimized: false,
  isModalOpen: false,
  startMeeting: () => {},
  minimizeMeeting: () => {},
  maximizeMeeting: () => {},
  leaveMeeting: () => {},
  openForFellowship: () => {},
});

export function MeetingProvider({ children }: { children: ReactNode }) {
  const [activeMeeting, setActiveMeeting] = useState<ActiveMeeting | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const startMeeting = useCallback(async (fellowshipId: string, fellowshipName: string) => {
    // If already in this meeting, just maximize
    if (activeMeeting?.fellowshipId === fellowshipId) {
      setIsMinimized(false);
      setIsModalOpen(true);
      return;
    }

    try {
      const res = await fetch("/api/livekit/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fellowshipId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to join room");

      if (mountedRef.current) {
        setActiveMeeting({ fellowshipId, fellowshipName, token: data.token, wsUrl: data.wsUrl });
        setIsMinimized(false);
        setIsModalOpen(true);
      }
    } catch (err: any) {
      console.error("Failed to start meeting:", err);
      alert(err.message || "Failed to connect to prayer room");
    }
  }, [activeMeeting]);

  const minimizeMeeting = useCallback(() => {
    setIsMinimized(true);
    setIsModalOpen(false);
  }, []);

  const maximizeMeeting = useCallback(() => {
    setIsMinimized(false);
    setIsModalOpen(true);
  }, []);

  const leaveMeeting = useCallback(() => {
    setActiveMeeting(null);
    setIsMinimized(false);
    setIsModalOpen(false);
  }, []);

  const openForFellowship = useCallback((fellowshipId: string, fellowshipName: string) => {
    startMeeting(fellowshipId, fellowshipName);
  }, [startMeeting]);

  return (
    <MeetingContext.Provider value={{
      activeMeeting,
      isMinimized,
      isModalOpen,
      startMeeting,
      minimizeMeeting,
      maximizeMeeting,
      leaveMeeting,
      openForFellowship,
    }}>
      {children}
    </MeetingContext.Provider>
  );
}

export function useMeeting() {
  return useContext(MeetingContext);
}
