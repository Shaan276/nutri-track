"use client";

import React, { useState } from "react";
import {
  X,
  Plus,
  Trash2,
  Dumbbell,
  Home,
  Save,
  Loader2,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { WorkoutType } from "@/lib/validations/workout";

interface CreateWorkoutTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface TemplateExerciseFormState {
  id: string;
  name: string;
  category: string;
  defaultSets: string;
  defaultReps: string;
  defaultWeightKg: string;
  defaultDurationSeconds: string;
  notes: string;
}

export function CreateWorkoutTemplateModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateWorkoutTemplateModalProps) {
  const [workoutType, setWorkoutType] = useState<WorkoutType>("GYM_WORKOUT");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isFavorite, setIsFavorite] = useState(false);
  const [exercises, setExercises] = useState<TemplateExerciseFormState[]>([
    {
      id: "ex_1",
      name: "Barbell Bench Press",
      category: "Chest",
      defaultSets: "3",
      defaultReps: "10",
      defaultWeightKg: "50",
      defaultDurationSeconds: "",
      notes: "Focus on controlled eccentric",
    },
  ]);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleTypeSwitch = (type: WorkoutType) => {
    setWorkoutType(type);
    if (type === "HOME_WORKOUT") {
      setName("Full Body Calisthenics Routine");
      setDescription("Bodyweight circuit focusing on push-ups, squats, and core isometric holds.");
      setExercises([
        {
          id: "ex_1",
          name: "Push-ups",
          category: "Chest / Bodyweight",
          defaultSets: "3",
          defaultReps: "15",
          defaultWeightKg: "",
          defaultDurationSeconds: "",
          notes: "Clean form, full lockout",
        },
        {
          id: "ex_2",
          name: "Plank Hold",
          category: "Core",
          defaultSets: "3",
          defaultReps: "",
          defaultWeightKg: "",
          defaultDurationSeconds: "45",
          notes: "Keep core tight",
        },
      ]);
    } else {
      setName("Push Day Hypertrophy");
      setDescription("Chest, shoulders, and triceps hypertrophy blueprint.");
      setExercises([
        {
          id: "ex_1",
          name: "Barbell Bench Press",
          category: "Chest",
          defaultSets: "3",
          defaultReps: "10",
          defaultWeightKg: "50",
          defaultDurationSeconds: "",
          notes: "",
        },
        {
          id: "ex_2",
          name: "Incline Dumbbell Press",
          category: "Chest",
          defaultSets: "3",
          defaultReps: "12",
          defaultWeightKg: "20",
          defaultDurationSeconds: "",
          notes: "",
        },
      ]);
    }
  };

  const handleAddExercise = (presetName?: string, isPlank?: boolean) => {
    const isHome = workoutType === "HOME_WORKOUT";
    const newExName = presetName || (isHome ? "Bodyweight Squats" : "Barbell Squats");
    setExercises([
      ...exercises,
      {
        id: `ex_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name: newExName,
        category: isHome ? "Bodyweight" : "Legs",
        defaultSets: "3",
        defaultReps: isPlank ? "" : isHome ? "15" : "10",
        defaultWeightKg: isHome ? "" : "40",
        defaultDurationSeconds: isPlank ? "45" : "",
        notes: "",
      },
    ]);
  };

  const handleRemoveExercise = (exId: string) => {
    if (exercises.length <= 1) {
      setError("A workout blueprint must contain at least 1 exercise.");
      return;
    }
    setExercises(exercises.filter((e) => e.id !== exId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (!name.trim()) {
      setError("Please enter a routine name.");
      setIsLoading(false);
      return;
    }

    try {
      const payload = {
        name: name.trim(),
        description: description.trim() ? description.trim() : null,
        workoutType,
        isFavorite,
        exercises: exercises.map((ex, idx) => ({
          name: ex.name.trim() || `Exercise ${idx + 1}`,
          category: ex.category.trim() ? ex.category.trim() : null,
          defaultSets: parseInt(ex.defaultSets, 10) || 3,
          defaultReps: ex.defaultReps.trim() ? parseInt(ex.defaultReps, 10) : null,
          defaultWeightKg: ex.defaultWeightKg.trim() ? parseFloat(ex.defaultWeightKg) : null,
          defaultDurationSeconds: ex.defaultDurationSeconds.trim() ? parseInt(ex.defaultDurationSeconds, 10) : null,
          notes: ex.notes.trim() ? ex.notes.trim() : null,
          orderIndex: idx,
        })),
      };

      const res = await fetch("/api/workout-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create workout blueprint");
        return;
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 animate-fade-in">
      <div className="relative w-full max-w-2xl bg-background-surface border border-border-default rounded-3xl p-5 sm:p-7 shadow-2xl space-y-5 text-left max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border-subtle pb-4 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <Dumbbell className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-foreground-primary tracking-tight">
                Create Workout Routine Blueprint
              </h3>
              <p className="text-xs text-foreground-muted font-medium">
                Define reusable templates with default sets, reps, and weights
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-foreground-muted hover:text-foreground-primary hover:bg-background-elevated transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-2 shrink-0">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Workout Type Toggle */}
        <div className="grid grid-cols-2 gap-2 p-1.5 rounded-2xl bg-background-elevated/70 border border-border-subtle shrink-0">
          <button
            type="button"
            onClick={() => handleTypeSwitch("GYM_WORKOUT")}
            className={`py-2 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              workoutType === "GYM_WORKOUT"
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-sm"
                : "text-foreground-muted hover:text-foreground-primary"
            }`}
          >
            <Dumbbell className="h-4 w-4" />
            <span>Gym Workout Routine</span>
          </button>

          <button
            type="button"
            onClick={() => handleTypeSwitch("HOME_WORKOUT")}
            className={`py-2 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              workoutType === "HOME_WORKOUT"
                ? "bg-purple-500/20 text-purple-300 border border-purple-500/50 shadow-sm"
                : "text-foreground-muted hover:text-foreground-primary"
            }`}
          >
            <Home className="h-4 w-4" />
            <span>Home Workout Routine</span>
          </button>
        </div>

        {/* Scrollable Form Content */}
        <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto pr-1 flex-1">
          <div>
            <label className="block text-xs font-bold text-foreground-secondary uppercase tracking-wider mb-1.5">
              Routine Blueprint Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Push Day Heavy Bench / Full Body Calisthenics"
              className="w-full px-3.5 py-2.5 rounded-xl bg-background-elevated border border-border-default text-foreground-primary text-sm font-bold focus:outline-none focus:border-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-foreground-secondary uppercase tracking-wider mb-1.5">
              Description / Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. 3-day split routine focusing on progressive overload and chest hypertrophy."
              className="w-full px-3.5 py-2 rounded-xl bg-background-elevated border border-border-default text-foreground-primary text-xs focus:outline-none focus:border-brand-500"
            />
          </div>

          {/* Quick Presets */}
          <div>
            <span className="block text-[11px] font-bold text-foreground-muted uppercase tracking-wider mb-1.5">
              Quick Add Common Exercises:
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {(workoutType === "HOME_WORKOUT"
                ? ["Push-ups", "Bodyweight Squats", "Plank Hold", "Lunges", "Burpees", "Pull-ups", "Sit-ups"]
                : ["Barbell Bench Press", "Incline Dumbbell Press", "Barbell Squats", "Deadlift", "Overhead Press", "Barbell Row", "Lat Pulldown"]
              ).map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handleAddExercise(preset, preset.toLowerCase().includes("plank"))}
                  className="px-2.5 py-1 rounded-lg bg-background-elevated text-foreground-secondary hover:text-brand-400 hover:border-brand-500/40 border border-border-subtle text-[11px] font-semibold transition-all cursor-pointer"
                >
                  + {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Exercises Builder */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between border-t border-border-subtle pt-3">
              <div>
                <h4 className="text-xs font-extrabold text-foreground-primary uppercase tracking-wider">
                  Template Exercises ({exercises.length})
                </h4>
                <p className="text-[11px] text-foreground-muted font-medium">
                  {workoutType === "HOME_WORKOUT"
                    ? "Specify default sets and target reps or plank durations"
                    : "Specify default sets, target reps, and suggested starting weights (kg)"}
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleAddExercise()}
                className="py-1.5 px-3 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>+ Custom Exercise</span>
              </button>
            </div>

            <div className="space-y-3">
              {exercises.map((ex, exIdx) => (
                <div
                  key={ex.id}
                  className="p-3.5 rounded-2xl bg-background-elevated border border-border-subtle space-y-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        required
                        value={ex.name}
                        onChange={(e) => {
                          const updated = [...exercises];
                          updated[exIdx].name = e.target.value;
                          setExercises(updated);
                        }}
                        placeholder="Exercise Name (e.g. Bench Press)"
                        className="px-3 py-1.5 rounded-lg bg-background-surface border border-border-default text-foreground-primary text-xs font-bold focus:outline-none focus:border-brand-500"
                      />
                      <input
                        type="text"
                        value={ex.category}
                        onChange={(e) => {
                          const updated = [...exercises];
                          updated[exIdx].category = e.target.value;
                          setExercises(updated);
                        }}
                        placeholder="Muscle / Category (e.g. Chest)"
                        className="px-3 py-1.5 rounded-lg bg-background-surface border border-border-default text-foreground-secondary text-xs focus:outline-none focus:border-brand-500"
                      />
                    </div>

                    {exercises.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveExercise(ex.id)}
                        className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/20 transition-colors cursor-pointer shrink-0"
                        title="Remove Exercise"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  {/* Defaults Grid */}
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-foreground-muted uppercase tracking-wider mb-1">
                        Default Sets
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="20"
                        value={ex.defaultSets}
                        onChange={(e) => {
                          const updated = [...exercises];
                          updated[exIdx].defaultSets = e.target.value;
                          setExercises(updated);
                        }}
                        placeholder="3"
                        className="w-full px-2.5 py-1.5 rounded-lg bg-background-surface border border-border-default text-foreground-primary text-xs font-mono font-bold focus:outline-none focus:border-brand-500 text-center"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-foreground-muted uppercase tracking-wider mb-1">
                        Target Reps
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={ex.defaultReps}
                        onChange={(e) => {
                          const updated = [...exercises];
                          updated[exIdx].defaultReps = e.target.value;
                          setExercises(updated);
                        }}
                        placeholder="10"
                        className="w-full px-2.5 py-1.5 rounded-lg bg-background-surface border border-border-default text-foreground-primary text-xs font-mono font-bold focus:outline-none focus:border-brand-500 text-center"
                      />
                    </div>

                    {workoutType === "GYM_WORKOUT" ? (
                      <div>
                        <label className="block text-[10px] font-bold text-foreground-muted uppercase tracking-wider mb-1">
                          Default Weight (kg)
                        </label>
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          value={ex.defaultWeightKg}
                          onChange={(e) => {
                            const updated = [...exercises];
                            updated[exIdx].defaultWeightKg = e.target.value;
                            setExercises(updated);
                          }}
                          placeholder="50"
                          className="w-full px-2.5 py-1.5 rounded-lg bg-background-surface border border-border-default text-foreground-primary text-xs font-mono font-bold focus:outline-none focus:border-brand-500 text-center"
                        />
                      </div>
                    ) : (
                      <div>
                        <label className="block text-[10px] font-bold text-foreground-muted uppercase tracking-wider mb-1">
                          Duration (s)
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={ex.defaultDurationSeconds}
                          onChange={(e) => {
                            const updated = [...exercises];
                            updated[exIdx].defaultDurationSeconds = e.target.value;
                            setExercises(updated);
                          }}
                          placeholder="45"
                          className="w-full px-2.5 py-1.5 rounded-lg bg-background-surface border border-border-default text-foreground-primary text-xs font-mono font-bold focus:outline-none focus:border-brand-500 text-center"
                        />
                      </div>
                    )}

                    <div className="col-span-3 sm:col-span-1">
                      <label className="block text-[10px] font-bold text-foreground-muted uppercase tracking-wider mb-1">
                        Notes
                      </label>
                      <input
                        type="text"
                        value={ex.notes}
                        onChange={(e) => {
                          const updated = [...exercises];
                          updated[exIdx].notes = e.target.value;
                          setExercises(updated);
                        }}
                        placeholder="e.g. 2s pause"
                        className="w-full px-2.5 py-1.5 rounded-lg bg-background-surface border border-border-default text-foreground-secondary text-xs focus:outline-none focus:border-brand-500"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Modal Actions */}
          <div className="pt-3 border-t border-border-subtle flex items-center justify-end gap-2.5 shrink-0">
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
              className="py-2.5 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-black font-black text-xs transition-all shadow-brand-glow flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Saving Blueprint...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Save Workout Blueprint</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateWorkoutTemplateModal;
