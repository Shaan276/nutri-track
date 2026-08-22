"use client";

import React, { useState } from "react";
import { X, Trash2, AlertTriangle, Loader2 } from "lucide-react";
import { WorkoutSessionDto } from "@/lib/services/workout.service";

interface DeleteWorkoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: WorkoutSessionDto | null;
  onSuccess: () => void;
}

export function DeleteWorkoutModal({
  isOpen,
  onClose,
  session,
  onSuccess,
}: DeleteWorkoutModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !session) return null;

  const handleDelete = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/workouts/${session.id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to delete workout session.");
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 animate-fade-in">
      <div className="relative w-full max-w-md bg-background-surface border border-border-default rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5 text-left">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-border-subtle pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-500/15 text-rose-400">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground-primary">
                Delete Workout Session
              </h3>
              <p className="text-xs text-foreground-muted">
                Permanent database removal
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
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold">
            {error}
          </div>
        )}

        <div className="space-y-3">
          <p className="text-sm text-foreground-secondary leading-relaxed font-medium">
            Are you sure you want to permanently delete{" "}
            <strong className="text-foreground-primary font-bold">&quot;{session.name}&quot;</strong> ({session.exercises.length} exercises, {session.totalSets} sets)?
          </p>

          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 font-medium">
            ⚠️ This will also delete all logged exercise sets and rep telemetry for this session from PostgreSQL. This action cannot be undone.
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-3 border-t border-border-subtle flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="py-2.5 px-4 rounded-xl bg-background-elevated hover:bg-background-elevated/80 text-foreground-secondary hover:text-foreground-primary text-xs font-bold transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleDelete}
            disabled={isLoading}
            className="py-2.5 px-5 rounded-xl bg-rose-500 hover:bg-rose-600 active:bg-rose-700 text-white font-extrabold text-xs transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                <span>Delete Workout</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
