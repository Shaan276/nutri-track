"use client";

import React, { useState, useEffect } from "react";
import { X, Save, Loader2, AlertCircle, Activity, Dumbbell } from "lucide-react";
import { UnifiedActivityItem } from "@/lib/services/unified-activity.service";
import { RunningType, runningTypeDisplayNames } from "@/lib/validations/activity";

interface EditUnifiedActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: UnifiedActivityItem | null;
  onSuccess: () => void;
}

export function EditUnifiedActivityModal({
  isOpen,
  onClose,
  item,
  onSuccess,
}: EditUnifiedActivityModalProps) {
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("");
  const [distanceKm, setDistanceKm] = useState("");
  const [caloriesBurned, setCaloriesBurned] = useState("");
  const [runningType, setRunningType] = useState<RunningType>("EASY");
  const [notes, setNotes] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (item) {
      setName(item.title);
      setDate(item.date);
      setDurationMinutes(String(Math.floor(item.durationSeconds / 60)));
      setDistanceKm(item.distanceKm ? String(item.distanceKm) : "");
      setCaloriesBurned(String(item.caloriesBurned));
      setRunningType(item.runningType || "EASY");
      setNotes(item.notes || "");
      setError(null);
    }
  }, [item]);

  if (!isOpen || !item) return null;

  const isWorkout = item.kind === "WORKOUT";
  const isRun = item.categoryKey === "RUN";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (isWorkout) {
        const payload = {
          name: name.trim() || item.title,
          date,
          durationSeconds: (parseInt(durationMinutes, 10) || 0) * 60,
          caloriesBurned: parseInt(caloriesBurned, 10) || 0,
          notes: notes.trim() ? notes.trim() : null,
        };

        const res = await fetch(`/api/workouts/${item.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Failed to update workout.");
          return;
        }
      } else {
        const payload = {
          date,
          distanceKm: parseFloat(distanceKm) || 0,
          movingDurationSeconds: (parseInt(durationMinutes, 10) || 0) * 60,
          caloriesBurned: parseInt(caloriesBurned, 10) || 0,
          runningType: isRun ? runningType : null,
          notes: notes.trim() ? notes.trim() : null,
        };

        const res = await fetch(`/api/activity/${item.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Failed to update activity.");
          return;
        }
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 animate-fade-in">
      <div className="relative w-full max-w-lg bg-background-surface border border-border-default rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5 text-left max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border-subtle pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400">
              {isWorkout ? <Dumbbell className="h-5 w-5" /> : <Activity className="h-5 w-5" />}
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground-primary">
                Edit {isWorkout ? "Workout Session" : "Activity Log"}
              </h3>
              <p className="text-xs text-foreground-muted">
                Update date, active duration, calories, or telemetry
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
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name / Title */}
          <div>
            <label className="block text-xs font-bold text-foreground-secondary uppercase tracking-wider mb-1.5">
              {isWorkout ? "Workout Session Name" : "Activity Title"}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-background-elevated border border-border-default text-foreground-primary text-sm font-semibold focus:outline-none focus:border-emerald-500/60"
            />
          </div>

          {/* Running Subtype if Run */}
          {isRun && (
            <div>
              <label className="block text-xs font-bold text-foreground-secondary uppercase tracking-wider mb-1.5">
                Running Session Type
              </label>
              <select
                value={runningType}
                onChange={(e) => setRunningType(e.target.value as RunningType)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-background-elevated border border-border-default text-foreground-primary text-sm font-semibold focus:outline-none focus:border-emerald-500/60"
              >
                {(
                  ["EASY", "LONG", "TEMPO", "RECOVERY", "INTERVAL", "RACE", "OTHER"] as RunningType[]
                ).map((t) => (
                  <option key={t} value={t}>
                    {runningTypeDisplayNames[t]}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Date */}
          <div>
            <label className="block text-xs font-bold text-foreground-secondary uppercase tracking-wider mb-1.5">
              Activity Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-background-elevated border border-border-default text-foreground-primary text-sm font-semibold focus:outline-none focus:border-emerald-500/60"
            />
          </div>

          {/* Duration, Calories, Distance */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-foreground-secondary uppercase tracking-wider mb-1.5">
                Duration (Minutes)
              </label>
              <input
                type="number"
                min="1"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-background-elevated border border-border-default text-foreground-primary text-sm font-mono font-bold focus:outline-none focus:border-emerald-500/60"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-foreground-secondary uppercase tracking-wider mb-1.5">
                Calories (kcal)
              </label>
              <input
                type="number"
                min="0"
                value={caloriesBurned}
                onChange={(e) => setCaloriesBurned(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-background-elevated border border-border-default text-foreground-primary text-sm font-mono font-bold focus:outline-none focus:border-emerald-500/60"
              />
            </div>
          </div>

          {!isWorkout && item.distanceKm !== undefined && (
            <div>
              <label className="block text-xs font-bold text-foreground-secondary uppercase tracking-wider mb-1.5">
                Distance (km)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={distanceKm}
                onChange={(e) => setDistanceKm(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-background-elevated border border-border-default text-foreground-primary text-sm font-mono font-bold focus:outline-none focus:border-emerald-500/60"
              />
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-foreground-secondary uppercase tracking-wider mb-1">
              Notes (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-background-elevated border border-border-default text-foreground-primary text-xs focus:outline-none focus:border-emerald-500/60"
            />
          </div>

          {/* Modal Actions */}
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

export default EditUnifiedActivityModal;
