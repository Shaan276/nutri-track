"use client";

import React, { useState } from "react";
import { HealthScoreResult } from "@/lib/services/insights/insight-types";
import { ShieldCheck, HelpCircle, CheckCircle2, AlertCircle, Info, ChevronDown, ChevronUp } from "lucide-react";

interface HealthScoreCardProps {
  healthScore: HealthScoreResult;
}

export function HealthScoreCard({ healthScore }: HealthScoreCardProps) {
  const [showExplanation, setShowExplanation] = useState(false);

  const { overallScore, grade, gradeLabel, gradeColor, categoryScores, explanation } = healthScore;

  const categories = [
    { key: "nutrition", data: categoryScores.nutrition },
    { key: "hydration", data: categoryScores.hydration },
    { key: "activity", data: categoryScores.activity },
    { key: "workout", data: categoryScores.workout },
    { key: "consistency", data: categoryScores.consistency },
  ];

  return (
    <div className="p-6 rounded-3xl bg-background-surface border border-border-default shadow-surface-card space-y-6 text-left">
      {/* Header with Title and Grade */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-brand-500/15 border border-brand-500/30 text-brand-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <ShieldCheck className="h-3.5 w-3.5" />
            Deterministic Consistency Index
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-foreground-primary tracking-tight">
            Overall Health &amp; Consistency Score
          </h2>
          <p className="text-xs text-foreground-secondary mt-0.5">
            Evaluated across 5 physical wellness pillars (0–100 points scale).
          </p>
        </div>

        {/* Big Score Gauge Badge */}
        <div className="flex items-center gap-4 bg-background-elevated border border-border-subtle p-3.5 px-5 rounded-2xl">
          <div className="text-center">
            <div className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-foreground-primary">
              {healthScore.isPending || grade === "PENDING" ? "--" : overallScore}
              <span className="text-base text-foreground-muted font-bold font-sans">/100</span>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-foreground-muted">
              Score Points
            </span>
          </div>

          <div className="h-10 w-[1px] bg-border-subtle" />

          <div className="text-center">
            <span
              className="inline-block text-xl sm:text-2xl font-black font-mono px-3 py-0.5 rounded-xl border"
              style={{
                color: gradeColor,
                borderColor: `${gradeColor}40`,
                backgroundColor: `${gradeColor}15`,
              }}
            >
              {grade === "PENDING" ? "Pending" : grade}
            </span>
            <div className="text-[10px] font-bold uppercase tracking-wider text-foreground-secondary mt-1">
              {grade === "PENDING" ? "Getting Started" : `Grade ${grade}`}
            </div>
          </div>
        </div>
      </div>

      {/* Pillar Point Breakdown Bars */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {categories.map(({ key, data }) => {
          const pct = Math.round((data.score / data.max) * 100);
          const isOptimal = data.status === "OPTIMAL";
          const isNeedsAttention = data.status === "NEEDS_ATTENTION";

          return (
            <div
              key={key}
              className="p-4 rounded-2xl bg-background-elevated/60 border border-border-subtle flex flex-col justify-between space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground-secondary truncate pr-1">
                  {data.label}
                </span>
                <span className="text-xs font-mono font-black text-foreground-primary">
                  {data.score}
                  <span className="text-[10px] text-foreground-muted">/{data.max}</span>
                </span>
              </div>

              {/* Mini progress bar */}
              <div className="w-full h-2 bg-background-surface rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    isOptimal
                      ? "bg-brand-400"
                      : isNeedsAttention
                      ? "bg-amber-400"
                      : "bg-blue-400"
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-foreground-muted">
                <span className="truncate">{data.description}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Toggle How it is Calculated */}
      <div className="pt-2 border-t border-border-subtle/50">
        <button
          onClick={() => setShowExplanation(!showExplanation)}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-400 hover:text-brand-300 transition-colors cursor-pointer"
        >
          <HelpCircle className="h-3.5 w-3.5" />
          <span>How is this score calculated?</span>
          {showExplanation ? (
            <ChevronUp className="h-3.5 w-3.5" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5" />
          )}
        </button>

        {showExplanation && (
          <div className="mt-3 p-4 rounded-2xl bg-background-elevated border border-border-subtle text-xs text-foreground-secondary space-y-2.5 animate-fade-in">
            <p className="font-bold text-foreground-primary">
              Deterministic 100-Point Health Index Formula:
            </p>
            <ul className="space-y-1.5 list-disc list-inside text-foreground-secondary">
              <li>
                <strong className="text-foreground-primary">Nutrition (30 pts):</strong> Caloric
                target adherence (15 pts) + Protein target adherence (15 pts).
              </li>
              <li>
                <strong className="text-foreground-primary">Hydration (20 pts):</strong> Daily fluid
                intake ratio vs target (12 pts) + Streak consistency (8 pts).
              </li>
              <li>
                <strong className="text-foreground-primary">Running &amp; Activity (20 pts):</strong>{" "}
                Active workout days &amp; step volume milestones.
              </li>
              <li>
                <strong className="text-foreground-primary">Workouts (15 pts):</strong> Training
                session frequency and tonnage volume.
              </li>
              <li>
                <strong className="text-foreground-primary">Consistency (15 pts):</strong> Multi-pillar
                daily tracking adherence.
              </li>
            </ul>
            <div className="p-2.5 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-300 font-medium">
              💡 {explanation}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
