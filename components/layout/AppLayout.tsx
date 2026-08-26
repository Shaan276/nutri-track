"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { BottomNavigation } from "./BottomNavigation";
import { QuickLogModal } from "@/components/quick-log/QuickLogModal";
import { NavigationProgressBar } from "./NavigationProgressBar";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isQuickLogOpen, setIsQuickLogOpen] = useState(false);

  return (
    <div className="h-screen w-screen bg-background-midnight text-foreground-primary flex overflow-hidden">
      {/* Top Navigation Progress Bar for Instant Click Feedback */}
      <NavigationProgressBar />

      {/* Desktop Fixed Left Sidebar */}
      <div className="hidden lg:flex flex-col w-64 h-full shrink-0 z-20">
        <Sidebar onOpenQuickLog={() => setIsQuickLogOpen(true)} />
      </div>

      {/* Mobile Drawer Sidebar */}
      {isMobileSidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex animate-fade-in">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setIsMobileSidebarOpen(false)}
          />

          {/* Drawer Content */}
          <div className="relative w-72 max-w-[85vw] h-full bg-background-surface z-10 shadow-2xl">
            <Sidebar
              onOpenQuickLog={() => {
                setIsMobileSidebarOpen(false);
                setIsQuickLogOpen(true);
              }}
              onCloseMobile={() => setIsMobileSidebarOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Main Full-Width Content Viewport */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        <Header
          onToggleMobileSidebar={() => setIsMobileSidebarOpen((prev) => !prev)}
          onOpenQuickLog={() => setIsQuickLogOpen(true)}
        />

        <main className="flex-1 w-full overflow-y-auto p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8 max-w-[1600px] mx-auto transform-gpu">
          {children}
        </main>
      </div>

      {/* Mobile Fixed Bottom Navigation Bar */}
      <BottomNavigation
        onOpenQuickLog={() => setIsQuickLogOpen(true)}
        onToggleMobileDrawer={() => setIsMobileSidebarOpen((prev) => !prev)}
      />

      {/* Global Quick Action Modal (Mounted on demand) */}
      {isQuickLogOpen && (
        <QuickLogModal
          isOpen={isQuickLogOpen}
          onClose={() => setIsQuickLogOpen(false)}
        />
      )}
    </div>
  );
}

export default AppLayout;
