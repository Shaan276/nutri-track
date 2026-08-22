"use client";

import React from "react";
import { Flame, Dna, Wheat, Droplet, Target } from "lucide-react";
import { MacroTotals, DailyTargets, ProgressPercentages } from "@/lib/services/nutrition.service";

interface DailyNutritionSummaryProps {
  totals: MacroTotals;
  targets: DailyTargets;
  progress: ProgressPercentages;
}

export function DailyNutritionSummary({
  totals,
  targets,
  progress,
}: DailyNutritionSummaryProps) {
  const caloriesRemaining = Math.max(0, targets.calories - totals.calories);
  const isCaloriesOver = totals.calories > targets.calories;

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
            {totals.calories === 0 ? (
              <span className="text-foreground-muted">0 / {targets.calories} kcal &bull; Not logged yet</span>
            ) : isCaloriesOver ? (
              <span className="text-rose-400">+{totals.calories - targets.calories} kcal over target</span>
            ) : (
              <span className="text-brand-400">{caloriesRemaining} kcal remaining</span>
            )}
          </p>
        </div>
      </div>

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
              {progress.caloriesPercent}%
            </span>
          </div>

          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-extrabold text-foreground-primary tracking-tight">
                {totals.calories}
              </span>
              <span className="text-xs font-semibold text-foreground-muted">/ {targets.calories} kcal</span>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2 bg-background-surface rounded-full overflow-hidden mt-2">
              <div
                className="h-full bg-brand-500 rounded-full transition-all duration-300 shadow-brand-glow"
                style={{ width: `${Math.min(progress.caloriesPercent, 100)}%` }}
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
              {progress.proteinPercent}%
            </span>
          </div>

          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-extrabold text-foreground-primary tracking-tight">
                {totals.protein}
              </span>
              <span className="text-xs font-semibold text-foreground-muted">/ {targets.protein} g</span>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2 bg-background-surface rounded-full overflow-hidden mt-2">
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(progress.proteinPercent, 100)}%` }}
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
              {progress.carbsPercent}%
            </span>
          </div>

          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-extrabold text-foreground-primary tracking-tight">
                {totals.carbs}
              </span>
              <span className="text-xs font-semibold text-foreground-muted">/ {targets.carbs} g</span>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2 bg-background-surface rounded-full overflow-hidden mt-2">
              <div
                className="h-full bg-amber-500 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(progress.carbsPercent, 100)}%` }}
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
              {progress.fatPercent}%
            </span>
          </div>

          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-extrabold text-foreground-primary tracking-tight">
                {totals.fat}
              </span>
              <span className="text-xs font-semibold text-foreground-muted">/ {targets.fat} g</span>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2 bg-background-surface rounded-full overflow-hidden mt-2">
              <div
                className="h-full bg-rose-500 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(progress.fatPercent, 100)}%` }}
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
            {totals.fiber} / {targets.fiber} g
          </strong>
        </div>

        <div className="flex items-center gap-2">
          <span>Added Sugar:</span>
          <strong className="text-foreground-secondary font-bold">
            {totals.sugar} / {targets.sugar} g
          </strong>
        </div>
      </div>
    </div>
  );
}

export default DailyNutritionSummary;
