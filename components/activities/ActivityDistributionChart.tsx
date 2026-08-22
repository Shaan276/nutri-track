"use client";

import React from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { ChartContainer } from "@/components/charts/ChartContainer";
import { ActivityDistributionSlice } from "@/lib/services/unified-activity.service";
import { PieChart as PieIcon } from "lucide-react";
import { formatDuration } from "@/lib/validations/activity";

interface ActivityDistributionChartProps {
  distribution: ActivityDistributionSlice[];
  isLoading?: boolean;
}

export function ActivityDistributionChart({
  distribution = [],
  isLoading = false,
}: ActivityDistributionChartProps) {
  const isEmpty = !distribution || distribution.length === 0 || distribution.every((d) => d.durationSeconds === 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data: ActivityDistributionSlice = payload[0].payload;
      return (
        <div className="bg-background-elevated border border-border-default rounded-2xl p-3.5 shadow-2xl text-left space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-base">{data.icon}</span>
            <span className="font-extrabold text-foreground-primary text-sm">{data.name}</span>
          </div>
          <p className="text-xs text-foreground-secondary font-mono font-bold">
            {formatDuration(data.durationSeconds)} ({data.percentage}%)
          </p>
          <p className="text-[11px] text-foreground-muted">
            {data.count} {data.count === 1 ? "session" : "sessions"} logged
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <ChartContainer
      title="Activity Time Distribution"
      subtitle="Breakdown of active duration across physical training categories"
      badge="Time Breakdown"
      badgeColor="brand"
      isLoading={isLoading}
      isEmpty={isEmpty}
      emptyIcon={<PieIcon className="h-6 w-6 text-emerald-400/50" />}
      emptyMessage="No activity distribution data available. Log a mix of runs, gym sessions, or walks to see your training balance."
      height={280}
    >
      <div className="w-full h-full flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Donut Chart */}
        <div className="w-full md:w-1/2 h-56 relative flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={distribution}
                dataKey="durationMinutes"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={4}
                stroke="none"
              >
                {distribution.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color}
                    className="hover:opacity-80 transition-opacity cursor-pointer"
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend Chips List */}
        <div className="w-full md:w-1/2 grid grid-cols-2 gap-2 text-left">
          {distribution.map((item) => (
            <div
              key={item.categoryKey}
              className="p-2.5 rounded-xl bg-background-elevated/70 border border-border-subtle flex items-center justify-between"
            >
              <div className="flex items-center gap-2 overflow-hidden">
                <span className="text-sm shrink-0">{item.icon}</span>
                <span className="text-xs font-bold text-foreground-primary truncate">
                  {item.name}
                </span>
              </div>
              <div className="flex items-baseline gap-1 shrink-0">
                <span className="text-xs font-extrabold text-foreground-primary font-mono">
                  {item.percentage}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </ChartContainer>
  );
}

export default ActivityDistributionChart;
