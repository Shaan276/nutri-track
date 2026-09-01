"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useQuery } from "@tanstack/react-query";
import {
  X,
  Search,
  Plus,
  Loader2,
  AlertCircle,
  Flame,
  Dna,
  Wheat,
  Droplet,
  Info,
  Check,
} from "lucide-react";
import { MealType, mealTypeDisplayNames, mealTypeIcons } from "@/lib/validations/meal";
import { FoodItem } from "../foods/FoodCard";
import { categoryDisplayNames, FoodCategory } from "@/lib/validations/food";

interface AddFoodModalProps {
  isOpen: boolean;
  onClose: () => void;
  mealType: MealType;
  selectedDate: string;
  onSuccess: () => void;
}

export function AddFoodModal({
  isOpen,
  onClose,
  mealType,
  selectedDate,
  onSuccess,
}: AddFoodModalProps) {
  const [mounted, setMounted] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [quantity, setQuantity] = useState<string>("100");
  const [quantityUnit, setQuantityUnit] = useState<string>("g");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch foods from the food database
  const { data: foodsData, isLoading: isFoodsLoading } = useQuery<{ status: string; foods: FoodItem[] }>({
    queryKey: ["foods", { search, statusFilter: "active" }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      params.set("status", "active");
      const res = await fetch(`/api/foods?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch foods");
      return res.json();
    },
    enabled: isOpen,
  });

  const foods = foodsData?.foods || [];

  const handleSelectFood = (food: FoodItem) => {
    setSelectedFood(food);
    setQuantity(String(food.servingSize || "100"));
    setQuantityUnit(food.servingUnit || "g");
    setError(null);
  };

  // Compute live scaling preview
  const quantityNum = parseFloat(quantity) || 0;
  const refSize = selectedFood ? Number(selectedFood.servingSize) : 100;
  const multiplier = refSize > 0 && quantityNum > 0 ? quantityNum / refSize : 0;

  const previewCalories = selectedFood
    ? Math.round(Number(selectedFood.calories) * multiplier * 10) / 10
    : 0;
  const previewProtein = selectedFood
    ? Math.round(Number(selectedFood.protein) * multiplier * 10) / 10
    : 0;
  const previewCarbs = selectedFood
    ? Math.round(Number(selectedFood.carbohydrates) * multiplier * 10) / 10
    : 0;
  const previewFat = selectedFood
    ? Math.round(Number(selectedFood.fat) * multiplier * 10) / 10
    : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFood) {
      setError("Please select a food item from the list.");
      return;
    }
    if (quantityNum <= 0) {
      setError("Consumed quantity must be greater than 0.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/meals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: selectedDate,
          mealType,
          foodId: selectedFood.id,
          quantity: quantityNum,
          quantityUnit: quantityUnit.trim() || selectedFood.servingUnit,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to log food entry");
        setIsLoading(false);
        return;
      }

      onSuccess();
      onClose();
    } catch (err) {
      console.error("Log food error:", err);
      setError("An unexpected network error occurred.");
      setIsLoading(false);
    }
  };

  if (!isOpen || !mounted) return null;

  const mealTitle = mealTypeDisplayNames[mealType] || mealType;
  const mealIcon = mealTypeIcons[mealType] || "🍽️";

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="fixed inset-0 bg-black/60 -z-10" onClick={onClose} />
      <div className="w-full max-w-2xl bg-background-surface border border-border-default rounded-3xl p-6 shadow-2xl space-y-5 text-left max-h-[90vh] flex flex-col overflow-hidden relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border-subtle pb-4 shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl select-none">{mealIcon}</span>
            <div>
              <h3 className="text-xl font-extrabold text-foreground-primary tracking-tight">
                Add Food to {mealTitle}
              </h3>
              <p className="text-xs font-semibold text-foreground-muted">
                Date: {selectedDate}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-foreground-muted hover:text-foreground-primary hover:bg-background-elevated transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-system-error/10 border border-system-error/30 flex items-start gap-2.5 text-left shrink-0">
            <AlertCircle className="h-4 w-4 text-system-error shrink-0 mt-0.5" />
            <p className="text-xs font-medium text-red-200">{error}</p>
          </div>
        )}

        {/* Search Bar */}
        <div className="relative shrink-0">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-foreground-muted">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            placeholder="Search food database..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-background-elevated/70 border border-border-subtle rounded-xl text-foreground-primary placeholder:text-foreground-muted/60 text-sm focus:outline-none focus:border-brand-500 transition-colors"
          />
        </div>

        {/* Middle Section: Food Selection & Scaler */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto pr-1 flex-1 min-h-[220px]">
          {/* Food List Column */}
          <div className="space-y-2 overflow-y-auto max-h-[260px] pr-1">
            <p className="text-xs font-bold uppercase tracking-wider text-foreground-muted sticky top-0 bg-background-surface py-1">
              Select Food Item ({foods.length})
            </p>

            {isFoodsLoading ? (
              <div className="py-8 text-center text-foreground-muted text-xs flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-brand-400" />
                <span>Searching foods...</span>
              </div>
            ) : foods.length === 0 ? (
              <div className="py-8 text-center text-foreground-muted text-xs">
                No matching foods found in library.
              </div>
            ) : (
              foods.map((food) => {
                const isSelected = selectedFood?.id === food.id;
                return (
                  <button
                    key={food.id}
                    type="button"
                    onClick={() => handleSelectFood(food)}
                    className={`w-full p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2 ${
                      isSelected
                        ? "bg-brand-500/15 border-brand-500/60 shadow-sm"
                        : "bg-background-elevated/50 hover:bg-background-elevated border-border-subtle"
                    }`}
                  >
                    <div>
                      <p className="text-xs font-bold text-foreground-primary">
                        {food.name}
                      </p>
                      <p className="text-[11px] font-semibold text-foreground-muted mt-0.5">
                        {categoryDisplayNames[food.category as FoodCategory] || food.category} &bull; {food.servingSize} {food.servingUnit} ({food.calories} kcal)
                      </p>
                    </div>

                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-brand-500 text-black flex items-center justify-center shrink-0">
                        <Check className="h-3 w-3 stroke-[3]" />
                      </div>
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Right Column: Quantity Scaler & Preview */}
          <div className="p-4 rounded-2xl bg-background-elevated/40 border border-border-subtle flex flex-col justify-between space-y-4">
            {selectedFood ? (
              <>
                <div className="space-y-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-brand-400">
                      Selected Item
                    </span>
                    <h4 className="text-sm font-bold text-foreground-primary">
                      {selectedFood.name}
                    </h4>
                    <p className="text-xs font-medium text-foreground-muted mt-0.5 flex items-center gap-1">
                      <Info className="h-3.5 w-3.5 text-brand-400" />
                      Ref: {selectedFood.servingSize} {selectedFood.servingUnit} = {selectedFood.calories} kcal
                    </p>
                  </div>

                  {/* Quantity Input */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold uppercase text-foreground-secondary">
                        Consumed Qty *
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="0.1"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        className="w-full px-3 py-2 bg-background-surface border border-border-subtle rounded-xl text-foreground-primary text-sm font-bold focus:outline-none focus:border-brand-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold uppercase text-foreground-secondary">
                        Unit
                      </label>
                      <input
                        type="text"
                        value={quantityUnit}
                        onChange={(e) => setQuantityUnit(e.target.value)}
                        className="w-full px-3 py-2 bg-background-surface border border-border-subtle rounded-xl text-foreground-primary text-sm font-bold focus:outline-none focus:border-brand-500"
                      />
                    </div>
                  </div>

                  {/* Live Nutrition Calculation Preview */}
                  <div className="p-3 rounded-xl bg-background-surface/80 border border-border-subtle space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-foreground-muted block text-center">
                      Calculated Nutrition Preview
                    </span>

                    <div className="grid grid-cols-4 gap-1 text-center">
                      <div>
                        <span className="text-[10px] text-brand-400 font-bold block">Cal</span>
                        <strong className="text-xs font-extrabold text-foreground-primary">{previewCalories}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-blue-400 font-bold block">Prot</span>
                        <strong className="text-xs font-extrabold text-foreground-primary">{previewProtein}g</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-amber-400 font-bold block">Carb</span>
                        <strong className="text-xs font-extrabold text-foreground-primary">{previewCarbs}g</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-rose-400 font-bold block">Fat</span>
                        <strong className="text-xs font-extrabold text-foreground-primary">{previewFat}g</strong>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-4 text-foreground-muted space-y-2">
                <Search className="h-6 w-6 text-foreground-muted/60" />
                <p className="text-xs font-semibold">Select a food from the left to configure quantity and preview scaled macros.</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-border-subtle shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-foreground-secondary hover:text-foreground-primary hover:bg-background-elevated transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={!selectedFood || isLoading || quantityNum <= 0}
            className="inline-flex items-center gap-2 py-2.5 px-5 bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-black font-bold text-xs rounded-xl shadow-brand-glow transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Logging...</span>
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                <span>Add to {mealTitle}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default AddFoodModal;
