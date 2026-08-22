"use client";

import React, { useState, useEffect, useRef } from "react";
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
  Minus,
  Sparkles,
  Info,
  Flame,
  Clock,
  Footprints,
} from "lucide-react";
import { MealType } from "@/lib/validations/meal";
import {
  BeverageType,
  beverageTypeDisplayNames,
  beverageTypeIcons,
  commonQuickAmounts,
} from "@/lib/validations/hydration";
import { RunningType, runningTypeDisplayNames, runningTypeDescriptions } from "@/lib/validations/activity";
import { FoodItem } from "../foods/FoodCard";

interface QuickLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMealType?: MealType;
  defaultTab?: QuickActionTab;
}

export type QuickActionTab = "MEAL" | "WATER" | "ACTIVITY" | "WORKOUT";

const POPULAR_FOOD_PRESETS: Array<{ name: string; servingSize: number; servingUnit: string; calories: number; protein: number; carbohydrates: number; fat: number }> = [
  { name: "Egg (Whole, Large)", servingSize: 1, servingUnit: "large", calories: 72, protein: 6.3, carbohydrates: 0.4, fat: 4.8 },
  { name: "Chicken Breast (Cooked)", servingSize: 100, servingUnit: "g", calories: 165, protein: 31, carbohydrates: 0, fat: 3.6 },
  { name: "Oatmeal (Rolled)", servingSize: 50, servingUnit: "g", calories: 190, protein: 6.5, carbohydrates: 34, fat: 3 },
  { name: "Whey Protein Scoop", servingSize: 30, servingUnit: "g", calories: 120, protein: 24, carbohydrates: 2, fat: 1.5 },
  { name: "Greek Yogurt (Non-Fat)", servingSize: 150, servingUnit: "g", calories: 90, protein: 15, carbohydrates: 6, fat: 0 },
  { name: "Banana (Medium)", servingSize: 1, servingUnit: "medium", calories: 105, protein: 1.3, carbohydrates: 27, fat: 0.3 },
  { name: "Rice (White, Cooked)", servingSize: 150, servingUnit: "g", calories: 195, protein: 4, carbohydrates: 43, fat: 0.4 },
];

const RUN_TYPES: RunningType[] = ["EASY", "LONG", "TEMPO", "RECOVERY", "INTERVAL", "RACE"];

export function QuickLogModal({
  isOpen,
  onClose,
  defaultMealType = "LUNCH",
  defaultTab = "MEAL",
}: QuickLogModalProps) {
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<QuickActionTab>(defaultTab);
  const [mealCategory, setMealCategory] = useState<MealType>(defaultMealType);
  const [date, setDate] = useState<string>(new Date().toISOString().split("T")[0]);

  // --- Meal Fields ---
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [customName, setCustomName] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [quantity, setQuantity] = useState("100");
  const [quantityUnit, setQuantityUnit] = useState("g");

  // --- Water Fields ---
  const [waterAmount, setWaterAmount] = useState<string>("250");
  const [beverageType, setBeverageType] = useState<BeverageType>("WATER");
  const [waterNotes, setWaterNotes] = useState("");

  // --- Activity Fields ---
  const [activityType, setActivityType] = useState<"RUN" | "WALK" | "CYCLING" | "HIIT" | "OTHER">("RUN");
  const [runningType, setRunningType] = useState<RunningType>("EASY");
  const [activityDistanceKm, setActivityDistanceKm] = useState<string>("5.0");
  const [activityDurationMins, setActivityDurationMins] = useState<string>("30");
  const [activityCalories, setActivityCalories] = useState<string>("300");
  const [showRunInfo, setShowRunInfo] = useState<RunningType | null>(null);

  // --- Workout Fields ---
  const [workoutType, setWorkoutType] = useState<"GYM_WORKOUT" | "HOME_WORKOUT">("GYM_WORKOUT");
  const [workoutName, setWorkoutName] = useState<string>("Push Day Workout");
  const [workoutDurationMins, setWorkoutDurationMins] = useState<string>("45");
  const [workoutCalories, setWorkoutCalories] = useState<string>("250");
  const [exerciseName, setExerciseName] = useState<string>("Bench Press");
  const [exerciseSets, setExerciseSets] = useState<number>(3);
  const [exerciseReps, setExerciseReps] = useState<number>(10);
  const [exerciseWeightKg, setExerciseWeightKg] = useState<number>(60);

  // Status & Lock
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 250);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Query Food Database
  const { data: foods = [] } = useQuery<FoodItem[]>({
    queryKey: ["foods", debouncedSearch],
    queryFn: async () => {
      const url = debouncedSearch
        ? `/api/foods?search=${encodeURIComponent(debouncedSearch)}`
        : "/api/foods";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch food library");
      const json = await res.json();
      return json.data || [];
    },
    enabled: isOpen && activeTab === "MEAL",
    staleTime: 1000 * 60,
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
    queryClient.invalidateQueries({ queryKey: ["challenges"] });
  };

  // --- Meal Handlers ---
  const handleSelectFood = (food: FoodItem | typeof POPULAR_FOOD_PRESETS[0]) => {
    setSelectedFood(food as any);
    setCustomName(food.name);
    setQuantity(String(food.servingSize));
    setQuantityUnit(food.servingUnit);
    setCalories(String(food.calories));
    setProtein(String(food.protein));
    setCarbs(String(food.carbohydrates));
    setFat(String(food.fat));
  };

  const handleQuantityChange = (newQtyStr: string) => {
    setQuantity(newQtyStr);
    const newQty = parseFloat(newQtyStr);
    const refServing = selectedFood ? Number(selectedFood.servingSize) : 0;

    if (selectedFood && !isNaN(newQty) && newQty > 0 && refServing > 0) {
      const factor = newQty / refServing;
      setCalories(String(Math.round(Number(selectedFood.calories) * factor * 10) / 10));
      setProtein(String(Math.round(Number(selectedFood.protein) * factor * 10) / 10));
      const baseCarbs = Number((selectedFood as any).carbs || (selectedFood as any).carbohydrates || 0);
      setCarbs(String(Math.round(baseCarbs * factor * 10) / 10));
      setFat(String(Math.round(Number(selectedFood.fat) * factor * 10) / 10));
    }
  };

  const handleMealSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return; // Prevent duplicate rapid submission

    if (!selectedFood && !customName.trim()) {
      setError("Please select a food or enter a custom food name.");
      return;
    }

    const numCalories = parseFloat(calories);
    const numProtein = parseFloat(protein) || 0;
    const numCarbs = parseFloat(carbs) || 0;
    const numFat = parseFloat(fat) || 0;
    const numQuantity = parseFloat(quantity) || 100;

    if (isNaN(numCalories) || numCalories < 0) {
      setError("Please enter a valid calorie amount.");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const payload = {
        date,
        mealType: mealCategory,
        foodId: (selectedFood as any)?.id || undefined,
        customFood: !selectedFood
          ? {
              name: customName.trim(),
              calories: numCalories,
              protein: numProtein,
              carbs: numCarbs,
              fat: numFat,
              servingSize: numQuantity,
              servingUnit: quantityUnit.trim() || "g",
            }
          : undefined,
        quantity: numQuantity,
        quantityUnit: quantityUnit.trim() || "g",
      };

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
    if (isLoading) return; // Prevent duplicate rapid submission

    const amount = parseInt(waterAmount, 10);
    if (!amount || amount <= 0 || amount > 5000) {
      setError("Please enter a valid water amount (1 - 5000 ml).");
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

  // --- Activity Handler ---
  const handleActivitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    const mins = parseFloat(activityDurationMins);
    if (!mins || mins <= 0) {
      setError("Please enter a valid duration in minutes.");
      return;
    }

    const distKm = parseFloat(activityDistanceKm) || 0;
    const cals = parseInt(activityCalories, 10) || 0;

    if (activityType === "RUN" && distKm <= 0) {
      setError("Running requires a distance greater than 0 km.");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const movingDurationSeconds = Math.round(mins * 60);

      const payload: any = {
        activityType,
        date,
        movingDurationSeconds,
        distanceKm: distKm,
        caloriesBurned: cals,
      };

      if (activityType === "RUN") {
        payload.runningType = runningType;
      }

      const res = await fetch("/api/activity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to log activity.");
      }

      invalidateAllHealthQueries();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to record activity.");
    } finally {
      setIsLoading(false);
    }
  };

  // --- Workout Handler ---
  const handleWorkoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    if (!workoutName.trim()) {
      setError("Please enter a workout name.");
      return;
    }

    const durationSec = (parseFloat(workoutDurationMins) || 30) * 60;
    const cals = parseInt(workoutCalories, 10) || 0;

    try {
      setIsLoading(true);
      setError(null);

      const setsArray = [];
      for (let i = 1; i <= exerciseSets; i++) {
        setsArray.push({
          setNumber: i,
          reps: exerciseReps,
          weightKg: workoutType === "GYM_WORKOUT" ? exerciseWeightKg : null,
        });
      }

      const payload = {
        workoutType,
        name: workoutName.trim(),
        date,
        durationSeconds: durationSec,
        caloriesBurned: cals,
        exercises: [
          {
            name: exerciseName.trim() || "Main Movement",
            orderIndex: 0,
            sets: setsArray,
          },
        ],
      };

      const res = await fetch("/api/workouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to log workout session.");
      }

      invalidateAllHealthQueries();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to record workout.");
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate live running pace
  const runDist = parseFloat(activityDistanceKm) || 0;
  const runMins = parseFloat(activityDurationMins) || 0;
  let livePaceDisplay = "--:-- / km";
  if (runDist > 0 && runMins > 0) {
    const secPerKm = (runMins * 60) / runDist;
    const pMin = Math.floor(secPerKm / 60);
    const pSec = Math.round(secPerKm % 60);
    livePaceDisplay = `${pMin}:${pSec < 10 ? "0" : ""}${pSec} / km`;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      {/* Container: Bottom sheet on mobile, rounded card on desktop */}
      <div className="bg-[#121620] border-t md:border border-[#232936] rounded-t-3xl md:rounded-2xl w-full max-w-xl max-h-[92vh] md:max-h-[85vh] flex flex-col shadow-2xl overflow-hidden relative">
        {/* Mobile Pull Handle */}
        <div className="md:hidden w-12 h-1.5 bg-slate-700 rounded-full mx-auto mt-3 mb-1 shrink-0" />

        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-[#232936] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Quick Log</h2>
              <p className="text-[11px] text-slate-400">Fast one-tap health and fitness recording</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 4 Core Pillar Tabs */}
        <div className="grid grid-cols-4 p-2 bg-[#0E121A] border-b border-[#232936] gap-1 shrink-0">
          <button
            type="button"
            onClick={() => { setActiveTab("MEAL"); setError(null); }}
            className={`py-2 px-1 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === "MEAL"
                ? "bg-[#161B26] text-emerald-400 border border-emerald-500/30 shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <UtensilsCrossed className="w-3.5 h-3.5" />
            <span>Meal</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab("WATER"); setError(null); }}
            className={`py-2 px-1 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === "WATER"
                ? "bg-[#161B26] text-blue-400 border border-blue-500/30 shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Droplets className="w-3.5 h-3.5" />
            <span>Water</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab("ACTIVITY"); setError(null); }}
            className={`py-2 px-1 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === "ACTIVITY"
                ? "bg-[#161B26] text-amber-400 border border-amber-500/30 shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Activity</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab("WORKOUT"); setError(null); }}
            className={`py-2 px-1 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === "WORKOUT"
                ? "bg-[#161B26] text-purple-400 border border-purple-500/30 shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Dumbbell className="w-3.5 h-3.5" />
            <span>Workout</span>
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-2 text-xs text-rose-400">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* TAB 1: MEAL */}
          {activeTab === "MEAL" && (
            <form onSubmit={handleMealSubmit} className="space-y-4">
              {/* Meal Type Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {(["BREAKFAST", "LUNCH", "DINNER", "SNACK"] as MealType[]).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setMealCategory(type)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                      mealCategory === type
                        ? "bg-emerald-500 text-[#0E121A] font-bold"
                        : "bg-[#161B26] text-slate-400 border border-[#232936] hover:text-white"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>

              {/* Food Search Input */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Search Food Database or type custom..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#161B26] border border-[#232936] rounded-xl pl-9 pr-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Popular Food Quick Chips */}
              {!searchQuery && (
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 block mb-1.5">
                    Frequently Logged
                  </span>
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                    {POPULAR_FOOD_PRESETS.map((p, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectFood(p)}
                        className="px-2.5 py-1 bg-[#161B26] hover:bg-[#1E2433] border border-[#232936] rounded-lg text-[11px] text-slate-300 whitespace-nowrap transition-colors flex items-center gap-1"
                      >
                        <span>{p.name}</span>
                        <span className="text-emerald-400 text-[10px]">+{p.calories}kcal</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Search Results Dropdown / List */}
              {searchQuery && foods.length > 0 && (
                <div className="max-h-32 overflow-y-auto bg-[#161B26] border border-[#232936] rounded-xl divide-y divide-[#232936]">
                  {foods.map((food) => (
                    <button
                      key={food.id}
                      type="button"
                      onClick={() => {
                        handleSelectFood(food);
                        setSearchQuery("");
                      }}
                      className="w-full px-3 py-2 text-left text-xs hover:bg-[#1E2433] flex items-center justify-between transition-colors"
                    >
                      <span className="text-white font-medium">{food.name}</span>
                      <span className="text-emerald-400 font-semibold">{food.calories} kcal / {food.servingSize}{food.servingUnit}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Food Details & Macro Preview */}
              <div className="p-3.5 bg-[#161B26] border border-[#232936] rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">
                    {selectedFood ? selectedFood.name : (customName || "Custom Food Entry")}
                  </span>
                  {selectedFood && (
                    <button
                      type="button"
                      onClick={() => { setSelectedFood(null); setCustomName(""); }}
                      className="text-[10px] text-rose-400 hover:underline"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {!selectedFood && (
                  <input
                    type="text"
                    placeholder="Custom food name *"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    className="w-full bg-[#121620] border border-[#232936] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                )}

                {/* Quantity Scaler */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-400 font-medium block mb-1">Portion Size</label>
                    <input
                      type="number"
                      value={quantity}
                      onChange={(e) => handleQuantityChange(e.target.value)}
                      className="w-full bg-[#121620] border border-[#232936] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 font-medium block mb-1">Unit</label>
                    <input
                      type="text"
                      value={quantityUnit}
                      onChange={(e) => setQuantityUnit(e.target.value)}
                      className="w-full bg-[#121620] border border-[#232936] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Live Macro Preview Pills */}
                <div className="grid grid-cols-4 gap-1.5 pt-1 text-center">
                  <div className="p-2 bg-[#121620] rounded-lg border border-[#232936]">
                    <div className="text-[10px] text-slate-500 uppercase">Calories</div>
                    <div className="text-xs font-black text-emerald-400">{calories || 0}</div>
                  </div>
                  <div className="p-2 bg-[#121620] rounded-lg border border-[#232936]">
                    <div className="text-[10px] text-slate-500 uppercase">Protein</div>
                    <div className="text-xs font-bold text-amber-400">{protein || 0}g</div>
                  </div>
                  <div className="p-2 bg-[#121620] rounded-lg border border-[#232936]">
                    <div className="text-[10px] text-slate-500 uppercase">Carbs</div>
                    <div className="text-xs font-bold text-blue-400">{carbs || 0}g</div>
                  </div>
                  <div className="p-2 bg-[#121620] rounded-lg border border-[#232936]">
                    <div className="text-[10px] text-slate-500 uppercase">Fats</div>
                    <div className="text-xs font-bold text-rose-400">{fat || 0}g</div>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-[#0E121A] font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50"
              >
                {isLoading ? "Saving Meal..." : `Log to ${mealCategory}`}
              </button>
            </form>
          )}

          {/* TAB 2: WATER */}
          {activeTab === "WATER" && (
            <form onSubmit={handleWaterSubmit} className="space-y-4">
              {/* One-Tap Quick Presets */}
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 block mb-2">
                  One-Tap Quick Presets
                </span>
                <div className="grid grid-cols-4 gap-2">
                  {commonQuickAmounts.map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setWaterAmount(String(amt))}
                      className={`py-2.5 rounded-xl border text-xs font-bold transition-all ${
                        waterAmount === String(amt)
                          ? "bg-blue-500/20 border-blue-500 text-blue-300 shadow-md shadow-blue-500/10"
                          : "bg-[#161B26] border-[#232936] text-slate-300 hover:text-white"
                      }`}
                    >
                      +{amt} ml
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Water Amount with Steppers */}
              <div className="p-3.5 bg-[#161B26] border border-[#232936] rounded-xl space-y-2">
                <label className="text-xs font-semibold text-slate-300 block">Custom Amount (ml)</label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setWaterAmount(String(Math.max(50, (parseInt(waterAmount, 10) || 250) - 50)))}
                    className="w-9 h-9 rounded-lg bg-[#121620] border border-[#232936] flex items-center justify-center text-slate-400 hover:text-white active:scale-95 transition-all"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <input
                    type="number"
                    value={waterAmount}
                    onChange={(e) => setWaterAmount(e.target.value)}
                    className="flex-1 bg-[#121620] border border-[#232936] rounded-lg px-3 py-2 text-center text-sm font-bold text-white focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setWaterAmount(String((parseInt(waterAmount, 10) || 250) + 50))}
                    className="w-9 h-9 rounded-lg bg-[#121620] border border-[#232936] flex items-center justify-center text-slate-400 hover:text-white active:scale-95 transition-all"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Beverage Type */}
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 block mb-1.5">
                  Beverage Type
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(["WATER", "COFFEE", "TEA", "ELECTROLYTES", "OTHER"] as BeverageType[]).map((bev) => (
                    <button
                      key={bev}
                      type="button"
                      onClick={() => setBeverageType(bev)}
                      className={`p-2 rounded-xl border text-xs flex items-center gap-1.5 transition-all ${
                        beverageType === bev
                          ? "bg-blue-500/20 border-blue-500 text-blue-300 font-semibold"
                          : "bg-[#161B26] border-[#232936] text-slate-400 hover:text-white"
                      }`}
                    >
                      <span>{beverageTypeIcons[bev]}</span>
                      <span className="text-[11px] truncate">{beverageTypeDisplayNames[bev]}</span>
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 bg-blue-500 hover:bg-blue-400 text-[#0E121A] font-bold text-xs rounded-xl shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50"
              >
                {isLoading ? "Recording..." : `Log +${waterAmount} ml Hydration`}
              </button>
            </form>
          )}

          {/* TAB 3: ACTIVITY */}
          {activeTab === "ACTIVITY" && (
            <form onSubmit={handleActivitySubmit} className="space-y-4">
              {/* Category Picker */}
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 block mb-1.5">
                  Activity Type
                </label>
                <div className="grid grid-cols-5 gap-1.5">
                  {(["RUN", "WALK", "CYCLING", "HIIT", "OTHER"] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setActivityType(type)}
                      className={`py-2 px-1 rounded-xl border text-xs font-semibold transition-all ${
                        activityType === type
                          ? "bg-amber-500/20 border-amber-500 text-amber-300 shadow-sm"
                          : "bg-[#161B26] border-[#232936] text-slate-400 hover:text-white"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Running Type Selector (If RUN) */}
              {activityType === "RUN" && (
                <div className="p-3 bg-[#161B26] border border-[#232936] rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-300">Run Classification *</span>
                    <span className="text-[10px] text-amber-400 font-medium">Target Pace: {livePaceDisplay}</span>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5">
                    {RUN_TYPES.map((rt) => (
                      <div key={rt} className="relative">
                        <button
                          type="button"
                          onClick={() => setRunningType(rt)}
                          className={`w-full py-1.5 px-2 rounded-lg border text-[11px] font-medium transition-all ${
                            runningType === rt
                              ? "bg-amber-500/20 border-amber-500 text-amber-300"
                              : "bg-[#121620] border-[#232936] text-slate-400 hover:text-white"
                          }`}
                        >
                          {runningTypeDisplayNames[rt]}
                        </button>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    {runningTypeDescriptions[runningType]}
                  </p>
                </div>
              )}

              {/* Distance & Duration Inputs */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[10px] text-slate-400 font-medium block mb-1">
                    {activityType === "RUN" || activityType === "WALK" || activityType === "CYCLING" ? "Distance (km) *" : "Distance (km)"}
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={activityDistanceKm}
                    onChange={(e) => setActivityDistanceKm(e.target.value)}
                    className="w-full bg-[#161B26] border border-[#232936] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-medium block mb-1">Duration (minutes) *</label>
                  <input
                    type="number"
                    min="1"
                    value={activityDurationMins}
                    onChange={(e) => setActivityDurationMins(e.target.value)}
                    className="w-full bg-[#161B26] border border-[#232936] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>
              </div>

              {/* Estimated Calories */}
              <div>
                <label className="text-[10px] text-slate-400 font-medium block mb-1">Estimated Calories Burned</label>
                <input
                  type="number"
                  value={activityCalories}
                  onChange={(e) => setActivityCalories(e.target.value)}
                  className="w-full bg-[#161B26] border border-[#232936] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-[#0E121A] font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50"
              >
                {isLoading ? "Saving Activity..." : `Log ${activityType}`}
              </button>
            </form>
          )}

          {/* TAB 4: WORKOUT */}
          {activeTab === "WORKOUT" && (
            <form onSubmit={handleWorkoutSubmit} className="space-y-4">
              {/* Gym vs Home Workout Toggle */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setWorkoutType("GYM_WORKOUT")}
                  className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                    workoutType === "GYM_WORKOUT"
                      ? "bg-purple-500/20 border-purple-500 text-purple-300"
                      : "bg-[#161B26] border-[#232936] text-slate-400 hover:text-white"
                  }`}
                >
                  <Dumbbell className="w-4 h-4" />
                  <span>Gym Workout</span>
                </button>
                <button
                  type="button"
                  onClick={() => setWorkoutType("HOME_WORKOUT")}
                  className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                    workoutType === "HOME_WORKOUT"
                      ? "bg-purple-500/20 border-purple-500 text-purple-300"
                      : "bg-[#161B26] border-[#232936] text-slate-400 hover:text-white"
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Home Workout</span>
                </button>
              </div>

              {/* Workout Name */}
              <div>
                <label className="text-[10px] text-slate-400 font-medium block mb-1">Workout Name *</label>
                <input
                  type="text"
                  value={workoutName}
                  onChange={(e) => setWorkoutName(e.target.value)}
                  className="w-full bg-[#161B26] border border-[#232936] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500"
                  required
                />
              </div>

              {/* Structured Movement & Sets */}
              <div className="p-3.5 bg-[#161B26] border border-[#232936] rounded-xl space-y-3">
                <span className="text-xs font-semibold text-white block">Exercise Details</span>
                <div>
                  <label className="text-[10px] text-slate-400 font-medium block mb-1">Primary Exercise</label>
                  <input
                    type="text"
                    value={exerciseName}
                    onChange={(e) => setExerciseName(e.target.value)}
                    className="w-full bg-[#121620] border border-[#232936] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-400 font-medium block mb-1">Sets</label>
                    <input
                      type="number"
                      min="1"
                      value={exerciseSets}
                      onChange={(e) => setExerciseSets(parseInt(e.target.value, 10) || 1)}
                      className="w-full bg-[#121620] border border-[#232936] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 font-medium block mb-1">Reps/Set</label>
                    <input
                      type="number"
                      min="1"
                      value={exerciseReps}
                      onChange={(e) => setExerciseReps(parseInt(e.target.value, 10) || 1)}
                      className="w-full bg-[#121620] border border-[#232936] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 font-medium block mb-1">Weight (kg)</label>
                    <input
                      type="number"
                      min="0"
                      disabled={workoutType === "HOME_WORKOUT"}
                      value={workoutType === "HOME_WORKOUT" ? 0 : exerciseWeightKg}
                      onChange={(e) => setExerciseWeightKg(parseFloat(e.target.value) || 0)}
                      className="w-full bg-[#121620] border border-[#232936] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500 disabled:opacity-40"
                    />
                  </div>
                </div>
              </div>

              {/* Duration & Calories */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[10px] text-slate-400 font-medium block mb-1">Duration (minutes)</label>
                  <input
                    type="number"
                    min="1"
                    value={workoutDurationMins}
                    onChange={(e) => setWorkoutDurationMins(e.target.value)}
                    className="w-full bg-[#161B26] border border-[#232936] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-medium block mb-1">Calories Burned</label>
                  <input
                    type="number"
                    min="0"
                    value={workoutCalories}
                    onChange={(e) => setWorkoutCalories(e.target.value)}
                    className="w-full bg-[#161B26] border border-[#232936] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-purple-600/20 transition-all disabled:opacity-50"
              >
                {isLoading ? "Saving Session..." : "Log Workout"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
