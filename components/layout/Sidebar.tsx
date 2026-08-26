"use client";
import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  LayoutDashboard,
  UtensilsCrossed,
  Sparkles,
  Droplets,
  Activity,
  Apple,
  Dumbbell,
  Flame,
  Users,
  LineChart,
  Bot,
  Settings,
  Zap,
  ShieldAlert,
  MessageSquarePlus,
  Target,
  Trophy,
  History,
} from "lucide-react";
import { NutriTrackLogo } from "@/components/branding/NutriTrackLogo";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { FeatureRequestModal } from "@/components/features/FeatureRequestModal";

interface SidebarProps {
  onOpenQuickLog: () => void;
  onCloseMobile?: () => void;
}

interface NavItem {
  name: string;
  href?: string;
  icon: any;
  active?: boolean;
  badge?: string;
  isPlaceholder?: boolean;
}

export function Sidebar({ onOpenQuickLog, onCloseMobile }: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isFeatureModalOpen, setIsFeatureModalOpen] = useState(false);
  const isAdmin = (session?.user as any)?.role === "ADMIN";

  const coreNavItems: NavItem[] = [
    {
      name: "Dashboard",
      href: "/app",
      icon: LayoutDashboard,
      active: pathname === "/app",
    },
    {
      name: "Yesterday's Data",
      href: "/yesterday",
      icon: History,
      badge: "AI ⚡",
      active: pathname.startsWith("/yesterday"),
    },
    {
      name: "Goals",
      href: "/goals",
      icon: Target,
      active: pathname.startsWith("/goals"),
    },
    {
      name: "Nutrition",
      href: "/nutrition",
      icon: UtensilsCrossed,
      active: pathname.startsWith("/nutrition"),
    },
    {
      name: "Deep Nutrition",
      href: "/deep-nutrition",
      icon: Sparkles,
      active: pathname.startsWith("/deep-nutrition"),
    },
    {
      name: "Hydration",
      href: "/hydration",
      icon: Droplets,
      active: pathname.startsWith("/hydration"),
    },
    {
      name: "Activities",
      href: "/activities",
      icon: Activity,
      active:
        pathname.startsWith("/activities") ||
        pathname.startsWith("/running") ||
        pathname.startsWith("/activity"),
    },
  ];

  const databasesNavItems: NavItem[] = [
    {
      name: "Food Database",
      href: "/foods",
      icon: Apple,
      active: pathname.startsWith("/foods"),
    },
    {
      name: "Workout Database",
      href: "/workouts",
      icon: Dumbbell,
      active: pathname.startsWith("/workouts"),
    },
  ];

  const analyticsNavItems: NavItem[] = [
    {
      name: "Insights",
      href: "/insights",
      icon: Sparkles,
      active: pathname.startsWith("/insights"),
    },
    {
      name: "Reports",
      href: "/reports",
      icon: LineChart,
      active: pathname.startsWith("/reports"),
    },
    {
      name: "AI Coach",
      href: "/ai-coach",
      icon: Bot,
      badge: isAdmin ? "Admin" : "Soon",
      active: pathname.startsWith("/ai-coach"),
    },
  ];

  const otherNavItems: NavItem[] = [
    {
      name: "Community",
      href: "/community",
      icon: Users,
      active: pathname.startsWith("/community"),
    },
    {
      name: "Settings",
      href: "/settings",
      icon: Settings,
      active:
        pathname.startsWith("/settings") ||
        pathname.startsWith("/profile") ||
        pathname.startsWith("/onboarding"),
    },
  ];

  const adminNavItems: NavItem[] = [
    {
      name: "Admin Control Center",
      href: "/admin",
      icon: ShieldAlert,
      active: pathname.startsWith("/admin"),
    },
  ];

  const renderNavGroup = (title: string, items: NavItem[]) => (
    <div className="space-y-1">
      <p className="px-3 text-[10px] font-black text-foreground-muted uppercase tracking-wider mb-1.5">
        {title}
      </p>
      {items.map((item) => {
        const Icon = item.icon;

        if (item.isPlaceholder) {
          return (
            <div
              key={item.name}
              className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-semibold text-foreground-muted/60 opacity-60 cursor-not-allowed"
            >
              <div className="flex items-center gap-3">
                <Icon className="h-4 w-4 shrink-0 text-foreground-muted/50" />
                <span>{item.name}</span>
              </div>
              {item.badge && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold uppercase bg-background-elevated border border-border-subtle text-foreground-muted">
                  {item.badge}
                </span>
              )}
            </div>
          );
        }

        return (
          <Link
            key={item.name}
            href={item.href!}
            onClick={onCloseMobile}
            className={`flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer ${
              item.active
                ? "bg-brand-500/15 text-brand-400 border border-brand-500/30 shadow-sm"
                : "text-foreground-secondary hover:text-foreground-primary hover:bg-background-elevated/70"
            }`}
          >
            <div className="flex items-center gap-3">
              <Icon
                className={`h-4 w-4 shrink-0 transition-colors ${
                  item.active ? "text-brand-400" : "text-foreground-muted"
                }`}
              />
              <span>{item.name}</span>
            </div>
          </Link>
        );
      })}
    </div>
  );

  return (
    <>
      <aside className="w-64 h-full bg-background-surface border-r border-border-default flex flex-col justify-between p-4 select-none overflow-y-auto">
        <div className="space-y-5">
          {/* Brand Logo */}
          <div className="px-2 pt-1 pb-1">
            <NutriTrackLogo size="sm" subtitle="HEALTH OS" />
          </div>

          {/* Quick Log Action Trigger */}
          <div className="px-1">
            <button
              onClick={() => {
                onOpenQuickLog();
                if (onCloseMobile) onCloseMobile();
              }}
              className="w-full py-2.5 px-4 bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-black font-extrabold text-xs rounded-xl shadow-brand-glow hover:shadow-brand-glow-lg transition-all duration-200 cursor-pointer flex items-center justify-center gap-2"
            >
              <Zap className="h-4 w-4 fill-black" />
              <span>QUICK LOG</span>
            </button>
          </div>

          {/* Navigation Groups */}
          <nav className="space-y-4">
            {isAdmin && renderNavGroup("Administration", adminNavItems)}
            {renderNavGroup("Core Navigation", coreNavItems)}
            {renderNavGroup("Databases", databasesNavItems)}
            {renderNavGroup("Analytics & Insights", analyticsNavItems)}
            {renderNavGroup("Other", otherNavItems)}
          </nav>

          {/* Feature Request Trigger */}
          <div className="px-1 pt-1">
            <button
              onClick={() => setIsFeatureModalOpen(true)}
              className="w-full py-2 px-3 bg-background-elevated hover:bg-purple-500/15 text-foreground-secondary hover:text-purple-400 border border-border-subtle hover:border-purple-500/30 font-bold text-xs rounded-xl transition-all duration-200 cursor-pointer flex items-center justify-center gap-2"
            >
              <MessageSquarePlus className="h-4 w-4" />
              <span>Request Feature</span>
            </button>
          </div>
        </div>

        {/* Footer / Account Section */}
        <div className="pt-3 border-t border-border-subtle space-y-2.5 mt-4">
          <div className="px-3 py-2 rounded-2xl bg-background-elevated/70 border border-border-subtle flex items-center justify-between">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-7 h-7 rounded-xl bg-brand-500/20 border border-brand-500/30 text-brand-400 flex items-center justify-center font-bold text-xs shrink-0">
                ⚡
              </div>
              <div className="truncate text-left">
                <p className="text-xs font-extrabold text-foreground-primary truncate">
                  Active Session
                </p>
                <p className="text-[10px] text-brand-400 font-semibold font-mono">
                  PostgreSQL Synced
                </p>
              </div>
            </div>
          </div>

          <LogoutButton />
        </div>
      </aside>

      {/* Feature Request Modal */}
      <FeatureRequestModal
        isOpen={isFeatureModalOpen}
        onClose={() => setIsFeatureModalOpen(false)}
      />
    </>
  );
}

export default Sidebar;
