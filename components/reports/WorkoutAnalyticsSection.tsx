"use client";

import React from "react";
import { Dumbbell, Home, Building2, Layers, Repeat, Flame } from "lucide-react";
import {
  WorkoutOverviewMetrics,
  WorkoutTrendPoint,
  ExerciseDistributionItem,
} from "@/lib/validations/report";
import { BarProgressChart } from "@/components/charts/BarProgressChart";
import { AreaTrendChart } from "@/components/charts/AreaTrendChart";
import { ChartContainer } from "@/components/charts/ChartContainer";

interface WorkoutAnalyticsSectionProps {
  overview: WorkoutOverviewMetrics;
  trend: WorkoutTrendPoint[];
  exerciseDistribution: ExerciseDistributionItem[];
}

export function WorkoutAnalyticsSection({
  overview,
  trend,
  exerciseDistribution,
}: WorkoutAnalyticsSectionProps) {
  const sessionsNoun = (count: number) => (count === 1 ? "session" : "sessions");

  return (
    <div className="space-y-6 text-left">
      {/* Section Title */}
      <div className="flex items-center gap-2.5 pb-2 border-b border-slate-800">
        <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 flex-shrink-0">
          <Dumbbell className="w-4 h-4" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight">Workout Analytics</h2>
          <p className="text-xs text-slate-400">
            Training frequency, exercise distribution, set volume, and tonnage progression
          </p>
        </div>
      </div>

      {/* Top Cards: Split, Sets, Volume, Duration */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 flex-shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 block font-medium">Gym Workouts</span>
            <strong className="text-xl font-black text-white">
              {overview.gymSessionsCount} {sessionsNoun(overview.gymSessionsCount)}
            </strong>
            <span className="text-[10px] text-slate-500 block">
              {overview.homeSessionsCount} Home {sessionsNoun(overview.homeSessionsCount)}
            </span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 flex-shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 block font-medium">Sets Completed</span>
            <strong className="text-xl font-black text-white">{overview.totalSets} sets</strong>
            <span className="text-[10px] text-slate-500 block">{overview.totalReps.toLocaleString()} total reps</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 flex-shrink-0">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 block font-medium">Training Volume</span>
            <strong className="text-xl font-black text-purple-300">
              {overview.totalVolumeKg > 0 ? `${overview.totalVolumeKg.toLocaleString()} kg` : "—"}
            </strong>
            <span className="text-[10px] text-slate-500 block">Calculated tonnage</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 flex-shrink-0">
            <Repeat className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 block font-medium">Avg Duration</span>
            <strong className="text-xl font-black text-emerald-400">
              {overview.avgDurationMinutes} min
            </strong>
            <span className="text-[10px] text-slate-500 block">Per workout session</span>
          </div>
        </div>
      </div>

      {/* Row 1: Training Volume / Frequency Chart & Exercise Distribution Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ChartContainer
            title="Daily Workout Volume & Sets"
            subtitle="Training load in total sets and tonnage per day"
            badge="Training Load"
            badgeColor="amber"
            height={280}
            isEmpty={trend.every((t) => t.sessions === 0)}
            emptyMessage="No workout sessions logged for this range."
          >
            <AreaTrendChart
              data={trend}
              dataKey="volumeKg"
              labelKey="label"
              strokeColor="#F59E0B"
              fillColor="#F59E0B"
              gradientId="workoutVolGrad"
              unit=" kg"
            />
          </ChartContainer>
        </div>

        {/* Most Performed Exercises */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight border-b border-slate-800 pb-3">
              Exercise Frequency
            </h3>
            {exerciseDistribution.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                No exercise logs found.
              </div>
            ) : (
              <div className="space-y-3 pt-3 overflow-y-auto max-h-56 pr-1">
                {exerciseDistribution.slice(0, 6).map((ex, idx) => (
                  <div
                    key={ex.exerciseName + idx}
                    className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs"
                  >
                    <div className="min-w-0">
                      <strong className="text-white block truncate">{ex.exerciseName}</strong>
                      <span className="text-[10px] text-slate-400">{ex.category} • {ex.sessionsCount} sessions</span>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className="font-mono text-amber-400 font-bold block">{ex.totalSets} sets</span>
                      <span className="text-[10px] text-slate-500">{ex.totalReps} reps</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
