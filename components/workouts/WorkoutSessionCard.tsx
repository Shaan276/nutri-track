"use client";

import React, { useState } from "react";
import { WorkoutSessionDto } from "@/lib/services/workout.service";
import { workoutTypeDisplayNames, workoutTypeIcons } from "@/lib/validations/workout";
import { formatDuration } from "@/lib/validations/activity";
import { Dumbbell, Home, Clock, Flame, ChevronDown, ChevronUp, Edit2, Trash2, Layers } from "lucide-react";

interface WorkoutSessionCardProps {
  session: WorkoutSessionDto;
  onEdit: (session: WorkoutSessionDto) => void;
  onDelete: (session: WorkoutSessionDto) => void;
}

export function WorkoutSessionCard({
  session,
  onEdit,
  onDelete,
}: WorkoutSessionCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const isHome = session.workoutType === "HOME_WORKOUT";
  const typeBadgeClass = isHome
    ? "bg-purple-500/15 text-purple-400 border-purple-500/30"
    : "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";

  return (
    <div className="w-full bg-background-surface border border-border-default rounded-3xl p-5 sm:p-6 shadow-surface-card space-y-4 text-left transition-all hover:border-border-hover">
      {/* Session Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border-subtle pb-4">
        <div className="flex items-center gap-3">
          <div className="text-2xl p-2 rounded-2xl bg-background-elevated border border-border-subtle select-none">
            {workoutTypeIcons[session.workoutType] || "🏋️"}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-base sm:text-lg font-extrabold text-foreground-primary tracking-tight">
                {session.name}
              </h4>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${typeBadgeClass}`}>
                {workoutTypeDisplayNames[session.workoutType]}
              </span>
            </div>
            {session.notes && (
              <p className="text-xs text-foreground-muted mt-0.5 font-medium">
                {session.notes}
              </p>
            )}
          </div>
        </div>

        {/* Quick Stats & Actions */}
        <div className="flex items-center gap-3 justify-between sm:justify-end">
          <div className="flex items-center gap-3 text-xs text-foreground-secondary font-mono">
            {session.durationSeconds > 0 && (
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-blue-400" />
                {formatDuration(session.durationSeconds)}
              </span>
            )}
            {session.caloriesBurned > 0 && (
              <span className="flex items-center gap-1">
                <Flame className="h-3.5 w-3.5 text-rose-400" />
                {session.caloriesBurned} kcal
              </span>
            )}
            <span className="flex items-center gap-1">
              <Layers className="h-3.5 w-3.5 text-emerald-400" />
              {session.totalSets} sets
            </span>
          </div>

          <div className="flex items-center gap-1 border-l border-border-subtle pl-3">
            <button
              type="button"
              onClick={() => onEdit(session)}
              title="Edit workout"
              className="p-1.5 rounded-xl text-foreground-muted hover:text-foreground-primary hover:bg-background-elevated transition-colors cursor-pointer"
            >
              <Edit2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => onDelete(session)}
              title="Delete workout"
              className="p-1.5 rounded-xl text-foreground-muted hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setIsExpanded((prev) => !prev)}
              className="p-1.5 rounded-xl text-foreground-muted hover:text-foreground-primary hover:bg-background-elevated transition-colors cursor-pointer ml-1"
            >
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Expandable Exercise List */}
      {isExpanded && (
        <div className="space-y-4 pt-1">
          {session.exercises.length === 0 ? (
            <p className="text-xs text-foreground-muted italic">No exercises logged in this workout.</p>
          ) : (
            session.exercises.map((exercise, exIndex) => (
              <div
                key={exercise.id || exIndex}
                className="p-4 rounded-2xl bg-background-elevated/60 border border-border-subtle space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-lg bg-emerald-500/15 text-emerald-400 font-black text-xs flex items-center justify-center font-mono">
                      {exIndex + 1}
                    </span>
                    <h5 className="text-sm font-bold text-foreground-primary">
                      {exercise.name}
                    </h5>
                    {exercise.category && (
                      <span className="px-2 py-0.5 rounded-md bg-background-surface border border-border-subtle text-[10px] font-semibold text-foreground-secondary">
                        {exercise.category}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-foreground-muted font-mono">
                    {exercise.sets.length} {exercise.sets.length === 1 ? "set" : "sets"}
                  </span>
                </div>

                {/* Sets Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-border-subtle text-[11px] font-bold text-foreground-muted uppercase">
                        <th className="py-1.5 px-2.5 w-16">Set</th>
                        <th className="py-1.5 px-2.5">Weight</th>
                        <th className="py-1.5 px-2.5">Reps</th>
                        <th className="py-1.5 px-2.5">Duration</th>
                        <th className="py-1.5 px-2.5">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-subtle/50">
                      {exercise.sets.map((set, setIdx) => (
                        <tr key={set.id || setIdx} className="text-foreground-secondary hover:bg-background-surface/50">
                          <td className="py-2 px-2.5 font-bold font-mono text-foreground-primary">
                            Set {set.setNumber || setIdx + 1}
                          </td>
                          <td className="py-2 px-2.5 font-mono font-bold text-emerald-400">
                            {set.weightKg !== null && set.weightKg !== undefined ? `${set.weightKg} kg` : "— (Bodyweight)"}
                          </td>
                          <td className="py-2 px-2.5 font-mono font-bold text-foreground-primary">
                            {set.reps !== null && set.reps !== undefined ? `${set.reps} reps` : "—"}
                          </td>
                          <td className="py-2 px-2.5 font-mono text-blue-400">
                            {set.durationSeconds !== null && set.durationSeconds !== undefined
                              ? `${set.durationSeconds}s`
                              : "—"}
                          </td>
                          <td className="py-2 px-2.5 text-foreground-muted text-[11px] truncate max-w-xs">
                            {set.notes || "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
