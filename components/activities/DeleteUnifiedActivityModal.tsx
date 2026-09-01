"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Trash2, AlertTriangle, Loader2 } from "lucide-react";
import { UnifiedActivityItem } from "@/lib/services/unified-activity.service";

interface DeleteUnifiedActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: UnifiedActivityItem | null;
  onSuccess: () => void;
}

export function DeleteUnifiedActivityModal({
  isOpen,
  onClose,
  item,
  onSuccess,
}: DeleteUnifiedActivityModalProps) {
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !item || !mounted) return null;

  const isWorkout = item.kind === "WORKOUT";

  const handleDelete = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const endpoint = isWorkout
        ? `/api/workouts/${item.id}`
        : `/api/activity/${item.id}`;

      const res = await fetch(endpoint, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to delete item.");
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

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="fixed inset-0 bg-black/60 -z-10" onClick={onClose} />
      <div className="relative w-full max-w-md bg-background-surface border border-border-default rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5 text-left z-10">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border-subtle pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-500/15 text-rose-400">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground-primary">
                Delete {isWorkout ? "Workout Session" : "Activity Log"}
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
            <strong className="text-foreground-primary font-bold">
              &quot;{item.title}&quot;
            </strong>{" "}
            ({item.subtitle})?
          </p>

          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 font-medium">
            ⚠️ This activity log will be permanently deleted from your PostgreSQL account. This action cannot be undone.
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
                <span>Delete Activity</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default DeleteUnifiedActivityModal;
