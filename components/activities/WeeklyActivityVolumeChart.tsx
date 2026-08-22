"use client";

import React from "react";
import { ChartContainer } from "@/components/charts/ChartContainer";
import { BarProgressChart } from "@/components/charts/BarProgressChart";
import { Activity, Flame, Clock } from "lucide-react";
import { formatDuration } from "@/lib/validations/activity";

interface WeeklyActivityVolumeChartProps {
  days: {
    date: string;
    label: string;
    durationMinutes: number;
    durationSeconds: number;
    caloriesBurned: number;
    distanceKm: number;
    activitiesCount: number;
  }[];
  totalDurationSeconds: number;
  totalCaloriesBurned: number;
  totalDistanceKm: number;
  totalActivitiesCount: number;
  isLoading?: boolean;
}

export function WeeklyActivityVolumeChart({
  days = [],
  totalDurationSeconds,
  totalCaloriesBurned,
  totalDistanceKm,
  totalActivitiesCount,
  isLoading = false,
}: WeeklyActivityVolumeChartProps) {
  const chartData = days.map((d) => ({
    label: d.label,
    value: d.durationMinutes,
    durationFormatted: formatDuration(d.durationSeconds),
    calories: d.caloriesBurned,
    distance: d.distanceKm,
    count: d.activitiesCount,
  }));

  const isEmpty = !chartData || chartData.length === 0 || chartData.every((d) => d.value === 0);

  return (
    <div className="w-full space-y-4">
      {/* 7-Day Training Summary Banner */}
      <div className="w-full bg-gradient-to-r from-emerald-500/10 via-background-surface to-background-surface border border-emerald-500/30 rounded-3xl p-5 sm:p-6 shadow-surface-card flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-left">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2">
            <Activity className="h-3.5 w-3.5" />
            7-Day Activity Volume
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-foreground-primary tracking-tight">
            {formatDuration(totalDurationSeconds)} Active Time
          </h3>
          <p className="text-xs text-foreground-secondary mt-0.5 font-medium">
            {totalActivitiesCount} {totalActivitiesCount === 1 ? "activity" : "activities"} &bull; {totalCaloriesBurned.toLocaleString()} kcal burned &bull; {totalDistanceKm.toFixed(2)} km covered
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-background-elevated border border-border-subtle flex items-center gap-2.5">
            <div className="p-1.5 rounded-xl bg-rose-500/15 text-rose-400">
              <Flame className="h-4 w-4" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-foreground-muted uppercase">Burned</span>
              <p className="text-sm font-extrabold text-foreground-primary font-mono">{totalCaloriesBurned.toLocaleString()} kcal</p>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-background-elevated border border-border-subtle flex items-center gap-2.5">
            <div className="p-1.5 rounded-xl bg-emerald-500/15 text-emerald-400">
              <Clock className="h-4 w-4" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-foreground-muted uppercase">Sessions</span>
              <p className="text-sm font-extrabold text-foreground-primary font-mono">{totalActivitiesCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bar Chart Container */}
      <ChartContainer
        title="Daily Active Minutes"
        subtitle="Active exercise time across all runs, workouts, and cardio sessions"
        badge="7 Days"
        badgeColor="brand"
        isLoading={isLoading}
        isEmpty={isEmpty}
        emptyIcon={<Activity className="h-6 w-6 text-emerald-400/50" />}
        emptyMessage="No physical activities logged in the last 7 days. Start logging runs, gym sessions, or walks to build your weekly activity history."
        height={260}
      >
        <BarProgressChart
          data={chartData}
          fillColor="#10B981"
          unit="min"
          valueFormatter={(v) => `${v} min`}
        />
      </ChartContainer>
    </div>
  );
}

export default WeeklyActivityVolumeChart;
