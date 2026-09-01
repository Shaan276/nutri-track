"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  Loader2,
  AlertCircle,
  Flame,
  Dna,
  Wheat,
  Droplet,
  Sparkles,
  Apple,
} from "lucide-react";
import { FoodCategory, categoryDisplayNames } from "@/lib/validations/food";

export function AddIngredientForm() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: "",
    category: "DAIRY" as FoodCategory,
    brand: "",
    servingSize: "100",
    servingUnit: "g",

    // Macronutrients (per reference serving)
    calories: "",
    protein: "",
    carbohydrates: "",
    fat: "",
    fiber: "",
    sugar: "",

    // Micronutrients
    calcium: "",
    iron: "",
    magnesium: "",
    potassium: "",
    sodium: "",
    zinc: "",
    vitaminA: "",
    vitaminC: "",
    vitaminD: "",
    vitaminB12: "",

    notes: "",
    isFavorite: false,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const categories: FoodCategory[] = [
    "DAIRY",
    "GRAINS_CEREALS",
    "PULSES_LEGUMES",
    "VEGETABLES",
    "FRUITS",
    "NUTS_SEEDS",
    "OILS_FATS",
    "BEVERAGES",
    "SNACKS",
    "SWEETS",
    "SUPPLEMENTS",
    "OTHER",
  ];

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isLoading) return;

    if (!formData.name.trim() || formData.name.trim().length < 2) {
      setError("Please enter an ingredient name with at least 2 characters.");
      return;
    }

    const servingSizeNum = parseFloat(formData.servingSize);
    if (isNaN(servingSizeNum) || servingSizeNum <= 0) {
      setError("Serving size must be greater than 0.");
      return;
    }

    const calNum = parseFloat(formData.calories);
    if (isNaN(calNum) || calNum < 0) {
      setError("Calories must be a valid non-negative number.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Store ingredient flag in metadata
      const ingredientMetadata = {
        isIngredient: true,
        type: "RAW_INGREDIENT",
        userNotes: formData.notes.trim() || undefined,
      };

      const payload = {
        name: formData.name.trim(),
        category: formData.category,
        brand: formData.brand.trim() || null,
        servingSize: servingSizeNum,
        servingUnit: formData.servingUnit.trim() || "g",
        calories: calNum,
        protein: parseFloat(formData.protein) || 0,
        carbohydrates: parseFloat(formData.carbohydrates) || 0,
        fat: parseFloat(formData.fat) || 0,
        fiber: parseFloat(formData.fiber) || 0,
        sugar: parseFloat(formData.sugar) || 0,

        calcium: formData.calcium ? parseFloat(formData.calcium) : null,
        iron: formData.iron ? parseFloat(formData.iron) : null,
        magnesium: formData.magnesium ? parseFloat(formData.magnesium) : null,
        potassium: formData.potassium ? parseFloat(formData.potassium) : null,
        sodium: formData.sodium ? parseFloat(formData.sodium) : null,
        zinc: formData.zinc ? parseFloat(formData.zinc) : null,
        vitaminA: formData.vitaminA ? parseFloat(formData.vitaminA) : null,
        vitaminC: formData.vitaminC ? parseFloat(formData.vitaminC) : null,
        vitaminD: formData.vitaminD ? parseFloat(formData.vitaminD) : null,
        vitaminB12: formData.vitaminB12 ? parseFloat(formData.vitaminB12) : null,

        notes: JSON.stringify(ingredientMetadata),
        isFavorite: formData.isFavorite,
      };

      const res = await fetch("/api/foods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to save ingredient.");
        setIsLoading(false);
        return;
      }

      router.push("/foods");
      router.refresh();
    } catch (err: any) {
      console.error("Save ingredient error:", err);
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

      {/* Basic Ingredient Info Card */}
      <div className="bg-background-surface border border-border-default rounded-3xl p-6 sm:p-7 shadow-sm space-y-6">
        <div className="flex items-center gap-2.5 pb-4 border-b border-border-subtle">
          <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400">
            <Apple className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground-primary tracking-tight">
              Raw Ingredient Details
            </h3>
            <p className="text-xs text-foreground-muted">
              Base raw ingredients used to prepare and calculate recipes
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Ingredient Name */}
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-foreground-secondary">
              Ingredient Name *
            </label>
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. Raw Paneer, Whole Wheat Atta, Rolled Oats, Chicken Breast, Olive Oil"
              className="w-full px-4 py-3 bg-background-elevated border border-border-default focus:border-emerald-500 rounded-2xl text-sm font-medium text-foreground-primary outline-none transition-all"
            />
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-foreground-secondary">
              Category *
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-background-elevated border border-border-default focus:border-emerald-500 rounded-2xl text-sm font-medium text-foreground-primary outline-none transition-all"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {categoryDisplayNames[cat] || cat}
                </option>
              ))}
            </select>
          </div>

          {/* Brand / Source */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-foreground-secondary">
              Brand / Origin (Optional)
            </label>
            <input
              type="text"
              name="brand"
              value={formData.brand}
              onChange={handleChange}
              placeholder="e.g. Amul, Aashirvaad, Raw Farm"
              className="w-full px-4 py-3 bg-background-elevated border border-border-default focus:border-emerald-500 rounded-2xl text-sm font-medium text-foreground-primary outline-none transition-all"
            />
          </div>

          {/* Reference Serving Size */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-foreground-secondary">
              Reference Serving Size *
            </label>
            <input
              type="number"
              step="any"
              min="0.1"
              required
              name="servingSize"
              value={formData.servingSize}
              onChange={handleChange}
              placeholder="100"
              className="w-full px-4 py-3 bg-background-elevated border border-border-default focus:border-emerald-500 rounded-2xl text-sm font-medium text-foreground-primary outline-none transition-all font-mono"
            />
          </div>

          {/* Reference Serving Unit */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-foreground-secondary">
              Serving Unit *
            </label>
            <input
              type="text"
              required
              name="servingUnit"
              value={formData.servingUnit}
              onChange={handleChange}
              placeholder="g, ml, piece, tbsp"
              className="w-full px-4 py-3 bg-background-elevated border border-border-default focus:border-emerald-500 rounded-2xl text-sm font-medium text-foreground-primary outline-none transition-all"
            />
          </div>
        </div>
      </div>

      {/* Macronutrients Card */}
      <div className="bg-background-surface border border-border-default rounded-3xl p-6 sm:p-7 shadow-sm space-y-6">
        <div className="flex items-center gap-2.5 pb-4 border-b border-border-subtle">
          <div className="p-2 rounded-xl bg-orange-500/15 text-orange-400">
            <Flame className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground-primary tracking-tight">
              Macronutrients (Per Reference Serving)
            </h3>
            <p className="text-xs text-foreground-muted">
              Energy and macronutrient breakdown for {formData.servingSize || "100"}{" "}
              {formData.servingUnit || "g"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {/* Calories */}
          <div className="p-4 rounded-2xl bg-background-elevated border border-orange-500/20 space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-orange-400 uppercase">
              <Flame className="h-3.5 w-3.5" />
              Calories (kcal) *
            </div>
            <input
              type="number"
              step="any"
              min="0"
              required
              name="calories"
              value={formData.calories}
              onChange={handleChange}
              placeholder="e.g. 265"
              className="w-full bg-transparent border-b border-border-default focus:border-orange-500 text-lg font-black text-foreground-primary outline-none font-mono py-1"
            />
          </div>

          {/* Protein */}
          <div className="p-4 rounded-2xl bg-background-elevated border border-blue-500/20 space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-blue-400 uppercase">
              <Dna className="h-3.5 w-3.5" />
              Protein (g) *
            </div>
            <input
              type="number"
              step="any"
              min="0"
              name="protein"
              value={formData.protein}
              onChange={handleChange}
              placeholder="e.g. 18.3"
              className="w-full bg-transparent border-b border-border-default focus:border-blue-500 text-lg font-black text-foreground-primary outline-none font-mono py-1"
            />
          </div>

          {/* Carbohydrates */}
          <div className="p-4 rounded-2xl bg-background-elevated border border-amber-500/20 space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 uppercase">
              <Wheat className="h-3.5 w-3.5" />
              Carbs (g) *
            </div>
            <input
              type="number"
              step="any"
              min="0"
              name="carbohydrates"
              value={formData.carbohydrates}
              onChange={handleChange}
              placeholder="e.g. 3.4"
              className="w-full bg-transparent border-b border-border-default focus:border-amber-500 text-lg font-black text-foreground-primary outline-none font-mono py-1"
            />
          </div>

          {/* Fat */}
          <div className="p-4 rounded-2xl bg-background-elevated border border-rose-500/20 space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-rose-400 uppercase">
              <Droplet className="h-3.5 w-3.5" />
              Fat (g) *
            </div>
            <input
              type="number"
              step="any"
              min="0"
              name="fat"
              value={formData.fat}
              onChange={handleChange}
              placeholder="e.g. 20.8"
              className="w-full bg-transparent border-b border-border-default focus:border-rose-500 text-lg font-black text-foreground-primary outline-none font-mono py-1"
            />
          </div>

          {/* Fiber */}
          <div className="p-4 rounded-2xl bg-background-elevated border border-emerald-500/20 space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 uppercase">
              <Sparkles className="h-3.5 w-3.5" />
              Fiber (g)
            </div>
            <input
              type="number"
              step="any"
              min="0"
              name="fiber"
              value={formData.fiber}
              onChange={handleChange}
              placeholder="e.g. 0"
              className="w-full bg-transparent border-b border-border-default focus:border-emerald-500 text-lg font-black text-foreground-primary outline-none font-mono py-1"
            />
          </div>

          {/* Sugar */}
          <div className="p-4 rounded-2xl bg-background-elevated border border-purple-500/20 space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-purple-400 uppercase">
              <Sparkles className="h-3.5 w-3.5" />
              Sugar (g)
            </div>
            <input
              type="number"
              step="any"
              min="0"
              name="sugar"
              value={formData.sugar}
              onChange={handleChange}
              placeholder="e.g. 2.5"
              className="w-full bg-transparent border-b border-border-default focus:border-purple-500 text-lg font-black text-foreground-primary outline-none font-mono py-1"
            />
          </div>
        </div>
      </div>

      {/* Micronutrients Card (Vitamins & Minerals) */}
      <div className="bg-background-surface border border-border-default rounded-3xl p-6 sm:p-7 shadow-sm space-y-6">
        <div className="flex items-center gap-2.5 pb-4 border-b border-border-subtle">
          <div className="p-2 rounded-xl bg-purple-500/15 text-purple-400">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground-primary tracking-tight">
              Micronutrients &amp; Minerals (Optional)
            </h3>
            <p className="text-xs text-foreground-muted">
              Vitamins, calcium, iron, and electrolyte data
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-foreground-secondary uppercase">Calcium (mg)</label>
            <input
              type="number"
              step="any"
              name="calcium"
              value={formData.calcium}
              onChange={handleChange}
              placeholder="e.g. 480"
              className="w-full px-3 py-2 bg-background-elevated border border-border-default rounded-xl text-xs font-mono text-foreground-primary"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-foreground-secondary uppercase">Iron (mg)</label>
            <input
              type="number"
              step="any"
              name="iron"
              value={formData.iron}
              onChange={handleChange}
              placeholder="e.g. 1.2"
              className="w-full px-3 py-2 bg-background-elevated border border-border-default rounded-xl text-xs font-mono text-foreground-primary"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-foreground-secondary uppercase">Potassium (mg)</label>
            <input
              type="number"
              step="any"
              name="potassium"
              value={formData.potassium}
              onChange={handleChange}
              placeholder="e.g. 150"
              className="w-full px-3 py-2 bg-background-elevated border border-border-default rounded-xl text-xs font-mono text-foreground-primary"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-foreground-secondary uppercase">Sodium (mg)</label>
            <input
              type="number"
              step="any"
              name="sodium"
              value={formData.sodium}
              onChange={handleChange}
              placeholder="e.g. 35"
              className="w-full px-3 py-2 bg-background-elevated border border-border-default rounded-xl text-xs font-mono text-foreground-primary"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-foreground-secondary uppercase">Magnesium (mg)</label>
            <input
              type="number"
              step="any"
              name="magnesium"
              value={formData.magnesium}
              onChange={handleChange}
              placeholder="e.g. 25"
              className="w-full px-3 py-2 bg-background-elevated border border-border-default rounded-xl text-xs font-mono text-foreground-primary"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-foreground-secondary uppercase">Zinc (mg)</label>
            <input
              type="number"
              step="any"
              name="zinc"
              value={formData.zinc}
              onChange={handleChange}
              placeholder="e.g. 2.0"
              className="w-full px-3 py-2 bg-background-elevated border border-border-default rounded-xl text-xs font-mono text-foreground-primary"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-foreground-secondary uppercase">Vitamin C (mg)</label>
            <input
              type="number"
              step="any"
              name="vitaminC"
              value={formData.vitaminC}
              onChange={handleChange}
              placeholder="e.g. 0"
              className="w-full px-3 py-2 bg-background-elevated border border-border-default rounded-xl text-xs font-mono text-foreground-primary"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-foreground-secondary uppercase">Vitamin B12 (mcg)</label>
            <input
              type="number"
              step="any"
              name="vitaminB12"
              value={formData.vitaminB12}
              onChange={handleChange}
              placeholder="e.g. 0.8"
              className="w-full px-3 py-2 bg-background-elevated border border-border-default rounded-xl text-xs font-mono text-foreground-primary"
            />
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
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-8 py-3 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-black font-extrabold text-xs rounded-2xl shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50 cursor-pointer"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Saving Ingredient...</span>
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              <span>Save Ingredient to Library</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
