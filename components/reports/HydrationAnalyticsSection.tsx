"use client";

import React from "react";
import { Droplets, Flame, CheckCircle2, Award } from "lucide-react";
import { HydrationOverviewMetrics, HydrationTrendPoint } from "@/lib/validations/report";
import { BarProgressChart } from "@/components/charts/BarProgressChart";
import { ChartContainer } from "@/components/charts/ChartContainer";

interface HydrationAnalyticsSectionProps {
  overview: HydrationOverviewMetrics;
  trend: HydrationTrendPoint[];
}

export function HydrationAnalyticsSection({
  overview,
  trend,
}: HydrationAnalyticsSectionProps) {
  const daysNoun = (count: number) => (count === 1 ? "day" : "days");

  return (
    <div className="space-y-6 text-left">
      {/* Section Title */}
      <div className="flex items-center gap-2.5 pb-2 border-b border-slate-800">
        <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 flex-shrink-0">
          <Droplets className="w-4 h-4" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight">Hydration Analytics</h2>
          <p className="text-xs text-slate-400">
            Daily water intake patterns, goal achievement rate, and hydration streaks
          </p>
        </div>
      </div>

      {/* Top Cards: Streak & Completion */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 flex-shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 block font-medium">Goal Achievement</span>
            <strong className="text-xl font-black text-white">{overview.goalAchievementPct}%</strong>
            <span className="text-[10px] text-slate-500 block">Target: {overview.dailyTargetMl} ml</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 flex-shrink-0">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 block font-medium">Current Streak</span>
            <strong className="text-xl font-black text-emerald-400">
              {overview.currentStreakDays} {daysNoun(overview.currentStreakDays)}
            </strong>
            <span className="text-[10px] text-slate-500 block">Consecutive target days</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 flex-shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 block font-medium">Longest Streak</span>
            <strong className="text-xl font-black text-purple-300">
              {overview.longestStreakDays} {daysNoun(overview.longestStreakDays)}
            </strong>
            <span className="text-[10px] text-slate-500 block">All-time historical best</span>
          </div>
        </div>
      </div>

      {/* Daily Fluid Intake Chart */}
      <ChartContainer
        title="Daily Fluid & Water Intake"
        subtitle="Actual volume consumed daily vs hydration goal"
        badge="Fluid Balance"
        badgeColor="blue"
        height={280}
        isEmpty={trend.every((t) => t.intake === 0)}
        emptyMessage="No hydration logs found for this date range."
      >
        <BarProgressChart
          data={trend}
          dataKey="intake"
          labelKey="label"
          barColor="#06B6D4"
          unit=" ml"
          targetKey="target"
        />
      </ChartContainer>
    </div>
  );
}
