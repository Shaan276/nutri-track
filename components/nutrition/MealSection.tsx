"use client";

import React from "react";
import { Plus, Flame, Utensils } from "lucide-react";
import { MealSectionSummary } from "@/lib/services/nutrition.service";
import { mealTypeDisplayNames, mealTypeIcons, MealType } from "@/lib/validations/meal";
import { MealEntryRow, MealEntryItem } from "./MealEntryRow";

interface MealSectionProps {
  section: MealSectionSummary;
  onOpenAddModal: (mealType: MealType) => void;
  onEditEntry: (entry: MealEntryItem) => void;
  onDeleteEntry: (id: string) => Promise<void>;
}

export function MealSection({
  section,
  onOpenAddModal,
  onEditEntry,
  onDeleteEntry,
}: MealSectionProps) {
  const icon = mealTypeIcons[section.mealType] || "🍽️";
  const title = mealTypeDisplayNames[section.mealType] || section.mealType;
  const entriesCount = section.entries.length;

  return (
    <div className="w-full bg-background-surface border border-border-default rounded-3xl p-5 sm:p-6 shadow-surface-card space-y-4 text-left transition-all hover:border-brand-500/40">
      {/* Meal Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border-subtle pb-3.5">
        <div className="flex items-center gap-3">
          <span className="text-2xl select-none" role="img" aria-label={title}>
            {icon}
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-foreground-primary tracking-tight">
                {title}
              </h3>
              <span className="px-2 py-0.2 rounded-full bg-background-elevated border border-border-subtle text-[11px] font-bold text-foreground-secondary">
                {entriesCount} {entriesCount === 1 ? "item" : "items"}
              </span>
            </div>

            {/* Subtotal Macro Breakdown */}
            <div className="flex items-center gap-3 text-xs font-semibold text-foreground-muted mt-0.5">
              <span className="flex items-center gap-1 text-brand-400 font-bold">
                <Flame className="h-3 w-3" />
                {section.totals.calories} kcal
              </span>
              <span>&bull;</span>
              <span>P: <strong className="text-foreground-secondary font-bold">{section.totals.protein}g</strong></span>
              <span>C: <strong className="text-foreground-secondary font-bold">{section.totals.carbs}g</strong></span>
              <span>F: <strong className="text-foreground-secondary font-bold">{section.totals.fat}g</strong></span>
            </div>
          </div>
        </div>

        {/* Add Food Button */}
        <button
          onClick={() => onOpenAddModal(section.mealType)}
          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-brand-500/15 hover:bg-brand-500/25 active:bg-brand-500/35 text-brand-400 border border-brand-500/30 rounded-xl text-xs font-bold transition-all duration-150 shadow-sm cursor-pointer shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Add Food</span>
        </button>
      </div>

      {/* Entries List or Empty State */}
      {entriesCount === 0 ? (
        <div className="py-6 px-4 text-center rounded-2xl bg-background-elevated/20 border border-dashed border-border-subtle/80 flex flex-col items-center justify-center space-y-2">
          <Utensils className="h-5 w-5 text-foreground-muted/60" />
          <p className="text-xs font-semibold text-foreground-muted">
            No foods logged for {title.toLowerCase()} yet.
          </p>
          <button
            onClick={() => onOpenAddModal(section.mealType)}
            className="text-xs font-bold text-brand-400 hover:text-brand-300 transition-colors cursor-pointer"
          >
            + Log First Food
          </button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {section.entries.map((entry) => (
            <MealEntryRow
              key={entry.id}
              entry={entry}
              onEdit={onEditEntry}
              onDelete={onDeleteEntry}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default MealSection;
