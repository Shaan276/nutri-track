"use client";

import React from "react";
import { Droplets, Flame, Target, Settings2, CheckCircle2, Sparkles } from "lucide-react";

interface HydrationOverviewCardProps {
  totalMl: number;
  targetMl: number;
  percentage: number;
  remainingMl: number;
  isGoalReached: boolean;
  streakDays: number;
  onEditGoal: () => void;
}

export function HydrationOverviewCard({
  totalMl,
  targetMl,
  percentage,
  remainingMl,
  isGoalReached,
  streakDays,
  onEditGoal,
}: HydrationOverviewCardProps) {
  const isOverTarget = totalMl > targetMl;
  const overAmount = totalMl - targetMl;

  return (
    <div className="w-full bg-background-surface border border-border-default rounded-3xl p-6 sm:p-7 shadow-surface-card space-y-6 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border-subtle pb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Droplets className="h-3.5 w-3.5" />
            Hydration Target
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-foreground-primary tracking-tight">
            Daily Fluid Balance
          </h2>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Streak Badge */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-extrabold">
            <Flame className="h-4 w-4 fill-amber-400" />
            <span>{streakDays} {streakDays === 1 ? "Day" : "Days"} Streak</span>
          </div>

          {/* Edit Goal Button */}
          <button
            onClick={onEditGoal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-background-elevated hover:bg-background-elevated/80 text-foreground-secondary hover:text-foreground-primary border border-border-subtle text-xs font-bold transition-colors cursor-pointer"
          >
            <Settings2 className="h-3.5 w-3.5" />
            <span>Edit Goal</span>
          </button>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Consumed vs Target */}
        <div className="p-5 rounded-2xl bg-background-elevated/70 border border-border-subtle flex flex-col justify-between space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
            <Droplets className="h-4 w-4" />
            Intake Volume
          </span>

          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-extrabold text-foreground-primary tracking-tight font-mono">
                {totalMl.toLocaleString()}
              </span>
              <span className="text-sm font-semibold text-foreground-muted">
                / {targetMl.toLocaleString()} ml
              </span>
            </div>

            <div className="w-full h-2.5 bg-background-surface rounded-full overflow-hidden mt-3">
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-300 shadow-sm"
                style={{ width: `${Math.min(percentage, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Completion Percentage */}
        <div className="p-5 rounded-2xl bg-background-elevated/70 border border-border-subtle flex flex-col justify-between space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-foreground-muted flex items-center gap-1.5">
            <Target className="h-4 w-4 text-brand-400" />
            Target Completion
          </span>

          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-extrabold text-foreground-primary tracking-tight font-mono">
                {percentage}%
              </span>
              <span className="text-xs font-semibold text-foreground-muted">of daily goal</span>
            </div>

            <p className="text-xs font-bold mt-2">
              {isGoalReached ? (
                <span className="inline-flex items-center gap-1 text-emerald-400">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Goal Reached!
                </span>
              ) : (
                <span className="text-blue-400">
                  On track to goal
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Remaining Volume */}
        <div className="p-5 rounded-2xl bg-background-elevated/70 border border-border-subtle flex flex-col justify-between space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-foreground-muted flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-cyan-400" />
            Remaining Balance
          </span>

          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-extrabold text-foreground-primary tracking-tight font-mono">
                {isOverTarget ? `+${overAmount.toLocaleString()}` : remainingMl.toLocaleString()}
              </span>
              <span className="text-sm font-semibold text-foreground-muted">ml</span>
            </div>

            <p className="text-xs font-semibold text-foreground-muted mt-2">
              {isOverTarget ? (
                <span className="text-emerald-400 font-bold">Exceeded goal by {overAmount} ml</span>
              ) : remainingMl === 0 ? (
                <span className="text-emerald-400 font-bold">Goal 100% achieved</span>
              ) : (
                <span>{remainingMl} ml left to drink</span>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HydrationOverviewCard;
