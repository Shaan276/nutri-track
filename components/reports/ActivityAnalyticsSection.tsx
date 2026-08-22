"use client";

import React from "react";
import { Activity, Flame, Mountain, Footprints, Timer, TrendingUp } from "lucide-react";
import {
  ActivityOverviewMetrics,
  RunningPaceTrendPoint,
  StepsTrendPoint,
  ActivityDistributionItem,
} from "@/lib/validations/report";
import { AreaTrendChart } from "@/components/charts/AreaTrendChart";
import { LineTrendChart } from "@/components/charts/LineTrendChart";
import { BarProgressChart } from "@/components/charts/BarProgressChart";
import { DonutDistributionChart } from "@/components/charts/DonutDistributionChart";
import { ChartContainer } from "@/components/charts/ChartContainer";

interface ActivityAnalyticsSectionProps {
  overview: ActivityOverviewMetrics;
  activityTrend: {
    date: string;
    label: string;
    distanceKm: number;
    calories: number;
    durationMinutes: number;
  }[];
  runningPaceTrend: RunningPaceTrendPoint[];
  stepsTrend: StepsTrendPoint[];
  activityDistribution: ActivityDistributionItem[];
}

export function ActivityAnalyticsSection({
  overview,
  activityTrend,
  runningPaceTrend,
  stepsTrend,
  activityDistribution,
}: ActivityAnalyticsSectionProps) {
  const avgDistance =
    overview.runningSessionsCount > 0
      ? (overview.totalDistanceKm / overview.runningSessionsCount).toFixed(2)
      : "0.00";

  const highestStepDay = stepsTrend.reduce(
    (max, cur) => (cur.steps > max.steps ? cur : max),
    { steps: 0, label: "—" }
  );

  return (
    <div className="space-y-6 text-left">
      {/* Section Title */}
      <div className="flex items-center gap-2.5 pb-2 border-b border-slate-800">
        <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 flex-shrink-0">
          <Activity className="w-4 h-4" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight">Activity &amp; Running Analytics</h2>
          <p className="text-xs text-slate-400">
            Running distance, pace progression (MM:SS/km), steps volume, elevation, and active calories
          </p>
        </div>
      </div>

      {/* Top Highlights Grid: Pace, Steps, Elevation, Distance */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 flex-shrink-0">
            <Timer className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 block font-medium">Average Pace</span>
            <strong className="text-xl font-black text-white font-mono">
              {overview.avgPaceFormatted || "—"}
            </strong>
            <span className="text-[10px] text-slate-500 block">Across {overview.runningSessionsCount} runs</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 flex-shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 block font-medium">Avg Distance / Run</span>
            <strong className="text-xl font-black text-white">
              {avgDistance} <span className="text-xs font-normal text-slate-400">km</span>
            </strong>
            <span className="text-[10px] text-slate-500 block">Total: {overview.totalDistanceKm} km</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 flex-shrink-0">
            <Footprints className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 block font-medium">Daily Steps</span>
            <strong className="text-xl font-black text-purple-300">
              {overview.totalSteps.toLocaleString()}
            </strong>
            <span className="text-[10px] text-slate-500 block">
              Peak: {highestStepDay.steps.toLocaleString()} steps ({highestStepDay.label})
            </span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 flex-shrink-0">
            <Mountain className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 block font-medium">Elevation Gain</span>
            <strong className="text-xl font-black text-amber-400">
              {overview.totalElevationGainMeters} <span className="text-xs font-normal text-slate-400">m</span>
            </strong>
            <span className="text-[10px] text-slate-500 block">
              Max single: {overview.highestElevationMeters} m
            </span>
          </div>
        </div>
      </div>

      {/* Row 1: Running Distance Trend & Activity Distribution Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ChartContainer
            title="Running & Movement Distance"
            subtitle="Daily logged distance in kilometers"
            badge="Distance"
            badgeColor="brand"
            height={280}
            isEmpty={activityTrend.every((a) => a.distanceKm === 0)}
            emptyMessage="No distance activities logged for this range."
          >
            <AreaTrendChart
              data={activityTrend}
              dataKey="distanceKm"
              labelKey="label"
              strokeColor="#10B981"
              fillColor="#10B981"
              gradientId="actDistGrad"
              unit=" km"
            />
          </ChartContainer>
        </div>

        <div>
          <ChartContainer
            title="Activity Distribution"
            subtitle="Breakdown by activity category"
            badge="Categories"
            badgeColor="blue"
            height={280}
            isEmpty={activityDistribution.length === 0}
            emptyMessage="No activity distribution data available."
          >
            <DonutDistributionChart
              data={activityDistribution}
              dataKey="percentage"
              nameKey="name"
              unit="%"
            />
          </ChartContainer>
        </div>
      </div>

      {/* Row 2: Pace Progression & Steps Volume */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartContainer
          title="Running Pace Trend"
          subtitle="Speed in minutes per kilometer (Lower line = faster run)"
          badge="Pace (MM:SS/km)"
          badgeColor="brand"
          height={260}
          isEmpty={runningPaceTrend.length === 0}
          emptyMessage="No running sessions with pace data recorded."
        >
          <LineTrendChart
            data={runningPaceTrend}
            lines={[
              {
                dataKey: "paceSecondsPerKm",
                color: "#10B981",
                name: "Pace (MM:SS/km)",
              },
            ]}
            labelKey="label"
            unit=" / km"
            reversedY={true}
          />
        </ChartContainer>

        <ChartContainer
          title="Daily Steps Volume"
          subtitle="Total steps walked or tracked daily vs target"
          badge="Step Count"
          badgeColor="blue"
          height={260}
          isEmpty={stepsTrend.every((s) => s.steps === 0)}
          emptyMessage="No step counts recorded for this range."
        >
          <BarProgressChart
            data={stepsTrend}
            dataKey="steps"
            labelKey="label"
            barColor="#3B82F6"
            unit=" steps"
            targetKey="target"
          />
        </ChartContainer>
      </div>
    </div>
  );
}
