"use client";

import React from "react";
import { Dumbbell, Home, Clock, Flame, CheckCircle, Layers } from "lucide-react";
import { formatDuration } from "@/lib/validations/activity";

interface WorkoutAnalysisCardProps {
  workouts: any[];
}

export function WorkoutAnalysisCard({ workouts = [] }: WorkoutAnalysisCardProps) {
  if (workouts.length === 0) return null;

  let totalSets = 0;
  let totalExercises = 0;
  let totalDurationSeconds = 0;
  let totalCalories = 0;
  let homeCount = 0;
  let gymCount = 0;

  for (const w of workouts) {
    totalDurationSeconds += w.durationSeconds || 0;
    totalCalories += w.caloriesBurned || 0;
    totalSets += w.totalSets || (w.exercises ? w.exercises.reduce((acc: number, ex: any) => acc + (ex.sets?.length || 0), 0) : 0);
    totalExercises += w.exercises?.length || 0;
    if (w.workoutType === "HOME_WORKOUT") homeCount++;
    if (w.workoutType === "GYM_WORKOUT") gymCount++;
  }

  return (
    <div className="w-full bg-background-surface border border-purple-500/30 rounded-3xl p-5 sm:p-6 shadow-surface-card space-y-4 text-left animate-fade-in">
      <div className="flex items-center justify-between border-b border-border-subtle pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-purple-500/15 text-purple-400 border border-purple-500/30">
            <Dumbbell className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-foreground-primary tracking-tight">
              Strength &amp; Workout Analysis
            </h3>
            <p className="text-xs text-foreground-muted font-medium">
              Resistance training volume, exercise sets, and workload
            </p>
          </div>
        </div>

        <span className="px-2.5 py-1 rounded-xl bg-purple-500/15 text-purple-300 font-mono font-extrabold text-xs border border-purple-500/30">
          {workouts.length} {workouts.length === 1 ? "workout" : "workouts"} logged
        </span>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-2xl bg-background-elevated/70 border border-border-subtle space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-foreground-secondary font-bold">
            <Layers className="h-3.5 w-3.5 text-purple-400" />
            <span>Total Sets</span>
          </div>
          <p className="text-lg font-black text-purple-400 font-mono">{totalSets} sets</p>
        </div>

        <div className="p-3 rounded-2xl bg-background-elevated/70 border border-border-subtle space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-foreground-secondary font-bold">
            <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
            <span>Exercises</span>
          </div>
          <p className="text-lg font-black text-foreground-primary font-mono">{totalExercises} exercises</p>
        </div>

        <div className="p-3 rounded-2xl bg-background-elevated/70 border border-border-subtle space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-foreground-secondary font-bold">
            <Clock className="h-3.5 w-3.5 text-blue-400" />
            <span>Training Time</span>
          </div>
          <p className="text-lg font-black text-blue-400 font-mono">{formatDuration(totalDurationSeconds)}</p>
        </div>

        <div className="p-3 rounded-2xl bg-background-elevated/70 border border-border-subtle space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-foreground-secondary font-bold">
            <Flame className="h-3.5 w-3.5 text-rose-400" />
            <span>Calories Burned</span>
          </div>
          <p className="text-lg font-black text-rose-400 font-mono">{totalCalories.toLocaleString()} kcal</p>
        </div>
      </div>

      {/* Home vs Gym distribution */}
      <div className="pt-2 border-t border-border-subtle flex items-center gap-3">
        <span className="text-xs font-bold text-foreground-muted uppercase tracking-wider">
          Training Split:
        </span>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40 flex items-center gap-1">
            <Home className="h-3 w-3" />
            <span>Home: {homeCount}</span>
          </span>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
            <Dumbbell className="h-3 w-3" />
            <span>Gym: {gymCount}</span>
          </span>
        </div>
      </div>
    </div>
  );
}

export default WorkoutAnalysisCard;
