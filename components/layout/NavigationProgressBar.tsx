"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export function NavigationProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    // When route changes, reset loading state
    setIsNavigating(false);
  }, [pathname, searchParams]);

  useEffect(() => {
    // Intercept clicks on links and buttons for instant loading feedback
    const handleAnchorClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement)?.closest("a");
      if (!target) return;

      const href = target.getAttribute("href");
      if (
        href &&
        href.startsWith("/") &&
        !href.startsWith("#") &&
        target.target !== "_blank" &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.shiftKey
      ) {
        // If navigating to a different pathname
        const targetUrl = new URL(href, window.location.origin);
        if (targetUrl.pathname !== window.location.pathname || targetUrl.search !== window.location.search) {
          setIsNavigating(true);
        }
      }
    };

    document.addEventListener("click", handleAnchorClick, { capture: true });
    return () => {
      document.removeEventListener("click", handleAnchorClick, { capture: true });
    };
  }, []);

  if (!isNavigating) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 pointer-events-none">
      <div className="h-1 bg-gradient-to-r from-emerald-500 via-teal-300 to-emerald-400 animate-pulse shadow-md shadow-emerald-500/50 transition-all duration-300" />
    </div>
  );
}
