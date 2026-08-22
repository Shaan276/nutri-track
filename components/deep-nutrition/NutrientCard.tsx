"use client";

import React, { useState } from "react";
import { Info, CheckCircle2, AlertCircle, AlertTriangle, HelpCircle } from "lucide-react";
import { NutrientItemAnalysis } from "@/lib/services/deep-nutrition.service";

interface NutrientCardProps {
  nutrient: NutrientItemAnalysis;
}

export function NutrientCard({ nutrient }: NutrientCardProps) {
  const [showInfo, setShowInfo] = useState(false);

  const getStatusBadge = () => {
    switch (nutrient.status) {
      case "ON_TRACK":
        return {
          bg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
          icon: CheckCircle2,
          text: "On track",
        };
      case "LOW":
        return {
          bg: "bg-rose-500/10 text-rose-400 border-rose-500/30",
          icon: AlertCircle,
          text: "Low intake",
        };
      case "NEEDS_ATTENTION":
        return {
          bg: "bg-amber-500/10 text-amber-400 border-amber-500/30",
          icon: AlertTriangle,
          text: "Below target",
        };
      case "HIGH":
        return {
          bg: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
          icon: CheckCircle2,
          text: "Above target",
        };
      case "UNAVAILABLE":
      default:
        return {
          bg: "bg-slate-800/60 text-slate-400 border-slate-700/50",
          icon: HelpCircle,
          text: "No data",
        };
    }
  };

  const badge = getStatusBadge();
  const IconComponent = badge.icon;
  const clampedPercent = nutrient.percentage !== null ? Math.min(100, Math.max(0, nutrient.percentage)) : 0;

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 hover:border-slate-700/80 transition-colors flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <h4 className="text-sm font-semibold text-white tracking-wide">{nutrient.name}</h4>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded-full border ${badge.bg}`}
              >
                <IconComponent className="w-3 h-3" />
                {badge.text}
              </span>
            </div>
          </div>
          <button
            onClick={() => setShowInfo(!showInfo)}
            className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-md transition-colors"
            title="Nutrient info & food sources"
            aria-label={`Info for ${nutrient.name}`}
          >
            <Info className="w-4 h-4" />
          </button>
        </div>

        {/* Info Box Toggle */}
        {showInfo && (
          <div className="my-2.5 p-2.5 bg-slate-950/80 border border-slate-800 rounded-lg text-xs space-y-1.5 animate-in fade-in duration-150">
            <p className="text-slate-300 leading-relaxed">{nutrient.description}</p>
            <p className="text-slate-400">
              <strong className="text-emerald-400">Food sources:</strong> {nutrient.foodSources}
            </p>
          </div>
        )}

        {/* Value metrics */}
        <div className="flex items-baseline justify-between mt-3 mb-2">
          {nutrient.consumedAmount !== null ? (
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold text-white tracking-tight">
                {nutrient.consumedAmount}
              </span>
              <span className="text-xs font-medium text-slate-400">
                / {nutrient.targetAmount} {nutrient.unit}
              </span>
            </div>
          ) : (
            <span className="text-sm italic text-slate-400">No data available</span>
          )}

          {nutrient.percentage !== null && (
            <span
              className="text-sm font-bold"
              style={{ color: nutrient.statusColor }}
            >
              {nutrient.percentage}%
            </span>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden mt-1">
        {nutrient.consumedAmount !== null ? (
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${clampedPercent}%`,
              backgroundColor: nutrient.statusColor,
            }}
          />
        ) : (
          <div className="h-full bg-slate-700/40 w-full" />
        )}
      </div>
    </div>
  );
}
