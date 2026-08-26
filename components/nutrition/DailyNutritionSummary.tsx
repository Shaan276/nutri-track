"use client";

import React from "react";
import Link from "next/link";
import { Flame, Dna, Wheat, Droplet, Target, Sparkles } from "lucide-react";
import { MacroTotals, DailyTargets, ProgressPercentages } from "@/lib/services/nutrition.service";

interface DailyNutritionSummaryProps {
  totals: MacroTotals;
  targets: DailyTargets & { isConfigured?: boolean };
  progress: ProgressPercentages;
  isConfigured?: boolean;
}

export function DailyNutritionSummary({
  totals,
  targets,
  progress,
  isConfigured,
}: DailyNutritionSummaryProps) {
  const safeTotals = totals || { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0 };
  const hasConfiguredTargets = isConfigured !== undefined ? isConfigured : Boolean(targets && targets.isConfigured !== false && targets.calories > 0);

  const safeTargets = targets || { calories: 2000, protein: 120, carbs: 250, fat: 65, fiber: 30, sugar: 50 };
  const safeProgress = progress || { caloriesPercent: 0, proteinPercent: 0, carbsPercent: 0, fatPercent: 0, fiberPercent: 0, sugarPercent: 0 };

  const caloriesRemaining = hasConfiguredTargets ? Math.max(0, safeTargets.calories - safeTotals.calories) : null;
  const isCaloriesOver = hasConfiguredTargets && safeTotals.calories > safeTargets.calories;

  return (
    <div className="w-full bg-background-surface border border-border-default rounded-3xl p-5 sm:p-6 shadow-surface-card space-y-5 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border-subtle pb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-brand-500/15 border border-brand-500/30 text-brand-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Target className="h-3.5 w-3.5" />
            Daily Nutrition Target
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-foreground-primary tracking-tight">
            Nutrition Overview
          </h2>
        </div>

        <div className="text-right">
          <p className="text-xs font-semibold text-foreground-muted uppercase">Calories Balance</p>
          <p className="text-sm font-bold text-foreground-primary">
            {!hasConfiguredTargets ? (
              <span className="text-foreground-muted">{safeTotals.calories} kcal logged &bull; Target not configured</span>
            ) : safeTotals.calories === 0 ? (
              <span className="text-foreground-muted">0 / {safeTargets.calories} kcal &bull; Not logged yet</span>
            ) : isCaloriesOver ? (
              <span className="text-rose-400">+{safeTotals.calories - safeTargets.calories} kcal over target</span>
            ) : (
              <span className="text-brand-400">{caloriesRemaining} kcal remaining</span>
            )}
          </p>
        </div>
      </div>

      {!hasConfiguredTargets && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-400 shrink-0" />
            <span>Personalized nutrition targets have not been configured yet.</span>
          </div>
          <Link
            href="/ai-coach"
            className="px-3 py-1 rounded-xl bg-amber-500 text-neutral-950 font-bold text-xs hover:bg-amber-400 transition-colors whitespace-nowrap"
          >
            Personalize in AI Coach →
          </Link>
        </div>
      )}

      {/* Main 4 Macro Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Calories Card */}
        <div className="bg-background-elevated/70 border border-border-subtle rounded-2xl p-4 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-brand-400">
              <Flame className="h-4 w-4" />
              <span>Calories</span>
            </div>
            <span className="text-xs font-bold font-mono text-brand-400">
              {hasConfiguredTargets ? `${safeProgress.caloriesPercent}%` : "--"}
            </span>
          </div>

          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-extrabold text-foreground-primary tracking-tight">
                {safeTotals.calories}
              </span>
              <span className="text-xs font-semibold text-foreground-muted">
                {hasConfiguredTargets ? `/ ${safeTargets.calories} kcal` : "kcal (unconfigured)"}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2 bg-background-surface rounded-full overflow-hidden mt-2">
              <div
                className="h-full bg-brand-500 rounded-full transition-all duration-300 shadow-brand-glow"
                style={{ width: `${hasConfiguredTargets ? Math.min(safeProgress.caloriesPercent, 100) : 0}%` }}
              />
            </div>
          </div>
        </div>

        {/* Protein Card */}
        <div className="bg-background-elevated/70 border border-border-subtle rounded-2xl p-4 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-blue-400">
              <Dna className="h-4 w-4" />
              <span>Protein</span>
            </div>
            <span className="text-xs font-bold font-mono text-blue-400">
              {hasConfiguredTargets ? `${safeProgress.proteinPercent}%` : "--"}
            </span>
          </div>

          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-extrabold text-foreground-primary tracking-tight">
                {safeTotals.protein}
              </span>
              <span className="text-xs font-semibold text-foreground-muted">
                {hasConfiguredTargets ? `/ ${safeTargets.protein} g` : "g (unconfigured)"}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2 bg-background-surface rounded-full overflow-hidden mt-2">
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-300"
                style={{ width: `${hasConfiguredTargets ? Math.min(safeProgress.proteinPercent, 100) : 0}%` }}
              />
            </div>
          </div>
        </div>

        {/* Carbohydrates Card */}
        <div className="bg-background-elevated/70 border border-border-subtle rounded-2xl p-4 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-400">
              <Wheat className="h-4 w-4" />
              <span>Carbs</span>
            </div>
            <span className="text-xs font-bold font-mono text-amber-400">
              {hasConfiguredTargets ? `${safeProgress.carbsPercent}%` : "--"}
            </span>
          </div>

          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-extrabold text-foreground-primary tracking-tight">
                {safeTotals.carbs}
              </span>
              <span className="text-xs font-semibold text-foreground-muted">
                {hasConfiguredTargets ? `/ ${safeTargets.carbs} g` : "g (unconfigured)"}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2 bg-background-surface rounded-full overflow-hidden mt-2">
              <div
                className="h-full bg-amber-500 rounded-full transition-all duration-300"
                style={{ width: `${hasConfiguredTargets ? Math.min(safeProgress.carbsPercent, 100) : 0}%` }}
              />
            </div>
          </div>
        </div>

        {/* Fat Card */}
        <div className="bg-background-elevated/70 border border-border-subtle rounded-2xl p-4 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-rose-400">
              <Droplet className="h-4 w-4" />
              <span>Fat</span>
            </div>
            <span className="text-xs font-bold font-mono text-rose-400">
              {hasConfiguredTargets ? `${safeProgress.fatPercent}%` : "--"}
            </span>
          </div>

          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-extrabold text-foreground-primary tracking-tight">
                {safeTotals.fat}
              </span>
              <span className="text-xs font-semibold text-foreground-muted">
                {hasConfiguredTargets ? `/ ${safeTargets.fat} g` : "g (unconfigured)"}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2 bg-background-surface rounded-full overflow-hidden mt-2">
              <div
                className="h-full bg-rose-500 rounded-full transition-all duration-300"
                style={{ width: `${hasConfiguredTargets ? Math.min(safeProgress.fatPercent, 100) : 0}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Nutrients: Fiber & Sugar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs font-semibold text-foreground-muted px-1">
        <div className="flex items-center gap-2">
          <span>Dietary Fiber:</span>
          <strong className="text-foreground-secondary font-bold">
            {safeTotals.fiber} {hasConfiguredTargets ? `/ ${safeTargets.fiber} g` : "g"}
          </strong>
        </div>

        <div className="flex items-center gap-2">
          <span>Added Sugar:</span>
          <strong className="text-foreground-secondary font-bold">
            {safeTotals.sugar} {hasConfiguredTargets ? `/ ${safeTargets.sugar} g` : "g"}
          </strong>
        </div>
      </div>
    </div>
  );
}

export default DailyNutritionSummary;
