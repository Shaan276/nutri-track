"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, Trash2, Loader2, X } from "lucide-react";
import { FoodItem } from "./FoodCard";

interface DeleteFoodModalProps {
  isOpen: boolean;
  onClose: () => void;
  food: FoodItem | null;
  onSuccess: () => void;
}

export function DeleteFoodModal({
  isOpen,
  onClose,
  food,
  onSuccess,
}: DeleteFoodModalProps) {
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !food || !mounted) return null;

  const handleDelete = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/foods/${food.id}?permanent=true`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to delete food item");
        setIsLoading(false);
        return;
      }

      onSuccess();
      onClose();
    } catch (err) {
      console.error("Delete food error:", err);
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
            <div className="p-2.5 rounded-xl bg-rose-500/15 text-rose-400 border border-rose-500/30">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground-primary tracking-tight">
                Delete Food Item
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
            Are you sure you want to permanently remove <strong className="text-foreground-primary font-bold">{food.name}</strong> from your food database?
          </p>
          <p className="text-xs text-foreground-muted">
            This food will no longer appear in your database search. Past logged meals that already used this food will safely preserve their nutritional values.
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
                <span>Delete Permanently</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default DeleteFoodModal;
