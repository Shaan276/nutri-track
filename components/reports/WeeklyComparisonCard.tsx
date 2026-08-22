"use client";

import React from "react";
import { TrendingUp, TrendingDown, Minus, ArrowRightLeft, AlertCircle } from "lucide-react";
import { WeeklyComparisonMetric } from "@/lib/validations/report";

interface WeeklyComparisonCardProps {
  comparisons: WeeklyComparisonMetric[];
  periodLabel?: string;
}

export function WeeklyComparisonCard({
  comparisons,
  periodLabel = "vs Previous Period",
}: WeeklyComparisonCardProps) {
  if (comparisons.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center space-y-2 text-left">
        <h3 className="text-sm font-bold text-white tracking-tight">Period Comparison</h3>
        <p className="text-xs text-slate-400">No comparative data available for this timeframe.</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4 text-left">
      <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 flex-shrink-0">
            <ArrowRightLeft className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">Period Comparison</h3>
            <p className="text-xs text-slate-400">
              Comparing your metrics against the immediately preceding period
            </p>
          </div>
        </div>
        <span className="text-[11px] font-semibold text-slate-400">{periodLabel}</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 pt-1">
        {comparisons.map((item) => {
          const isIncrease = item.direction === "INCREASE";
          const isDecrease = item.direction === "DECREASE";
          const isNew = item.direction === "NEW" || item.percentChange === null;

          return (
            <div
              key={item.key}
              className="bg-slate-950/70 border border-slate-800/90 rounded-xl p-4 space-y-2"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-300">{item.label}</span>
                {isNew ? (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                    New Period
                  </span>
                ) : isIncrease ? (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    +{item.percentChange}%
                  </span>
                ) : isDecrease ? (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/30 flex items-center gap-1">
                    <TrendingDown className="w-3 h-3" />
                    -{item.percentChange}%
                  </span>
                ) : (
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1">
                    <Minus className="w-3 h-3" />
                    0%
                  </span>
                )}
              </div>

              <div className="flex items-baseline justify-between pt-1">
                <div>
                  <span className="text-lg font-black text-white font-mono">
                    {item.currentPeriodValue.toLocaleString()}
                  </span>
                  <span className="text-xs text-slate-400 ml-1">{item.unit}</span>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-slate-500 block">Prev:</span>
                  <span className="text-xs font-mono text-slate-400 font-medium">
                    {item.previousPeriodValue.toLocaleString()} {item.unit}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
