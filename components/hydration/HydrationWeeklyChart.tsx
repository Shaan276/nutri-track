"use client";

import React from "react";
import { ChartContainer } from "@/components/charts/ChartContainer";
import { BarProgressChart, BarChartDataPoint } from "@/components/charts/BarProgressChart";
import { Droplets } from "lucide-react";

interface HydrationWeeklyChartProps {
  data: BarChartDataPoint[];
  targetMl: number;
  isLoading?: boolean;
}

export function HydrationWeeklyChart({
  data,
  targetMl,
  isLoading = false,
}: HydrationWeeklyChartProps) {
  const isEmpty = !data || data.length === 0 || data.every((d) => d.value === 0);

  return (
    <ChartContainer
      title="Weekly Fluid Intake Trend"
      subtitle="Daily intake volume vs your daily hydration target"
      badge="7-Day History"
      badgeColor="blue"
      isLoading={isLoading}
      isEmpty={isEmpty}
      emptyIcon={<Droplets className="h-6 w-6 text-blue-400/50" />}
      emptyMessage="No weekly hydration data recorded yet."
      height={260}
    >
      <BarProgressChart
        data={data}
        fillColor="#3b82f6"
        targetValue={targetMl}
        targetLabel="Target"
        unit="ml"
        valueFormatter={(v) => `${v.toLocaleString()}`}
      />
    </ChartContainer>
  );
}

export default HydrationWeeklyChart;
