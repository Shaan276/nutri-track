"use client";

import React from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";

export interface DonutDataPoint {
  name?: string;
  value?: number;
  percentage?: number;
  color: string;
  [key: string]: any;
}

export interface DonutDistributionChartProps {
  data: DonutDataPoint[];
  dataKey?: string;
  nameKey?: string;
  centerLabel?: string;
  centerValue?: string;
  valueFormatter?: (val: number) => string;
  unit?: string;
}

export function DonutDistributionChart({
  data,
  dataKey = "value",
  nameKey = "name",
  centerLabel,
  centerValue,
  valueFormatter = (v) => `${v}`,
  unit = "",
}: DonutDistributionChartProps) {
  if (!data || data.length === 0) return null;

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload || !payload.length) return null;
              const p = payload[0];
              const name = p.name || (nameKey ? p.payload?.[nameKey] : "Item");
              const val = p.value !== undefined ? p.value : (dataKey ? p.payload?.[dataKey] : 0);
              return (
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl text-xs space-y-1 text-left z-50">
                  <p className="font-bold text-white">{name}</p>
                  <p className="font-semibold" style={{ color: p.payload?.color }}>
                    {valueFormatter(Number(val))} {unit}
                  </p>
                </div>
              );
            }}
          />
          <Pie
            data={data}
            innerRadius="65%"
            outerRadius="90%"
            paddingAngle={3}
            dataKey={dataKey}
            nameKey={nameKey}
            stroke="none"
            isAnimationActive={false}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>

      {/* Center Label inside hole */}
      {(centerValue || centerLabel) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
          {centerValue && (
            <span className="text-xl font-black text-white tracking-tight font-mono">
              {centerValue}
            </span>
          )}
          {centerLabel && (
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              {centerLabel}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export default DonutDistributionChart;
