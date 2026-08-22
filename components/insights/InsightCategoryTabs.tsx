"use client";

import React from "react";

export type InsightFilterTab =
  | "ALL"
  | "ATTENTION"
  | "GOING_WELL"
  | "NUTRITION"
  | "MICRONUTRIENTS"
  | "HYDRATION"
  | "ACTIVITIES"
  | "WORKOUTS"
  | "TRENDS"
  | "ACHIEVEMENTS"
  | "RECOMMENDATIONS";

interface InsightCategoryTabsProps {
  activeTab: InsightFilterTab;
  onTabChange: (tab: InsightFilterTab) => void;
  counts: {
    all: number;
    attention: number;
    goingWell: number;
    nutrition: number;
    micronutrients: number;
    hydration: number;
    activities: number;
    workouts: number;
    trends: number;
    achievements: number;
    recommendations: number;
  };
}

export function InsightCategoryTabs({
  activeTab,
  onTabChange,
  counts,
}: InsightCategoryTabsProps) {
  const tabs: { id: InsightFilterTab; label: string; count: number; badgeColor?: string }[] = [
    { id: "ALL", label: "All Insights", count: counts.all },
    {
      id: "ATTENTION",
      label: "Needs Attention",
      count: counts.attention,
      badgeColor: counts.attention > 0 ? "bg-amber-500/20 text-amber-300 border-amber-500/30" : undefined,
    },
    {
      id: "GOING_WELL",
      label: "Going Well",
      count: counts.goingWell,
      badgeColor: counts.goingWell > 0 ? "bg-brand-500/20 text-brand-300 border-brand-500/30" : undefined,
    },
    { id: "NUTRITION", label: "Nutrition", count: counts.nutrition },
    { id: "MICRONUTRIENTS", label: "Micronutrients", count: counts.micronutrients },
    { id: "HYDRATION", label: "Hydration", count: counts.hydration },
    { id: "ACTIVITIES", label: "Running & Activity", count: counts.activities },
    { id: "WORKOUTS", label: "Workouts", count: counts.workouts },
    { id: "TRENDS", label: "Weekly Shifts", count: counts.trends },
    { id: "ACHIEVEMENTS", label: "Achievements", count: counts.achievements },
    { id: "RECOMMENDATIONS", label: "Next Steps", count: counts.recommendations },
  ];

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none text-left">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              isActive
                ? "bg-brand-500 text-black shadow-brand-glow font-extrabold"
                : "bg-background-surface hover:bg-background-elevated text-foreground-secondary hover:text-foreground-primary border border-border-default hover:border-border-subtle"
            }`}
          >
            <span>{tab.label}</span>
            {tab.count > 0 && (
              <span
                className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono font-bold ${
                  isActive
                    ? "bg-black/20 text-black"
                    : tab.badgeColor || "bg-background-elevated text-foreground-muted border border-border-subtle"
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
