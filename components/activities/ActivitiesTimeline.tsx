"use client";

import React, { useState } from "react";
import {
  Activity,
  Dumbbell,
  Clock,
  Flame,
  MapPin,
  Footprints,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronUp,
  Gauge,
  TrendingUp,
} from "lucide-react";
import { UnifiedActivityItem } from "@/lib/services/unified-activity.service";
import { runningTypeBadges, formatDuration } from "@/lib/validations/activity";

interface ActivitiesTimelineProps {
  items: UnifiedActivityItem[];
  selectedDate: string;
  onEdit: (item: UnifiedActivityItem) => void;
  onDelete: (item: UnifiedActivityItem) => void;
  onOpenLogModal: () => void;
}

type FilterOption = "ALL" | "RUN" | "WORKOUT" | "WALK" | "CYCLING" | "HIIT" | "OTHER";

export function ActivitiesTimeline({
  items = [],
  selectedDate,
  onEdit,
  onDelete,
  onOpenLogModal,
}: ActivitiesTimelineProps) {
  const [filter, setFilter] = useState<FilterOption>("ALL");
  const [expandedWorkouts, setExpandedWorkouts] = useState<Record<string, boolean>>({});

  const toggleWorkoutExpand = (id: string) => {
    setExpandedWorkouts((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredItems = items.filter((item) => {
    if (filter === "ALL") return true;
    if (filter === "RUN") return item.categoryKey === "RUN";
    if (filter === "WORKOUT") return item.kind === "WORKOUT" || item.categoryKey === "HOME_WORKOUT" || item.categoryKey === "GYM_WORKOUT";
    if (filter === "WALK") return item.categoryKey === "WALK";
    if (filter === "CYCLING") return item.categoryKey === "CYCLING";
    if (filter === "HIIT") return item.categoryKey === "HIIT";
    if (filter === "OTHER") return item.categoryKey === "OTHER";
    return true;
  });

  const filterTabs: { id: FilterOption; label: string; icon: string }[] = [
    { id: "ALL", label: `All (${items.length})`, icon: "⚡" },
    { id: "RUN", label: "Running", icon: "🏃" },
    { id: "WORKOUT", label: "Workouts", icon: "🏋️" },
    { id: "WALK", label: "Walking", icon: "🚶" },
    { id: "CYCLING", label: "Cycling", icon: "🚴" },
    { id: "HIIT", label: "HIIT", icon: "🔥" },
    { id: "OTHER", label: "Other", icon: "➕" },
  ];

  return (
    <div className="space-y-4 text-left">
      {/* Header and Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-emerald-400" />
          <h3 className="text-base font-extrabold text-foreground-primary tracking-tight">
            Activities Timeline for {selectedDate}
          </h3>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {filterTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                filter === tab.id
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm"
                  : "bg-background-elevated/70 text-foreground-muted hover:text-foreground-primary border border-border-subtle"
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Timeline List */}
      {filteredItems.length === 0 ? (
        <div className="py-14 px-4 text-center rounded-3xl bg-background-surface border border-dashed border-border-default flex flex-col items-center justify-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <Activity className="h-6 w-6" />
          </div>
          <p className="text-base font-bold text-foreground-primary">
            No activities recorded for this date
          </p>
          <p className="text-xs text-foreground-muted max-w-sm font-medium">
            Log a run, walk, cycling session, or strength workout to build your daily fitness record.
          </p>
          <button
            onClick={onOpenLogModal}
            className="inline-flex items-center gap-2 py-2 px-4 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-black font-extrabold text-xs rounded-xl shadow-brand-glow transition-all cursor-pointer mt-1"
          >
            <span>+ Log Activity Now</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredItems.map((item) => {
            const isWorkout = item.kind === "WORKOUT";
            const isExpanded = expandedWorkouts[item.id] ?? false;
            const runBadge = item.runningType ? runningTypeBadges[item.runningType] : null;

            return (
              <div
                key={item.id}
                className="bg-background-surface border border-border-default rounded-3xl p-4 sm:p-5 shadow-surface-card hover:border-border-default/80 transition-all space-y-3"
              >
                {/* Main Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-background-elevated border border-border-subtle flex items-center justify-center text-xl shrink-0">
                      {item.icon}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-base font-extrabold text-foreground-primary">
                          {item.title}
                        </h4>

                        {/* Running Subtype Badge */}
                        {runBadge && (
                          <span
                            className={`px-2 py-0.5 rounded-full text-[11px] font-extrabold border ${runBadge.color}`}
                          >
                            {runBadge.label} Run
                          </span>
                        )}

                        {/* Workout Type Badge */}
                        {isWorkout && (
                          <span
                            className={`px-2 py-0.5 rounded-full text-[11px] font-extrabold border ${
                              item.workoutType === "HOME_WORKOUT"
                                ? "bg-purple-500/20 text-purple-300 border-purple-500/40"
                                : "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                            }`}
                          >
                            {item.workoutType === "HOME_WORKOUT" ? "Home Workout" : "Gym Workout"}
                          </span>
                        )}

                        {/* Integration Provider Badge (e.g. Strava) */}
                        {item.source && item.source !== "MANUAL" && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#FC4C02]/20 text-[#FC4C02] border border-[#FC4C02]/40 flex items-center gap-1">
                            <span>●</span>
                            <span>{item.externalProvider || item.source}</span>
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-foreground-secondary font-medium mt-0.5">
                        {item.subtitle}
                      </p>
                    </div>
                  </div>

                  {/* Telemetry Metrics & Action Buttons */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-border-subtle">
                    <div className="flex items-center gap-3 sm:gap-4 text-xs font-mono font-bold">
                      {/* Active Time */}
                      <div className="flex items-center gap-1 text-emerald-400">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{formatDuration(item.durationSeconds)}</span>
                      </div>

                      {/* Calories */}
                      {item.caloriesBurned > 0 && (
                        <div className="flex items-center gap-1 text-rose-400">
                          <Flame className="h-3.5 w-3.5" />
                          <span>{item.caloriesBurned} kcal</span>
                        </div>
                      )}

                      {/* Distance */}
                      {item.distanceKm && item.distanceKm > 0 && (
                        <div className="flex items-center gap-1 text-blue-400">
                          <MapPin className="h-3.5 w-3.5" />
                          <span>{item.distanceKm} km</span>
                        </div>
                      )}

                      {/* Pace */}
                      {item.paceFormatted && (
                        <div className="hidden md:flex items-center gap-1 text-amber-400">
                          <Gauge className="h-3.5 w-3.5" />
                          <span>{item.paceFormatted}</span>
                        </div>
                      )}

                      {/* Speed */}
                      {item.speedKmh && (
                        <div className="hidden md:flex items-center gap-1 text-amber-400">
                          <TrendingUp className="h-3.5 w-3.5" />
                          <span>{item.speedKmh} km/h</span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      {isWorkout && item.exercises && item.exercises.length > 0 && (
                        <button
                          type="button"
                          onClick={() => toggleWorkoutExpand(item.id)}
                          className="p-1.5 rounded-xl text-foreground-muted hover:text-foreground-primary hover:bg-background-elevated transition-colors cursor-pointer"
                          title={isExpanded ? "Hide Exercises" : "Show Exercises"}
                        >
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => onEdit(item)}
                        className="p-1.5 rounded-xl text-foreground-muted hover:text-brand-400 hover:bg-background-elevated transition-colors cursor-pointer"
                        title="Edit Activity"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => onDelete(item)}
                        className="p-1.5 rounded-xl text-foreground-muted hover:text-rose-400 hover:bg-background-elevated transition-colors cursor-pointer"
                        title="Delete Activity"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Notes (if any) */}
                {item.notes && (
                  <p className="text-xs text-foreground-secondary bg-background-elevated/50 p-2.5 rounded-xl border border-border-subtle font-medium">
                    &quot;{item.notes}&quot;
                  </p>
                )}

                {/* Expandable Exercise & Set Details for Workouts */}
                {isWorkout && isExpanded && item.exercises && (
                  <div className="pt-2 border-t border-border-subtle space-y-2.5 animate-fade-in">
                    <h5 className="text-xs font-extrabold text-foreground-primary uppercase tracking-wider">
                      Exercise Telemetry &amp; Sets
                    </h5>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                      {item.exercises.map((ex: any, idx: number) => (
                        <div
                          key={ex.id || idx}
                          className="p-3 rounded-2xl bg-background-elevated/70 border border-border-subtle space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-foreground-primary text-xs">
                              {ex.name}
                            </span>
                            {ex.category && (
                              <span className="text-[10px] text-foreground-muted uppercase font-semibold">
                                {ex.category}
                              </span>
                            )}
                          </div>

                          <div className="space-y-1">
                            {ex.sets?.map((s: any) => (
                              <div
                                key={s.id || s.setNumber}
                                className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-background-surface/80 border border-border-subtle"
                              >
                                <span className="font-mono text-foreground-muted font-bold text-[11px]">
                                  Set {s.setNumber}
                                </span>
                                <span className="font-mono font-bold text-foreground-primary">
                                  {s.weightKg ? `${s.weightKg} kg × ` : ""}
                                  {s.reps ? `${s.reps} reps` : ""}
                                  {s.durationSeconds ? `${s.durationSeconds}s duration` : ""}
                                  {!s.weightKg && !s.durationSeconds && s.reps ? " (Bodyweight)" : ""}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default ActivitiesTimeline;
