"use client";

import React from "react";
import { Activity, Gauge, Clock, Flame, Footprints, Mountain } from "lucide-react";
import { formatPace, formatDuration } from "@/lib/validations/activity";

interface RunningOverviewCardsProps {
  totalDistanceKm: number;
  totalMovingDurationSeconds: number;
  averagePaceSecondsPerKm: number;
  totalSteps: number;
  totalCaloriesBurned: number;
  totalElevationGainMeters: number;
  activitiesCount: number;
}

export function RunningOverviewCards({
  totalDistanceKm,
  totalMovingDurationSeconds,
  averagePaceSecondsPerKm,
  totalSteps,
  totalCaloriesBurned,
  totalElevationGainMeters,
  activitiesCount,
}: RunningOverviewCardsProps) {
  const paceFormatted = formatPace(averagePaceSecondsPerKm);
  const timeFormatted = formatDuration(totalMovingDurationSeconds);

  return (
    <div className="w-full bg-background-surface border border-border-default rounded-3xl p-5 sm:p-6 shadow-surface-card space-y-4 text-left">
      <div className="flex items-center justify-between border-b border-border-subtle pb-3.5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-500/15 text-amber-400">
            <Activity className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground-primary tracking-tight">
              Today&apos;s Running Metrics
            </h3>
            <p className="text-xs text-foreground-muted">
              Live distance, pace, and cardio totals
            </p>
          </div>
        </div>

        <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-bold font-mono">
          {activitiesCount} {activitiesCount === 1 ? "run" : "runs"}
        </span>
      </div>

      {/* 6 Key Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Distance */}
        <div className="p-4 rounded-2xl bg-background-elevated/70 border border-border-subtle space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1">
            <Activity className="h-3 w-3" /> Distance
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-foreground-primary tracking-tight font-mono">
              {totalDistanceKm}
            </span>
            <span className="text-xs font-semibold text-foreground-muted">km</span>
          </div>
        </div>

        {/* Avg Pace */}
        <div className="p-4 rounded-2xl bg-background-elevated/70 border border-border-subtle space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-brand-400 flex items-center gap-1">
            <Gauge className="h-3 w-3" /> Avg Pace
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-black text-foreground-primary tracking-tight font-mono">
              {paceFormatted.replace(" / km", "")}
            </span>
            <span className="text-xs font-semibold text-foreground-muted">/km</span>
          </div>
        </div>

        {/* Moving Time */}
        <div className="p-4 rounded-2xl bg-background-elevated/70 border border-border-subtle space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1">
            <Clock className="h-3 w-3" /> Moving Time
          </span>
          <p className="text-2xl font-black text-foreground-primary tracking-tight font-mono">
            {timeFormatted}
          </p>
        </div>

        {/* Calories Burned */}
        <div className="p-4 rounded-2xl bg-background-elevated/70 border border-border-subtle space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1">
            <Flame className="h-3 w-3" /> Calories
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-foreground-primary tracking-tight font-mono">
              {totalCaloriesBurned.toLocaleString()}
            </span>
            <span className="text-xs font-semibold text-foreground-muted">kcal</span>
          </div>
        </div>

        {/* Steps */}
        <div className="p-4 rounded-2xl bg-background-elevated/70 border border-border-subtle space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1">
            <Footprints className="h-3 w-3" /> Steps
          </span>
          <p className="text-2xl font-black text-foreground-primary tracking-tight font-mono">
            {totalSteps.toLocaleString()}
          </p>
        </div>

        {/* Elevation Gain */}
        <div className="p-4 rounded-2xl bg-background-elevated/70 border border-border-subtle space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1">
            <Mountain className="h-3 w-3" /> Elevation
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-foreground-primary tracking-tight font-mono">
              {totalElevationGainMeters}
            </span>
            <span className="text-xs font-semibold text-foreground-muted">m</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RunningOverviewCards;
