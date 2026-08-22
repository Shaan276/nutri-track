"use client";

import React, { useState, useEffect } from "react";
import { X, Dumbbell, Home, Plus, Trash2, Clock, Flame, Loader2, AlertCircle, Sparkles } from "lucide-react";
import { WorkoutType, workoutTypeDisplayNames } from "@/lib/validations/workout";

interface ExerciseFormState {
  name: string;
  category: string;
  notes: string;
  sets: Array<{
    reps: string;
    weightKg: string;
    durationSeconds: string;
    notes: string;
  }>;
}

interface LogWorkoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultDate?: string;
  onSuccess: () => void;
}

export function LogWorkoutModal({
  isOpen,
  onClose,
  defaultDate,
  onSuccess,
}: LogWorkoutModalProps) {
  const [workoutType, setWorkoutType] = useState<WorkoutType>("GYM_WORKOUT");
  const [name, setName] = useState<string>("Upper Body Strength");
  const [date, setDate] = useState<string>(defaultDate || new Date().toISOString().split("T")[0]);
  const [durationMinutes, setDurationMinutes] = useState<string>("45");
  const [caloriesBurned, setCaloriesBurned] = useState<string>("280");
  const [notes, setNotes] = useState<string>("");

  const [exercises, setExercises] = useState<ExerciseFormState[]>([
    {
      name: "Bench Press",
      category: "Chest",
      notes: "",
      sets: [
        { reps: "12", weightKg: "40", durationSeconds: "", notes: "" },
        { reps: "10", weightKg: "50", durationSeconds: "", notes: "" },
        { reps: "8", weightKg: "55", durationSeconds: "", notes: "" },
      ],
    },
  ]);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (defaultDate) setDate(defaultDate);
      setError(null);
    }
  }, [isOpen, defaultDate]);

  if (!isOpen) return null;

  const handleTypeChange = (type: WorkoutType) => {
    setWorkoutType(type);
    if (type === "HOME_WORKOUT") {
      setName("Morning Home Workout");
      setExercises([
        {
          name: "Push-ups",
          category: "Chest / Bodyweight",
          notes: "",
          sets: [
            { reps: "15", weightKg: "", durationSeconds: "", notes: "" },
            { reps: "12", weightKg: "", durationSeconds: "", notes: "" },
            { reps: "10", weightKg: "", durationSeconds: "", notes: "" },
          ],
        },
        {
          name: "Plank",
          category: "Core",
          notes: "",
          sets: [
            { reps: "", weightKg: "", durationSeconds: "45", notes: "" },
            { reps: "", weightKg: "", durationSeconds: "45", notes: "" },
          ],
        },
      ]);
    } else {
      setName("Gym Strength Session");
      setExercises([
        {
          name: "Bench Press",
          category: "Chest",
          notes: "",
          sets: [
            { reps: "12", weightKg: "40", durationSeconds: "", notes: "" },
            { reps: "10", weightKg: "50", durationSeconds: "", notes: "" },
            { reps: "8", weightKg: "55", durationSeconds: "", notes: "" },
          ],
        },
      ]);
    }
  };

  const handleAddExercise = () => {
    setExercises((prev) => [
      ...prev,
      {
        name: workoutType === "HOME_WORKOUT" ? "Bodyweight Squats" : "Barbell Squats",
        category: "Legs",
        notes: "",
        sets: [
          { reps: "12", weightKg: workoutType === "HOME_WORKOUT" ? "" : "60", durationSeconds: "", notes: "" },
          { reps: "10", weightKg: workoutType === "HOME_WORKOUT" ? "" : "70", durationSeconds: "", notes: "" },
          { reps: "8", weightKg: workoutType === "HOME_WORKOUT" ? "" : "80", durationSeconds: "", notes: "" },
        ],
      },
    ]);
  };

  const handleRemoveExercise = (index: number) => {
    if (exercises.length <= 1) {
      setError("Workout must contain at least one exercise.");
      return;
    }
    setExercises((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddSet = (exerciseIndex: number) => {
    setExercises((prev) => {
      const copy = [...prev];
      const ex = { ...copy[exerciseIndex] };
      const lastSet = ex.sets[ex.sets.length - 1];
      ex.sets = [
        ...ex.sets,
        {
          reps: lastSet?.reps || "10",
          weightKg: lastSet?.weightKg || "",
          durationSeconds: lastSet?.durationSeconds || "",
          notes: "",
        },
      ];
      copy[exerciseIndex] = ex;
      return copy;
    });
  };

  const handleRemoveSet = (exerciseIndex: number, setIndex: number) => {
    setExercises((prev) => {
      const copy = [...prev];
      const ex = { ...copy[exerciseIndex] };
      if (ex.sets.length <= 1) {
        return copy; // Keep at least one set
      }
      ex.sets = ex.sets.filter((_, i) => i !== setIndex);
      copy[exerciseIndex] = ex;
      return copy;
    });
  };

  const handleSetChange = (
    exerciseIndex: number,
    setIndex: number,
    field: "reps" | "weightKg" | "durationSeconds" | "notes",
    val: string
  ) => {
    setExercises((prev) => {
      const copy = [...prev];
      const ex = { ...copy[exerciseIndex] };
      const sList = [...ex.sets];
      sList[setIndex] = { ...sList[setIndex], [field]: val };
      ex.sets = sList;
      copy[exerciseIndex] = ex;
      return copy;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please provide a workout name.");
      return;
    }

    if (exercises.length === 0) {
      setError("Please add at least one exercise.");
      return;
    }

    // Validate exercises
    for (let i = 0; i < exercises.length; i++) {
      const ex = exercises[i];
      if (!ex.name.trim()) {
        setError(`Exercise #${i + 1} requires a name.`);
        return;
      }
      if (ex.sets.length === 0) {
        setError(`Exercise "${ex.name}" requires at least 1 set.`);
        return;
      }
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
        exercises: exercises.map((ex, exIdx) => ({
          name: ex.name.trim(),
          category: ex.category ? ex.category.trim() : null,
          orderIndex: exIdx,
          notes: ex.notes ? ex.notes.trim() : null,
          sets: ex.sets.map((st, stIdx) => ({
            setNumber: stIdx + 1,
            reps: st.reps ? parseInt(st.reps, 10) : null,
            weightKg: st.weightKg ? parseFloat(st.weightKg) : null,
            durationSeconds: st.durationSeconds ? parseInt(st.durationSeconds, 10) : null,
            notes: st.notes ? st.notes.trim() : null,
          })),
        })),
      };

      const res = await fetch("/api/workouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to save workout session.");
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
      <div className="relative w-full max-w-2xl bg-background-surface border border-border-default rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5 text-left max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-border-subtle pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400">
              <Dumbbell className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground-primary">
                Log Structured Workout
              </h3>
              <p className="text-xs text-foreground-muted">
                Track strength training, exercises, per-set weights &amp; reps
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

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Workout Type Selector */}
          <div>
            <label className="block text-xs font-bold text-foreground-secondary mb-1.5">
              Workout Category
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleTypeChange("GYM_WORKOUT")}
                className={`py-3 px-4 rounded-2xl border text-xs font-extrabold flex items-center justify-center gap-2.5 transition-all ${
                  workoutType === "GYM_WORKOUT"
                    ? "border-emerald-500/60 bg-emerald-500/15 text-emerald-300 shadow-sm"
                    : "border-border-subtle bg-background-elevated/60 text-foreground-secondary hover:text-foreground-primary"
                }`}
              >
                <Dumbbell className="h-4 w-4 text-emerald-400" />
                <span>Gym Workout (Weights &amp; Reps)</span>
              </button>

              <button
                type="button"
                onClick={() => handleTypeChange("HOME_WORKOUT")}
                className={`py-3 px-4 rounded-2xl border text-xs font-extrabold flex items-center justify-center gap-2.5 transition-all ${
                  workoutType === "HOME_WORKOUT"
                    ? "border-purple-500/60 bg-purple-500/15 text-purple-300 shadow-sm"
                    : "border-border-subtle bg-background-elevated/60 text-foreground-secondary hover:text-foreground-primary"
                }`}
              >
                <Home className="h-4 w-4 text-purple-400" />
                <span>Home Workout (Bodyweight &amp; Core)</span>
              </button>
            </div>
          </div>

          {/* Workout Name & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-foreground-secondary mb-1.5">
                Workout Session Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Chest & Triceps Blast"
                className="w-full px-3.5 py-2.5 rounded-xl bg-background-elevated border border-border-default text-foreground-primary text-sm font-medium focus:outline-none focus:border-emerald-500/60"
              />
            </div>

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
                Estimated Calories (kcal)
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

          {/* Exercise Builder Section */}
          <div className="space-y-4 pt-2 border-t border-border-subtle">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-foreground-primary">
                  Exercises &amp; Set Breakdown
                </h4>
                <p className="text-xs text-foreground-muted">
                  Log individual weight (kg) and reps for every set
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddExercise}
                className="py-1.5 px-3 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Exercise</span>
              </button>
            </div>

            {/* Exercise Items List */}
            <div className="space-y-4">
              {exercises.map((ex, exIndex) => (
                <div
                  key={exIndex}
                  className="p-4 rounded-2xl bg-background-elevated border border-border-subtle space-y-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 flex-1">
                      <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 font-black text-xs flex items-center justify-center font-mono shrink-0">
                        {exIndex + 1}
                      </span>
                      <input
                        type="text"
                        value={ex.name}
                        onChange={(e) => {
                          const copy = [...exercises];
                          copy[exIndex].name = e.target.value;
                          setExercises(copy);
                        }}
                        placeholder="Exercise name (e.g. Bench Press)"
                        className="w-full px-3 py-1.5 rounded-xl bg-background-surface border border-border-default text-foreground-primary text-sm font-bold focus:outline-none focus:border-emerald-500/60"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveExercise(exIndex)}
                      title="Remove exercise"
                      className="p-1.5 rounded-xl text-foreground-muted hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Sets Table for this exercise */}
                  <div className="space-y-2">
                    <div className="grid grid-cols-12 gap-2 text-[10px] font-bold text-foreground-muted uppercase px-1">
                      <div className="col-span-2">Set</div>
                      <div className="col-span-3">{workoutType === "HOME_WORKOUT" ? "Weight (opt)" : "Weight (kg)"}</div>
                      <div className="col-span-3">Reps</div>
                      <div className="col-span-3">Duration (s)</div>
                      <div className="col-span-1"></div>
                    </div>

                    {ex.sets.map((set, setIndex) => (
                      <div key={setIndex} className="grid grid-cols-12 gap-2 items-center">
                        <div className="col-span-2 text-xs font-mono font-bold text-foreground-primary px-1">
                          #{setIndex + 1}
                        </div>
                        <div className="col-span-3">
                          <input
                            type="number"
                            step="0.5"
                            min="0"
                            placeholder="kg"
                            value={set.weightKg}
                            onChange={(e) => handleSetChange(exIndex, setIndex, "weightKg", e.target.value)}
                            className="w-full px-2 py-1 rounded-lg bg-background-surface border border-border-default text-foreground-primary text-xs font-mono focus:outline-none focus:border-emerald-500/60"
                          />
                        </div>
                        <div className="col-span-3">
                          <input
                            type="number"
                            min="1"
                            placeholder="Reps"
                            value={set.reps}
                            onChange={(e) => handleSetChange(exIndex, setIndex, "reps", e.target.value)}
                            className="w-full px-2 py-1 rounded-lg bg-background-surface border border-border-default text-foreground-primary text-xs font-mono focus:outline-none focus:border-emerald-500/60"
                          />
                        </div>
                        <div className="col-span-3">
                          <input
                            type="number"
                            min="1"
                            placeholder="Sec"
                            value={set.durationSeconds}
                            onChange={(e) => handleSetChange(exIndex, setIndex, "durationSeconds", e.target.value)}
                            className="w-full px-2 py-1 rounded-lg bg-background-surface border border-border-default text-foreground-primary text-xs font-mono focus:outline-none focus:border-emerald-500/60"
                          />
                        </div>
                        <div className="col-span-1 flex justify-end">
                          <button
                            type="button"
                            onClick={() => handleRemoveSet(exIndex, setIndex)}
                            disabled={ex.sets.length <= 1}
                            className="p-1 text-foreground-muted hover:text-rose-400 transition-colors disabled:opacity-20 cursor-pointer"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}

                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => handleAddSet(exIndex)}
                        className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="h-3 w-3" />
                        <span>Add Next Set</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-foreground-secondary mb-1">
              Workout Notes (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Great intensity, increased bench press weight"
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
                  <span>Saving Workout...</span>
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  <span>Save Workout Session</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
