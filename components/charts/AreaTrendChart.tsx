"use client";

import React, { useId } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from "recharts";

export interface AreaChartDataPoint {
  label?: string;
  value?: number;
  [key: string]: any;
}

export interface AreaTrendChartProps {
  data: AreaChartDataPoint[];
  dataKey?: string;
  labelKey?: string;
  strokeColor?: string;
  fillColor?: string;
  fillGradientStart?: string;
  fillGradientEnd?: string;
  gradientId?: string;
  valueFormatter?: (val: number) => string;
  unit?: string;
  referenceLineY?: number;
  referenceLineLabel?: string;
}

export function AreaTrendChart({
  data,
  dataKey = "value",
  labelKey = "label",
  strokeColor = "#10b981", // brand emerald
  fillColor,
  fillGradientStart,
  fillGradientEnd,
  gradientId: customGradientId,
  valueFormatter = (val) => `${val}`,
  unit = "",
  referenceLineY,
  referenceLineLabel = "Target",
}: AreaTrendChartProps) {
  const reactId = useId();
  const gradientId = customGradientId || `areaGradient_${reactId.replace(/:/g, "_")}`;
  const effectiveStroke = strokeColor || fillColor || "#10b981";

  if (!data || data.length === 0) return null;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="5%"
              stopColor={fillGradientStart || effectiveStroke}
              stopOpacity={0.4}
            />
            <stop
              offset="95%"
              stopColor={fillGradientEnd || effectiveStroke}
              stopOpacity={0.0}
            />
          </linearGradient>
        </defs>
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
            return (
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl text-xs space-y-1 z-50 text-left">
                <p className="font-bold text-white">{label}</p>
                <p className="font-semibold text-emerald-400">
                  {valueFormatter(val)} {unit}
                </p>
              </div>
            );
          }}
        />
        {referenceLineY !== undefined && referenceLineY > 0 && (
          <ReferenceLine
            y={referenceLineY}
            stroke="#10b981"
            strokeDasharray="4 4"
            label={{
              value: `${referenceLineLabel} (${referenceLineY}${unit})`,
              position: "top",
              fill: "#10b981",
              fontSize: 10,
              fontWeight: 700,
            }}
          />
        )}
        <Area
          type="monotone"
          dataKey={dataKey}
          stroke={effectiveStroke}
          strokeWidth={2.5}
          fillOpacity={1}
          fill={`url(#${gradientId})`}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export default AreaTrendChart;
