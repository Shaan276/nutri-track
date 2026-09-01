"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Save, Loader2, AlertCircle, Info, Flame, Dna, Wheat, Droplet } from "lucide-react";
import { MealEntryItem } from "./MealEntryRow";

interface EditMealEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  entry: MealEntryItem | null;
  onSuccess: () => void;
}

export function EditMealEntryModal({
  isOpen,
  onClose,
  entry,
  onSuccess,
}: EditMealEntryModalProps) {
  const [mounted, setMounted] = useState(false);
  const [quantity, setQuantity] = useState<string>(entry ? String(entry.quantity) : "100");
  const [quantityUnit, setQuantityUnit] = useState<string>(entry ? entry.quantityUnit : "g");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Sync state if entry changes
  React.useEffect(() => {
    if (entry) {
      setQuantity(String(entry.quantity));
      setQuantityUnit(entry.quantityUnit);
      setError(null);
    }
  }, [entry]);

  if (!isOpen || !entry) return null;

  // Compute live recalculated nutrition
  const quantityNum = parseFloat(quantity) || 0;
  const refSize = entry.referenceServingSize || 100;
  const multiplier = refSize > 0 && quantityNum > 0 ? quantityNum / refSize : 0;

  // Reference base values from original entry
  const baseCalories = Number(entry.calories) / (Number(entry.quantity) / refSize);
  const baseProtein = Number(entry.protein) / (Number(entry.quantity) / refSize);
  const baseCarbs = Number(entry.carbs) / (Number(entry.quantity) / refSize);
  const baseFat = Number(entry.fat) / (Number(entry.quantity) / refSize);

  const previewCalories = Math.round(baseCalories * multiplier * 10) / 10;
  const previewProtein = Math.round(baseProtein * multiplier * 10) / 10;
  const previewCarbs = Math.round(baseCarbs * multiplier * 10) / 10;
  const previewFat = Math.round(baseFat * multiplier * 10) / 10;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (quantityNum <= 0) {
      setError("Consumed quantity must be greater than 0.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/meals/${entry.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quantity: quantityNum,
          quantityUnit: quantityUnit.trim() || entry.quantityUnit,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to update entry");
        setIsLoading(false);
        return;
      }

      onSuccess();
      onClose();
    } catch (err) {
      console.error("Update meal entry error:", err);
      setError("An unexpected network error occurred.");
      setIsLoading(false);
    }
  };

  if (!isOpen || !entry || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="fixed inset-0 bg-black/60 -z-10" onClick={onClose} />
      <div className="w-full max-w-lg bg-background-surface border border-border-default rounded-3xl p-6 shadow-2xl space-y-5 text-left relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border-subtle pb-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-brand-400">
              Edit Logged Item
            </span>
            <h3 className="text-xl font-extrabold text-foreground-primary tracking-tight">
              {entry.foodName}
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-foreground-muted hover:text-foreground-primary hover:bg-background-elevated transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-system-error/10 border border-system-error/30 flex items-start gap-2.5 text-left">
            <AlertCircle className="h-4 w-4 text-system-error shrink-0 mt-0.5" />
            <p className="text-xs font-medium text-red-200">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-3 rounded-xl bg-background-elevated/40 border border-border-subtle text-xs text-foreground-secondary flex items-center gap-2">
            <Info className="h-4 w-4 text-brand-400 shrink-0" />
            <span>
              Reference Serving: <strong>{entry.referenceServingSize} {entry.referenceServingUnit}</strong>
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-foreground-secondary">
                Consumed Quantity *
              </label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                required
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                disabled={isLoading}
                className="w-full px-3.5 py-2.5 bg-background-elevated/70 border border-border-subtle rounded-xl text-foreground-primary text-sm font-bold focus:outline-none focus:border-brand-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-foreground-secondary">
                Unit
              </label>
              <input
                type="text"
                required
                value={quantityUnit}
                onChange={(e) => setQuantityUnit(e.target.value)}
                disabled={isLoading}
                className="w-full px-3.5 py-2.5 bg-background-elevated/70 border border-border-subtle rounded-xl text-foreground-primary text-sm font-bold focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          {/* Recalculated Preview */}
          <div className="p-3.5 rounded-xl bg-background-elevated/60 border border-border-subtle space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-foreground-muted block text-center">
              Recalculated Nutrition Snapshot
            </span>

            <div className="grid grid-cols-4 gap-2 text-center">
              <div>
                <span className="text-[10px] text-brand-400 font-bold block">Calories</span>
                <strong className="text-sm font-extrabold text-foreground-primary">{previewCalories}</strong>
                <span className="text-[10px] text-foreground-muted block">kcal</span>
              </div>
              <div>
                <span className="text-[10px] text-blue-400 font-bold block">Protein</span>
                <strong className="text-sm font-extrabold text-foreground-primary">{previewProtein}</strong>
                <span className="text-[10px] text-foreground-muted block">g</span>
              </div>
              <div>
                <span className="text-[10px] text-amber-400 font-bold block">Carbs</span>
                <strong className="text-sm font-extrabold text-foreground-primary">{previewCarbs}</strong>
                <span className="text-[10px] text-foreground-muted block">g</span>
              </div>
              <div>
                <span className="text-[10px] text-rose-400 font-bold block">Fat</span>
                <strong className="text-sm font-extrabold text-foreground-primary">{previewFat}</strong>
                <span className="text-[10px] text-foreground-muted block">g</span>
              </div>
            </div>
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
              disabled={isLoading || quantityNum <= 0}
              className="inline-flex items-center gap-2 py-2.5 px-5 bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-black font-bold text-xs rounded-xl shadow-brand-glow transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Updating...</span>
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
    </div>,
    document.body
  );
}

export default EditMealEntryModal;
