"use client";

import React from "react";
import { CheckCircle2, AlertTriangle, HelpCircle, Flame } from "lucide-react";
import { DeepNutritionOverview } from "@/lib/services/deep-nutrition.service";

interface NutrientCoverageScoreProps {
  overview: DeepNutritionOverview;
}

export function NutrientCoverageScore({ overview }: NutrientCoverageScoreProps) {
  const getRatingColor = () => {
    switch (overview.coverageRating) {
      case "EXCELLENT":
        return "text-emerald-400 border-emerald-500/30 bg-emerald-500/10";
      case "GOOD":
        return "text-emerald-400 border-emerald-500/30 bg-emerald-500/10";
      case "MODERATE":
        return "text-amber-400 border-amber-500/30 bg-amber-500/10";
      case "LOW":
        return "text-rose-400 border-rose-500/30 bg-rose-500/10";
      case "NO_DATA":
      default:
        return "text-slate-400 border-slate-700 bg-slate-800/40";
    }
  };

  const circumference = 2 * Math.PI * 40;
  const strokeDashoffset = circumference - (overview.coverageScore / 100) * circumference;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Left: Score Gauge */}
        <div className="flex items-center gap-6">
          <div className="relative w-28 h-28 flex-shrink-0 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                className="text-slate-800"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke="currentColor"
                strokeWidth="8"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
                className={overview.coverageScore >= 70 ? "text-emerald-500" : overview.coverageScore >= 50 ? "text-amber-500" : "text-rose-500"}
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className="text-2xl font-black text-white tracking-tight leading-none">
                {overview.coverageScore}
              </span>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mt-0.5">
                / 100
              </span>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-bold text-white tracking-tight">Overall Nutrient Coverage</h3>
              <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${getRatingColor()}`}>
                {overview.coverageRatingLabel}
              </span>
            </div>
            <p className="text-xs text-slate-400 max-w-md leading-relaxed">
              Synthesizes daily intake across {overview.totalNutrientsTracked} tracked macronutrients, vitamins, and minerals against standard RDA targets.
            </p>
          </div>
        </div>

        {/* Right: Summary Metrics Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full md:w-auto">
          {/* On Track */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 text-center min-w-[90px]">
            <div className="flex items-center justify-center gap-1 text-emerald-400 text-xs font-semibold mb-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              On Track
            </div>
            <span className="text-xl font-bold text-white">{overview.nutrientsOnTarget}</span>
          </div>

          {/* Below Target */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 text-center min-w-[90px]">
            <div className="flex items-center justify-center gap-1 text-amber-400 text-xs font-semibold mb-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              Below Target
            </div>
            <span className="text-xl font-bold text-white">{overview.nutrientsBelowTarget}</span>
          </div>

          {/* Above Target */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 text-center min-w-[90px]">
            <div className="flex items-center justify-center gap-1 text-cyan-400 text-xs font-semibold mb-1">
              <Flame className="w-3.5 h-3.5" />
              Above Target
            </div>
            <span className="text-xl font-bold text-white">{overview.nutrientsAboveTarget}</span>
          </div>

          {/* No Data */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 text-center min-w-[90px]">
            <div className="flex items-center justify-center gap-1 text-slate-400 text-xs font-semibold mb-1">
              <HelpCircle className="w-3.5 h-3.5" />
              No Data
            </div>
            <span className="text-xl font-bold text-white">{overview.nutrientsNoData}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
