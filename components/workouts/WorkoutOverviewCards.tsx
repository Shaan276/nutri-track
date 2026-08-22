"use client";

import React from "react";
import { Dumbbell, Clock, Flame, Layers } from "lucide-react";
import { formatDuration } from "@/lib/validations/activity";

interface WorkoutOverviewCardsProps {
  totalWorkouts: number;
  totalDurationSeconds: number;
  totalCaloriesBurned: number;
  totalSetsCompleted: number;
}

export function WorkoutOverviewCards({
  totalWorkouts,
  totalDurationSeconds,
  totalCaloriesBurned,
  totalSetsCompleted,
}: WorkoutOverviewCardsProps) {
  const durationFormatted = formatDuration(totalDurationSeconds);

  return (
    <div className="w-full bg-background-surface border border-border-default rounded-3xl p-5 sm:p-6 shadow-surface-card space-y-4 text-left">
      <div className="flex items-center justify-between border-b border-border-subtle pb-3.5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-400">
            <Dumbbell className="h-4 w-4" />
          </div>
          <h3 className="text-base font-bold text-foreground-primary tracking-tight">
            Today&apos;s Workout Metrics
          </h3>
        </div>

        <span className="px-2.5 py-0.5 rounded-full bg-background-elevated border border-border-subtle text-xs font-bold text-foreground-secondary font-mono">
          {totalWorkouts} {totalWorkouts === 1 ? "session" : "sessions"}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {/* Workouts Count */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-background-elevated/70 border border-border-subtle flex flex-col justify-between space-y-1">
          <div className="flex items-center justify-between text-foreground-muted">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Sessions</span>
            <Dumbbell className="h-3.5 w-3.5 text-emerald-400" />
          </div>
          <span className="text-xl sm:text-2xl font-black text-foreground-primary font-mono tracking-tight">
            {totalWorkouts}
          </span>
          <span className="text-[10px] text-foreground-muted font-medium">Logged today</span>
        </div>

        {/* Total Duration */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-background-elevated/70 border border-border-subtle flex flex-col justify-between space-y-1">
          <div className="flex items-center justify-between text-foreground-muted">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-400">Duration</span>
            <Clock className="h-3.5 w-3.5 text-blue-400" />
          </div>
          <span className="text-xl sm:text-2xl font-black text-foreground-primary font-mono tracking-tight">
            {durationFormatted}
          </span>
          <span className="text-[10px] text-foreground-muted font-medium">Active workout time</span>
        </div>

        {/* Total Sets */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-background-elevated/70 border border-border-subtle flex flex-col justify-between space-y-1">
          <div className="flex items-center justify-between text-foreground-muted">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-400">Total Sets</span>
            <Layers className="h-3.5 w-3.5 text-purple-400" />
          </div>
          <span className="text-xl sm:text-2xl font-black text-foreground-primary font-mono tracking-tight">
            {totalSetsCompleted}
          </span>
          <span className="text-[10px] text-foreground-muted font-medium">Completed sets</span>
        </div>

        {/* Calories Burned */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-background-elevated/70 border border-border-subtle flex flex-col justify-between space-y-1">
          <div className="flex items-center justify-between text-foreground-muted">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-400">Calories</span>
            <Flame className="h-3.5 w-3.5 text-rose-400" />
          </div>
          <span className="text-xl sm:text-2xl font-black text-foreground-primary font-mono tracking-tight">
            {totalCaloriesBurned}
          </span>
          <span className="text-[10px] text-foreground-muted font-medium">Estimated kcal</span>
        </div>
      </div>
    </div>
  );
}
