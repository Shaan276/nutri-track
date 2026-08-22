"use client";

import React from "react";
import { MacroDistributionSlice } from "@/lib/services/deep-nutrition.service";

interface MacroDonutChartProps {
  distribution: MacroDistributionSlice[];
  totalCalories: number;
}

export function MacroDonutChart({ distribution, totalCalories }: MacroDonutChartProps) {
  const totalCals = distribution.reduce((sum, d) => sum + d.calories, 0);

  // Calculate SVG donut segments
  let cumulativeAngle = 0;
  const radius = 38;
  const cx = 50;
  const cy = 50;
  const circumference = 2 * Math.PI * radius;

  const segments = distribution.map((item) => {
    const fraction = totalCals > 0 ? item.calories / totalCals : 0;
    const strokeDasharray = `${fraction * circumference} ${circumference}`;
    const strokeDashoffset = -cumulativeAngle * circumference;
    cumulativeAngle += fraction;

    return {
      ...item,
      strokeDasharray,
      strokeDashoffset,
    };
  });

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 flex flex-col justify-between space-y-4 text-left">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
          Macronutrient Energy Distribution
        </h3>
        <span className="text-[11px] font-bold px-2.5 py-0.5 bg-slate-800 border border-slate-700 text-slate-200 rounded-lg flex-shrink-0">
          {totalCalories.toLocaleString()} kcal Total
        </span>
      </div>

      {/* Content: Donut + Detailed Macro Rows */}
      <div className="flex flex-col items-center gap-5 my-1">
        {/* SVG Donut */}
        <div className="relative w-32 h-32 sm:w-36 sm:h-36 flex items-center justify-center flex-shrink-0">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            {/* Background Circle */}
            <circle
              cx={cx}
              cy={cy}
              r={radius}
              stroke="currentColor"
              strokeWidth="11"
              fill="transparent"
              className="text-slate-800"
            />
            {/* Segments */}
            {totalCals > 0 &&
              segments.map((seg) => (
                <circle
                  key={seg.key}
                  cx={cx}
                  cy={cy}
                  r={radius}
                  stroke={seg.color}
                  strokeWidth="11"
                  strokeDasharray={seg.strokeDasharray}
                  strokeDashoffset={seg.strokeDashoffset}
                  fill="transparent"
                  className="transition-all duration-300"
                />
              ))}
          </svg>
          <div className="absolute flex flex-col items-center justify-center text-center pointer-events-none">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Calories</span>
            <span className="text-lg sm:text-xl font-extrabold text-white tracking-tight">{totalCalories.toLocaleString()}</span>
          </div>
        </div>

        {/* Macro Breakdown List */}
        <div className="w-full space-y-2.5">
          {distribution.map((macro) => (
            <div
              key={macro.key}
              className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-2.5 space-y-1.5"
            >
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: macro.color }}
                  />
                  <span className="font-semibold text-slate-200">{macro.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-white">{macro.grams}g</span>
                  <span className="text-[11px] font-bold text-slate-400">
                    {macro.percentage}%
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min(100, macro.percentage)}%`,
                    backgroundColor: macro.color,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
