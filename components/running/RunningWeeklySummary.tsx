"use client";

import React from "react";
import { TrendingUp, Activity, Gauge, Clock, Flame, Calendar } from "lucide-react";
import { formatPace, formatDuration } from "@/lib/validations/activity";
import { WeeklyActivitySummary } from "@/lib/services/activity.service";

interface RunningWeeklySummaryProps {
  summary?: WeeklyActivitySummary;
  isLoading?: boolean;
}

export function RunningWeeklySummary({ summary, isLoading = false }: RunningWeeklySummaryProps) {
  if (isLoading || !summary) {
    return (
      <div className="w-full bg-background-surface border border-border-default rounded-3xl p-6 shadow-surface-card space-y-4 animate-pulse">
        <div className="h-5 w-48 bg-background-elevated rounded-lg" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-background-elevated rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  const paceStr = formatPace(summary.averagePaceSecondsPerKm);
  const timeStr = formatDuration(summary.totalMovingDurationSeconds);

  return (
    <div className="w-full bg-gradient-to-br from-amber-500/10 via-background-elevated to-background-surface border border-amber-500/30 rounded-3xl p-6 sm:p-7 shadow-surface-card space-y-5 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border-subtle pb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
            <TrendingUp className="h-3.5 w-3.5" />
            7-Day Training Volume
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-foreground-primary tracking-tight">
            Weekly Running Summary
          </h2>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-background-elevated border border-border-subtle text-xs font-bold text-foreground-secondary">
          <Calendar className="h-3.5 w-3.5 text-amber-400" />
          <span>Last 7 Days</span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Weekly Distance */}
        <div className="p-4 rounded-2xl bg-background-elevated/70 border border-border-subtle space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
            <Activity className="h-3.5 w-3.5" /> Total Distance
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-black text-foreground-primary tracking-tight font-mono">
              {summary.totalDistanceKm}
            </span>
            <span className="text-sm font-semibold text-foreground-muted">km</span>
          </div>
        </div>

        {/* Weekly Runs Count */}
        <div className="p-4 rounded-2xl bg-background-elevated/70 border border-border-subtle space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-400 flex items-center gap-1.5">
            <TrendingUp className="h-3.5 w-3.5" /> Total Sessions
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-black text-foreground-primary tracking-tight font-mono">
              {summary.totalRuns}
            </span>
            <span className="text-sm font-semibold text-foreground-muted">runs</span>
          </div>
        </div>

        {/* Weekly Pace */}
        <div className="p-4 rounded-2xl bg-background-elevated/70 border border-border-subtle space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
            <Gauge className="h-3.5 w-3.5" /> Avg Pace
          </span>
          <p className="text-2xl font-black text-foreground-primary tracking-tight font-mono">
            {paceStr}
          </p>
        </div>

        {/* Weekly Moving Time */}
        <div className="p-4 rounded-2xl bg-background-elevated/70 border border-border-subtle space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" /> Total Duration
          </span>
          <p className="text-2xl font-black text-foreground-primary tracking-tight font-mono">
            {timeStr}
          </p>
        </div>
      </div>
    </div>
  );
}

export default RunningWeeklySummary;
