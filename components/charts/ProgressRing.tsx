"use client";

import React from "react";

interface ProgressRingProps {
  progress: number; // 0 - 100+
  size?: number;
  strokeWidth?: number;
  strokeColor?: string;
  trackColor?: string;
  centerText?: string;
  centerSubtitle?: string;
  showPercent?: boolean;
}

export function ProgressRing({
  progress,
  size = 140,
  strokeWidth = 10,
  strokeColor = "#10b981", // brand emerald
  trackColor = "#1f293d",
  centerText,
  centerSubtitle,
  showPercent = true,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(Math.max(progress, 0), 100);
  const strokeDashoffset = circumference - (clamped / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center select-none" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Background Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Progress Arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
          className="transition-all duration-700 ease-out"
        />
      </svg>

      {/* Center Label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        {centerText ? (
          <span className="text-xl font-extrabold text-foreground-primary tracking-tight font-mono">
            {centerText}
          </span>
        ) : showPercent ? (
          <span className="text-xl font-extrabold text-foreground-primary tracking-tight font-mono">
            {Math.round(progress)}%
          </span>
        ) : null}

        {centerSubtitle && (
          <span className="text-[10px] font-semibold text-foreground-muted uppercase tracking-wider mt-0.5">
            {centerSubtitle}
          </span>
        )}
      </div>
    </div>
  );
}

export default ProgressRing;
