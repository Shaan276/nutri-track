"use client";

import React, { useState } from "react";
import Link from "next/link";
import { SmartInsight } from "@/lib/services/insights/insight-types";
import { Sparkles, ChevronDown, ChevronUp, ArrowRight, AlertTriangle } from "lucide-react";

interface MicronutrientGroupCardProps {
  insight: SmartInsight;
}

export function MicronutrientGroupCard({ insight }: MicronutrientGroupCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const items = insight.groupedItems || [];

  return (
    <div className="p-5 rounded-2xl bg-background-surface border border-amber-500/30 hover:border-amber-500/50 transition-all text-left space-y-4 shadow-sm">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-lg">🔬</span>
          <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-[11px] font-bold text-amber-300 uppercase tracking-wider">
            Grouped Micronutrients
          </span>
          <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-mono font-bold uppercase tracking-wider">
            HIGH PRIORITY
          </span>
        </div>

        <span className="text-xs font-mono font-bold text-amber-300 px-2 py-0.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
          {items.length} Nutrients
        </span>
      </div>

      <div>
        <h4 className="text-base font-bold text-foreground-primary tracking-tight">
          {insight.title}
        </h4>
        <p className="text-xs font-medium text-foreground-secondary mt-1 leading-relaxed">
          {insight.summary}
        </p>
      </div>

      {/* Expandable Grouped Nutrients Grid */}
      <div className="pt-2 border-t border-border-subtle/50">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between p-2.5 rounded-xl bg-background-elevated hover:bg-background-elevated/80 border border-border-subtle text-xs font-bold text-foreground-primary transition-colors cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-400" />
            <span>
              {isExpanded ? "Collapse Nutrient List" : `Expand ${items.length} Nutrient Gaps`}
            </span>
          </span>
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>

        {isExpanded && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-3 animate-fade-in">
            {items.map((item) => {
              const pct = Math.min(100, Math.round(item.percentage));
              return (
                <div
                  key={item.key}
                  className="p-3.5 rounded-xl bg-background-elevated border border-border-subtle space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground-primary truncate pr-1">
                      {item.name}
                    </span>
                    <span className="text-[11px] font-mono font-bold text-amber-400">
                      {pct}%
                    </span>
                  </div>

                  <div className="w-full h-1.5 bg-background-surface rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-400 rounded-full transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[10px] font-mono text-foreground-muted">
                    <span>Avg: {item.current} {item.unit}</span>
                    <span>Goal: {item.target} {item.unit}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Suggested Action & CTA */}
      <div className="flex items-center justify-between pt-2 border-t border-border-subtle/40">
        <p className="text-xs text-foreground-secondary truncate pr-3">
          💡 {insight.suggestedAction}
        </p>

        <Link
          href="/deep-nutrition"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-400 hover:text-brand-300 transition-colors cursor-pointer shrink-0"
        >
          <span>Open Deep Nutrition</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
