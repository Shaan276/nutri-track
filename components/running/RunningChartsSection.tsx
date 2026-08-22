"use client";

import React from "react";
import { ChartContainer } from "@/components/charts/ChartContainer";
import { AreaTrendChart } from "@/components/charts/AreaTrendChart";
import { LineTrendChart } from "@/components/charts/LineTrendChart";
import { BarProgressChart } from "@/components/charts/BarProgressChart";
import { WeeklyDayActivityPoint } from "@/lib/services/activity.service";
import { formatPace } from "@/lib/validations/activity";
import { Activity, Gauge, Footprints } from "lucide-react";

interface RunningChartsSectionProps {
  days: WeeklyDayActivityPoint[];
  isLoading?: boolean;
}

export function RunningChartsSection({ days, isLoading = false }: RunningChartsSectionProps) {
  const isAllEmpty = !days || days.length === 0 || days.every((d) => d.distanceKm === 0);

  // Distance Chart Data
  const distanceData = (days || []).map((d) => ({
    label: d.label,
    value: d.distanceKm,
  }));

  // Pace Chart Data (only include days with a run > 0 km so pace 0 does not skew chart)
  const paceData = (days || []).map((d) => ({
    label: d.label,
    value: d.distanceKm > 0 ? Math.round((d.averagePaceSecondsPerKm / 60) * 10) / 10 : 0,
    rawSeconds: d.averagePaceSecondsPerKm,
  }));

  const hasPaceData = paceData.some((p) => p.value > 0);

  // Steps Chart Data
  const stepsData = (days || []).map((d) => ({
    label: d.label,
    value: d.steps,
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-left">
      {/* 1. Daily Distance Trend Chart */}
      <ChartContainer
        title="Daily Distance Trend"
        subtitle="Distance logged per day over the past week"
        badge="Distance (km)"
        badgeColor="amber"
        isLoading={isLoading}
        isEmpty={isAllEmpty}
        emptyIcon={<Activity className="h-6 w-6 text-amber-400/50" />}
        emptyMessage="No running distance recorded in this 7-day period."
        height={260}
      >
        <AreaTrendChart
          data={distanceData}
          strokeColor="#f59e0b"
          fillGradientStart="rgba(245, 158, 11, 0.35)"
          unit="km"
          valueFormatter={(v) => `${v} km`}
        />
      </ChartContainer>

      {/* 2. Pace Trend Chart (Lower is faster) */}
      <ChartContainer
        title="Pace Progression"
        subtitle="Average running pace (lower line = faster pace)"
        badge="Pace (min/km)"
        badgeColor="brand"
        isLoading={isLoading}
        isEmpty={!hasPaceData}
        emptyIcon={<Gauge className="h-6 w-6 text-brand-400/50" />}
        emptyMessage="No pace data available for this period."
        height={260}
      >
        <LineTrendChart
          data={paceData.filter((p) => p.value > 0)}
          strokeColor="#10b981"
          reversedYAxis={true}
          unit="/km"
          valueFormatter={(v) => {
            const mins = Math.floor(v);
            const secs = Math.round((v - mins) * 60);
            return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
          }}
        />
      </ChartContainer>

      {/* 3. Steps Volume Chart */}
      <div className="lg:col-span-2">
        <ChartContainer
          title="Daily Steps Volume"
          subtitle="Total step count per day"
          badge="Steps"
          badgeColor="blue"
          isLoading={isLoading}
          isEmpty={isAllEmpty && stepsData.every((s) => s.value === 0)}
          emptyIcon={<Footprints className="h-6 w-6 text-blue-400/50" />}
          emptyMessage="No daily steps recorded yet."
          height={240}
        >
          <BarProgressChart
            data={stepsData}
            fillColor="#38bdf8"
            unit="steps"
            valueFormatter={(v) => `${v.toLocaleString()}`}
          />
        </ChartContainer>
      </div>
    </div>
  );
}

export default RunningChartsSection;
