"use client";

import React from "react";
import Link from "next/link";
import { RecommendationItem } from "@/lib/services/insights/insight-types";
import { Lightbulb, ArrowRight, UtensilsCrossed, Droplets, Dumbbell, Activity, Sparkles } from "lucide-react";

interface RecommendationsGridProps {
  recommendations: RecommendationItem[];
}

export function RecommendationsGrid({ recommendations }: RecommendationsGridProps) {
  if (!recommendations || recommendations.length === 0) return null;

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case "UtensilsCrossed":
        return <UtensilsCrossed className="h-4 w-4 text-brand-400" />;
      case "Droplets":
        return <Droplets className="h-4 w-4 text-blue-400" />;
      case "Dumbbell":
        return <Dumbbell className="h-4 w-4 text-amber-400" />;
      case "Activity":
        return <Activity className="h-4 w-4 text-emerald-400" />;
      case "Sparkles":
        return <Sparkles className="h-4 w-4 text-purple-400" />;
      default:
        return <Lightbulb className="h-4 w-4 text-brand-400" />;
    }
  };

  return (
    <div className="p-6 rounded-3xl bg-background-surface border border-border-default shadow-surface-card space-y-5 text-left">
      <div className="flex items-center justify-between gap-2">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-brand-500/15 border border-brand-500/30 text-brand-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <Lightbulb className="h-3.5 w-3.5" />
            Recommended Next Actions
          </div>
          <h3 className="text-xl font-black text-foreground-primary tracking-tight">
            Targeted Next Steps
          </h3>
          <p className="text-xs text-foreground-secondary mt-0.5">
            Personalized, actionable optimizations linked directly to your application modules.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {recommendations.map((rec) => (
          <div
            key={rec.id}
            className="p-5 rounded-2xl bg-background-elevated border border-border-subtle hover:border-brand-500/40 transition-all flex flex-col justify-between space-y-3.5 shadow-sm"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-background-surface border border-border-subtle">
                    {getIcon(rec.iconName)}
                  </div>
                  <span className="text-[10px] font-mono font-bold text-foreground-secondary uppercase tracking-wider">
                    {rec.category}
                  </span>
                </div>

                <span
                  className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider ${
                    rec.priority === "HIGH"
                      ? "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                      : rec.priority === "MEDIUM"
                      ? "bg-blue-500/15 text-blue-300 border border-blue-500/30"
                      : "bg-foreground-muted/15 text-foreground-secondary border border-border-subtle"
                  }`}
                >
                  {rec.priority}
                </span>
              </div>

              <h4 className="text-sm font-bold text-foreground-primary">
                {rec.title}
              </h4>

              <p className="text-xs font-medium text-foreground-secondary leading-relaxed">
                {rec.explanation}
              </p>
            </div>

            <Link
              href={rec.actionUrl}
              className="inline-flex items-center justify-between w-full py-2 px-3.5 rounded-xl bg-background-surface hover:bg-brand-500/15 text-brand-400 hover:text-brand-300 border border-border-subtle hover:border-brand-500/30 text-xs font-bold transition-all cursor-pointer"
            >
              <span>{rec.actionLabel}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
