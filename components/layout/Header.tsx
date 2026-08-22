"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Zap, User, Calendar } from "lucide-react";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";

interface HeaderProps {
  onToggleMobileSidebar: () => void;
  onOpenQuickLog: () => void;
}

export function Header({ onToggleMobileSidebar, onOpenQuickLog }: HeaderProps) {
  const pathname = usePathname();

  let pageTitle = "Dashboard";
  if (pathname.startsWith("/nutrition")) {
    pageTitle = "Daily Nutrition";
  } else if (pathname.startsWith("/deep-nutrition")) {
    pageTitle = "Deep Nutrition";
  } else if (pathname.startsWith("/reports")) {
    pageTitle = "Reports & Analytics";
  } else if (pathname.startsWith("/foods")) {
    pageTitle = "Food Database";
  } else if (pathname.startsWith("/hydration")) {
    pageTitle = "Hydration Tracking";
  } else if (
    pathname.startsWith("/activities") ||
    pathname.startsWith("/running") ||
    pathname.startsWith("/workouts") ||
    pathname.startsWith("/activity")
  ) {
    pageTitle = "Activities Hub";
  } else if (pathname.startsWith("/profile")) {
    pageTitle = "Profile & Settings";
  } else if (pathname.startsWith("/onboarding")) {
    pageTitle = "Onboarding Setup";
  } else if (pathname.startsWith("/admin")) {
    pageTitle = "Admin Control Center";
  } else if (pathname.startsWith("/community")) {
    pageTitle = "Community & Friends";
  } else if (pathname.startsWith("/insights")) {
    pageTitle = "Health Insights";
  } else if (pathname.startsWith("/ai-coach")) {
    pageTitle = "AI Health Coach";
  }

  const todayStr = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(new Date());

  return (
    <header className="w-full h-16 bg-background-surface border-b border-border-default px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30">
      {/* Left: Mobile Toggle & Page Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileSidebar}
          className="lg:hidden p-2 rounded-xl text-foreground-secondary hover:text-foreground-primary hover:bg-background-elevated transition-colors cursor-pointer"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div>
          <h1 className="text-base sm:text-lg font-extrabold text-foreground-primary tracking-tight">
            {pageTitle}
          </h1>
        </div>
      </div>

      {/* Right: Date, Notifications, Quick Log Action, and Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-background-elevated/70 border border-border-subtle text-xs font-semibold text-foreground-secondary">
          <Calendar className="h-3.5 w-3.5 text-brand-400" />
          <span>{todayStr}</span>
        </div>

        {/* Central Notification Center */}
        <NotificationCenter />

        <button
          onClick={onOpenQuickLog}
          className="inline-flex items-center gap-1.5 py-1.5 px-3.5 bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-black font-extrabold text-xs rounded-xl shadow-brand-glow hover:shadow-brand-glow-lg transition-all duration-200 cursor-pointer"
        >
          <Zap className="h-3.5 w-3.5 fill-black" />
          <span className="hidden sm:inline">QUICK LOG</span>
        </button>

        <Link
          href="/settings"
          className="p-2 rounded-xl text-foreground-secondary hover:text-foreground-primary hover:bg-background-elevated border border-transparent hover:border-border-subtle transition-colors cursor-pointer"
          title="Account Settings"
        >
          <User className="h-4 w-4" />
        </Link>
      </div>
    </header>
  );
}

export default Header;
