"use client";

import React from "react";
import { CheckCircle2, XCircle, AlertCircle, ShieldCheck, Target } from "lucide-react";
import { ConsistencyScoreBreakdown } from "@/lib/validations/report";

interface ConsistencyScoreCardProps {
  scoreBreakdown: ConsistencyScoreBreakdown;
}

export function ConsistencyScoreCard({ scoreBreakdown }: ConsistencyScoreCardProps) {
  const { score, rating, ratingLabel, activePillarsCount, totalChecksMet, totalChecksEvaluated, pillars } =
    scoreBreakdown;

  const getScoreColor = () => {
    if (score >= 85) return "text-emerald-400 border-emerald-500/30 bg-emerald-500/10";
    if (score >= 70) return "text-blue-400 border-blue-500/30 bg-blue-500/10";
    if (score >= 50) return "text-amber-400 border-amber-500/30 bg-amber-500/10";
    return "text-rose-400 border-rose-500/30 bg-rose-500/10";
  };

  const getBarColor = () => {
    if (score >= 85) return "bg-emerald-500";
    if (score >= 70) return "bg-blue-500";
    if (score >= 50) return "bg-amber-500";
    return "bg-rose-500";
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-5 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 flex-shrink-0">
            <Target className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white tracking-tight">Consistency Score</h3>
              <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider ${getScoreColor()}`}>
                {ratingLabel}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Deterministic score measuring adherence across your configured targets ({activePillarsCount} active pillars)
            </p>
          </div>
        </div>

        {/* Big Score Badge */}
        <div className="flex items-baseline gap-1.5 self-start sm:self-auto">
          <span className="text-3xl font-black text-white tracking-tight">{score}%</span>
          <span className="text-xs font-semibold text-slate-400">adherence</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1.5">
        <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
          <div
            className={`h-full ${getBarColor()} transition-all duration-500 rounded-full`}
            style={{ width: `${score}%` }}
          />
        </div>
        <div className="flex justify-between text-[11px] text-slate-400">
          <span>{totalChecksMet} of {totalChecksEvaluated} total applicable target checks achieved</span>
          <span className="font-semibold text-slate-300">{score}% Score</span>
        </div>
      </div>

      {/* Transparent Pillars Breakdown Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
        {pillars.map((pillar) => {
          const isPassed = pillar.percentage >= 70;
          return (
            <div
              key={pillar.key}
              className="bg-slate-950/70 border border-slate-800/90 rounded-xl p-3.5 flex items-start gap-3"
            >
              <div className="mt-0.5 flex-shrink-0">
                {isPassed ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <XCircle className="w-4 h-4 text-amber-400" />
                )}
              </div>
              <div className="space-y-0.5 flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-xs font-bold text-white truncate">{pillar.label}</h4>
                  <span
                    className={`text-[11px] font-mono font-bold ${
                      isPassed ? "text-emerald-400" : "text-amber-400"
                    }`}
                  >
                    {pillar.percentage}%
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-tight">{pillar.detail}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
