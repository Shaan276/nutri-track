"use client";

import React, { useState } from "react";
import { Utensils, Sparkles, PieChart, ShieldCheck, AlertCircle } from "lucide-react";
import {
  CalorieTrendPoint,
  MacroTrendPoint,
  MacroDistributionSlice,
  ProteinConsistencyPoint,
  FiberSugarTrendPoint,
  MicronutrientReportItem,
} from "@/lib/validations/report";
import { AreaTrendChart } from "@/components/charts/AreaTrendChart";
import { LineTrendChart } from "@/components/charts/LineTrendChart";
import { BarProgressChart } from "@/components/charts/BarProgressChart";
import { DonutDistributionChart } from "@/components/charts/DonutDistributionChart";
import { ChartContainer } from "@/components/charts/ChartContainer";

interface NutritionAnalyticsSectionProps {
  calorieTrend: CalorieTrendPoint[];
  macroTrend: MacroTrendPoint[];
  macroDistribution: MacroDistributionSlice[];
  proteinConsistency: ProteinConsistencyPoint[];
  fiberSugarTrend: FiberSugarTrendPoint[];
  micronutrients: MicronutrientReportItem[];
}

export function NutritionAnalyticsSection({
  calorieTrend,
  macroTrend,
  macroDistribution,
  proteinConsistency,
  fiberSugarTrend,
  micronutrients,
}: NutritionAnalyticsSectionProps) {
  const [microTab, setMicroTab] = useState<"ALL" | "VITAMINS" | "MINERALS">("ALL");

  const filteredMicros = micronutrients.filter((m) => {
    if (microTab === "VITAMINS") return m.category === "VITAMIN";
    if (microTab === "MINERALS") return m.category === "MINERAL";
    return true;
  });

  return (
    <div className="space-y-6 text-left">
      {/* Section Title */}
      <div className="flex items-center gap-2.5 pb-2 border-b border-slate-800">
        <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 flex-shrink-0">
          <Utensils className="w-4 h-4" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight">Nutrition Analytics</h2>
          <p className="text-xs text-slate-400">
            Daily caloric balance, macronutrient distribution, protein adherence, and micronutrient coverage
          </p>
        </div>
      </div>

      {/* Row 1: Calorie Trend & Macro Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ChartContainer
            title="Daily Caloric Intake Trend"
            subtitle="Actual daily calories logged vs target"
            badge="Energy Intake"
            badgeColor="blue"
            height={280}
            isEmpty={calorieTrend.every((c) => c.calories === 0)}
            emptyMessage="No meal logs recorded for this date range."
          >
            <AreaTrendChart
              data={calorieTrend}
              dataKey="calories"
              labelKey="label"
              strokeColor="#3B82F6"
              fillColor="#3B82F6"
              gradientId="calTrendGrad"
              unit=" kcal"
              referenceLineY={calorieTrend[0]?.target}
              referenceLineLabel="Target"
            />
          </ChartContainer>
        </div>

        <div>
          <ChartContainer
            title="Macronutrient Distribution"
            subtitle="Energy contribution by macro"
            badge="Macro Ratio"
            badgeColor="brand"
            height={280}
            isEmpty={macroDistribution.every((m) => m.grams === 0)}
            emptyMessage="No macro data recorded for this range."
          >
            <DonutDistributionChart
              data={macroDistribution}
              dataKey="percentage"
              nameKey="name"
              unit="%"
            />
          </ChartContainer>
        </div>
      </div>

      {/* Row 2: Protein Consistency & Fiber/Sugar Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartContainer
          title="Daily Protein Adherence"
          subtitle="Daily protein consumed in grams vs daily target"
          badge="Muscle & Repair"
          badgeColor="blue"
          height={260}
          isEmpty={proteinConsistency.every((p) => p.proteinG === 0)}
          emptyMessage="No protein logs found for this date range."
        >
          <BarProgressChart
            data={proteinConsistency}
            dataKey="proteinG"
            labelKey="label"
            barColor="#3B82F6"
            unit="g"
            targetKey="targetG"
          />
        </ChartContainer>

        <ChartContainer
          title="Fiber & Sugar Intake"
          subtitle="Daily fiber and sugar intake trends in grams"
          badge="Gut & Glucose"
          badgeColor="amber"
          height={260}
          isEmpty={fiberSugarTrend.every((f) => f.fiberG === 0 && f.sugarG === 0)}
          emptyMessage="No fiber or sugar data recorded for this range."
        >
          <LineTrendChart
            data={fiberSugarTrend}
            lines={[
              { dataKey: "fiberG", color: "#8B5CF6", name: "Fiber (g)" },
              { dataKey: "sugarG", color: "#F59E0B", name: "Sugar (g)" },
            ]}
            labelKey="label"
            unit="g"
          />
        </ChartContainer>
      </div>

      {/* Row 3: Micronutrient Analytics & 63-Nutrient Coverage Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 flex-shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Micronutrient Coverage Analysis
              </h3>
              <p className="text-xs text-slate-400">
                Average daily intake across 13 vitamins and 13 minerals (Normalized 63-Nutrient Taxonomy)
              </p>
            </div>
          </div>

          {/* Vitamin / Mineral Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-950 border border-slate-800 rounded-xl self-start sm:self-auto">
            {(["ALL", "VITAMINS", "MINERALS"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setMicroTab(tab)}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                  microTab === tab
                    ? "bg-purple-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {tab === "ALL" ? "All Micronutrients" : tab === "VITAMINS" ? "Vitamins (13)" : "Minerals (13)"}
              </button>
            ))}
          </div>
        </div>

        {/* Micronutrients Progress Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
          {filteredMicros.map((item) => {
            const hasTarget = item.hasTarget && item.target !== null && item.target > 0;
            const pct = item.percentage !== null ? item.percentage : 0;
            const barWidth = hasTarget ? Math.min(100, pct) : 0;

            const getBarColor = () => {
              if (!hasTarget) return "bg-slate-700";
              if (pct >= 100) return "bg-emerald-500";
              if (pct >= 70) return "bg-blue-500";
              return "bg-amber-500";
            };

            return (
              <div
                key={item.key}
                className="bg-slate-950/70 border border-slate-800/90 rounded-xl p-4 space-y-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-bold text-white">{item.label}</h4>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">
                      {item.category}
                    </span>
                  </div>
                  <span className={`text-[10px] font-bold ${item.statusColor}`}>
                    {hasTarget ? `${pct}% of target` : "No target"}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800/60">
                  <div
                    className={`h-full ${getBarColor()} rounded-full transition-all duration-300`}
                    style={{ width: `${hasTarget ? barWidth : 0}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>
                    Avg: <strong className="text-white font-mono">{item.avgIntake} {item.unit}</strong>
                  </span>
                  <span>
                    {hasTarget ? (
                      <>Target: <strong className="text-slate-300 font-mono">{item.target} {item.unit}</strong></>
                    ) : (
                      <em className="text-slate-500 not-italic">No target configured</em>
                    )}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
