"use client";

import React from "react";
import { Clock, Flame, MapPin, Footprints } from "lucide-react";
import { formatDuration } from "@/lib/validations/activity";

interface ActivitiesOverviewCardsProps {
  totalActiveDurationSeconds: number;
  totalCaloriesBurned: number;
  totalDistanceKm: number;
  totalSteps: number;
}

export function ActivitiesOverviewCards({
  totalActiveDurationSeconds,
  totalCaloriesBurned,
  totalDistanceKm,
  totalSteps,
}: ActivitiesOverviewCardsProps) {
  const cards = [
    {
      label: "Active Time",
      value: formatDuration(totalActiveDurationSeconds),
      subtext: totalActiveDurationSeconds > 0 ? `${Math.round(totalActiveDurationSeconds / 60)} active minutes` : "No activity logged",
      icon: Clock,
      color: "text-emerald-400",
      bg: "bg-emerald-500/15",
      border: "border-emerald-500/30",
    },
    {
      label: "Calories Burned",
      value: `${totalCaloriesBurned.toLocaleString()}`,
      unit: "kcal",
      subtext: totalCaloriesBurned > 0 ? "Cardio & strength output" : "0 kcal burned",
      icon: Flame,
      color: "text-rose-400",
      bg: "bg-rose-500/15",
      border: "border-rose-500/30",
    },
    {
      label: "Total Distance",
      value: totalDistanceKm.toFixed(2),
      unit: "km",
      subtext: totalDistanceKm > 0 ? "GPS & manual distance" : "0.00 km logged",
      icon: MapPin,
      color: "text-blue-400",
      bg: "bg-blue-500/15",
      border: "border-blue-500/30",
    },
    {
      label: "Total Steps",
      value: totalSteps.toLocaleString(),
      unit: "steps",
      subtext: totalSteps > 0 ? "Daily step count" : "0 steps logged",
      icon: Footprints,
      color: "text-amber-400",
      bg: "bg-amber-500/15",
      border: "border-amber-500/30",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className="bg-background-surface border border-border-default rounded-3xl p-4 sm:p-5 shadow-surface-card hover:border-border-default/80 transition-all flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground-secondary uppercase tracking-wider">
                {card.label}
              </span>
              <div className={`p-2 rounded-xl ${card.bg} ${card.color} border ${card.border}`}>
                <Icon className="h-4 w-4" />
              </div>
            </div>

            <div className="mt-3">
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-black text-foreground-primary tracking-tight font-mono">
                  {card.value}
                </span>
                {card.unit && (
                  <span className="text-xs font-bold text-foreground-secondary font-mono">
                    {card.unit}
                  </span>
                )}
              </div>
              <p className="text-xs text-foreground-muted mt-1 font-medium truncate">
                {card.subtext}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default ActivitiesOverviewCards;
