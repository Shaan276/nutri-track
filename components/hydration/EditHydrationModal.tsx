"use client";

import React, { useState, useEffect } from "react";
import { X, Droplets, Save, Loader2, AlertCircle } from "lucide-react";
import { HydrationEntryDto } from "@/lib/services/hydration.service";
import {
  BeverageType,
  beverageTypeDisplayNames,
  beverageTypeIcons,
  commonQuickAmounts,
} from "@/lib/validations/hydration";

interface EditHydrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  entry: HydrationEntryDto | null;
  onSuccess: () => void;
}

export function EditHydrationModal({
  isOpen,
  onClose,
  entry,
  onSuccess,
}: EditHydrationModalProps) {
  const [amountMl, setAmountMl] = useState<string>(entry ? String(entry.amountMl) : "250");
  const [beverageType, setBeverageType] = useState<BeverageType>(entry ? entry.beverageType : "WATER");
  const [notes, setNotes] = useState<string>(entry?.notes || "");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (entry) {
      setAmountMl(String(entry.amountMl));
      setBeverageType(entry.beverageType);
      setNotes(entry.notes || "");
      setError(null);
    }
  }, [entry]);

  if (!isOpen || !entry) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(amountMl) || 0;
    if (amount <= 0 || amount > 5000) {
      setError("Please enter a valid amount between 1 ml and 5,000 ml.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/hydration/${entry.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amountMl: amount,
          beverageType,
          notes: notes.trim() || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to update hydration entry");
        setIsLoading(false);
        return;
      }

      onSuccess();
      onClose();
    } catch (err) {
      console.error("Update hydration error:", err);
      setError("An unexpected network error occurred.");
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-lg bg-background-surface border border-border-default rounded-3xl p-6 shadow-2xl space-y-5 text-left">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border-subtle pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/15 text-blue-400 border border-blue-500/30">
              <Droplets className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground-primary tracking-tight">
                Edit Hydration Entry
              </h3>
              <p className="text-xs text-foreground-muted font-medium">
                Modify volume or beverage type
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
          <div className="p-3 rounded-xl bg-system-error/10 border border-system-error/30 flex items-start gap-2.5 text-left text-xs font-semibold text-rose-300">
            <AlertCircle className="h-4 w-4 text-system-error shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Quick Select Buttons */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-foreground-secondary">
              Quick Presets
            </label>
            <div className="grid grid-cols-5 gap-1.5">
              {commonQuickAmounts.map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setAmountMl(String(amt))}
                  className={`py-1.5 px-1 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    amountMl === String(amt)
                      ? "bg-blue-500/20 border-blue-500/50 text-blue-400"
                      : "bg-background-elevated/60 border-border-subtle text-foreground-secondary hover:bg-background-elevated"
                  }`}
                >
                  +{amt}ml
                </button>
              ))}
            </div>
          </div>

          {/* Amount & Beverage Type */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-foreground-secondary">
                Intake Volume (ml) *
              </label>
              <input
                type="number"
                step="1"
                min="1"
                max="5000"
                required
                value={amountMl}
                onChange={(e) => setAmountMl(e.target.value)}
                disabled={isLoading}
                className="w-full px-3.5 py-2.5 bg-background-elevated/70 border border-border-subtle rounded-xl text-foreground-primary text-sm font-bold focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-foreground-secondary">
                Beverage Type
              </label>
              <select
                value={beverageType}
                onChange={(e) => setBeverageType(e.target.value as BeverageType)}
                disabled={isLoading}
                className="w-full px-3 py-2.5 bg-background-elevated/70 border border-border-subtle rounded-xl text-foreground-primary text-xs font-bold focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                {Object.entries(beverageTypeDisplayNames).map(([key, label]) => (
                  <option key={key} value={key} className="bg-background-surface">
                    {beverageTypeIcons[key as BeverageType]} {label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Optional Notes */}
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-foreground-secondary">
              Notes (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Glass with breakfast"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isLoading}
              className="w-full px-3.5 py-2.5 bg-background-elevated/70 border border-border-subtle rounded-xl text-foreground-primary placeholder:text-foreground-muted/60 text-xs focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Footer Actions */}
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
                  <span>Update Entry</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditHydrationModal;
