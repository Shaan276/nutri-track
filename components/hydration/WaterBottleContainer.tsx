"use client";

import React from "react";
import { Droplets, Sparkles, CheckCircle2, Flame } from "lucide-react";

interface WaterBottleContainerProps {
  totalMl: number;
  targetMl: number;
  percentage: number;
  remainingMl: number;
  isGoalReached: boolean;
  streakDays: number;
}

export function WaterBottleContainer({
  totalMl,
  targetMl,
  percentage,
  remainingMl,
  isGoalReached,
  streakDays,
}: WaterBottleContainerProps) {
  const isOver = totalMl > targetMl;
  const overAmount = totalMl - targetMl;

  // Fill height visually clamped between 3% (empty base) and 100% (full container)
  const fillPercentage = totalMl <= 0 ? 0 : Math.min(Math.max((totalMl / targetMl) * 100, 3), 100);

  // Generate 4 dynamic graduation marks based on target
  const ticks = [
    { label: `${Math.round(targetMl * 0.25)}ml`, pos: 25 },
    { label: `${Math.round(targetMl * 0.5)}ml`, pos: 50 },
    { label: `${Math.round(targetMl * 0.75)}ml`, pos: 75 },
    { label: `${targetMl}ml`, pos: 100 },
  ];

  return (
    <div className="w-full bg-background-surface border border-border-default rounded-3xl p-6 sm:p-7 shadow-surface-card flex flex-col md:flex-row items-center justify-between gap-8 text-left">
      {/* Left: Key Metrics & Info */}
      <div className="flex-1 space-y-4">
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-400 text-xs font-bold uppercase tracking-wider">
            <Droplets className="h-3.5 w-3.5 fill-blue-400" />
            <span>Live Container Level</span>
          </div>

          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-extrabold">
            <Flame className="h-3.5 w-3.5 fill-amber-400" />
            <span>{streakDays} {streakDays === 1 ? "Day" : "Days"} Streak</span>
          </div>
        </div>

        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl sm:text-5xl font-black text-foreground-primary tracking-tight font-mono">
              {totalMl.toLocaleString()}
            </span>
            <span className="text-lg font-bold text-foreground-muted">
              / {targetMl.toLocaleString()} ml
            </span>
          </div>

          <p className="text-sm font-semibold text-foreground-secondary mt-1">
            {isOver ? (
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4" /> Goal surpassed by +{overAmount.toLocaleString()} ml ({percentage}%)!
              </span>
            ) : isGoalReached ? (
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4" /> Daily target 100% achieved!
              </span>
            ) : (
              <span>
                <strong className="text-blue-400 font-bold">{remainingMl.toLocaleString()} ml</strong> remaining to reach your goal today.
              </span>
            )}
          </p>
        </div>

        {/* Progress Bar & Quick Stats */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="p-3.5 rounded-2xl bg-background-elevated/70 border border-border-subtle">
            <span className="text-[11px] font-bold uppercase tracking-wider text-foreground-muted">
              Target Progress
            </span>
            <p className="text-2xl font-black text-blue-400 font-mono mt-0.5">
              {percentage}%
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-background-elevated/70 border border-border-subtle">
            <span className="text-[11px] font-bold uppercase tracking-wider text-foreground-muted">
              Hydration State
            </span>
            <p className="text-sm font-bold text-foreground-primary mt-1.5 flex items-center gap-1">
              {isGoalReached ? (
                <span className="text-emerald-400 font-extrabold flex items-center gap-1">
                  <Sparkles className="h-3.5 w-3.5" /> Optimal
                </span>
              ) : percentage >= 50 ? (
                <span className="text-cyan-400 font-bold">Good Pace</span>
              ) : (
                <span className="text-amber-400 font-bold">Needs Fluid</span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Right: Realistic Water Bottle / Glass Container */}
      <div className="relative flex flex-col items-center justify-center p-4">
        {/* Bottle Cap / Spout */}
        <div className="w-14 h-4 bg-gradient-to-r from-blue-600 via-blue-400 to-blue-600 rounded-t-md border-t border-x border-blue-300/40 shadow-sm" />
        <div className="w-18 h-3 bg-gradient-to-r from-slate-700 via-slate-600 to-slate-700 rounded-sm border-x border-border-subtle shadow-md -mt-0.5" />

        {/* Main Bottle Body Container */}
        <div className="relative w-36 sm:w-44 h-64 bg-slate-900/90 rounded-b-3xl border-2 border-blue-400/40 shadow-[0_0_25px_rgba(59,130,246,0.15)] overflow-hidden flex flex-col justify-end">
          {/* Glass Reflection Highlight */}
          <div className="absolute top-2 left-3 w-2.5 h-[85%] bg-gradient-to-b from-white/25 via-white/10 to-transparent rounded-full pointer-events-none z-20" />
          <div className="absolute top-3 right-3 w-1 h-[70%] bg-gradient-to-b from-white/15 to-transparent rounded-full pointer-events-none z-20" />

          {/* Measurement Tick Marks on the Right Side */}
          <div className="absolute inset-y-4 right-2 flex flex-col justify-between items-end pointer-events-none z-20 text-[9px] font-mono font-bold text-foreground-muted select-none">
            {ticks.reverse().map((t, idx) => (
              <div key={idx} className="flex items-center gap-1">
                <span className="opacity-70">{t.label}</span>
                <span className="w-2.5 h-[1px] bg-white/40" />
              </div>
            ))}
          </div>

          {/* Animated Water Liquid */}
          <div
            className="w-full bg-gradient-to-t from-blue-600 via-blue-500 to-cyan-400 transition-all duration-1000 ease-out relative z-10"
            style={{ height: `${fillPercentage}%` }}
          >
            {/* Water Surface Wave / Glow Line */}
            {fillPercentage > 0 && (
              <div className="absolute -top-1.5 left-0 right-0 h-3 bg-cyan-200/60 rounded-full blur-[1px] shadow-[0_0_10px_#38bdf8]" />
            )}

            {/* Bubble Accents */}
            {fillPercentage > 15 && (
              <>
                <div className="absolute bottom-4 left-6 w-2 h-2 rounded-full bg-white/40 animate-pulse" />
                <div className="absolute bottom-10 right-8 w-1.5 h-1.5 rounded-full bg-white/30 animate-pulse" />
                <div className="absolute bottom-16 left-12 w-2.5 h-2.5 rounded-full bg-white/20 animate-pulse" />
              </>
            )}
          </div>
        </div>

        {/* Base Stand */}
        <div className="w-40 h-2 bg-slate-800 rounded-full mt-1 border-b border-border-subtle shadow-md" />
      </div>
    </div>
  );
}

export default WaterBottleContainer;
