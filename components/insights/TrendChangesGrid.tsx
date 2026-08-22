"use client";

import React from "react";
import { TrendChangeItem } from "@/lib/services/insights/insight-types";
import { ArrowUpRight, ArrowDownRight, Minus, TrendingUp } from "lucide-react";

interface TrendChangesGridProps {
  trends: TrendChangeItem[];
}

export function TrendChangesGrid({ trends }: TrendChangesGridProps) {
  if (!trends || trends.length === 0) return null;

  return (
    <div className="p-6 rounded-3xl bg-background-surface border border-border-default shadow-surface-card space-y-5 text-left">
      <div className="flex items-center justify-between gap-2">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <TrendingUp className="h-3.5 w-3.5" />
            Period-Over-Period Changes
          </div>
          <h3 className="text-xl font-black text-foreground-primary tracking-tight">
            Weekly Trends &amp; Behavioral Shifts
          </h3>
          <p className="text-xs text-foreground-secondary mt-0.5">
            Compared with previous equivalent timeframe (&plusmn;5% threshold for meaningful shifts).
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {trends.map((item) => {
          const isImproving = item.direction === "IMPROVING";
          const isDeclining = item.direction === "DECLINING";
          const isStable = item.direction === "STABLE";

          return (
            <div
              key={item.key}
              className="p-4 rounded-2xl bg-background-elevated border border-border-subtle flex flex-col justify-between space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground-primary">
                  {item.label}
                </span>

                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider ${
                    isImproving
                      ? "bg-brand-500/15 text-brand-400 border border-brand-500/30"
                      : isDeclining
                      ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                      : "bg-foreground-muted/15 text-foreground-secondary border border-border-subtle"
                  }`}
                >
                  {isImproving && <ArrowUpRight className="h-3 w-3" />}
                  {isDeclining && <ArrowDownRight className="h-3 w-3" />}
                  {isStable && <Minus className="h-3 w-3" />}
                  <span>{item.direction}</span>
                </span>
              </div>

              <div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl font-black font-mono text-foreground-primary">
                    {typeof item.currentValue === "number"
                      ? Math.round(item.currentValue).toLocaleString()
                      : item.currentValue}
                  </span>
                  <span className="text-xs text-foreground-muted font-mono">{item.unit}</span>
                </div>

                <p className="text-[11px] text-foreground-secondary font-medium mt-1">
                  {item.formattedText}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
