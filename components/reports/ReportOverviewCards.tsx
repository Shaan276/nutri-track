"use client";

import React from "react";
import { Utensils, Droplets, Flame, Dumbbell, TrendingUp, TrendingDown, Minus } from "lucide-react";
import {
  NutritionOverviewMetrics,
  HydrationOverviewMetrics,
  ActivityOverviewMetrics,
  WorkoutOverviewMetrics,
  WeeklyComparisonMetric,
} from "@/lib/validations/report";

interface ReportOverviewCardsProps {
  nutrition: NutritionOverviewMetrics;
  hydration: HydrationOverviewMetrics;
  activities: ActivityOverviewMetrics;
  workouts: WorkoutOverviewMetrics;
  comparisons?: WeeklyComparisonMetric[];
}

export function ReportOverviewCards({
  nutrition,
  hydration,
  activities,
  workouts,
  comparisons = [],
}: ReportOverviewCardsProps) {
  const daysNoun = (count: number) => (count === 1 ? "day" : "days");
  const runsNoun = (count: number) => (count === 1 ? "run" : "runs");
  const sessionsNoun = (count: number) => (count === 1 ? "session" : "sessions");

  const getComparison = (key: string) => comparisons.find((c) => c.key === key);

  const renderTrendBadge = (comp?: WeeklyComparisonMetric) => {
    if (!comp) return null;

    if (comp.direction === "NEW" || comp.percentChange === null) {
      return (
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 border border-slate-700">
          New Period
        </span>
      );
    }

    if (comp.direction === "INCREASE") {
      return (
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
          <TrendingUp className="w-3 h-3" />
          +{comp.percentChange}%
        </span>
      );
    }

    if (comp.direction === "DECREASE") {
      return (
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-400 border border-rose-500/30 flex items-center gap-1">
          <TrendingDown className="w-3 h-3" />
          -{comp.percentChange}%
        </span>
      );
    }

    return (
      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1">
        <Minus className="w-3 h-3" />
        0%
      </span>
    );
  };

  const calComp = getComparison("calories");
  const hydComp = getComparison("hydration");
  const runComp = getComparison("running_distance");
  const workComp = getComparison("workout_volume") || getComparison("workout_frequency");

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 text-left">
      {/* 1. Nutrition Summary */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between space-y-4">
        <div>
          {/* Card Top */}
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 flex-shrink-0">
                <Utensils className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white tracking-tight">Nutrition</h4>
                <span className="text-[11px] text-slate-400">Daily Average</span>
              </div>
            </div>
            {renderTrendBadge(calComp)}
          </div>

          {/* Value Display */}
          <div className="space-y-0.5">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-white tracking-tight">
                {nutrition.avgCalories.toLocaleString()}
              </span>
              <span className="text-xs font-semibold text-slate-400">kcal / day</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Target: {nutrition.targetCalories.toLocaleString()} kcal ({nutrition.loggedDaysCount} {daysNoun(nutrition.loggedDaysCount)} logged)
            </p>
          </div>
        </div>

        {/* Bottom Metrics: Macros & Fiber */}
        <div className="pt-3 border-t border-slate-800 grid grid-cols-4 gap-1.5 text-center text-xs">
          <div className="bg-slate-950/70 p-2 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 block font-medium">Protein</span>
            <strong className="text-blue-400 font-extrabold text-xs">{nutrition.avgProteinG}g</strong>
          </div>
          <div className="bg-slate-950/70 p-2 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 block font-medium">Carbs</span>
            <strong className="text-emerald-400 font-extrabold text-xs">{nutrition.avgCarbsG}g</strong>
          </div>
          <div className="bg-slate-950/70 p-2 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 block font-medium">Fats</span>
            <strong className="text-amber-400 font-extrabold text-xs">{nutrition.avgFatG}g</strong>
          </div>
          <div className="bg-slate-950/70 p-2 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 block font-medium">Fiber</span>
            <strong className="text-purple-400 font-extrabold text-xs">{nutrition.avgFiberG}g</strong>
          </div>
        </div>
      </div>

      {/* 2. Hydration Summary */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between space-y-4">
        <div>
          {/* Card Top */}
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 flex-shrink-0">
                <Droplets className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white tracking-tight">Hydration</h4>
                <span className="text-[11px] text-slate-400">Daily Average</span>
              </div>
            </div>
            {renderTrendBadge(hydComp)}
          </div>

          {/* Value Display */}
          <div className="space-y-0.5">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-white tracking-tight">
                {hydration.avgIntakeMl.toLocaleString()}
              </span>
              <span className="text-xs font-semibold text-slate-400">ml / day</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Target: {hydration.dailyTargetMl.toLocaleString()} ml ({hydration.goalAchievementPct}% achieved)
            </p>
          </div>
        </div>

        {/* Bottom Metrics: Goal Completion & Streak */}
        <div className="pt-3 border-t border-slate-800 grid grid-cols-2 gap-2 text-center text-xs">
          <div className="bg-slate-950/70 p-2 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 block font-medium">Goal Met</span>
            <strong className="text-cyan-400 font-extrabold text-xs">{hydration.goalAchievementPct}%</strong>
          </div>
          <div className="bg-slate-950/70 p-2 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 block font-medium">Streak</span>
            <strong className="text-emerald-400 font-extrabold text-xs">
              🔥 {hydration.currentStreakDays} {daysNoun(hydration.currentStreakDays)}
            </strong>
          </div>
        </div>
      </div>

      {/* 3. Activity Summary */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between space-y-4">
        <div>
          {/* Card Top */}
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 flex-shrink-0">
                <Flame className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white tracking-tight">Activity</h4>
                <span className="text-[11px] text-slate-400">Distance &amp; Steps</span>
              </div>
            </div>
            {renderTrendBadge(runComp)}
          </div>

          {/* Value Display */}
          <div className="space-y-0.5">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-white tracking-tight">
                {activities.totalDistanceKm}
              </span>
              <span className="text-xs font-semibold text-slate-400">km total</span>
            </div>
            <p className="text-[11px] text-slate-400">
              {activities.totalSteps.toLocaleString()} steps • {activities.totalCaloriesBurned.toLocaleString()} kcal burned
            </p>
          </div>
        </div>

        {/* Bottom Metrics: Sessions & Duration */}
        <div className="pt-3 border-t border-slate-800 grid grid-cols-2 gap-2 text-center text-xs">
          <div className="bg-slate-950/70 p-2 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 block font-medium">Active Time</span>
            <strong className="text-emerald-400 font-extrabold text-xs">{activities.totalDurationMinutes} min</strong>
          </div>
          <div className="bg-slate-950/70 p-2 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 block font-medium">Runs / Acts</span>
            <strong className="text-white font-extrabold text-xs">
              {activities.runningSessionsCount} / {activities.otherSessionsCount}
            </strong>
          </div>
        </div>
      </div>

      {/* 4. Workout Summary */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between space-y-4">
        <div>
          {/* Card Top */}
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 flex-shrink-0">
                <Dumbbell className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white tracking-tight">Workouts</h4>
                <span className="text-[11px] text-slate-400">Strength &amp; Training</span>
              </div>
            </div>
            {renderTrendBadge(workComp)}
          </div>

          {/* Value Display */}
          <div className="space-y-0.5">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-white tracking-tight">
                {workouts.totalSessions}
              </span>
              <span className="text-xs font-semibold text-slate-400">{sessionsNoun(workouts.totalSessions)}</span>
            </div>
            <p className="text-[11px] text-slate-400">
              {workouts.gymSessionsCount} Gym • {workouts.homeSessionsCount} Home sessions
            </p>
          </div>
        </div>

        {/* Bottom Metrics: Sets & Volume */}
        <div className="pt-3 border-t border-slate-800 grid grid-cols-2 gap-2 text-center text-xs">
          <div className="bg-slate-950/70 p-2 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 block font-medium">Total Sets</span>
            <strong className="text-amber-400 font-extrabold text-xs">{workouts.totalSets} sets</strong>
          </div>
          <div className="bg-slate-950/70 p-2 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 block font-medium">Volume</span>
            <strong className="text-white font-extrabold text-xs">
              {workouts.totalVolumeKg > 0 ? `${workouts.totalVolumeKg.toLocaleString()} kg` : "—"}
            </strong>
          </div>
        </div>
      </div>
    </div>
  );
}
