"use client";

import React, { useState, useEffect } from "react";
import { X, Activity, Gauge, Clock, Flame, Footprints, Mountain, Loader2, Plus, AlertCircle, Bike } from "lucide-react";
import {
  formatPace,
  calculateAveragePace,
  calculateCyclingSpeed,
  ActivityType,
  RunningType,
  activityTypeDisplayNames,
  activityTypeIcons,
  runningTypeDisplayNames,
  runningTypeBadges,
} from "@/lib/validations/activity";
import { RunningTypeTooltip } from "@/components/activity/RunningTypeTooltip";

interface LogRunModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultDate?: string;
  onSuccess: () => void;
}

export function LogRunModal({
  isOpen,
  onClose,
  defaultDate,
  onSuccess,
}: LogRunModalProps) {
  const [activityType, setActivityType] = useState<ActivityType>("RUN");
  const [runningType, setRunningType] = useState<RunningType>("EASY");
  const [date, setDate] = useState<string>(defaultDate || new Date().toISOString().split("T")[0]);
  const [distanceKm, setDistanceKm] = useState<string>("5.0");
  const [durationMinutes, setDurationMinutes] = useState<string>("25");
  const [durationSeconds, setDurationSeconds] = useState<string>("0");
  const [steps, setSteps] = useState<string>("6000");
  const [caloriesBurned, setCaloriesBurned] = useState<string>("350");
  const [elevationGainMeters, setElevationGainMeters] = useState<string>("45");
  const [notes, setNotes] = useState<string>("");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (defaultDate) setDate(defaultDate);
      setError(null);
    }
  }, [isOpen, defaultDate]);

  if (!isOpen) return null;

  const distNum = parseFloat(distanceKm) || 0;
  const minsNum = parseInt(durationMinutes, 10) || 0;
  const secsNum = parseInt(durationSeconds, 10) || 0;
  const totalDurationSecs = minsNum * 60 + secsNum;
  const livePaceSecs = calculateAveragePace(distNum, totalDurationSecs);
  const livePaceFormatted = formatPace(livePaceSecs);
  const cyclingSpeedKmh = calculateCyclingSpeed(distNum, totalDurationSecs);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (totalDurationSecs <= 0) {
      setError("Please enter a valid duration greater than 0 seconds.");
      return;
    }

    if ((activityType === "RUN" || activityType === "WALK" || activityType === "CYCLING") && distNum <= 0) {
      setError(`Please enter a valid distance greater than 0 km for ${activityTypeDisplayNames[activityType].toLowerCase()}.`);
      return;
    }

    if (activityType === "RUN" && !runningType) {
      setError("Please select a running type (Easy, Long, Tempo, or Recovery).");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const payload = {
        activityType,
        runningType: activityType === "RUN" ? runningType : null,
        date,
        distanceKm: distNum,
        movingDurationSeconds: totalDurationSecs,
        steps: parseInt(steps, 10) || 0,
        caloriesBurned: parseInt(caloriesBurned, 10) || 0,
        elevationGainMeters: parseInt(elevationGainMeters, 10) || 0,
        notes: notes.trim() ? notes.trim() : null,
      };

      const res = await fetch("/api/activity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to log activity session.");
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

  const activityTypesList: ActivityType[] = ["RUN", "WALK", "CYCLING", "HIIT", "OTHER"];
  const runningTypesList: RunningType[] = ["EASY", "LONG", "TEMPO", "RECOVERY"];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 animate-fade-in">
      <div className="relative w-full max-w-lg bg-background-surface border border-border-default rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5 text-left max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-border-subtle pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground-primary">
                Log Activity / Workout
              </h3>
              <p className="text-xs text-foreground-muted">
                Track cardio telemetry, duration, and calories
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
          {/* Activity Type Selector */}
          <div>
            <label className="block text-xs font-bold text-foreground-secondary mb-1.5">
              Activity Type
            </label>
            <div className="grid grid-cols-5 gap-1.5">
              {activityTypesList.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setActivityType(type)}
                  className={`py-2 px-1 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-1 border ${
                    activityType === type
                      ? "bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm"
                      : "bg-background-elevated/70 text-foreground-muted border-border-subtle hover:text-foreground-primary"
                  }`}
                >
                  <span className="text-base select-none">{activityTypeIcons[type]}</span>
                  <span className="text-[10px] truncate max-w-full font-semibold">{activityTypeDisplayNames[type]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Running Type Selector (If RUN) */}
          {activityType === "RUN" && (
            <div className="p-3.5 rounded-2xl bg-background-elevated/60 border border-border-subtle space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-foreground-secondary">
                  Running Session Type <span className="text-rose-400">*</span>
                </label>
                <RunningTypeTooltip selectedType={runningType} onSelect={(t) => setRunningType(t)} showSelector />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {runningTypesList.map((rType) => {
                  const badge = runningTypeBadges[rType];
                  const isSel = runningType === rType;
                  return (
                    <button
                      key={rType}
                      type="button"
                      onClick={() => setRunningType(rType)}
                      className={`py-2 px-2.5 rounded-xl border text-xs font-bold transition-all text-center ${
                        isSel
                          ? "border-amber-400 bg-amber-500/20 text-amber-300 shadow-sm"
                          : "border-border-subtle bg-background-surface hover:border-border-default text-foreground-secondary"
                      }`}
                    >
                      {runningTypeDisplayNames[rType]}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Date Picker */}
          <div>
            <label className="block text-xs font-bold text-foreground-secondary mb-1.5">
              Activity Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-background-elevated border border-border-default text-foreground-primary text-sm font-medium focus:outline-none focus:border-amber-500/60"
            />
          </div>

          {/* Distance & Duration Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {activityType !== "HIIT" && (
              <div>
                <label className="block text-xs font-bold text-foreground-secondary mb-1.5">
                  Distance (km)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max="500"
                  value={distanceKm}
                  onChange={(e) => setDistanceKm(e.target.value)}
                  placeholder="5.00"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background-elevated border border-border-default text-foreground-primary text-sm font-bold font-mono focus:outline-none focus:border-amber-500/60"
                />
              </div>
            )}

            <div className={activityType === "HIIT" ? "sm:col-span-2" : ""}>
              <label className="block text-xs font-bold text-foreground-secondary mb-1.5">
                Moving Duration (Min : Sec)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="1440"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(e.target.value)}
                  placeholder="Min"
                  className="w-1/2 px-3 py-2.5 rounded-xl bg-background-elevated border border-border-default text-foreground-primary text-sm font-bold font-mono focus:outline-none focus:border-amber-500/60 text-center"
                />
                <span className="text-foreground-muted font-bold">:</span>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={durationSeconds}
                  onChange={(e) => setDurationSeconds(e.target.value)}
                  placeholder="Sec"
                  className="w-1/2 px-3 py-2.5 rounded-xl bg-background-elevated border border-border-default text-foreground-primary text-sm font-bold font-mono focus:outline-none focus:border-amber-500/60 text-center"
                />
              </div>
            </div>
          </div>

          {/* Dynamic Pace or Speed Calculation Banner */}
          {activityType === "RUN" && (
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Gauge className="h-4 w-4 text-amber-400" />
                <span className="text-xs font-bold text-foreground-secondary">Calculated Pace:</span>
              </div>
              <span className="text-sm font-extrabold text-amber-400 font-mono">
                {livePaceFormatted}
              </span>
            </div>
          )}

          {activityType === "CYCLING" && (
            <div className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bike className="h-4 w-4 text-blue-400" />
                <span className="text-xs font-bold text-foreground-secondary">Average Speed:</span>
              </div>
              <span className="text-sm font-extrabold text-blue-400 font-mono">
                {cyclingSpeedKmh > 0 ? `${cyclingSpeedKmh} km/h` : "--.- km/h"}
              </span>
            </div>
          )}

          {/* Steps, Calories & Elevation Grid */}
          <div className="grid grid-cols-3 gap-2.5">
            <div>
              <label className="block text-[11px] font-bold text-foreground-secondary mb-1">
                Steps
              </label>
              <input
                type="number"
                min="0"
                value={steps}
                onChange={(e) => setSteps(e.target.value)}
                placeholder="6000"
                className="w-full px-2.5 py-2 rounded-xl bg-background-elevated border border-border-default text-foreground-primary text-xs font-mono focus:outline-none focus:border-amber-500/60"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-foreground-secondary mb-1">
                Calories (kcal)
              </label>
              <input
                type="number"
                min="0"
                value={caloriesBurned}
                onChange={(e) => setCaloriesBurned(e.target.value)}
                placeholder="350"
                className="w-full px-2.5 py-2 rounded-xl bg-background-elevated border border-border-default text-foreground-primary text-xs font-mono focus:outline-none focus:border-amber-500/60"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-foreground-secondary mb-1">
                Elevation (m)
              </label>
              <input
                type="number"
                min="0"
                value={elevationGainMeters}
                onChange={(e) => setElevationGainMeters(e.target.value)}
                placeholder="45"
                className="w-full px-2.5 py-2 rounded-xl bg-background-elevated border border-border-default text-foreground-primary text-xs font-mono focus:outline-none focus:border-amber-500/60"
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
              placeholder="e.g. Felt smooth, morning cool weather"
              className="w-full px-3.5 py-2 rounded-xl bg-background-elevated border border-border-default text-foreground-primary text-xs focus:outline-none focus:border-amber-500/60"
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
              className="py-2.5 px-5 rounded-xl bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-black font-extrabold text-xs transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Saving Session...</span>
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  <span>Save Activity Session</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
