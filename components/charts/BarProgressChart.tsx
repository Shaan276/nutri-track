"use client";

import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  Cell,
} from "recharts";

export interface BarChartDataPoint {
  label?: string;
  value?: number;
  target?: number;
  [key: string]: any;
}

export interface BarProgressChartProps {
  data: BarChartDataPoint[];
  dataKey?: string;
  labelKey?: string;
  fillColor?: string;
  barColor?: string;
  targetValue?: number;
  targetKey?: string;
  targetLabel?: string;
  valueFormatter?: (val: number) => string;
  unit?: string;
}

export function BarProgressChart({
  data,
  dataKey = "value",
  labelKey = "label",
  fillColor,
  barColor,
  targetValue,
  targetKey,
  targetLabel = "Target",
  valueFormatter = (val) => `${val}`,
  unit = "",
}: BarProgressChartProps) {
  const effectiveBarColor = barColor || fillColor || "#3b82f6";

  if (!data || data.length === 0) return null;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#222f3e" vertical={false} opacity={0.6} />
        <XAxis
          dataKey={labelKey}
          stroke="#718096"
          fontSize={11}
          tickLine={false}
          axisLine={false}
          tick={{ fill: "#a0aec0" }}
        />
        <YAxis
          stroke="#718096"
          fontSize={11}
          tickLine={false}
          axisLine={false}
          tick={{ fill: "#a0aec0" }}
        />
        <Tooltip
          content={({ active, payload, label }) => {
            if (!active || !payload || !payload.length) return null;
            const val = Number(payload[0]?.value) || 0;
            const targetVal =
              targetValue ||
              (targetKey && payload[0]?.payload ? Number(payload[0].payload[targetKey]) : undefined);

            return (
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl text-xs space-y-1 z-50 text-left">
                <p className="font-bold text-white">{label}</p>
                <p className="font-semibold text-blue-400">
                  Value: {valueFormatter(val)} {unit}
                </p>
                {targetVal !== undefined && targetVal > 0 && (
                  <p className="text-[11px] text-slate-400">
                    Target: {valueFormatter(targetVal)} {unit} ({Math.round((val / targetVal) * 100)}%)
                  </p>
                )}
              </div>
            );
          }}
        />
        {targetValue !== undefined && targetValue > 0 && (
          <ReferenceLine
            y={targetValue}
            stroke="#10b981"
            strokeDasharray="4 4"
            label={{
              value: `${targetLabel} (${targetValue}${unit})`,
              position: "top",
              fill: "#10b981",
              fontSize: 10,
              fontWeight: 700,
            }}
          />
        )}
        <Bar dataKey={dataKey} radius={[6, 6, 0, 0]} maxBarSize={36} isAnimationActive={false}>
          {data.map((entry, index) => {
            const rawVal = entry[dataKey] ?? entry.value ?? 0;
            const targetVal = targetValue || (targetKey ? entry[targetKey] : undefined);
            const isMet = targetVal ? rawVal >= targetVal : false;
            return (
              <Cell
                key={`cell-${index}`}
                fill={isMet ? "#10b981" : effectiveBarColor}
                fillOpacity={0.9}
              />
            );
          })}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export default BarProgressChart;
