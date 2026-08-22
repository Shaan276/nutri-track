"use client";

import React, { useState } from "react";
import Link from "next/link";
import { SmartInsight } from "@/lib/services/insights/insight-types";
import { ArrowRight, ChevronDown, ChevronUp, AlertCircle, CheckCircle2, Info } from "lucide-react";

interface InsightCardProps {
  insight: SmartInsight;
}

export function InsightCard({ insight }: InsightCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const isPositive = insight.severity === "SUCCESS" || insight.priority === "POSITIVE";
  const isWarning = insight.severity === "WARNING" || insight.severity === "ALERT";

  return (
    <div
      className={`p-5 rounded-2xl border transition-all text-left space-y-3.5 shadow-sm ${
        isPositive
          ? "bg-background-surface border-border-default hover:border-brand-500/40"
          : isWarning
          ? "bg-background-surface border-border-default hover:border-amber-500/40"
          : "bg-background-surface border-border-default hover:border-blue-500/40"
      }`}
    >
      {/* Header: Category, Priority, and Metric */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-lg">{insight.icon || "💡"}</span>
          <span className="px-2.5 py-0.5 rounded-full bg-background-elevated border border-border-subtle text-[11px] font-bold text-foreground-secondary uppercase tracking-wider">
            {insight.category}
          </span>
          <span
            className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider ${
              isPositive
                ? "bg-brand-500/15 text-brand-300 border border-brand-500/30"
                : isWarning
                ? "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                : "bg-blue-500/15 text-blue-300 border border-blue-500/30"
            }`}
          >
            {insight.priority}
          </span>
        </div>

        {insight.metric?.formattedText && (
          <span className="text-xs font-mono font-bold text-foreground-primary px-2 py-0.5 rounded-lg bg-background-elevated border border-border-subtle">
            {insight.metric.formattedText}
          </span>
        )}
      </div>

      {/* Title and Summary */}
      <div>
        <h4 className="text-base font-bold text-foreground-primary tracking-tight">
          {insight.title}
        </h4>
        <p className="text-xs font-medium text-foreground-secondary mt-1 leading-relaxed">
          {insight.summary}
        </p>
      </div>

      {/* Expandable Explanation Details */}
      {isExpanded && (
        <div className="p-3.5 rounded-xl bg-background-elevated border border-border-subtle text-xs space-y-2.5 animate-fade-in">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-blue-400 block mb-0.5">
              What Happened:
            </span>
            <p className="text-foreground-secondary">{insight.whatHappened}</p>
          </div>

          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 block mb-0.5">
              Why It Matters:
            </span>
            <p className="text-foreground-secondary">{insight.whyItMatters}</p>
          </div>

          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-brand-400 block mb-0.5">
              Suggested Action:
            </span>
            <p className="text-foreground-secondary">{insight.suggestedAction}</p>
          </div>
        </div>
      )}

      {/* Footer Controls: Toggle Expand & Action Link */}
      <div className="flex items-center justify-between pt-1 border-t border-border-subtle/40">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs font-bold text-foreground-muted hover:text-foreground-primary flex items-center gap-1 transition-colors cursor-pointer"
        >
          <span>{isExpanded ? "Hide Details" : "View Explanation"}</span>
          {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>

        {insight.actionUrl && (
          <Link
            href={insight.actionUrl}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-400 hover:text-brand-300 transition-colors cursor-pointer"
          >
            <span>{insight.actionLabel || `Open ${insight.relatedModule}`}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>
    </div>
  );
}
