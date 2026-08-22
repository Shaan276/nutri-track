"use client";

import React from "react";
import { Activity, Gauge, MapPin, TrendingUp, Mountain, Sparkles } from "lucide-react";
import { formatPace, formatDuration, runningTypeBadges, runningTypeDisplayNames, RunningType } from "@/lib/validations/activity";

interface RunningAnalysisCardProps {
  runs: any[];
  totalDistanceKm: number;
  totalDurationSeconds: number;
  averagePaceSecondsPerKm: number;
  totalElevationGainMeters: number;
}

export function RunningAnalysisCard({
  runs = [],
  totalDistanceKm,
  totalDurationSeconds,
  averagePaceSecondsPerKm,
  totalElevationGainMeters,
}: RunningAnalysisCardProps) {
  if (runs.length === 0) return null;

  // Calculate longest run
  const longestRunDist = runs.reduce((max, r) => Math.max(max, Number(r.distanceKm || 0)), 0);

  // Group run types
  const runTypeCounts: Partial<Record<RunningType, number>> = {};
  for (const r of runs) {
    if (r.runningType) {
      const type = r.runningType as RunningType;
      runTypeCounts[type] = (runTypeCounts[type] || 0) + 1;
    }
  }

  const avgPaceStr = formatPace(averagePaceSecondsPerKm);

  return (
    <div className="w-full bg-background-surface border border-emerald-500/30 rounded-3xl p-5 sm:p-6 shadow-surface-card space-y-4 text-left animate-fade-in">
      <div className="flex items-center justify-between border-b border-border-subtle pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <Activity className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-foreground-primary tracking-tight">
              Running Telemetry Analysis
            </h3>
            <p className="text-xs text-foreground-muted font-medium">
              Aerobic performance, endurance metrics, and pacing
            </p>
          </div>
        </div>

        <span className="px-2.5 py-1 rounded-xl bg-emerald-500/15 text-emerald-300 font-mono font-extrabold text-xs border border-emerald-500/30">
          {runs.length} {runs.length === 1 ? "run" : "runs"} logged
        </span>
      </div>

      {/* Metric Highlights Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-2xl bg-background-elevated/70 border border-border-subtle space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-foreground-secondary font-bold">
            <Gauge className="h-3.5 w-3.5 text-amber-400" />
            <span>Average Pace</span>
          </div>
          <p className="text-lg font-black text-amber-400 font-mono">{avgPaceStr}</p>
        </div>

        <div className="p-3 rounded-2xl bg-background-elevated/70 border border-border-subtle space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-foreground-secondary font-bold">
            <MapPin className="h-3.5 w-3.5 text-emerald-400" />
            <span>Total Distance</span>
          </div>
          <p className="text-lg font-black text-foreground-primary font-mono">{totalDistanceKm.toFixed(2)} km</p>
        </div>

        <div className="p-3 rounded-2xl bg-background-elevated/70 border border-border-subtle space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-foreground-secondary font-bold">
            <TrendingUp className="h-3.5 w-3.5 text-blue-400" />
            <span>Longest Run</span>
          </div>
          <p className="text-lg font-black text-blue-400 font-mono">{longestRunDist.toFixed(2)} km</p>
        </div>

        <div className="p-3 rounded-2xl bg-background-elevated/70 border border-border-subtle space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-foreground-secondary font-bold">
            <Mountain className="h-3.5 w-3.5 text-purple-400" />
            <span>Elevation Gain</span>
          </div>
          <p className="text-lg font-black text-purple-400 font-mono">{totalElevationGainMeters} m</p>
        </div>
      </div>

      {/* Running Types Distribution Chips */}
      {Object.keys(runTypeCounts).length > 0 && (
        <div className="pt-2 border-t border-border-subtle flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-foreground-muted uppercase tracking-wider">
            Run Subtypes:
          </span>
          {(Object.entries(runTypeCounts) as [RunningType, number][]).map(([type, count]) => {
            const badge = runningTypeBadges[type];
            return (
              <span
                key={type}
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${badge.color}`}
              >
                <span>{runningTypeDisplayNames[type]}</span>
                <span className="font-mono font-extrabold">({count})</span>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default RunningAnalysisCard;
