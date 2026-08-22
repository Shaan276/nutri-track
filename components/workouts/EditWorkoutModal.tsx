"use client";

import React, { useState, useEffect } from "react";
import { X, Dumbbell, Save, Loader2, AlertCircle } from "lucide-react";
import { WorkoutSessionDto } from "@/lib/services/workout.service";
import { WorkoutType, workoutTypeDisplayNames } from "@/lib/validations/workout";

interface EditWorkoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: WorkoutSessionDto | null;
  onSuccess: () => void;
}

export function EditWorkoutModal({
  isOpen,
  onClose,
  session,
  onSuccess,
}: EditWorkoutModalProps) {
  const [workoutType, setWorkoutType] = useState<WorkoutType>("GYM_WORKOUT");
  const [name, setName] = useState<string>("");
  const [date, setDate] = useState<string>("");
  const [durationMinutes, setDurationMinutes] = useState<string>("");
  const [caloriesBurned, setCaloriesBurned] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session) {
      setWorkoutType(session.workoutType);
      setName(session.name);
      setDate(session.date);
      setDurationMinutes(String(Math.floor(session.durationSeconds / 60)));
      setCaloriesBurned(String(session.caloriesBurned));
      setNotes(session.notes || "");
      setError(null);
    }
  }, [session]);

  if (!isOpen || !session) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please provide a workout name.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const payload = {
        workoutType,
        name: name.trim(),
        date,
        durationSeconds: (parseInt(durationMinutes, 10) || 0) * 60,
        caloriesBurned: parseInt(caloriesBurned, 10) || 0,
        notes: notes.trim() ? notes.trim() : null,
      };

      const res = await fetch(`/api/workouts/${session.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to update workout session.");
        return;
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "An unexpected network error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 animate-fade-in">
      <div className="relative w-full max-w-lg bg-background-surface border border-border-default rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5 text-left max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-border-subtle pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400">
              <Dumbbell className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground-primary">
                Edit Workout Details
              </h3>
              <p className="text-xs text-foreground-muted">
                Update session metadata, active time, and notes
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-foreground-muted hover:text-foreground-primary hover:bg-background-elevated transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Workout Type */}
          <div>
            <label className="block text-xs font-bold text-foreground-secondary mb-1.5">
              Workout Category
            </label>
            <select
              value={workoutType}
              onChange={(e) => setWorkoutType(e.target.value as WorkoutType)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-background-elevated border border-border-default text-foreground-primary text-sm font-medium focus:outline-none focus:border-emerald-500/60"
            >
              <option value="GYM_WORKOUT">Gym Workout (Weights &amp; Reps)</option>
              <option value="HOME_WORKOUT">Home Workout (Bodyweight &amp; Core)</option>
            </select>
          </div>

          {/* Workout Name */}
          <div>
            <label className="block text-xs font-bold text-foreground-secondary mb-1.5">
              Workout Session Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Upper Body Strength"
              className="w-full px-3.5 py-2.5 rounded-xl bg-background-elevated border border-border-default text-foreground-primary text-sm font-medium focus:outline-none focus:border-emerald-500/60"
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-xs font-bold text-foreground-secondary mb-1.5">
              Session Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-background-elevated border border-border-default text-foreground-primary text-sm font-medium focus:outline-none focus:border-emerald-500/60"
            />
          </div>

          {/* Duration & Calories */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-foreground-secondary mb-1.5">
                Duration (Minutes)
              </label>
              <input
                type="number"
                min="0"
                max="300"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                placeholder="45"
                className="w-full px-3.5 py-2.5 rounded-xl bg-background-elevated border border-border-default text-foreground-primary text-sm font-mono focus:outline-none focus:border-emerald-500/60"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-foreground-secondary mb-1.5">
                Calories (kcal)
              </label>
              <input
                type="number"
                min="0"
                max="5000"
                value={caloriesBurned}
                onChange={(e) => setCaloriesBurned(e.target.value)}
                placeholder="280"
                className="w-full px-3.5 py-2.5 rounded-xl bg-background-elevated border border-border-default text-foreground-primary text-sm font-mono focus:outline-none focus:border-emerald-500/60"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-foreground-secondary mb-1">
              Notes (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Great session"
              className="w-full px-3.5 py-2 rounded-xl bg-background-elevated border border-border-default text-foreground-primary text-xs focus:outline-none focus:border-emerald-500/60"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-border-subtle flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 rounded-xl bg-background-elevated hover:bg-background-elevated/80 text-foreground-secondary hover:text-foreground-primary text-xs font-bold transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isLoading}
              className="py-2.5 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-black font-extrabold text-xs transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
