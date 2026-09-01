"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  UtensilsCrossed,
  Plus,
  Trash2,
  Save,
  Loader2,
  AlertCircle,
  Flame,
  Dna,
  Wheat,
  Droplet,
  Sparkles,
  Search,
  Check,
  ChefHat,
  Scale,
} from "lucide-react";
import { FoodCategory, categoryDisplayNames } from "@/lib/validations/food";
import { FoodItem } from "./FoodCard";

export interface SelectedRecipeIngredient {
  foodId: string;
  name: string;
  category: string;
  baseServingSize: number;
  baseServingUnit: string;
  baseCalories: number;
  baseProtein: number;
  baseCarbs: number;
  baseFat: number;
  baseFiber: number;
  baseCalcium?: number;
  baseIron?: number;
  basePotassium?: number;
  baseSodium?: number;
  baseMagnesium?: number;
  baseZinc?: number;
  baseVitaminC?: number;
  baseVitaminB12?: number;

  // Selected quantity
  quantity: number;
  unit: string;
}

export function AddRecipeFoodForm() {
  const router = useRouter();

  // Basic Dish Information
  const [dishName, setDishName] = useState("");
  const [category, setCategory] = useState<FoodCategory>("SNACKS");
  const [servingSize, setServingSize] = useState("1");
  const [servingUnit, setServingUnit] = useState("serving");
  const [notes, setNotes] = useState("");
  const [isFavorite, setIsFavorite] = useState(false);

  // Selected Recipe Ingredients
  const [selectedIngredients, setSelectedIngredients] = useState<SelectedRecipeIngredient[]>([]);

  // Ingredient Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch available library foods/ingredients
  const { data: foodsData, isLoading: isFoodsLoading } = useQuery<{ status: string; foods: FoodItem[] }>({
    queryKey: ["foods", { search: searchQuery, statusFilter: "active" }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.set("search", searchQuery);
      params.set("status", "active");
      const res = await fetch(`/api/foods?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch foods");
      return res.json();
    },
  });

  // Filter out foods already selected
  const selectableFoods = useMemo(() => {
    const foodsList = foodsData?.foods || [];
    const selectedIds = new Set(selectedIngredients.map((i) => i.foodId));
    return foodsList.filter((f) => !selectedIds.has(f.id));
  }, [foodsData?.foods, selectedIngredients]);

  // Handle adding an ingredient from the library
  const handleAddIngredient = (food: FoodItem) => {
    const defaultQty = Number(food.servingSize) || 100;
    const newIngredient: SelectedRecipeIngredient = {
      foodId: food.id,
      name: food.name,
      category: food.category,
      baseServingSize: Number(food.servingSize) || 100,
      baseServingUnit: food.servingUnit || "g",
      baseCalories: Number(food.calories) || 0,
      baseProtein: Number(food.protein) || 0,
      baseCarbs: Number(food.carbohydrates) || 0,
      baseFat: Number(food.fat) || 0,
      baseFiber: Number(food.fiber) || 0,
      baseCalcium: food.calcium ? Number(food.calcium) : undefined,
      baseIron: food.iron ? Number(food.iron) : undefined,
      basePotassium: food.potassium ? Number(food.potassium) : undefined,
      baseSodium: food.sodium ? Number(food.sodium) : undefined,
      baseMagnesium: food.magnesium ? Number(food.magnesium) : undefined,
      baseZinc: food.zinc ? Number(food.zinc) : undefined,
      baseVitaminC: food.vitaminC ? Number(food.vitaminC) : undefined,
      baseVitaminB12: food.vitaminB12 ? Number(food.vitaminB12) : undefined,

      quantity: defaultQty,
      unit: food.servingUnit || "g",
    };

    setSelectedIngredients((prev) => [...prev, newIngredient]);
    setSearchQuery("");
    setIsSearching(false);
  };

  // Handle updating quantity for a specific ingredient
  const handleUpdateQuantity = (index: number, quantity: number) => {
    setSelectedIngredients((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, quantity: Math.max(0, quantity) } : item))
    );
  };

  // Handle removing an ingredient
  const handleRemoveIngredient = (index: number) => {
    setSelectedIngredients((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Live Automatic Recipe Nutrition Calculations
  const calculatedTotals = useMemo(() => {
    let calories = 0;
    let protein = 0;
    let carbs = 0;
    let fat = 0;
    let fiber = 0;
    let calcium = 0;
    let iron = 0;
    let potassium = 0;
    let sodium = 0;
    let magnesium = 0;
    let zinc = 0;
    let vitaminC = 0;
    let vitaminB12 = 0;

    for (const item of selectedIngredients) {
      const ratio = item.baseServingSize > 0 ? item.quantity / item.baseServingSize : 1;
      calories += item.baseCalories * ratio;
      protein += item.baseProtein * ratio;
      carbs += item.baseCarbs * ratio;
      fat += item.baseFat * ratio;
      fiber += item.baseFiber * ratio;

      if (item.baseCalcium) calcium += item.baseCalcium * ratio;
      if (item.baseIron) iron += item.baseIron * ratio;
      if (item.basePotassium) potassium += item.basePotassium * ratio;
      if (item.baseSodium) sodium += item.baseSodium * ratio;
      if (item.baseMagnesium) magnesium += item.baseMagnesium * ratio;
      if (item.baseZinc) zinc += item.baseZinc * ratio;
      if (item.baseVitaminC) vitaminC += item.baseVitaminC * ratio;
      if (item.baseVitaminB12) vitaminB12 += item.baseVitaminB12 * ratio;
    }

    return {
      calories: Math.round(calories * 10) / 10,
      protein: Math.round(protein * 10) / 10,
      carbs: Math.round(carbs * 10) / 10,
      fat: Math.round(fat * 10) / 10,
      fiber: Math.round(fiber * 10) / 10,
      calcium: Math.round(calcium * 10) / 10,
      iron: Math.round(iron * 10) / 10,
      potassium: Math.round(potassium * 10) / 10,
      sodium: Math.round(sodium * 10) / 10,
      magnesium: Math.round(magnesium * 10) / 10,
      zinc: Math.round(zinc * 10) / 10,
      vitaminC: Math.round(vitaminC * 10) / 10,
      vitaminB12: Math.round(vitaminB12 * 10) / 10,
    };
  }, [selectedIngredients]);

  // Macro Energy Percentages
  const macroPercentages = useMemo(() => {
    const pCals = calculatedTotals.protein * 4;
    const cCals = calculatedTotals.carbs * 4;
    const fCals = calculatedTotals.fat * 9;
    const totalMacroCals = pCals + cCals + fCals;

    if (totalMacroCals <= 0) return { protein: 0, carbs: 0, fat: 0 };

    return {
      protein: Math.round((pCals / totalMacroCals) * 100),
      carbs: Math.round((cCals / totalMacroCals) * 100),
      fat: Math.round((fCals / totalMacroCals) * 100),
    };
  }, [calculatedTotals]);

  const categories: FoodCategory[] = [
    "SNACKS",
    "GRAINS_CEREALS",
    "PULSES_LEGUMES",
    "DAIRY",
    "VEGETABLES",
    "FRUITS",
    "SWEETS",
    "BEVERAGES",
    "SUPPLEMENTS",
    "OTHER",
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    if (!dishName.trim() || dishName.trim().length < 2) {
      setError("Please enter a food/dish name with at least 2 characters.");
      return;
    }

    if (selectedIngredients.length === 0) {
      setError("Please add at least one ingredient to prepare this food/dish.");
      return;
    }

    const servingNum = parseFloat(servingSize) || 1;

    setIsLoading(true);
    setError(null);

    try {
      // Build Recipe Metadata
      const recipeMetadata = {
        isRecipe: true,
        type: "PREPARED_DISH",
        userNotes: notes.trim() || undefined,
        ingredients: selectedIngredients.map((i) => ({
          foodId: i.foodId,
          name: i.name,
          quantity: i.quantity,
          unit: i.unit,
          calories: Math.round(
            (i.baseCalories * (i.baseServingSize > 0 ? i.quantity / i.baseServingSize : 1)) * 10
          ) / 10,
          protein: Math.round(
            (i.baseProtein * (i.baseServingSize > 0 ? i.quantity / i.baseServingSize : 1)) * 10
          ) / 10,
          carbs: Math.round(
            (i.baseCarbs * (i.baseServingSize > 0 ? i.quantity / i.baseServingSize : 1)) * 10
          ) / 10,
          fat: Math.round(
            (i.baseFat * (i.baseServingSize > 0 ? i.quantity / i.baseServingSize : 1)) * 10
          ) / 10,
        })),
      };

      const payload = {
        name: dishName.trim(),
        category,
        brand: `Recipe (${selectedIngredients.length} ingredients)`,
        servingSize: servingNum,
        servingUnit: servingUnit.trim() || "serving",
        calories: calculatedTotals.calories,
        protein: calculatedTotals.protein,
        carbohydrates: calculatedTotals.carbs,
        fat: calculatedTotals.fat,
        fiber: calculatedTotals.fiber,
        sugar: 0,

        calcium: calculatedTotals.calcium > 0 ? calculatedTotals.calcium : null,
        iron: calculatedTotals.iron > 0 ? calculatedTotals.iron : null,
        magnesium: calculatedTotals.magnesium > 0 ? calculatedTotals.magnesium : null,
        potassium: calculatedTotals.potassium > 0 ? calculatedTotals.potassium : null,
        sodium: calculatedTotals.sodium > 0 ? calculatedTotals.sodium : null,
        zinc: calculatedTotals.zinc > 0 ? calculatedTotals.zinc : null,
        vitaminC: calculatedTotals.vitaminC > 0 ? calculatedTotals.vitaminC : null,
        vitaminB12: calculatedTotals.vitaminB12 > 0 ? calculatedTotals.vitaminB12 : null,

        notes: JSON.stringify(recipeMetadata),
        isFavorite,
      };

      const res = await fetch("/api/foods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to save prepared food.");
        setIsLoading(false);
        return;
      }

      router.push("/foods");
      router.refresh();
    } catch (err: any) {
      console.error("Save recipe error:", err);
      setError("An unexpected network error occurred.");
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 text-left">
      {error && (
        <div className="p-4 rounded-2xl bg-system-error/10 border border-system-error/30 flex items-center gap-3 text-sm font-semibold text-rose-300 animate-fade-in">
          <AlertCircle className="h-5 w-5 text-system-error shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Dish Name & Serving Card */}
      <div className="bg-background-surface border border-border-default rounded-3xl p-6 sm:p-7 shadow-sm space-y-6">
        <div className="flex items-center gap-2.5 pb-4 border-b border-border-subtle">
          <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400">
            <ChefHat className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground-primary tracking-tight">
              Prepared Dish &amp; Food Recipe
            </h3>
            <p className="text-xs text-foreground-muted">
              Prepare a composite meal exclusively by combining ingredients from your library
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Dish Name */}
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-foreground-secondary">
              Dish / Food Name *
            </label>
            <input
              type="text"
              required
              value={dishName}
              onChange={(e) => setDishName(e.target.value)}
              placeholder="e.g. Paneer Bhurji & 4 Rotis, High-Protein Oatmeal Bowl, Chicken Quinoa Salad"
              className="w-full px-4 py-3 bg-background-elevated border border-border-default focus:border-amber-500 rounded-2xl text-sm font-medium text-foreground-primary outline-none transition-all"
            />
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-foreground-secondary">
              Dish Category *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as FoodCategory)}
              className="w-full px-4 py-3 bg-background-elevated border border-border-default focus:border-amber-500 rounded-2xl text-sm font-medium text-foreground-primary outline-none transition-all"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {categoryDisplayNames[cat] || cat}
                </option>
              ))}
            </select>
          </div>

          {/* Serving Unit */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-foreground-secondary">
              Yield / Serving Unit *
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                min="1"
                required
                value={servingSize}
                onChange={(e) => setServingSize(e.target.value)}
                placeholder="1"
                className="w-24 px-4 py-3 bg-background-elevated border border-border-default focus:border-amber-500 rounded-2xl text-sm font-medium text-foreground-primary outline-none font-mono"
              />
              <input
                type="text"
                required
                value={servingUnit}
                onChange={(e) => setServingUnit(e.target.value)}
                placeholder="plate, bowl, serving"
                className="flex-1 px-4 py-3 bg-background-elevated border border-border-default focus:border-amber-500 rounded-2xl text-sm font-medium text-foreground-primary outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Ingredient Selection & Composition Card */}
      <div className="bg-background-surface border border-border-default rounded-3xl p-6 sm:p-7 shadow-sm space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-border-subtle">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/15 text-blue-400">
              <Scale className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground-primary tracking-tight">
                Recipe Ingredients ({selectedIngredients.length})
              </h3>
              <p className="text-xs text-foreground-muted">
                Select and adjust the exact grams/quantities for each ingredient
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsSearching(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-500/15 hover:bg-brand-500/25 border border-brand-500/30 text-brand-400 text-xs font-extrabold transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Select Ingredient</span>
          </button>
        </div>

        {/* Search / Add Ingredient Dropdown Panel */}
        {isSearching && (
          <div className="p-5 rounded-2xl bg-background-elevated border border-brand-500/30 space-y-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-brand-400 uppercase tracking-wider">
                Search Library Ingredients
              </span>
              <button
                type="button"
                onClick={() => setIsSearching(false)}
                className="text-xs text-foreground-muted hover:text-foreground-primary"
              >
                Close Search
              </button>
            </div>

            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-muted pointer-events-none" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search raw paneer, oats, atta, chicken, olive oil, tomato, onion..."
                className="w-full pl-10 pr-4 py-2.5 bg-background-surface border border-border-default focus:border-brand-500 rounded-xl text-xs font-medium text-foreground-primary outline-none"
              />
            </div>

            {/* Results List */}
            <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
              {isFoodsLoading ? (
                <div className="py-6 flex items-center justify-center gap-2 text-xs text-foreground-muted">
                  <Loader2 className="h-4 w-4 animate-spin text-brand-400" />
                  <span>Searching ingredients...</span>
                </div>
              ) : selectableFoods.length === 0 ? (
                <div className="py-6 text-center text-xs text-foreground-muted">
                  No matching ingredients found.{" "}
                  <Link href="/foods/add" className="text-brand-400 font-bold hover:underline">
                    Add new ingredient first
                  </Link>
                </div>
              ) : (
                selectableFoods.slice(0, 10).map((food) => (
                  <div
                    key={food.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-background-surface border border-border-subtle hover:border-brand-500/40 transition-all text-xs"
                  >
                    <div>
                      <h4 className="font-bold text-foreground-primary">{food.name}</h4>
                      <p className="text-[11px] text-foreground-muted font-mono">
                        {Number(food.calories)} kcal • {Number(food.protein)}g P • {Number(food.carbohydrates)}g C • {Number(food.fat)}g F (per {Number(food.servingSize)}{food.servingUnit})
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleAddIngredient(food)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-black font-extrabold text-xs transition-colors cursor-pointer"
                    >
                      + Add to Recipe
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Added Ingredients Table */}
        {selectedIngredients.length === 0 ? (
          <div className="py-12 border-2 border-dashed border-border-subtle rounded-2xl flex flex-col items-center justify-center text-center space-y-3">
            <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400">
              <ChefHat className="h-8 w-8" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground-primary">No ingredients added yet</p>
              <p className="text-xs text-foreground-muted max-w-sm mt-1">
                Click &quot;Select Ingredient&quot; above to search and select ingredients from your library to compose this dish.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsSearching(true)}
              className="px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-black font-bold text-xs transition-all shadow-sm cursor-pointer"
            >
              + Select First Ingredient
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {selectedIngredients.map((item, idx) => {
              const ratio = item.baseServingSize > 0 ? item.quantity / item.baseServingSize : 1;
              const itemCals = Math.round(item.baseCalories * ratio);
              const itemProt = Math.round(item.baseProtein * ratio * 10) / 10;
              const itemCarb = Math.round(item.baseCarbs * ratio * 10) / 10;
              const itemFat = Math.round(item.baseFat * ratio * 10) / 10;

              return (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-background-elevated border border-border-default flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-400" />
                      <h4 className="text-sm font-bold text-foreground-primary">{item.name}</h4>
                    </div>
                    <div className="flex flex-wrap gap-2 text-[11px] text-foreground-muted font-mono">
                      <span className="text-orange-400 font-semibold">{itemCals} kcal</span>
                      <span>•</span>
                      <span className="text-blue-400 font-semibold">{itemProt}g P</span>
                      <span>•</span>
                      <span className="text-amber-400 font-semibold">{itemCarb}g C</span>
                      <span>•</span>
                      <span className="text-rose-400 font-semibold">{itemFat}g F</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-auto">
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min="1"
                        step="any"
                        value={item.quantity}
                        onChange={(e) => handleUpdateQuantity(idx, parseFloat(e.target.value) || 0)}
                        className="w-20 px-3 py-1.5 rounded-xl bg-background-surface border border-border-default focus:border-brand-500 text-xs font-mono text-foreground-primary text-center outline-none"
                      />
                      <span className="text-xs font-semibold text-foreground-muted">{item.unit}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveIngredient(idx)}
                      className="p-2 rounded-xl text-foreground-muted hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                      title="Remove ingredient"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Live Auto-Calculated Composite Nutrition Summary */}
      <div className="bg-gradient-to-br from-[#0e1726] to-[#0d1117] border border-brand-500/30 rounded-3xl p-6 sm:p-7 shadow-lg space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-brand-500/20">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-brand-500/20 text-brand-400">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground-primary tracking-tight">
                Live Auto-Calculated Dish Totals
              </h3>
              <p className="text-xs text-brand-300/80">
                Summed and calculated in real-time from {selectedIngredients.length} selected ingredients
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-2xl font-black font-mono text-orange-400">
              {calculatedTotals.calories}
            </span>
            <span className="text-xs text-foreground-muted ml-1 font-semibold">kcal total</span>
          </div>
        </div>

        {/* 4 Macro Big Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-orange-500/10 border border-orange-500/20 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-orange-400 uppercase">
              <Flame className="h-3.5 w-3.5" />
              Calories
            </div>
            <p className="text-xl font-black font-mono text-foreground-primary">
              {calculatedTotals.calories} <span className="text-xs font-medium text-foreground-muted">kcal</span>
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-blue-400 uppercase">
              <Dna className="h-3.5 w-3.5" />
              Protein
            </div>
            <p className="text-xl font-black font-mono text-blue-400">
              {calculatedTotals.protein} <span className="text-xs font-medium text-foreground-muted">g</span>
            </p>
            <p className="text-[10px] text-foreground-muted">{macroPercentages.protein}% of energy</p>
          </div>

          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 uppercase">
              <Wheat className="h-3.5 w-3.5" />
              Carbs
            </div>
            <p className="text-xl font-black font-mono text-amber-400">
              {calculatedTotals.carbs} <span className="text-xs font-medium text-foreground-muted">g</span>
            </p>
            <p className="text-[10px] text-foreground-muted">{macroPercentages.carbs}% of energy</p>
          </div>

          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-rose-400 uppercase">
              <Droplet className="h-3.5 w-3.5" />
              Fat
            </div>
            <p className="text-xl font-black font-mono text-rose-400">
              {calculatedTotals.fat} <span className="text-xs font-medium text-foreground-muted">g</span>
            </p>
            <p className="text-[10px] text-foreground-muted">{macroPercentages.fat}% of energy</p>
          </div>
        </div>

        {/* Macro Distribution Visual Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-foreground-muted font-medium">
            <span>Macro Distribution</span>
            <span className="font-mono">
              P: {macroPercentages.protein}% • C: {macroPercentages.carbs}% • F: {macroPercentages.fat}%
            </span>
          </div>
          <div className="h-3 rounded-full bg-background-surface overflow-hidden flex">
            <div style={{ width: `${macroPercentages.protein}%` }} className="bg-blue-500 transition-all" />
            <div style={{ width: `${macroPercentages.carbs}%` }} className="bg-amber-500 transition-all" />
            <div style={{ width: `${macroPercentages.fat}%` }} className="bg-rose-500 transition-all" />
          </div>
        </div>
      </div>

      {/* Form Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-border-subtle">
        <Link
          href="/foods"
          className="px-6 py-3 rounded-2xl bg-background-surface hover:bg-background-elevated border border-border-default text-xs font-bold text-foreground-secondary transition-all"
        >
          Cancel
        </Link>

        <button
          type="submit"
          disabled={isLoading || selectedIngredients.length === 0}
          className="inline-flex items-center gap-2 px-8 py-3 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-black font-extrabold text-xs rounded-2xl shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50 cursor-pointer"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Saving Prepared Food...</span>
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              <span>Save Prepared Food ({selectedIngredients.length} Ingredients)</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
