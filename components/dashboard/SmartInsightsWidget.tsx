"use client";

import React from "react";
import Link from "next/link";
import { SmartInsightsResponse } from "@/lib/services/insights/insight-types";
import { Sparkles, ArrowRight, AlertTriangle, CheckCircle2, Trophy, Lightbulb } from "lucide-react";

interface SmartInsightsWidgetProps {
  insights?: SmartInsightsResponse | null;
}

export function SmartInsightsWidget({ insights }: SmartInsightsWidgetProps) {
  if (!insights || !insights.healthScore) {
    return null;
  }

  const { healthScore, heroInsight, positiveInsights = [], attentionInsights = [], recommendations = [], achievements = [] } =
    insights;

  const topAttention = attentionInsights[0];
  const topPositive = positiveInsights[0];
  const topRec = recommendations[0];
  const topAch = achievements[0];

  return (
    <div className="p-6 rounded-3xl bg-background-surface border border-border-default shadow-surface-card space-y-5 text-left">
      {/* Widget Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-brand-500/20 text-brand-400">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-foreground-primary">
              Smart Insights &amp; Health Score
            </h3>
            <p className="text-xs text-foreground-secondary">
              Personalized intelligence based on your tracked wellness data.
            </p>
          </div>
        </div>

        <Link
          href="/insights"
          className="inline-flex items-center gap-1 text-xs font-bold text-brand-400 hover:text-brand-300 transition-colors cursor-pointer"
        >
          <span>View All Insights</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Grid of Key Quick Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Today's Score */}
        <div className="p-4 rounded-2xl bg-background-elevated border border-border-subtle flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-foreground-muted">
              Today&apos;s Score
            </span>
            <span
              className="text-xs font-mono font-black px-2 py-0.5 rounded-md border"
              style={{
                color: healthScore.gradeColor,
                borderColor: `${healthScore.gradeColor}40`,
                backgroundColor: `${healthScore.gradeColor}15`,
              }}
            >
              {healthScore.grade === "PENDING" ? "Getting Started" : `Grade ${healthScore.grade}`}
            </span>
          </div>

          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black font-mono text-foreground-primary">
              {healthScore.isPending || healthScore.grade === "PENDING" ? "--" : healthScore.overallScore}
            </span>
            <span className="text-xs text-foreground-muted font-mono font-bold">/ 100</span>
          </div>

          <p className="text-[11px] text-foreground-secondary truncate font-medium">
            {healthScore.gradeLabel}
          </p>
        </div>

        {/* Card 2: Needs Attention / Starter */}
        <div className="p-4 rounded-2xl bg-background-elevated border border-border-subtle flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Focus Area
            </span>
            {topAttention && (
              <span className="text-[10px] font-mono text-foreground-muted uppercase">
                {topAttention.category}
              </span>
            )}
          </div>

          <p className="text-xs font-bold text-foreground-primary line-clamp-2">
            {topAttention ? topAttention.title : !insights.hasSufficientData ? "Log Your First Meal" : "All primary targets on track"}
          </p>

          <p className="text-[11px] text-foreground-secondary line-clamp-1">
            {topAttention ? topAttention.summary : !insights.hasSufficientData ? "Record foods to unlock full intelligence." : "No critical nutrient or hydration deficits."}
          </p>
        </div>

        {/* Card 3: Going Well */}
        <div className="p-4 rounded-2xl bg-background-elevated border border-border-subtle flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-brand-400 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              Going Well
            </span>
            {topPositive && (
              <span className="text-[10px] font-mono text-foreground-muted uppercase">
                {topPositive.category}
              </span>
            )}
          </div>

          <p className="text-xs font-bold text-foreground-primary line-clamp-2">
            {topPositive ? topPositive.title : "Building daily consistency"}
          </p>

          <p className="text-[11px] text-foreground-secondary line-clamp-1">
            {topPositive ? topPositive.summary : "Log meals and activities to highlight strengths."}
          </p>
        </div>

        {/* Card 4: Recommended Next Action */}
        <div className="p-4 rounded-2xl bg-background-elevated border border-border-subtle flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1">
              <Lightbulb className="h-3 w-3" />
              Next Action
            </span>
            {topRec && (
              <span className="text-[10px] font-mono text-foreground-muted uppercase">
                {topRec.category}
              </span>
            )}
          </div>

          <p className="text-xs font-bold text-foreground-primary line-clamp-2">
            {topRec ? topRec.title : "Log your next meal or drink"}
          </p>

          {topRec ? (
            <Link
              href={topRec.actionUrl}
              className="text-[11px] font-bold text-brand-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>{topRec.actionLabel}</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          ) : (
            <Link
              href="/nutrition"
              className="text-[11px] font-bold text-brand-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Open Nutrition</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
