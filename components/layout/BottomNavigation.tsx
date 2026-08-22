"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  UtensilsCrossed,
  Activity,
  Menu,
  Plus,
} from "lucide-react";

interface BottomNavigationProps {
  onOpenQuickLog: () => void;
  onToggleMobileDrawer: () => void;
}

export function BottomNavigation({
  onOpenQuickLog,
  onToggleMobileDrawer,
}: BottomNavigationProps) {
  const pathname = usePathname();

  const isDashboardActive = pathname === "/app";
  const isNutritionActive = pathname.startsWith("/nutrition");
  const isActivitiesActive =
    pathname.startsWith("/activities") ||
    pathname.startsWith("/running") ||
    pathname.startsWith("/activity");

  return (
    <nav
      className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-[#0E121A]/95 backdrop-blur-xl border-t border-[#232936] px-3 py-1.5 flex items-center justify-around select-none"
      style={{ paddingBottom: "max(6px, env(safe-area-inset-bottom, 6px))" }}
      aria-label="Mobile Navigation"
    >
      {/* 1. Dashboard */}
      <Link
        href="/app"
        className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
          isDashboardActive
            ? "text-emerald-400 font-semibold"
            : "text-slate-400 hover:text-slate-200"
        }`}
      >
        <LayoutDashboard className={`w-5 h-5 ${isDashboardActive ? "stroke-[2.5]" : "stroke-[1.75]"}`} />
        <span className="text-[10px] mt-0.5 tracking-tight">Home</span>
      </Link>

      {/* 2. Nutrition */}
      <Link
        href="/nutrition"
        className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
          isNutritionActive
            ? "text-emerald-400 font-semibold"
            : "text-slate-400 hover:text-slate-200"
        }`}
      >
        <UtensilsCrossed className={`w-5 h-5 ${isNutritionActive ? "stroke-[2.5]" : "stroke-[1.75]"}`} />
        <span className="text-[10px] mt-0.5 tracking-tight">Nutrition</span>
      </Link>

      {/* 3. Center Elevated Quick Log Button */}
      <div className="relative -top-3 flex items-center justify-center">
        <button
          onClick={onOpenQuickLog}
          type="button"
          aria-label="Open Quick Log"
          className="w-13 h-13 w-[52px] h-[52px] rounded-2xl bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-400 text-[#0E121A] flex items-center justify-center shadow-lg shadow-emerald-500/30 border-2 border-[#0E121A] active:scale-95 transition-transform group"
        >
          <Plus className="w-6 h-6 stroke-[3] text-[#0E121A] group-hover:rotate-90 transition-transform duration-200" />
        </button>
      </div>

      {/* 4. Activities */}
      <Link
        href="/activities"
        className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
          isActivitiesActive
            ? "text-emerald-400 font-semibold"
            : "text-slate-400 hover:text-slate-200"
        }`}
      >
        <Activity className={`w-5 h-5 ${isActivitiesActive ? "stroke-[2.5]" : "stroke-[1.75]"}`} />
        <span className="text-[10px] mt-0.5 tracking-tight">Activities</span>
      </Link>

      {/* 5. More / Menu */}
      <button
        onClick={onToggleMobileDrawer}
        type="button"
        className="flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-slate-400 hover:text-slate-200 transition-all"
        aria-label="Open Full Menu"
      >
        <Menu className="w-5 h-5 stroke-[1.75]" />
        <span className="text-[10px] mt-0.5 tracking-tight">More</span>
      </button>
    </nav>
  );
}
