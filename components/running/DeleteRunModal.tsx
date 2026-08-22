"use client";

import React, { useState } from "react";
import { AlertTriangle, Trash2, Loader2, X } from "lucide-react";
import { ActivityEntryDto } from "@/lib/services/activity.service";
import { formatPace, formatDuration, activityTypeDisplayNames } from "@/lib/validations/activity";

interface DeleteRunModalProps {
  isOpen: boolean;
  onClose: () => void;
  activity: ActivityEntryDto | null;
  onSuccess: () => void;
}

export function DeleteRunModal({
  isOpen,
  onClose,
  activity,
  onSuccess,
}: DeleteRunModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !activity) return null;

  const handleDelete = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/activity/${activity.id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to delete run entry");
        setIsLoading(false);
        return;
      }

      onSuccess();
      onClose();
    } catch (err) {
      console.error("Delete run error:", err);
      setError("An unexpected network error occurred.");
      setIsLoading(false);
    }
  };

  const title = activityTypeDisplayNames[activity.activityType] || activity.activityType;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md bg-background-surface border border-border-default rounded-3xl p-6 shadow-2xl space-y-5 text-left">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border-subtle pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-500/15 text-rose-400 border border-rose-500/30">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground-primary tracking-tight">
                Delete Workout Record
              </h3>
              <p className="text-xs text-foreground-muted font-medium">
                Action requires confirmation
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-foreground-muted hover:text-foreground-primary hover:bg-background-elevated transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-system-error/10 border border-system-error/30 text-xs font-semibold text-rose-300">
            {error}
          </div>
        )}

        <div className="space-y-2 text-sm text-foreground-secondary">
          <p>
            Are you sure you want to permanently remove this <strong className="text-foreground-primary font-bold">{activity.distanceKm} km {title}</strong> session ({formatDuration(activity.movingDurationSeconds)}, {formatPace(activity.averagePaceSecondsPerKm)})?
          </p>
          <p className="text-xs text-foreground-muted">
            Daily and weekly distance and calories burned will be recalculated immediately.
          </p>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-border-subtle">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-foreground-secondary hover:text-foreground-primary hover:bg-background-elevated transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleDelete}
            disabled={isLoading}
            className="inline-flex items-center gap-2 py-2.5 px-5 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-bold text-xs rounded-xl shadow-sm transition-all disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                <span>Delete Run</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default DeleteRunModal;
