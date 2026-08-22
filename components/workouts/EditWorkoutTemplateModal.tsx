"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Plus,
  Trash2,
  Dumbbell,
  Home,
  Save,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { WorkoutType } from "@/lib/validations/workout";
import { WorkoutTemplateDto } from "@/lib/validations/workout-template";

interface EditWorkoutTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  template: WorkoutTemplateDto | null;
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

export function EditWorkoutTemplateModal({
  isOpen,
  onClose,
  template,
  onSuccess,
}: EditWorkoutTemplateModalProps) {
  const [workoutType, setWorkoutType] = useState<WorkoutType>("GYM_WORKOUT");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isFavorite, setIsFavorite] = useState(false);
  const [exercises, setExercises] = useState<TemplateExerciseFormState[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (template) {
      setName(template.name);
      setDescription(template.description || "");
      setWorkoutType(template.workoutType);
      setIsFavorite(template.isFavorite);
      setExercises(
        template.exercises.map((ex) => ({
          id: ex.id,
          name: ex.name,
          category: ex.category || "",
          defaultSets: String(ex.defaultSets || 3),
          defaultReps: ex.defaultReps !== null && ex.defaultReps !== undefined ? String(ex.defaultReps) : "",
          defaultWeightKg: ex.defaultWeightKg !== null && ex.defaultWeightKg !== undefined ? String(ex.defaultWeightKg) : "",
          defaultDurationSeconds: ex.defaultDurationSeconds !== null && ex.defaultDurationSeconds !== undefined ? String(ex.defaultDurationSeconds) : "",
          notes: ex.notes || "",
        }))
      );
    }
  }, [template]);

  if (!isOpen || !template) return null;

  const handleAddExercise = () => {
    const isHome = workoutType === "HOME_WORKOUT";
    setExercises([
      ...exercises,
      {
        id: `ex_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name: isHome ? "Bodyweight Exercise" : "Weight Exercise",
        category: isHome ? "Bodyweight" : "Strength",
        defaultSets: "3",
        defaultReps: isHome ? "15" : "10",
        defaultWeightKg: isHome ? "" : "30",
        defaultDurationSeconds: "",
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

      const res = await fetch(`/api/workout-templates/${template.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to update workout blueprint");
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
            <div className="p-2.5 rounded-2xl bg-brand-500/15 text-brand-400 border border-brand-500/30">
              <Dumbbell className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-foreground-primary tracking-tight">
                Edit Workout Routine Blueprint
              </h3>
              <p className="text-xs text-foreground-muted font-medium">
                Update template defaults for this reusable workout routine
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
              placeholder="e.g. Push Day Heavy Bench"
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
              placeholder="e.g. 3-day split routine"
              className="w-full px-3.5 py-2 rounded-xl bg-background-elevated border border-border-default text-foreground-primary text-xs focus:outline-none focus:border-brand-500"
            />
          </div>

          {/* Exercises Builder */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between border-t border-border-subtle pt-3">
              <div>
                <h4 className="text-xs font-extrabold text-foreground-primary uppercase tracking-wider">
                  Template Exercises ({exercises.length})
                </h4>
                <p className="text-[11px] text-foreground-muted font-medium">
                  Modify default sets, reps, and weights
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddExercise}
                className="py-1.5 px-3 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>+ Add Exercise</span>
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
                        placeholder="Exercise Name"
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
                        placeholder="Muscle / Category"
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
                          Weight (kg)
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
                        placeholder="e.g. paused"
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
                  <span>Updating Blueprint...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Update Blueprint</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditWorkoutTemplateModal;
