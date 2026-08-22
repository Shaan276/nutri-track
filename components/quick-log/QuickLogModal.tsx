"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  X,
  Droplets,
  UtensilsCrossed,
  Activity,
  Dumbbell,
  Search,
  Check,
  AlertCircle,
  Plus,
  Trash2,
  Sparkles,
  Layers,
  ArrowRight,
  Calculator,
} from "lucide-react";
import { MealType, mealTypeDisplayNames, mealTypeIcons } from "@/lib/validations/meal";
import {
  BeverageType,
  beverageTypeDisplayNames,
  beverageTypeIcons,
  commonQuickAmounts,
} from "@/lib/validations/hydration";
import { FoodItem } from "../foods/FoodCard";

interface QuickLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMealType?: MealType;
  defaultTab?: QuickActionTab;
}

export type QuickActionTab = "MEAL" | "WATER" | "ACTIVITY" | "WORKOUT";

export interface IngredientInput {
  id: string;
  name: string;
  quantityG: number;
  state: "RAW" | "COOKED";
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
}

// Standard staple reference database for instant ingredient addition
export const STAPLE_INGREDIENTS: Array<Omit<IngredientInput, "id" | "quantityG">> = [
  { name: "Raw Besan (Gram Flour)", state: "RAW", caloriesPer100g: 387, proteinPer100g: 22.4, carbsPer100g: 57.8, fatPer100g: 6.7 },
  { name: "Raw Aata (Whole Wheat Flour)", state: "RAW", caloriesPer100g: 340, proteinPer100g: 13.2, carbsPer100g: 72.0, fatPer100g: 2.5 },
  { name: "Raw Soya Chunks (Nutrela)", state: "RAW", caloriesPer100g: 345, proteinPer100g: 52.0, carbsPer100g: 33.0, fatPer100g: 0.5 },
  { name: "Raw Rolled Oats", state: "RAW", caloriesPer100g: 389, proteinPer100g: 16.9, carbsPer100g: 66.3, fatPer100g: 6.9 },
  { name: "Raw Paneer (Cottage Cheese)", state: "RAW", caloriesPer100g: 265, proteinPer100g: 18.3, carbsPer100g: 3.4, fatPer100g: 20.8 },
  { name: "Raw Chicken Breast", state: "RAW", caloriesPer100g: 120, proteinPer100g: 22.5, carbsPer100g: 0.0, fatPer100g: 2.6 },
  { name: "Mustard Oil / Cooking Oil", state: "RAW", caloriesPer100g: 884, proteinPer100g: 0.0, carbsPer100g: 0.0, fatPer100g: 100.0 },
  { name: "Desi Ghee (Clarified Butter)", state: "RAW", caloriesPer100g: 900, proteinPer100g: 0.0, carbsPer100g: 0.0, fatPer100g: 100.0 },
  { name: "Raw Eggs (Whole, Large)", state: "RAW", caloriesPer100g: 143, proteinPer100g: 12.6, carbsPer100g: 0.8, fatPer100g: 9.5 },
  { name: "Cooked White Rice", state: "COOKED", caloriesPer100g: 130, proteinPer100g: 2.7, carbsPer100g: 28.2, fatPer100g: 0.3 },
  { name: "Boiled Egg (Whole, Large)", state: "COOKED", caloriesPer100g: 155, proteinPer100g: 13.0, carbsPer100g: 1.1, fatPer100g: 10.6 },
  { name: "Cooked Chicken Breast", state: "COOKED", caloriesPer100g: 165, proteinPer100g: 31.0, carbsPer100g: 0.0, fatPer100g: 3.6 },
  { name: "Plain Roti / Chapati", state: "COOKED", caloriesPer100g: 297, proteinPer100g: 9.0, carbsPer100g: 60.0, fatPer100g: 1.5 },
  { name: "Cooked Yellow Dal (Tadka)", state: "COOKED", caloriesPer100g: 110, proteinPer100g: 5.5, carbsPer100g: 16.0, fatPer100g: 2.8 },
  { name: "Whey Protein Powder", state: "RAW", caloriesPer100g: 400, proteinPer100g: 80.0, carbsPer100g: 6.7, fatPer100g: 5.0 },
];

export function QuickLogModal({
  isOpen,
  onClose,
  defaultMealType = "LUNCH",
  defaultTab = "MEAL",
}: QuickLogModalProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<QuickActionTab>(defaultTab);
  const [mealCategory, setMealCategory] = useState<MealType>(defaultMealType);
  const [date, setDate] = useState<string>(new Date().toISOString().split("T")[0]);

  // --- Meal Mode: Dish Builder vs Single Food ---
  const [mealLogMode, setMealLogMode] = useState<"DISH" | "SINGLE">("DISH");
  const [dishName, setDishName] = useState("Besan Chilla");
  const [aiPrompt, setAiPrompt] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [ingredients, setIngredients] = useState<IngredientInput[]>([
    {
      id: "ing_1",
      name: "Raw Besan (Gram Flour)",
      quantityG: 60,
      state: "RAW",
      caloriesPer100g: 387,
      proteinPer100g: 22.4,
      carbsPer100g: 57.8,
      fatPer100g: 6.7,
    },
    {
      id: "ing_2",
      name: "Mustard Oil / Ghee",
      quantityG: 5,
      state: "RAW",
      caloriesPer100g: 884,
      proteinPer100g: 0.0,
      carbsPer100g: 0.0,
      fatPer100g: 100.0,
    },
  ]);

  // --- Single Food Mode ---
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [singleFoodQuantityG, setSingleFoodQuantityG] = useState("100");

  // --- Water Fields ---
  const [waterAmount, setWaterAmount] = useState<string>("250");
  const [beverageType, setBeverageType] = useState<BeverageType>("WATER");
  const [waterNotes, setWaterNotes] = useState("");

  // Status
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Search foods query for single food mode
  const { data: foods = [] } = useQuery<FoodItem[]>({
    queryKey: ["foods", searchQuery],
    queryFn: async () => {
      const url = searchQuery
        ? `/api/foods?search=${encodeURIComponent(searchQuery)}`
        : "/api/foods";
      const res = await fetch(url);
      if (!res.ok) return [];
      const json = await res.json();
      return json.data || [];
    },
    enabled: isOpen && activeTab === "MEAL" && mealLogMode === "SINGLE",
  });

  useEffect(() => {
    if (isOpen) {
      setActiveTab(defaultTab);
      setMealCategory(defaultMealType);
      setDate(new Date().toISOString().split("T")[0]);
      setError(null);
      setSuccessMessage(null);
    }
  }, [isOpen, defaultTab, defaultMealType]);

  // Tab switcher with instant redirect for Activity and Workout
  const handleTabChange = (tab: QuickActionTab) => {
    if (tab === "ACTIVITY") {
      onClose();
      router.push("/activities");
      return;
    }
    if (tab === "WORKOUT") {
      onClose();
      router.push("/workouts");
      return;
    }
    setActiveTab(tab);
  };

  if (!isOpen) return null;

  // Invalidate all related queries
  const invalidateAllHealthQueries = () => {
    queryClient.invalidateQueries({ queryKey: ["nutrition"] });
    queryClient.invalidateQueries({ queryKey: ["hydration"] });
    queryClient.invalidateQueries({ queryKey: ["hydration-weekly"] });
    queryClient.invalidateQueries({ queryKey: ["activities"] });
    queryClient.invalidateQueries({ queryKey: ["activity"] });
    queryClient.invalidateQueries({ queryKey: ["workouts"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    queryClient.invalidateQueries({ queryKey: ["deep-nutrition"] });
    queryClient.invalidateQueries({ queryKey: ["health-snapshot"] });
    queryClient.invalidateQueries({ queryKey: ["reports"] });
    queryClient.invalidateQueries({ queryKey: ["goals"] });
    queryClient.invalidateQueries({ queryKey: ["achievements"] });
  };

  // --- Dynamic Macro Calculations for Dish Builder ---
  const calculateDishTotals = () => {
    let totCal = 0;
    let totProt = 0;
    let totCarb = 0;
    let totFat = 0;

    for (const ing of ingredients) {
      const factor = (ing.quantityG || 0) / 100;
      totCal += (ing.caloriesPer100g || 0) * factor;
      totProt += (ing.proteinPer100g || 0) * factor;
      totCarb += (ing.carbsPer100g || 0) * factor;
      totFat += (ing.fatPer100g || 0) * factor;
    }

    return {
      calories: Math.round(totCal * 10) / 10,
      protein: Math.round(totProt * 10) / 10,
      carbs: Math.round(totCarb * 10) / 10,
      fat: Math.round(totFat * 10) / 10,
    };
  };

  const dishTotals = calculateDishTotals();

  // --- Ingredient Handlers ---
  const handleUpdateIngredientQuantity = (id: string, newQtyG: number) => {
    setIngredients((prev) =>
      prev.map((ing) => (ing.id === id ? { ...ing, quantityG: Math.max(0, newQtyG) } : ing))
    );
  };

  const handleRemoveIngredient = (id: string) => {
    setIngredients((prev) => prev.filter((ing) => ing.id !== id));
  };

  const handleAddStapleIngredient = (staple: (typeof STAPLE_INGREDIENTS)[0]) => {
    const newId = `ing_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    setIngredients((prev) => [
      ...prev,
      {
        id: newId,
        name: staple.name,
        quantityG: 50,
        state: staple.state,
        caloriesPer100g: staple.caloriesPer100g,
        proteinPer100g: staple.proteinPer100g,
        carbsPer100g: staple.carbsPer100g,
        fatPer100g: staple.fatPer100g,
      },
    ]);
  };

  // --- AI Recipe Breakdown Handler ---
  const handleAiBreakdown = async (queryText?: string) => {
    const text = (queryText || aiPrompt || dishName).trim();
    if (!text) {
      setError("Please enter a dish name or recipe description for AI breakdown.");
      return;
    }

    try {
      setIsAiLoading(true);
      setError(null);

      const res = await fetch("/api/ai/meals/breakdown", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: text }),
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || "AI breakdown failed");
      }

      const data = await res.json();
      if (data.dishName) {
        setDishName(data.dishName);
      }

      if (data.ingredients && Array.isArray(data.ingredients)) {
        setIngredients(
          data.ingredients.map((ing: any, i: number) => ({
            id: `ai_ing_${Date.now()}_${i}`,
            name: ing.name,
            quantityG: ing.quantityG,
            state: ing.state || "RAW",
            caloriesPer100g: ing.caloriesPer100g,
            proteinPer100g: ing.proteinPer100g,
            carbsPer100g: ing.carbsPer100g,
            fatPer100g: ing.fatPer100g,
          }))
        );
      }
      setAiPrompt("");
    } catch (err: any) {
      setError(err.message || "Failed to calculate recipe with AI.");
    } finally {
      setIsAiLoading(false);
    }
  };

  // --- Meal Submission Handler ---
  const handleLogMeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    try {
      setIsLoading(true);
      setError(null);

      let payload: any;

      if (mealLogMode === "DISH") {
        if (!dishName.trim()) {
          throw new Error("Please enter a dish name.");
        }
        if (ingredients.length === 0) {
          throw new Error("Please add at least one ingredient to your dish.");
        }

        payload = {
          date,
          mealType: mealCategory,
          customFood: {
            name: dishName.trim(),
            calories: dishTotals.calories,
            protein: dishTotals.protein,
            carbs: dishTotals.carbs,
            fat: dishTotals.fat,
            servingSize: 100,
            servingUnit: "g",
            ingredients: ingredients.map((ing) => ({
              name: ing.name,
              quantityG: ing.quantityG,
              state: ing.state,
              caloriesPer100g: ing.caloriesPer100g,
              proteinPer100g: ing.proteinPer100g,
              carbsPer100g: ing.carbsPer100g,
              fatPer100g: ing.fatPer100g,
            })),
          },
          ingredients: ingredients.map((ing) => ({
            name: ing.name,
            quantityG: ing.quantityG,
            state: ing.state,
            caloriesPer100g: ing.caloriesPer100g,
            proteinPer100g: ing.proteinPer100g,
            carbsPer100g: ing.carbsPer100g,
            fatPer100g: ing.fatPer100g,
          })),
          quantity: 100,
          quantityUnit: "g",
        };
      } else {
        // Single food mode
        if (!selectedFood) {
          throw new Error("Please select a food item from the database.");
        }
        const qtyNum = parseFloat(singleFoodQuantityG);
        if (isNaN(qtyNum) || qtyNum <= 0) {
          throw new Error("Please enter a valid quantity in grams.");
        }

        payload = {
          date,
          mealType: mealCategory,
          foodId: selectedFood.id,
          quantity: qtyNum,
          quantityUnit: "g",
        };
      }

      const res = await fetch("/api/meals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to log meal entry.");
      }

      invalidateAllHealthQueries();
      onClose();
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  // --- Hydration Handler ---
  const handleWaterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    const amount = parseInt(waterAmount, 10);
    if (!amount || amount <= 0 || amount > 5000) {
      setError("Please enter a valid amount (1 - 5000 ml).");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const res = await fetch("/api/hydration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amountMl: amount,
          beverageType,
          date,
          notes: waterNotes.trim() ? waterNotes.trim() : null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to log hydration.");
      }

      invalidateAllHealthQueries();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to record hydration.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in text-left">
      <div className="relative w-full max-w-xl max-h-[92vh] flex flex-col bg-[#0D1117] border border-[#21262D] rounded-3xl shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#21262D] bg-[#161B22]/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand-500/15 border border-brand-500/30 flex items-center justify-center text-brand-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Quick Log</h2>
              <p className="text-[11px] text-slate-400">Auto-calculated nutrition & health tracking</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Tabs */}
        <div className="grid grid-cols-4 p-2 bg-[#090D13] border-b border-[#21262D] gap-1.5">
          <button
            type="button"
            onClick={() => handleTabChange("MEAL")}
            className={`py-2 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === "MEAL"
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <UtensilsCrossed className="w-3.5 h-3.5" />
            <span>Meal</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange("WATER")}
            className={`py-2 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === "WATER"
                ? "bg-blue-500/20 text-blue-400 border border-blue-500/40 shadow-sm"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Droplets className="w-3.5 h-3.5" />
            <span>Water</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange("ACTIVITY")}
            className="py-2 px-2 rounded-xl text-xs font-bold text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 flex items-center justify-center gap-1.5 transition-all"
            title="Open Activity Tracker"
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Activity ↗</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange("WORKOUT")}
            className="py-2 px-2 rounded-xl text-xs font-bold text-slate-400 hover:text-purple-400 hover:bg-purple-500/10 flex items-center justify-center gap-1.5 transition-all"
            title="Open Workout Tracker"
          >
            <Dumbbell className="w-3.5 h-3.5" />
            <span>Workout ↗</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4 text-xs">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* TAB 1: MEAL LOGGING */}
          {activeTab === "MEAL" && (
            <form onSubmit={handleLogMeal} className="space-y-4">
              {/* Meal Category Selection */}
              <div className="grid grid-cols-4 gap-1.5">
                {(["BREAKFAST", "LUNCH", "DINNER", "SNACK"] as MealType[]).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setMealCategory(cat)}
                    className={`py-2 px-1 rounded-xl font-bold text-center transition-all ${
                      mealCategory === cat
                        ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/20"
                        : "bg-[#161B22] text-slate-400 hover:text-white border border-[#21262D]"
                    }`}
                  >
                    <span className="mr-1">{mealTypeIcons[cat]}</span>
                    {mealTypeDisplayNames[cat].toUpperCase()}
                  </button>
                ))}
              </div>

              {/* Mode Toggle: Dish / Recipe vs Single Food */}
              <div className="flex rounded-xl bg-[#161B22] p-1 border border-[#21262D]">
                <button
                  type="button"
                  onClick={() => setMealLogMode("DISH")}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    mealLogMode === "DISH"
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Calculator className="w-3.5 h-3.5" />
                  <span>Dish & Raw Ingredients (Auto-Macro)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMealLogMode("SINGLE")}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    mealLogMode === "SINGLE"
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Single Food Item</span>
                </button>
              </div>

              {/* DISH BUILDER MODE */}
              {mealLogMode === "DISH" ? (
                <div className="space-y-4">
                  {/* Dish Name & AI Recipe Auto-Breakdown */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-300">Dish Name</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={dishName}
                        onChange={(e) => setDishName(e.target.value)}
                        placeholder="e.g. Besan Chilla, Soya Bhurji, Oats Protein Bowl"
                        className="flex-1 px-3 py-2 rounded-xl bg-[#161B22] border border-[#21262D] text-white focus:border-emerald-500 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleAiBreakdown()}
                        disabled={isAiLoading}
                        className="px-3 py-2 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 font-bold flex items-center gap-1.5 transition-all disabled:opacity-50"
                        title="Auto-calculate ingredients using AI"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{isAiLoading ? "Calculating..." : "AI Breakdown"}</span>
                      </button>
                    </div>
                  </div>

                  {/* AI Quick Prompt Input */}
                  <div className="p-3 rounded-2xl bg-purple-950/20 border border-purple-500/30 space-y-2">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-purple-300">
                      <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                      <span>AI Ingredient Extractor</span>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        placeholder="e.g. 2 Besan Chilla with 5g ghee and 50g curd"
                        className="flex-1 px-3 py-1.5 text-xs rounded-xl bg-[#0D1117] border border-purple-500/30 text-white placeholder:text-slate-500 focus:outline-none"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAiBreakdown(aiPrompt);
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => handleAiBreakdown(aiPrompt)}
                        disabled={isAiLoading || !aiPrompt.trim()}
                        className="px-3 py-1.5 rounded-xl bg-purple-500 hover:bg-purple-400 text-black font-bold text-xs disabled:opacity-50 transition-all"
                      >
                        Extract
                      </button>
                    </div>
                  </div>

                  {/* Ingredients Table / Cards */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                        Raw / Cooked Ingredients ({ingredients.length})
                      </span>
                      <span className="text-[10px] text-slate-400">Nutrients calculate per grams automatically</span>
                    </div>

                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      {ingredients.map((ing) => {
                        const factor = (ing.quantityG || 0) / 100;
                        const cal = Math.round((ing.caloriesPer100g || 0) * factor * 10) / 10;
                        const prot = Math.round((ing.proteinPer100g || 0) * factor * 10) / 10;
                        const carb = Math.round((ing.carbsPer100g || 0) * factor * 10) / 10;
                        const fat = Math.round((ing.fatPer100g || 0) * factor * 10) / 10;

                        return (
                          <div
                            key={ing.id}
                            className="p-2.5 rounded-xl bg-[#161B22] border border-[#21262D] flex items-center justify-between gap-3"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span
                                  className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                                    ing.state === "RAW"
                                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                      : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                                  }`}
                                >
                                  {ing.state}
                                </span>
                                <span className="text-xs font-bold text-white truncate">{ing.name}</span>
                              </div>
                              <div className="text-[10px] text-slate-400 mt-0.5 flex gap-2">
                                <span className="text-emerald-400">{cal} kcal</span>
                                <span className="text-amber-400">{prot}g P</span>
                                <span className="text-blue-400">{carb}g C</span>
                                <span className="text-rose-400">{fat}g F</span>
                              </div>
                            </div>

                            {/* Quantity Input in Grams */}
                            <div className="flex items-center gap-1.5 shrink-0">
                              <input
                                type="number"
                                min="0"
                                max="2000"
                                value={ing.quantityG || ""}
                                onChange={(e) =>
                                  handleUpdateIngredientQuantity(ing.id, parseFloat(e.target.value) || 0)
                                }
                                className="w-16 px-2 py-1 text-center font-mono font-bold text-xs rounded-lg bg-[#0D1117] border border-[#30363D] text-white focus:border-emerald-500 focus:outline-none"
                              />
                              <span className="text-[11px] text-slate-400 font-medium">g</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveIngredient(ing.id)}
                                className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Add Common Raw & Cooked Staples */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      + Click to Add Raw/Cooked Materials
                    </span>
                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                      {STAPLE_INGREDIENTS.map((staple) => (
                        <button
                          key={staple.name}
                          type="button"
                          onClick={() => handleAddStapleIngredient(staple)}
                          className="px-2 py-1 rounded-lg bg-[#161B22] hover:bg-emerald-500/20 text-slate-300 hover:text-emerald-300 border border-[#21262D] hover:border-emerald-500/30 text-[11px] font-medium flex items-center gap-1 transition-all"
                        >
                          <Plus className="w-3 h-3 text-emerald-400" />
                          <span>{staple.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Calculated Dish Summary */}
                  <div className="p-3.5 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 grid grid-cols-4 gap-2 text-center">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400">Calories</span>
                      <p className="text-sm font-extrabold text-emerald-400">{dishTotals.calories}</p>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400">Protein</span>
                      <p className="text-sm font-extrabold text-amber-400">{dishTotals.protein}g</p>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400">Carbs</span>
                      <p className="text-sm font-extrabold text-blue-400">{dishTotals.carbs}g</p>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400">Fats</span>
                      <p className="text-sm font-extrabold text-rose-400">{dishTotals.fat}g</p>
                    </div>
                  </div>
                </div>
              ) : (
                /* SINGLE FOOD SEARCH MODE */
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search raw/cooked foods..."
                      className="w-full pl-8 pr-3 py-2 rounded-xl bg-[#161B22] border border-[#21262D] text-white focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  {/* Food Selection Results */}
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {foods.map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setSelectedFood(f)}
                        className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                          selectedFood?.id === f.id
                            ? "bg-emerald-500/20 border-emerald-500 text-white"
                            : "bg-[#161B22] border-[#21262D] text-slate-300 hover:border-slate-600"
                        }`}
                      >
                        <div>
                          <span className="font-bold text-xs text-white block">{f.name}</span>
                          <span className="text-[10px] text-slate-400">
                            {f.calories} kcal | {f.protein}g P | {f.carbohydrates}g C | {f.fat}g F (per {f.servingSize}{f.servingUnit})
                          </span>
                        </div>
                        {selectedFood?.id === f.id && <Check className="w-4 h-4 text-emerald-400" />}
                      </button>
                    ))}
                  </div>

                  {selectedFood && (
                    <div className="p-3 rounded-2xl bg-[#161B22] border border-[#21262D] space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">{selectedFood.name}</span>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            min="1"
                            value={singleFoodQuantityG}
                            onChange={(e) => setSingleFoodQuantityG(e.target.value)}
                            className="w-16 px-2 py-1 text-center font-bold text-xs rounded-lg bg-[#0D1117] border border-[#30363D] text-white focus:outline-none"
                          />
                          <span className="text-slate-400">g</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50"
              >
                {isLoading
                  ? "Logging..."
                  : `Log to ${mealTypeDisplayNames[mealCategory].toUpperCase()}`}
              </button>
            </form>
          )}

          {/* TAB 2: HYDRATION */}
          {activeTab === "WATER" && (
            <form onSubmit={handleWaterSubmit} className="space-y-4">
              {/* Quick Amounts */}
              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1.5">
                  Quick Amount Select
                </label>
                <div className="grid grid-cols-5 gap-1.5">
                  {commonQuickAmounts.map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setWaterAmount(String(amt))}
                      className={`py-2 rounded-xl border text-xs font-bold transition-all ${
                        waterAmount === String(amt)
                          ? "bg-blue-500 text-white border-blue-400 shadow-md shadow-blue-500/20"
                          : "bg-[#161B22] border-[#21262D] text-slate-300 hover:text-white"
                      }`}
                    >
                      +{amt} ml
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Amount */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-300">Custom Amount (ml)</label>
                <input
                  type="number"
                  min="1"
                  max="5000"
                  value={waterAmount}
                  onChange={(e) => setWaterAmount(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#161B22] border border-[#21262D] text-white font-mono font-bold text-center text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>

              {/* High-Contrast Beverage Grid */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-300 block">Beverage Type</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  {(
                    [
                      "WATER",
                      "TEA",
                      "MILK",
                      "BUTTERMILK",
                      "LASSI",
                      "JUICE",
                      "PROTEIN_SHAKE",
                      "ORS",
                      "OTHER",
                    ] as BeverageType[]
                  ).map((bev) => (
                    <button
                      key={bev}
                      type="button"
                      onClick={() => setBeverageType(bev)}
                      className={`p-2.5 rounded-xl border text-xs flex items-center gap-2 transition-all ${
                        beverageType === bev
                          ? "bg-blue-500/25 border-blue-400 text-white font-bold shadow-sm"
                          : "bg-[#161B22] border-[#21262D] text-slate-300 hover:text-white hover:border-slate-600"
                      }`}
                    >
                      <span className="text-sm">{beverageTypeIcons[bev]}</span>
                      <span className="text-[11px] font-medium truncate">
                        {beverageTypeDisplayNames[bev]}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit Hydration */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-blue-500 hover:bg-blue-400 text-black font-extrabold text-xs rounded-2xl shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50"
              >
                {isLoading ? "Recording..." : `Log +${waterAmount} ml Hydration`}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
