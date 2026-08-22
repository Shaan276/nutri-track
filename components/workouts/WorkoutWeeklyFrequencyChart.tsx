"use client";

import React from "react";
import { WeeklyWorkoutsSummary } from "@/lib/services/workout.service";
import { ChartContainer } from "@/components/charts/ChartContainer";
import { BarProgressChart } from "@/components/charts/BarProgressChart";
import { Dumbbell, Home, Flame, Clock } from "lucide-react";
import { formatDuration } from "@/lib/validations/activity";

interface WorkoutWeeklyFrequencyChartProps {
  summary: WeeklyWorkoutsSummary | null;
  isLoading?: boolean;
}

export function WorkoutWeeklyFrequencyChart({
  summary,
  isLoading = false,
}: WorkoutWeeklyFrequencyChartProps) {
  if (isLoading || !summary) {
    return (
      <div className="w-full bg-background-surface border border-border-default rounded-3xl p-6 shadow-surface-card space-y-4 animate-pulse">
        <div className="h-5 w-48 bg-background-elevated rounded-lg" />
        <div className="h-44 bg-background-elevated/40 rounded-2xl" />
      </div>
    );
  }

  const chartData = summary.days.map((d) => ({
    label: d.label,
    value: d.workoutsCount,
    durationFormatted: formatDuration(d.durationSeconds),
  }));

  const isEmpty = !chartData || chartData.length === 0 || chartData.every((d) => d.value === 0);

  return (
    <div className="w-full space-y-4">
      {/* 7-Day Volume Overview Banner */}
      <div className="w-full bg-gradient-to-r from-emerald-500/10 via-background-surface to-background-surface border border-emerald-500/30 rounded-3xl p-5 sm:p-6 shadow-surface-card flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-left">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2">
            <Dumbbell className="h-3.5 w-3.5" />
            7-Day Training Volume
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-foreground-primary tracking-tight">
            {summary.totalWorkouts} {summary.totalWorkouts === 1 ? "Workout Session" : "Workout Sessions"}
          </h3>
          <p className="text-xs text-foreground-secondary mt-0.5 font-medium">
            {formatDuration(summary.totalDurationSeconds)} total time &bull; {summary.totalSetsCompleted} sets completed
          </p>
        </div>

        {/* Type Distribution Chips */}
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-background-elevated border border-border-subtle flex items-center gap-2.5">
            <div className="p-1.5 rounded-xl bg-purple-500/15 text-purple-400">
              <Home className="h-4 w-4" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-foreground-muted uppercase">Home</span>
              <p className="text-sm font-extrabold text-foreground-primary font-mono">{summary.typeDistribution.homeCount}</p>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-background-elevated border border-border-subtle flex items-center gap-2.5">
            <div className="p-1.5 rounded-xl bg-emerald-500/15 text-emerald-400">
              <Dumbbell className="h-4 w-4" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-foreground-muted uppercase">Gym</span>
              <p className="text-sm font-extrabold text-foreground-primary font-mono">{summary.typeDistribution.gymCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bar Chart inside ChartContainer */}
      <ChartContainer
        title="Weekly Workout Frequency"
        subtitle="Workout sessions completed over the last 7 days"
        badge="7 Days"
        badgeColor="brand"
        isLoading={isLoading}
        isEmpty={isEmpty}
        emptyIcon={<Dumbbell className="h-6 w-6 text-emerald-400/50" />}
        emptyMessage="No workout sessions recorded in the last 7 days. Start logging your home or gym sessions to see your training frequency trend."
        height={260}
      >
        <BarProgressChart
          data={chartData}
          fillColor="#10B981"
          unit="sessions"
          valueFormatter={(v) => `${v} sessions`}
        />
      </ChartContainer>
    </div>
  );
}

export default WorkoutWeeklyFrequencyChart;
