"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Zap,
  Sparkles,
  Flame,
  Droplets,
  Activity,
  Dumbbell,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  Calendar,
  RefreshCw,
  Bot,
  ShieldAlert,
  Loader2,
  Award,
  ChevronRight,
  Target,
} from "lucide-react";
import { DynamicNutritionTargetResult } from "@/lib/services/dynamic-nutrition.service";

interface YesterdaysDataClientProps {
  initialData: DynamicNutritionTargetResult;
}

export function YesterdaysDataClient({ initialData }: YesterdaysDataClientProps) {
  const [data, setData] = useState<DynamicNutritionTargetResult>(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const fetchDynamicData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/nutrition/dynamic");
      if (res.ok) {
        const fresh = await res.json();
        setData(fresh);
      }
    } catch (err) {
      console.error("Failed to refresh dynamic nutrition data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleDynamic = async () => {
    if (isToggling) return;
    setIsToggling(true);
    const nextState = !data.isDynamicEnabled;

    try {
      const res = await fetch("/api/nutrition/dynamic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: nextState }),
      });

      if (res.ok) {
        const resData = await res.json();
        setData(resData.data);
        setStatusMessage(
          nextState
            ? "Dynamic Nutrition enabled! Today's targets are now auto-optimized from yesterday's activity."
            : "Dynamic Nutrition disabled. Today's targets are fixed at your profile baseline."
        );
        setTimeout(() => setStatusMessage(null), 5000);
      }
    } catch (err) {
      console.error("Failed to toggle dynamic nutrition:", err);
    } finally {
      setIsToggling(false);
    }
  };

  const y = data.yesterdaysSummary;

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-12">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-6 rounded-3xl bg-background-surface border border-border-default shadow-lg">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-brand-400 uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" />
            AI Intelligence & Yesterday's Performance
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground-primary tracking-tight">
            Yesterday's Data & Dynamic Nutrition
          </h1>
          <p className="text-xs sm:text-sm text-foreground-secondary mt-1 max-w-2xl leading-relaxed">
            Every morning, Nutri-Track reviews yesterday's actual nutrition, workouts, and running volume to dynamically adapt today's protein, carbs, and hydration for maximum recovery and metabolic momentum.
          </p>
        </div>

        {/* Master Dynamic Toggle */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={fetchDynamicData}
            disabled={isLoading}
            className="p-3 rounded-2xl bg-background-elevated hover:bg-neutral-800 border border-border-subtle text-foreground-secondary hover:text-foreground-primary transition-all cursor-pointer"
            title="Refresh Yesterday's Data & Calculations"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-brand-400" : ""}`} />
          </button>

          <button
            type="button"
            onClick={handleToggleDynamic}
            disabled={isToggling}
            className={`flex items-center gap-3 px-5 py-3 rounded-2xl border font-bold text-xs transition-all shadow-md cursor-pointer ${
              data.isDynamicEnabled
                ? "bg-emerald-950/70 border-emerald-600/80 text-emerald-300 shadow-emerald-950/40 hover:bg-emerald-900/80"
                : "bg-background-elevated border-border-subtle text-foreground-muted hover:text-foreground-secondary"
            }`}
          >
            <Zap className={`w-4 h-4 ${data.isDynamicEnabled ? "text-emerald-400 fill-emerald-400" : "text-neutral-500"}`} />
            <span>Dynamic Nutrition:</span>
            <span
              className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold uppercase ${
                data.isDynamicEnabled ? "bg-emerald-500/20 text-emerald-300" : "bg-neutral-800 text-neutral-400"
              }`}
            >
              {isToggling ? "..." : data.isDynamicEnabled ? "ENABLED" : "DISABLED"}
            </span>
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-800 text-xs text-emerald-300 flex items-center gap-2 shadow-md animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* AI Dynamic Optimization Hero Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-neutral-900 via-neutral-900/95 to-neutral-950 border border-emerald-800/40 p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider">
              <Zap className="w-3.5 h-3.5 fill-emerald-400" />
              {data.isDynamicEnabled ? "Today's Dynamic Targets (Auto-Optimized)" : "Today's Targets (Static Baseline)"}
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white">
              Personalized Fueling Blueprint for Today
            </h2>
            <p className="text-xs sm:text-sm text-neutral-400">
              Primary Goal: <strong className="text-white">{data.primaryGoal}</strong> • Baseline Reference: <span className="text-neutral-300">{data.baseline.calories} kcal / {data.baseline.protein}g Protein</span>
            </p>
          </div>

          <Link
            href="/ai-coach"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-400 text-black font-extrabold text-xs transition-all shadow-md cursor-pointer shrink-0"
          >
            <Bot className="w-4 h-4" />
            <span>Consult AI Coach on Today's Plan</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Target Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          {/* Calories */}
          <div className="p-4 rounded-2xl bg-neutral-950/70 border border-neutral-800 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold text-neutral-400 uppercase">
              <span>Calories</span>
              <Flame className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-white">
              {data.optimized.calories}{" "}
              <span className="text-xs font-normal text-neutral-400">kcal</span>
            </div>
            <div className="text-[11px] text-neutral-400 flex items-center gap-1">
              <span>Baseline: {data.baseline.calories}</span>
              {data.optimized.calories !== data.baseline.calories && (
                <span className={`font-bold ${data.optimized.calories > data.baseline.calories ? "text-emerald-400" : "text-amber-400"}`}>
                  ({data.optimized.calories > data.baseline.calories ? "+" : ""}{data.optimized.calories - data.baseline.calories})
                </span>
              )}
            </div>
          </div>

          {/* Protein */}
          <div className="p-4 rounded-2xl bg-neutral-950/70 border border-neutral-800 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold text-neutral-400 uppercase">
              <span>Protein</span>
              <Award className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-emerald-400">
              {data.optimized.protein}{" "}
              <span className="text-xs font-normal text-neutral-400">g</span>
            </div>
            <div className="text-[11px] text-neutral-400 flex items-center gap-1">
              <span>Baseline: {data.baseline.protein}g</span>
              {data.optimized.protein !== data.baseline.protein && (
                <span className="font-bold text-emerald-400">
                  (+{data.optimized.protein - data.baseline.protein}g)
                </span>
              )}
            </div>
          </div>

          {/* Carbs */}
          <div className="p-4 rounded-2xl bg-neutral-950/70 border border-neutral-800 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold text-neutral-400 uppercase">
              <span>Carbohydrates</span>
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-cyan-400">
              {data.optimized.carbohydrates}{" "}
              <span className="text-xs font-normal text-neutral-400">g</span>
            </div>
            <div className="text-[11px] text-neutral-400 flex items-center gap-1">
              <span>Baseline: {data.baseline.carbohydrates}g</span>
              {data.optimized.carbohydrates !== data.baseline.carbohydrates && (
                <span className="font-bold text-cyan-400">
                  (+{data.optimized.carbohydrates - data.baseline.carbohydrates}g)
                </span>
              )}
            </div>
          </div>

          {/* Fats */}
          <div className="p-4 rounded-2xl bg-neutral-950/70 border border-neutral-800 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold text-neutral-400 uppercase">
              <span>Fats</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-amber-300">
              {data.optimized.fat}{" "}
              <span className="text-xs font-normal text-neutral-400">g</span>
            </div>
            <div className="text-[11px] text-neutral-400">
              Baseline: {data.baseline.fat}g
            </div>
          </div>

          {/* Hydration */}
          <div className="p-4 rounded-2xl bg-neutral-950/70 border border-neutral-800 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold text-neutral-400 uppercase">
              <span>Hydration</span>
              <Droplets className="w-3.5 h-3.5 text-sky-400" />
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-sky-400">
              {data.optimized.hydrationMl}{" "}
              <span className="text-xs font-normal text-neutral-400">ml</span>
            </div>
            <div className="text-[11px] text-neutral-400 flex items-center gap-1">
              <span>Baseline: {data.baseline.hydrationMl}ml</span>
              {data.optimized.hydrationMl !== data.baseline.hydrationMl && (
                <span className="font-bold text-sky-400">
                  (+{data.optimized.hydrationMl - data.baseline.hydrationMl}ml)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Dynamic Adjustments List */}
        {data.adjustments.length > 0 ? (
          <div className="space-y-3 pt-2">
            <div className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              Why Today's Targets Were Adjusted (AI Physiological Rationale)
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {data.adjustments.map((adj, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-neutral-950/80 border border-neutral-800 text-xs text-neutral-300 flex items-start gap-2.5"
                >
                  <div className="p-1 rounded-md bg-emerald-500/20 text-emerald-400 font-extrabold text-[11px] shrink-0 mt-0.5">
                    +{adj.delta} {adj.unit}
                  </div>
                  <div className="leading-relaxed">{adj.reason}</div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-neutral-950/60 border border-neutral-800 text-xs text-neutral-400 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              {data.isDynamicEnabled
                ? "Yesterday's nutrition and expenditure were perfectly balanced with your baseline. No extra compensations required today!"
                : "Dynamic Nutrition is currently OFF. Targets are locked to your static profile baseline."}
            </span>
          </div>
        )}
      </div>

      {/* Yesterday's Complete Data Breakdown Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground-primary flex items-center gap-2">
            <Calendar className="w-4 h-4 text-brand-400" />
            Yesterday's Performance Logs ({y.date})
          </h2>
          <span className="text-xs text-foreground-muted">24-hour consolidated audit</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Nutrition */}
          <div className="p-5 rounded-2xl bg-background-surface border border-border-default space-y-4 shadow-sm hover:border-brand-500/40 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-foreground-secondary flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-amber-400" />
                Nutrition Intake
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                  y.nutrition.calorieDelta <= 0 ? "bg-emerald-500/20 text-emerald-300" : "bg-amber-500/20 text-amber-300"
                }`}
              >
                {y.nutrition.calorieDelta > 0 ? `+${y.nutrition.calorieDelta} kcal surplus` : `${Math.abs(y.nutrition.calorieDelta)} kcal deficit`}
              </span>
            </div>

            <div className="space-y-1">
              <div className="text-2xl font-extrabold text-foreground-primary">
                {y.nutrition.caloriesConsumed}{" "}
                <span className="text-xs font-normal text-foreground-muted">/ {y.nutrition.calorieTarget} kcal</span>
              </div>
              <div className="text-xs text-foreground-secondary">
                Protein: <strong className="text-emerald-400">{y.nutrition.proteinConsumed}g</strong> / {y.nutrition.proteinTarget}g
              </div>
            </div>

            <div className="pt-2 border-t border-border-subtle grid grid-cols-3 gap-2 text-center text-[11px]">
              <div>
                <span className="text-foreground-muted block text-[10px]">Carbs</span>
                <span className="font-bold text-foreground-primary">{y.nutrition.carbsConsumed}g</span>
              </div>
              <div>
                <span className="text-foreground-muted block text-[10px]">Fat</span>
                <span className="font-bold text-foreground-primary">{y.nutrition.fatConsumed}g</span>
              </div>
              <div>
                <span className="text-foreground-muted block text-[10px]">Fiber</span>
                <span className="font-bold text-foreground-primary">{y.nutrition.fiberConsumed}g</span>
              </div>
            </div>
          </div>

          {/* Card 2: Hydration */}
          <div className="p-5 rounded-2xl bg-background-surface border border-border-default space-y-4 shadow-sm hover:border-sky-500/40 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-foreground-secondary flex items-center gap-1.5">
                <Droplets className="w-4 h-4 text-sky-400" />
                Hydration Balance
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                  y.hydration.percentage >= 100 ? "bg-sky-500/20 text-sky-300" : "bg-neutral-800 text-neutral-400"
                }`}
              >
                {y.hydration.percentage}% Goal
              </span>
            </div>

            <div className="space-y-1">
              <div className="text-2xl font-extrabold text-foreground-primary">
                {y.hydration.consumedMl}{" "}
                <span className="text-xs font-normal text-foreground-muted">/ {y.hydration.targetMl} ml</span>
              </div>
              <div className="text-xs text-foreground-secondary">
                {y.hydration.deltaMl >= 0
                  ? `Goal achieved (+${y.hydration.deltaMl}ml surplus)`
                  : `${Math.abs(y.hydration.deltaMl)}ml deficit`}
              </div>
            </div>

            <div className="pt-2 border-t border-border-subtle text-[11px] text-foreground-muted">
              {y.hydration.percentage >= 100
                ? "Optimal cellular hydration achieved yesterday 💧✨"
                : "Mild hydration deficit carried into today."}
            </div>
          </div>

          {/* Card 3: Movement & Runs */}
          <div className="p-5 rounded-2xl bg-background-surface border border-border-default space-y-4 shadow-sm hover:border-emerald-500/40 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-foreground-secondary flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-emerald-400" />
                Cardio & Steps
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300">
                {y.movement.activeCaloriesBurned} kcal burned
              </span>
            </div>

            <div className="space-y-1">
              <div className="text-2xl font-extrabold text-foreground-primary">
                {y.movement.steps.toLocaleString()}{" "}
                <span className="text-xs font-normal text-foreground-muted">steps</span>
              </div>
              <div className="text-xs text-foreground-secondary">
                Running Distance: <strong className="text-emerald-400">{y.movement.distanceKm} km</strong> ({y.movement.runsCount} runs)
              </div>
            </div>

            <div className="pt-2 border-t border-border-subtle text-[11px] text-foreground-muted">
              Active energy expenditure fueled metabolic rate.
            </div>
          </div>

          {/* Card 4: Strength Workouts */}
          <div className="p-5 rounded-2xl bg-background-surface border border-border-default space-y-4 shadow-sm hover:border-amber-500/40 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-foreground-secondary flex items-center gap-1.5">
                <Dumbbell className="w-4 h-4 text-amber-400" />
                Strength & Lifting
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300">
                {y.workouts.sessionsCount} Sessions
              </span>
            </div>

            <div className="space-y-1">
              <div className="text-2xl font-extrabold text-foreground-primary">
                {y.workouts.totalVolumeKg.toLocaleString()}{" "}
                <span className="text-xs font-normal text-foreground-muted">kg volume</span>
              </div>
              <div className="text-xs text-foreground-secondary">
                Total Sets: <strong className="text-white">{y.workouts.totalSets}</strong> • Workout Burn: {y.movement.workoutCalories} kcal
              </div>
            </div>

            <div className="pt-2 border-t border-border-subtle text-[11px] text-foreground-muted">
              {y.workouts.totalVolumeKg > 0
                ? "Muscle protein breakdown stimulates recovery signaling."
                : "Rest day from resistance training."}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action Banner */}
      <div className="p-6 rounded-3xl bg-background-elevated border border-border-subtle flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-foreground-primary">
            Want the AI to adapt specific meals for today's dynamic target?
          </h3>
          <p className="text-xs text-foreground-secondary">
            Ask the AI Coach in chat: <em>"How should I split today's {data.optimized.protein}g protein across my meals?"</em>
          </p>
        </div>

        <Link
          href="/ai-coach"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-400 text-black font-extrabold text-xs transition-all shadow-md cursor-pointer shrink-0"
        >
          <Bot className="w-4 h-4" />
          <span>Open AI Coach</span>
        </Link>
      </div>
    </div>
  );
}
