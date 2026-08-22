"use client";

import React, { useState } from "react";
import { Edit2, Trash2, Loader2, Flame } from "lucide-react";
import { categoryDisplayNames, FoodCategory } from "@/lib/validations/food";

export interface MealEntryItem {
  id: string;
  foodId: string;
  foodName: string;
  foodCategory: string;
  brand: string | null;
  quantity: number;
  quantityUnit: string;
  referenceServingSize: number;
  referenceServingUnit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  createdAt: string;
}

interface MealEntryRowProps {
  entry: MealEntryItem;
  onEdit: (entry: MealEntryItem) => void;
  onDelete: (id: string) => Promise<void>;
}

export function MealEntryRow({ entry, onEdit, onDelete }: MealEntryRowProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (isDeleting) return;
    setIsDeleting(true);
    try {
      await onDelete(entry.id);
    } finally {
      setIsDeleting(false);
    }
  };

  const categoryName = categoryDisplayNames[entry.foodCategory as FoodCategory] || entry.foodCategory;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-background-elevated/50 hover:bg-background-elevated/80 border border-border-subtle transition-all duration-150 text-left">
      {/* Left Column: Food Details & Quantity */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          <h4 className="text-sm font-bold text-foreground-primary tracking-tight">
            {entry.foodName}
          </h4>
          <span className="px-2 py-0.2 rounded-md bg-background-surface border border-border-subtle text-[10px] font-bold uppercase tracking-wider text-brand-400">
            {categoryName}
          </span>
          {entry.brand && (
            <span className="text-xs font-semibold text-foreground-muted">
              ({entry.brand})
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs text-foreground-secondary font-medium">
          <span>
            Consumed: <strong className="text-foreground-primary font-bold">{entry.quantity} {entry.quantityUnit}</strong>
          </span>
          <span className="text-foreground-muted">&bull;</span>
          <span className="text-foreground-muted">
            (Ref: {entry.referenceServingSize} {entry.referenceServingUnit})
          </span>
        </div>
      </div>

      {/* Right Column: Snapshot Macros & Action Buttons */}
      <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-border-subtle/60">
        {/* Macros */}
        <div className="flex items-center gap-2.5 text-xs text-right">
          <div className="flex items-center gap-1 font-bold text-brand-400">
            <Flame className="h-3.5 w-3.5" />
            <span>{entry.calories} kcal</span>
          </div>

          <div className="hidden xs:flex items-center gap-2 text-foreground-muted text-[11px] font-semibold">
            <span>P: <strong className="text-foreground-secondary font-bold">{entry.protein}g</strong></span>
            <span>C: <strong className="text-foreground-secondary font-bold">{entry.carbs}g</strong></span>
            <span>F: <strong className="text-foreground-secondary font-bold">{entry.fat}g</strong></span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onEdit(entry)}
            title="Edit quantity"
            className="p-1.5 rounded-lg text-foreground-muted hover:text-foreground-primary hover:bg-background-surface transition-colors cursor-pointer"
          >
            <Edit2 className="h-3.5 w-3.5" />
          </button>

          <button
            onClick={handleDelete}
            disabled={isDeleting}
            title="Delete entry"
            className="p-1.5 rounded-lg text-foreground-muted hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
          >
            {isDeleting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default MealEntryRow;
