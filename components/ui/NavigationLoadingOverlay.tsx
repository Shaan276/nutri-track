"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

export function NavigationLoadingOverlay() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isNavigating, setIsNavigating] = useState(false);

  // Whenever pathname or searchParams change, turn off navigating state
  useEffect(() => {
    setIsNavigating(false);
  }, [pathname, searchParams]);

  // Intercept click on links and cards that trigger navigation
  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement)?.closest("a, button[data-navigate], div[data-navigate]");
      if (!target) return;

      const href = target.getAttribute("href") || target.getAttribute("data-navigate");
      if (
        href &&
        href.startsWith("/") &&
        !href.startsWith("/#") &&
        !href.startsWith("/api") &&
        href !== pathname
      ) {
        setIsNavigating(true);
        // Safety timeout so overlay never stays more than 3 seconds
        setTimeout(() => setIsNavigating(false), 3000);
      }
    };

    document.addEventListener("click", handleDocumentClick, { capture: true });
    return () => {
      document.removeEventListener("click", handleDocumentClick, { capture: true });
    };
  }, [pathname]);

  if (!isNavigating) return null;

  return (
    <div className="fixed inset-0 z-50 pointer-events-none flex flex-col items-center justify-center bg-black/40 backdrop-blur-[2px] transition-all duration-200">
      {/* Top glowing progress bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 animate-pulse shadow-lg shadow-emerald-500/50" />

      {/* Center sleek loading badge */}
      <div className="px-5 py-3 rounded-2xl bg-neutral-950/90 border border-neutral-800 shadow-2xl flex items-center gap-3 text-white text-xs font-semibold animate-in fade-in zoom-in duration-150">
        <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />
        <span>Loading...</span>
      </div>
    </div>
  );
}
