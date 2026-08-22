"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Star,
  Edit2,
  Trash2,
  Archive,
  RotateCcw,
  Flame,
  Dna,
  Wheat,
  Droplet,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Info,
} from "lucide-react";
import { categoryDisplayNames, FoodCategory } from "@/lib/validations/food";

export interface FoodItem {
  id: string;
  userId: string | null;
  name: string;
  category: FoodCategory;
  brand: string | null;
  barcode: string | null;
  servingSize: number | string;
  servingUnit: string;
  calories: number | string;
  protein: number | string;
  carbohydrates: number | string;
  fat: number | string;
  fiber: number | string;
  sugar: number | string;
  sodium: number | string;
  calcium: number | string;
  iron: number | string;
  potassium: number | string;
  magnesium: number | string;
  zinc: number | string;
  vitaminA: number | string;
  vitaminC: number | string;
  vitaminD: number | string;
  vitaminB12: number | string;
  water: number | string;
  notes: string | null;
  isFavorite: boolean;
  isArchived: boolean;
  isSystemFood: boolean;
}

interface FoodCardProps {
  food: FoodItem;
  currentUserId?: string;
  onToggleFavorite: (id: string) => Promise<void>;
  onToggleArchive: (id: string, isArchived: boolean) => Promise<void>;
  onDelete?: (food: FoodItem) => void;
}

export function FoodCard({
  food,
  currentUserId,
  onToggleFavorite,
  onToggleArchive,
  onDelete,
}: FoodCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isFavoriting, setIsFavoriting] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);

  const isOwner = food.userId === currentUserId || (!food.isSystemFood && food.userId !== null);

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (isFavoriting) return;
    setIsFavoriting(true);
    try {
      await onToggleFavorite(food.id);
    } finally {
      setIsFavoriting(false);
    }
  };

  const handleArchiveClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (isArchiving) return;
    setIsArchiving(true);
    try {
      await onToggleArchive(food.id, food.isArchived);
    } finally {
      setIsArchiving(false);
    }
  };

  const calories = Number(food.calories).toFixed(0);
  const protein = Number(food.protein).toFixed(1);
  const carbs = Number(food.carbohydrates).toFixed(1);
  const fat = Number(food.fat).toFixed(1);
  const fiber = Number(food.fiber).toFixed(1);
  const sugar = Number(food.sugar).toFixed(1);

  const hasMicros =
    Number(food.sodium) > 0 ||
    Number(food.calcium) > 0 ||
    Number(food.iron) > 0 ||
    Number(food.potassium) > 0 ||
    Number(food.magnesium) > 0 ||
    Number(food.zinc) > 0 ||
    Number(food.vitaminA) > 0 ||
    Number(food.vitaminC) > 0 ||
    Number(food.vitaminD) > 0 ||
    Number(food.vitaminB12) > 0;

  return (
    <div
      className={`group bg-background-surface border ${
        food.isFavorite ? "border-brand-500/40 shadow-sm" : "border-border-default"
      } rounded-2xl p-5 transition-all duration-200 hover:border-brand-500/60 hover:shadow-surface-card text-left flex flex-col justify-between`}
    >
      <div>
        {/* Top Header: Category, Badges, and Star */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-md bg-background-elevated border border-border-subtle text-[11px] font-bold uppercase tracking-wider text-brand-400">
              {categoryDisplayNames[food.category] || food.category}
            </span>

            {food.isSystemFood && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-[10px] font-semibold">
                <Sparkles className="h-3 w-3" />
                Baseline
              </span>
            )}

            {food.isArchived && (
              <span className="px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-semibold">
                Archived
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            {/* Favorite Star Button */}
            {!food.isSystemFood && (
              <button
                onClick={handleFavoriteClick}
                disabled={isFavoriting}
                title={food.isFavorite ? "Remove from favorites" : "Add to favorites"}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  food.isFavorite
                    ? "text-amber-400 bg-amber-400/10 hover:bg-amber-400/20"
                    : "text-foreground-muted hover:text-amber-400 hover:bg-background-elevated"
                }`}
              >
                <Star className={`h-4 w-4 ${food.isFavorite ? "fill-amber-400" : ""}`} />
              </button>
            )}
          </div>
        </div>

        {/* Food Name & Brand */}
        <div className="mb-3.5">
          <h3 className="text-base font-bold text-foreground-primary tracking-tight group-hover:text-brand-300 transition-colors">
            {food.name}
          </h3>
          {food.brand && (
            <p className="text-xs font-semibold text-foreground-muted">{food.brand}</p>
          )}
        </div>

        {/* Reference Serving Size Banner */}
        <div className="mb-4 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-background-elevated/80 border border-border-subtle text-xs font-semibold text-foreground-secondary">
          <Info className="h-3.5 w-3.5 text-brand-400" />
          <span>
            Serving Reference:{" "}
            <strong className="text-foreground-primary font-bold">
              {food.servingSize} {food.servingUnit}
            </strong>
          </span>
        </div>

        {/* Macronutrients Grid */}
        <div className="grid grid-cols-4 gap-2 bg-background-elevated/40 border border-border-subtle rounded-xl p-2.5 text-center mb-3">
          {/* Calories */}
          <div>
            <div className="flex items-center justify-center gap-0.5 text-[10px] font-semibold uppercase text-brand-400">
              <Flame className="h-3 w-3" />
              <span>Cal</span>
            </div>
            <p className="text-sm font-extrabold text-foreground-primary mt-0.5">
              {calories}
            </p>
            <span className="text-[10px] text-foreground-muted">kcal</span>
          </div>

          {/* Protein */}
          <div>
            <div className="flex items-center justify-center gap-0.5 text-[10px] font-semibold uppercase text-blue-400">
              <Dna className="h-3 w-3" />
              <span>Prot</span>
            </div>
            <p className="text-sm font-extrabold text-foreground-primary mt-0.5">
              {protein}
            </p>
            <span className="text-[10px] text-foreground-muted">g</span>
          </div>

          {/* Carbs */}
          <div>
            <div className="flex items-center justify-center gap-0.5 text-[10px] font-semibold uppercase text-amber-400">
              <Wheat className="h-3 w-3" />
              <span>Carb</span>
            </div>
            <p className="text-sm font-extrabold text-foreground-primary mt-0.5">
              {carbs}
            </p>
            <span className="text-[10px] text-foreground-muted">g</span>
          </div>

          {/* Fat */}
          <div>
            <div className="flex items-center justify-center gap-0.5 text-[10px] font-semibold uppercase text-rose-400">
              <Droplet className="h-3 w-3" />
              <span>Fat</span>
            </div>
            <p className="text-sm font-extrabold text-foreground-primary mt-0.5">
              {fat}
            </p>
            <span className="text-[10px] text-foreground-muted">g</span>
          </div>
        </div>

        {/* Secondary Macros: Fiber & Sugar */}
        {(Number(food.fiber) > 0 || Number(food.sugar) > 0) && (
          <div className="flex items-center justify-between text-xs text-foreground-muted px-1 mb-2">
            <span>Fiber: <strong className="text-foreground-secondary font-bold">{fiber}g</strong></span>
            <span>Sugar: <strong className="text-foreground-secondary font-bold">{sugar}g</strong></span>
          </div>
        )}

        {/* Micronutrients Accordion */}
        {hasMicros && (
          <div className="mt-2 pt-2 border-t border-border-subtle">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-full flex items-center justify-between text-xs font-semibold text-foreground-muted hover:text-foreground-primary transition-colors cursor-pointer py-1"
            >
              <span>Micronutrients Breakdown</span>
              {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>

            {isExpanded && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2 p-2.5 rounded-lg bg-background-elevated/30 text-xs">
                {Number(food.sodium) > 0 && (
                  <div>
                    <span className="text-foreground-muted block text-[10px]">Sodium</span>
                    <span className="font-bold text-foreground-primary">{food.sodium} mg</span>
                  </div>
                )}
                {Number(food.calcium) > 0 && (
                  <div>
                    <span className="text-foreground-muted block text-[10px]">Calcium</span>
                    <span className="font-bold text-foreground-primary">{food.calcium} mg</span>
                  </div>
                )}
                {Number(food.iron) > 0 && (
                  <div>
                    <span className="text-foreground-muted block text-[10px]">Iron</span>
                    <span className="font-bold text-foreground-primary">{food.iron} mg</span>
                  </div>
                )}
                {Number(food.potassium) > 0 && (
                  <div>
                    <span className="text-foreground-muted block text-[10px]">Potassium</span>
                    <span className="font-bold text-foreground-primary">{food.potassium} mg</span>
                  </div>
                )}
                {Number(food.magnesium) > 0 && (
                  <div>
                    <span className="text-foreground-muted block text-[10px]">Magnesium</span>
                    <span className="font-bold text-foreground-primary">{food.magnesium} mg</span>
                  </div>
                )}
                {Number(food.vitaminC) > 0 && (
                  <div>
                    <span className="text-foreground-muted block text-[10px]">Vitamin C</span>
                    <span className="font-bold text-foreground-primary">{food.vitaminC} mg</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Notes preview if any */}
        {food.notes && (
          <p className="mt-2 text-xs text-foreground-muted italic line-clamp-2 px-1">
            &ldquo;{food.notes}&rdquo;
          </p>
        )}
      </div>

      {/* Action Footer */}
      <div className="mt-4 pt-3 border-t border-border-subtle flex items-center justify-between gap-2">
        {isOwner && !food.isSystemFood ? (
          <>
            <div className="flex items-center gap-1.5">
              <Link
                href={`/foods/${food.id}/edit`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-background-elevated hover:bg-background-elevated/80 text-foreground-secondary border border-border-subtle transition-colors cursor-pointer"
              >
                <Edit2 className="h-3.5 w-3.5" />
                <span>Edit</span>
              </Link>

              <button
                onClick={handleArchiveClick}
                disabled={isArchiving}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-foreground-muted hover:text-foreground-primary transition-colors cursor-pointer"
              >
                {food.isArchived ? (
                  <>
                    <RotateCcw className="h-3.5 w-3.5 text-brand-400" />
                    <span>Restore</span>
                  </>
                ) : (
                  <>
                    <Archive className="h-3.5 w-3.5" />
                    <span>Archive</span>
                  </>
                )}
              </button>
            </div>

            {onDelete && (
              <button
                onClick={() => onDelete(food)}
                title="Delete food permanently"
                className="p-1.5 rounded-lg text-foreground-muted hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </>
        ) : (
          <span className="text-[11px] font-medium text-foreground-muted">Verified Baseline Food</span>
        )}
      </div>
    </div>
  );
}

export default FoodCard;
