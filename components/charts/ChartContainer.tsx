"use client";

import React from "react";
import { Loader2, AlertCircle } from "lucide-react";

interface ChartContainerProps {
  title: string;
  subtitle?: string;
  badge?: string;
  badgeColor?: "brand" | "blue" | "amber" | "rose" | "neutral";
  action?: React.ReactNode;
  isLoading?: boolean;
  isEmpty?: boolean;
  emptyIcon?: React.ReactNode;
  emptyMessage?: string;
  emptyAction?: React.ReactNode;
  children: React.ReactNode;
  height?: number | string;
}

const badgeColorClasses = {
  brand: "bg-brand-500/15 text-brand-400 border-brand-500/30",
  blue: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  amber: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  rose: "bg-rose-500/15 text-rose-400 border-rose-500/30",
  neutral: "bg-background-elevated text-foreground-secondary border-border-subtle",
};

export function ChartContainer({
  title,
  subtitle,
  badge,
  badgeColor = "brand",
  action,
  isLoading = false,
  isEmpty = false,
  emptyIcon,
  emptyMessage = "No data available yet.",
  emptyAction,
  children,
  height = 280,
}: ChartContainerProps) {
  return (
    <div className="w-full bg-background-surface border border-border-default rounded-3xl p-5 sm:p-6 shadow-surface-card space-y-4 text-left">
      {/* Chart Header */}
      <div className="flex items-center justify-between gap-3 border-b border-border-subtle pb-3.5">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-foreground-primary tracking-tight">
              {title}
            </h3>
            {badge && (
              <span
                className={`px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider ${badgeColorClasses[badgeColor]}`}
              >
                {badge}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-foreground-muted mt-0.5">{subtitle}</p>
          )}
        </div>

        {action && <div>{action}</div>}
      </div>

      {/* Chart Body */}
      <div
        className="w-full relative flex items-center justify-center"
        style={{ height: typeof height === "number" ? `${height}px` : height }}
      >
        {isLoading ? (
          <div className="flex flex-col items-center justify-center space-y-2 text-foreground-muted">
            <Loader2 className="h-6 w-6 animate-spin text-brand-400" />
            <span className="text-xs font-semibold">Loading visualization...</span>
          </div>
        ) : isEmpty ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-center p-6 rounded-2xl bg-background-elevated/30 border border-dashed border-border-subtle space-y-2.5">
            {emptyIcon || <AlertCircle className="h-6 w-6 text-foreground-muted/50" />}
            <p className="text-xs font-semibold text-foreground-muted max-w-xs">
              {emptyMessage}
            </p>
            {emptyAction && <div className="pt-1">{emptyAction}</div>}
          </div>
        ) : (
          <div className="w-full h-full">{children}</div>
        )}
      </div>
    </div>
  );
}

export default ChartContainer;
