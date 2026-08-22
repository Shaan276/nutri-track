"use client";

import React from "react";
import Link from "next/link";
import { SmartInsight } from "@/lib/services/insights/insight-types";
import { Sparkles, ArrowRight, AlertTriangle, CheckCircle2, Info } from "lucide-react";

interface HeroInsightBannerProps {
  insight: SmartInsight;
}

export function HeroInsightBanner({ insight }: HeroInsightBannerProps) {
  const isPositive = insight.severity === "SUCCESS" || insight.priority === "POSITIVE";
  const isWarning = insight.severity === "WARNING" || insight.severity === "ALERT";

  return (
    <div
      className={`p-6 sm:p-7 rounded-3xl border text-left relative overflow-hidden transition-all shadow-surface-card ${
        isPositive
          ? "bg-gradient-to-br from-emerald-500/15 via-background-surface to-background-elevated border-brand-500/40"
          : isWarning
          ? "bg-gradient-to-br from-amber-500/15 via-background-surface to-background-elevated border-amber-500/40"
          : "bg-gradient-to-br from-blue-500/15 via-background-surface to-background-elevated border-blue-500/40"
      }`}
    >
      {/* Background Accent Pill */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-background-elevated/80 border border-border-subtle text-xs font-extrabold uppercase tracking-wider">
          <span className="text-base">{insight.icon || "✨"}</span>
          <span
            className={
              isPositive
                ? "text-brand-400"
                : isWarning
                ? "text-amber-400"
                : "text-blue-400"
            }
          >
            Today&apos;s Focus &bull; {insight.category}
          </span>
        </div>

        <span className="px-2.5 py-0.5 rounded-md bg-background-surface/80 border border-border-subtle text-[11px] font-mono font-bold text-foreground-secondary uppercase tracking-wider">
          {insight.priority} PRIORITY
        </span>
      </div>

      <h3 className="text-xl sm:text-2xl font-black text-foreground-primary tracking-tight mb-2">
        {insight.title}
      </h3>

      <p className="text-sm font-semibold text-foreground-secondary mb-5">
        {insight.summary}
      </p>

      {/* Structured Explainable 3-Pillar Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 mb-5">
        {/* Pillar 1: What Happened */}
        <div className="p-4 rounded-2xl bg-background-surface/90 border border-border-subtle space-y-1">
          <div className="text-[10px] font-black uppercase tracking-wider text-foreground-muted flex items-center gap-1">
            <Info className="h-3 w-3 text-blue-400" />
            What Happened
          </div>
          <p className="text-xs font-medium text-foreground-primary leading-relaxed">
            {insight.whatHappened}
          </p>
        </div>

        {/* Pillar 2: Why It Matters */}
        <div className="p-4 rounded-2xl bg-background-surface/90 border border-border-subtle space-y-1">
          <div className="text-[10px] font-black uppercase tracking-wider text-foreground-muted flex items-center gap-1">
            <AlertTriangle className="h-3 w-3 text-amber-400" />
            Why It Matters
          </div>
          <p className="text-xs font-medium text-foreground-primary leading-relaxed">
            {insight.whyItMatters}
          </p>
        </div>

        {/* Pillar 3: Suggested Action */}
        <div className="p-4 rounded-2xl bg-background-surface/90 border border-border-subtle space-y-1">
          <div className="text-[10px] font-black uppercase tracking-wider text-foreground-muted flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3 text-brand-400" />
            Suggested Action
          </div>
          <p className="text-xs font-medium text-foreground-primary leading-relaxed">
            {insight.suggestedAction}
          </p>
        </div>
      </div>

      {/* Direct CTA Action */}
      {insight.actionUrl && (
        <div className="flex items-center justify-end">
          <Link
            href={insight.actionUrl}
            className={`inline-flex items-center gap-2 py-2.5 px-5 rounded-xl font-extrabold text-xs shadow-md transition-all cursor-pointer ${
              isPositive
                ? "bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-black shadow-brand-glow"
                : isWarning
                ? "bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-black"
                : "bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white"
            }`}
          >
            <span>{insight.actionLabel || `Open ${insight.relatedModule}`}</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}
    </div>
  );
}
