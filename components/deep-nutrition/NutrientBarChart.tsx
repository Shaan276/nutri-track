"use client";

import React from "react";
import { NutrientItemAnalysis } from "@/lib/services/deep-nutrition.service";

interface NutrientBarChartProps {
  title: string;
  nutrients: NutrientItemAnalysis[];
}

export function NutrientBarChart({ title, nutrients }: NutrientBarChartProps) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold text-white tracking-wide">{title}</h3>
        <span className="text-xs text-slate-400">Target: 100% (RDA)</span>
      </div>

      <div className="space-y-3.5">
        {nutrients.map((item) => {
          const percent = item.percentage !== null ? item.percentage : 0;
          const clamped = Math.min(150, Math.max(0, percent));
          const widthPercent = (clamped / 150) * 100;

          return (
            <div key={item.key} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-slate-200">{item.name}</span>
                <div className="flex items-center gap-2">
                  {item.consumedAmount !== null ? (
                    <span className="text-slate-400">
                      {item.consumedAmount} / {item.targetAmount} {item.unit}
                    </span>
                  ) : (
                    <span className="text-slate-500 italic">No data</span>
                  )}
                  {item.percentage !== null ? (
                    <span className="font-bold w-10 text-right" style={{ color: item.statusColor }}>
                      {item.percentage}%
                    </span>
                  ) : (
                    <span className="text-slate-500 w-10 text-right">—</span>
                  )}
                </div>
              </div>

              {/* Bar track */}
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden relative">
                {/* 100% Marker Line */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-slate-600 z-10"
                  style={{ left: `${(100 / 150) * 100}%` }}
                />
                {item.consumedAmount !== null ? (
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${widthPercent}%`,
                      backgroundColor: item.statusColor,
                    }}
                  />
                ) : (
                  <div className="h-full bg-slate-700/30 w-full" />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
