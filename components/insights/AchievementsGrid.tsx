"use client";

import React from "react";
import { AchievementItem } from "@/lib/services/insights/insight-types";
import { Trophy, Award } from "lucide-react";

interface AchievementsGridProps {
  achievements: AchievementItem[];
}

export function AchievementsGrid({ achievements }: AchievementsGridProps) {
  if (!achievements || achievements.length === 0) return null;

  return (
    <div className="p-6 rounded-3xl bg-background-surface border border-border-default shadow-surface-card space-y-5 text-left">
      <div className="flex items-center justify-between gap-2">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <Trophy className="h-3.5 w-3.5" />
            Verified Milestones
          </div>
          <h3 className="text-xl font-black text-foreground-primary tracking-tight">
            Achievements &amp; Personal Records
          </h3>
          <p className="text-xs text-foreground-secondary mt-0.5">
            Historical personal bests and consistency milestones recorded in your database.
          </p>
        </div>

        <span className="text-xs font-mono font-bold text-foreground-muted px-2.5 py-1 rounded-xl bg-background-elevated border border-border-subtle">
          {achievements.length} Milestones
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {achievements.map((ach) => (
          <div
            key={ach.id}
            className="p-4 rounded-2xl bg-gradient-to-br from-background-elevated to-background-surface border border-border-subtle hover:border-amber-500/40 transition-all flex items-start gap-3.5 shadow-sm"
          >
            <div className="p-2.5 rounded-2xl bg-amber-500/15 border border-amber-500/25 text-2xl shrink-0">
              {ach.badgeIcon || "🏆"}
            </div>

            <div className="space-y-1 min-w-0 flex-1">
              <div className="flex items-center justify-between gap-1">
                <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wider">
                  {ach.category}
                </span>
                <span className="text-[10px] font-mono text-foreground-muted">
                  {ach.date}
                </span>
              </div>

              <h4 className="text-sm font-bold text-foreground-primary truncate">
                {ach.title}
              </h4>

              <div className="text-xs font-mono font-black text-brand-400">
                {ach.metric}
              </div>

              <p className="text-[11px] text-foreground-secondary leading-snug">
                {ach.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
