"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Target, Loader2, AlertCircle, Save, Droplets } from "lucide-react";

interface UpdateHydrationGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTargetMl: number;
  onSuccess: () => void;
}

export function UpdateHydrationGoalModal({
  isOpen,
  onClose,
  currentTargetMl,
  onSuccess,
}: UpdateHydrationGoalModalProps) {
  const [mounted, setMounted] = useState(false);
  const [targetMl, setTargetMl] = useState<string>(String(currentTargetMl || 2500));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTargetMl(String(currentTargetMl || 2500));
      setError(null);
    }
  }, [isOpen, currentTargetMl]);

  if (!isOpen || !mounted) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(targetMl, 10);
    if (isNaN(val) || val < 500 || val > 10000) {
      setError("Daily goal must be between 500 ml and 10,000 ml.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/hydration/target", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetMl: val }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to update daily hydration goal");
        setIsLoading(false);
        return;
      }

      onSuccess();
      onClose();
    } catch (err) {
      console.error("Update target error:", err);
      setError("An unexpected network error occurred.");
      setIsLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="fixed inset-0 bg-black/60 -z-10" onClick={onClose} />
      <div className="w-full max-w-md bg-background-surface border border-border-default rounded-3xl p-6 shadow-2xl space-y-5 text-left relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border-subtle pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/15 text-blue-400 border border-blue-500/30">
              <Target className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground-primary tracking-tight">
                Daily Hydration Target
              </h3>
              <p className="text-xs text-foreground-muted font-medium">
                Customize your daily fluid goal
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
          <div className="p-3 rounded-xl bg-system-error/10 border border-system-error/30 flex items-start gap-2 text-xs font-semibold text-rose-300">
            <AlertCircle className="h-4 w-4 text-system-error shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-foreground-secondary">
              Daily Target (Milliliters) *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-blue-400">
                <Droplets className="h-4 w-4" />
              </div>
              <input
                type="number"
                step="50"
                min="500"
                max="10000"
                required
                value={targetMl}
                onChange={(e) => setTargetMl(e.target.value)}
                disabled={isLoading}
                className="w-full pl-10 pr-4 py-2.5 bg-background-elevated/70 border border-border-subtle rounded-xl text-foreground-primary text-sm font-bold focus:outline-none focus:border-blue-500"
              />
            </div>
            <p className="text-[11px] text-foreground-muted">
              Recommended: 2,000 ml to 3,500 ml depending on activity level.
            </p>
          </div>

          {/* Quick preset buttons */}
          <div className="grid grid-cols-4 gap-2 pt-1">
            {[2000, 2500, 3000, 3500].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setTargetMl(String(preset))}
                className="py-1.5 px-2 rounded-lg bg-background-elevated text-xs font-semibold text-foreground-secondary hover:text-blue-400 hover:bg-blue-500/10 border border-border-subtle transition-colors cursor-pointer"
              >
                {preset} ml
              </button>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border-subtle">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-foreground-secondary hover:text-foreground-primary hover:bg-background-elevated transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center gap-2 py-2.5 px-5 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Save Goal</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

export default UpdateHydrationGoalModal;
