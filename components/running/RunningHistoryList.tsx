"use client";

import React from "react";
import { Activity, Clock, Gauge, Flame, Mountain, Footprints, Edit2, Trash2, Plus } from "lucide-react";
import { ActivityEntryDto } from "@/lib/services/activity.service";
import {
  formatPace,
  formatDuration,
  activityTypeDisplayNames,
  activityTypeIcons,
  runningTypeDisplayNames,
  runningTypeBadges,
} from "@/lib/validations/activity";

interface RunningHistoryListProps {
  activities: ActivityEntryDto[];
  onEdit: (activity: ActivityEntryDto) => void;
  onDelete: (activity: ActivityEntryDto) => void;
  onOpenLogModal: () => void;
}

export function RunningHistoryList({
  activities,
  onEdit,
  onDelete,
  onOpenLogModal,
}: RunningHistoryListProps) {
  const count = activities.length;

  return (
    <div className="w-full bg-background-surface border border-border-default rounded-3xl p-5 sm:p-6 shadow-surface-card space-y-4 text-left">
      <div className="flex items-center justify-between border-b border-border-subtle pb-3.5">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-amber-400" />
          <h3 className="text-base font-bold text-foreground-primary tracking-tight">
            Today&apos;s Workout Sessions
          </h3>
        </div>

        <span className="px-2.5 py-0.5 rounded-full bg-background-elevated border border-border-subtle text-xs font-bold text-foreground-secondary font-mono">
          {count} {count === 1 ? "session" : "sessions"}
        </span>
      </div>

      {count === 0 ? (
        <div className="py-14 px-4 text-center rounded-2xl bg-background-elevated/20 border border-dashed border-border-subtle flex flex-col items-center justify-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
            <Activity className="h-6 w-6" />
          </div>
          <p className="text-sm font-bold text-foreground-primary">No runs logged yet today</p>
          <p className="text-xs text-foreground-muted max-w-sm">
            Track your outdoor runs, treadmill sessions, and cardio workouts to monitor your pace and weekly volume.
          </p>
          <button
            onClick={onOpenLogModal}
            className="inline-flex items-center gap-2 py-2 px-4 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-black font-extrabold text-xs rounded-xl shadow-sm transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4 fill-black" />
            <span>Log Your First Run</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {activities.map((act) => {
            const icon = activityTypeIcons[act.activityType] || "🏃";
            const title = activityTypeDisplayNames[act.activityType] || act.activityType;
            const paceStr = formatPace(act.averagePaceSecondsPerKm);
            const durStr = formatDuration(act.movingDurationSeconds);

            return (
              <div
                key={act.id}
                className="p-4 sm:p-5 rounded-2xl bg-background-elevated/50 hover:bg-background-elevated/80 border border-border-subtle transition-all space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl select-none">{icon}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-extrabold text-foreground-primary">
                          {title}
                        </h4>
                        {act.runningType && (
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${runningTypeBadges[act.runningType]?.color || "bg-amber-500/15 text-amber-300 border-amber-500/30"}`}>
                            {runningTypeDisplayNames[act.runningType] || act.runningType}
                          </span>
                        )}
                      </div>
                      {act.notes && (
                        <p className="text-xs text-foreground-muted mt-0.5 max-w-md truncate">
                          {act.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onEdit(act)}
                      title="Edit run"
                      className="p-2 rounded-xl text-foreground-muted hover:text-foreground-primary hover:bg-background-surface transition-colors cursor-pointer"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => onDelete(act)}
                      title="Delete run"
                      className="p-2 rounded-xl text-foreground-muted hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Metrics Chips */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1 border-t border-border-subtle/50 text-xs">
                  {/* Distance */}
                  <div className="p-2 rounded-xl bg-background-surface border border-border-subtle flex flex-col">
                    <span className="text-[10px] font-bold uppercase text-amber-400">Distance</span>
                    <span className="text-sm font-extrabold text-foreground-primary font-mono mt-0.5">
                      {act.distanceKm} km
                    </span>
                  </div>

                  {/* Avg Pace */}
                  <div className="p-2 rounded-xl bg-background-surface border border-border-subtle flex flex-col">
                    <span className="text-[10px] font-bold uppercase text-brand-400">Pace</span>
                    <span className="text-sm font-extrabold text-foreground-primary font-mono mt-0.5">
                      {paceStr}
                    </span>
                  </div>

                  {/* Duration */}
                  <div className="p-2 rounded-xl bg-background-surface border border-border-subtle flex flex-col">
                    <span className="text-[10px] font-bold uppercase text-blue-400">Duration</span>
                    <span className="text-sm font-extrabold text-foreground-primary font-mono mt-0.5">
                      {durStr}
                    </span>
                  </div>

                  {/* Calories */}
                  <div className="p-2 rounded-xl bg-background-surface border border-border-subtle flex flex-col">
                    <span className="text-[10px] font-bold uppercase text-rose-400">Calories</span>
                    <span className="text-sm font-extrabold text-foreground-primary font-mono mt-0.5">
                      {act.caloriesBurned} kcal
                    </span>
                  </div>

                  {/* Steps / Elevation */}
                  <div className="p-2 rounded-xl bg-background-surface border border-border-subtle flex flex-col">
                    <span className="text-[10px] font-bold uppercase text-cyan-400">Steps / Elev</span>
                    <span className="text-sm font-extrabold text-foreground-primary font-mono mt-0.5">
                      {act.steps > 0 ? `${act.steps.toLocaleString()} st` : `${act.elevationGainMeters}m`}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default RunningHistoryList;
