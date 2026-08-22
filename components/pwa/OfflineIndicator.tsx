"use client";
import React, { useState, useEffect } from "react";
import { WifiOff } from "lucide-react";

export function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    if (typeof window !== "undefined") {
      setIsOffline(!navigator.onLine);
      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      }
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-amber-500/90 text-[#0E121A] backdrop-blur-md rounded-full shadow-2xl flex items-center gap-2 text-xs font-bold animate-fadeIn">
      <WifiOff className="w-3.5 h-3.5" />
      <span>You are currently offline. Reconnecting...</span>
    </div>
  );
}
