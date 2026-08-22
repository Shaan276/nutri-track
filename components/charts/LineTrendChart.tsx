"use client";

import React from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

export interface LineChartDataPoint {
  label?: string;
  value?: number;
  secondaryValue?: number;
  [key: string]: any;
}

export interface LineSeriesConfig {
  dataKey: string;
  color: string;
  name?: string;
  strokeWidth?: number;
  strokeDasharray?: string;
}

export interface LineTrendChartProps {
  data: LineChartDataPoint[];
  dataKey?: string;
  labelKey?: string;
  secondaryDataKey?: string;
  lines?: LineSeriesConfig[];
  strokeColor?: string;
  secondaryStrokeColor?: string;
  valueFormatter?: (val: number) => string;
  unit?: string;
  reversedYAxis?: boolean;
  reversedY?: boolean;
  domain?: [number | string, number | string];
}

export function LineTrendChart({
  data,
  dataKey = "value",
  labelKey = "label",
  secondaryDataKey,
  lines,
  strokeColor = "#10b981", // brand emerald
  secondaryStrokeColor = "#3b82f6", // blue
  valueFormatter = (val) => `${val}`,
  unit = "",
  reversedYAxis = false,
  reversedY = false,
  domain = ["auto", "auto"],
}: LineTrendChartProps) {
  const isReversed = reversedY || reversedYAxis;

  if (!data || data.length === 0) return null;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
          reversed={isReversed}
          domain={domain}
          tick={{ fill: "#a0aec0" }}
          tickFormatter={(v) => `${v}`}
        />
        <Tooltip
          content={({ active, payload, label }) => {
            if (!active || !payload || !payload.length) return null;
            return (
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl text-xs space-y-1 z-50 text-left">
                <p className="font-bold text-white">{label}</p>
                {payload.map((p, idx) => {
                  const displayVal = p.payload?.formattedPace
                    ? p.payload.formattedPace
                    : `${valueFormatter(Number(p.value))} ${unit}`;
                  return (
                    <p key={idx} className="font-semibold" style={{ color: p.color }}>
                      {p.name === "value" ? "Value" : p.name}: {displayVal}
                    </p>
                  );
                })}
              </div>
            );
          }}
        />

        {lines && lines.length > 0 ? (
          lines.map((lineConfig) => (
            <Line
              key={lineConfig.dataKey}
              type="monotone"
              dataKey={lineConfig.dataKey}
              name={lineConfig.name || lineConfig.dataKey}
              stroke={lineConfig.color}
              strokeWidth={lineConfig.strokeWidth || 2.5}
              strokeDasharray={lineConfig.strokeDasharray}
              dot={{ r: 3.5, fill: lineConfig.color, strokeWidth: 1.5, stroke: "#0f1422" }}
              activeDot={{ r: 5.5, fill: lineConfig.color, stroke: "#ffffff", strokeWidth: 2 }}
              isAnimationActive={false}
            />
          ))
        ) : (
          <>
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke={strokeColor}
              strokeWidth={2.5}
              dot={{ r: 3.5, fill: strokeColor, strokeWidth: 1.5, stroke: "#0f1422" }}
              activeDot={{ r: 5.5, fill: strokeColor, stroke: "#ffffff", strokeWidth: 2 }}
              isAnimationActive={false}
            />
            {secondaryDataKey && (
              <Line
                type="monotone"
                dataKey={secondaryDataKey}
                stroke={secondaryStrokeColor}
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={false}
                isAnimationActive={false}
              />
            )}
          </>
        )}
      </LineChart>
    </ResponsiveContainer>
  );
}

export default LineTrendChart;
