"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  Loader2,
  AlertCircle,
  Info,
  Flame,
  Dna,
  Wheat,
  Droplet,
  Sparkles,
} from "lucide-react";
import { FoodCategory, categoryDisplayNames } from "@/lib/validations/food";
import { FoodItem } from "./FoodCard";

interface FoodFormProps {
  initialData?: FoodItem | null;
  mode: "create" | "edit";
}

export function FoodForm({ initialData, mode }: FoodFormProps) {
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    category: (initialData?.category || "OTHER") as FoodCategory,
    brand: initialData?.brand || "",
    barcode: initialData?.barcode || "",
    servingSize: initialData?.servingSize ? String(initialData.servingSize) : "100",
    servingUnit: initialData?.servingUnit || "g",

    // Macronutrients
    calories: initialData?.calories !== undefined ? String(initialData.calories) : "",
    protein: initialData?.protein !== undefined ? String(initialData.protein) : "",
    carbohydrates: initialData?.carbohydrates !== undefined ? String(initialData.carbohydrates) : "",
    fat: initialData?.fat !== undefined ? String(initialData.fat) : "",
    fiber: initialData?.fiber !== undefined ? String(initialData.fiber) : "",
    sugar: initialData?.sugar !== undefined ? String(initialData.sugar) : "",

    // Micronutrients
    sodium: initialData?.sodium !== undefined ? String(initialData.sodium) : "",
    calcium: initialData?.calcium !== undefined ? String(initialData.calcium) : "",
    iron: initialData?.iron !== undefined ? String(initialData.iron) : "",
    potassium: initialData?.potassium !== undefined ? String(initialData.potassium) : "",
    magnesium: initialData?.magnesium !== undefined ? String(initialData.magnesium) : "",
    zinc: initialData?.zinc !== undefined ? String(initialData.zinc) : "",
    vitaminA: initialData?.vitaminA !== undefined ? String(initialData.vitaminA) : "",
    vitaminC: initialData?.vitaminC !== undefined ? String(initialData.vitaminC) : "",
    vitaminD: initialData?.vitaminD !== undefined ? String(initialData.vitaminD) : "",
    vitaminB12: initialData?.vitaminB12 !== undefined ? String(initialData.vitaminB12) : "",

    // Additional
    water: initialData?.water !== undefined ? String(initialData.water) : "",
    notes: initialData?.notes || "",
    isFavorite: initialData?.isFavorite || false,
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
    "FRUITS",
    "VEGETABLES",
    "GRAINS_CEREALS",
    "PULSES_LEGUMES",
    "DAIRY",
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
      setError("Please enter a food name with at least 2 characters.");
      return;
    }

    const servingSizeNum = parseFloat(formData.servingSize);
    if (isNaN(servingSizeNum) || servingSizeNum <= 0) {
      setError("Serving size must be greater than 0.");
      return;
    }

    if (!formData.servingUnit.trim()) {
      setError("Serving unit is required (e.g. g, ml, serving).");
      return;
    }

    setIsLoading(true);
    setError(null);

    const payload = {
      name: formData.name.trim(),
      category: formData.category,
      brand: formData.brand.trim() || null,
      barcode: formData.barcode.trim() || null,
      servingSize: servingSizeNum,
      servingUnit: formData.servingUnit.trim(),
      calories: parseFloat(formData.calories) || 0,
      protein: parseFloat(formData.protein) || 0,
      carbohydrates: parseFloat(formData.carbohydrates) || 0,
      fat: parseFloat(formData.fat) || 0,
      fiber: parseFloat(formData.fiber) || 0,
      sugar: parseFloat(formData.sugar) || 0,
      sodium: parseFloat(formData.sodium) || 0,
      calcium: parseFloat(formData.calcium) || 0,
      iron: parseFloat(formData.iron) || 0,
      potassium: parseFloat(formData.potassium) || 0,
      magnesium: parseFloat(formData.magnesium) || 0,
      zinc: parseFloat(formData.zinc) || 0,
      vitaminA: parseFloat(formData.vitaminA) || 0,
      vitaminC: parseFloat(formData.vitaminC) || 0,
      vitaminD: parseFloat(formData.vitaminD) || 0,
      vitaminB12: parseFloat(formData.vitaminB12) || 0,
      water: parseFloat(formData.water) || 0,
      notes: formData.notes.trim() || null,
      isFavorite: formData.isFavorite,
    };

    try {
      const url = mode === "create" ? "/api/foods" : `/api/foods/${initialData?.id}`;
      const method = mode === "create" ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to save food item.");
        setIsLoading(false);
        return;
      }

      router.push("/foods");
      router.refresh();
    } catch (err: any) {
      console.error("Save food error:", err);
      setError("An unexpected network error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      {/* Back Link */}
      <div className="flex items-center justify-between">
        <Link
          href="/foods"
          className="inline-flex items-center gap-2 text-sm font-semibold text-brand-400 hover:text-brand-300 transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Food Database</span>
        </Link>
      </div>

      <div className="bg-background-surface border border-border-default rounded-3xl p-6 sm:p-8 shadow-surface-card text-left space-y-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-brand-500/15 border border-brand-500/30 text-brand-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <Sparkles className="h-3.5 w-3.5" />
            {mode === "create" ? "New Entry" : "Edit Entry"}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground-primary tracking-tight">
            {mode === "create" ? "Add Food to Database" : `Edit ${initialData?.name}`}
          </h1>
          <p className="text-sm text-foreground-secondary mt-1 font-medium">
            Define nutritional values normalized per reference serving size.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-system-error/10 border border-system-error/30 flex items-start gap-3 text-left">
            <AlertCircle className="h-5 w-5 text-system-error shrink-0 mt-0.5" />
            <p className="text-sm font-medium text-red-200">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Basic Information */}
          <div className="space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-widest text-foreground-muted border-b border-border-subtle pb-2">
              1. Basic Food Information
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Name */}
              <div className="space-y-1.5 sm:col-span-2">
                <label
                  htmlFor="name"
                  className="block text-xs font-semibold uppercase tracking-wider text-foreground-secondary"
                >
                  Food Name *
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  placeholder="e.g. Banana, Brown Rice, Grilled Chicken"
                  value={formData.name}
                  onChange={handleChange}
                  disabled={isLoading}
                  className="w-full px-4 py-2.5 bg-background-elevated/70 border border-border-subtle rounded-xl text-foreground-primary placeholder:text-foreground-muted/60 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors disabled:opacity-50"
                />
              </div>

              {/* Category */}
              <div className="space-y-1.5">
                <label
                  htmlFor="category"
                  className="block text-xs font-semibold uppercase tracking-wider text-foreground-secondary"
                >
                  Category *
                </label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  disabled={isLoading}
                  className="w-full px-4 py-2.5 bg-background-elevated/70 border border-border-subtle rounded-xl text-foreground-primary text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat} className="bg-background-surface text-foreground-primary">
                      {categoryDisplayNames[cat]}
                    </option>
                  ))}
                </select>
              </div>

              {/* Brand */}
              <div className="space-y-1.5">
                <label
                  htmlFor="brand"
                  className="block text-xs font-semibold uppercase tracking-wider text-foreground-secondary"
                >
                  Brand (Optional)
                </label>
                <input
                  id="brand"
                  name="brand"
                  type="text"
                  placeholder="e.g. Amul, Quaker, Organic Valley"
                  value={formData.brand}
                  onChange={handleChange}
                  disabled={isLoading}
                  className="w-full px-4 py-2.5 bg-background-elevated/70 border border-border-subtle rounded-xl text-foreground-primary placeholder:text-foreground-muted/60 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors disabled:opacity-50"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Reference Serving */}
          <div className="space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-widest text-foreground-muted border-b border-border-subtle pb-2">
              2. Reference Serving Size
            </h2>

            {/* Visual Normalization Banner */}
            <div className="p-3 rounded-xl bg-brand-500/10 border border-brand-500/30 flex items-start gap-2.5 text-xs text-brand-300 font-medium">
              <Info className="h-4 w-4 shrink-0 text-brand-400 mt-0.5" />
              <span>
                <strong>Data Normalization Rule:</strong> All macronutrient and micronutrient values below represent
                the exact amount contained in this reference serving (e.g. 100g or 100ml).
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Serving Size */}
              <div className="space-y-1.5">
                <label
                  htmlFor="servingSize"
                  className="block text-xs font-semibold uppercase tracking-wider text-foreground-secondary"
                >
                  Serving Size Number *
                </label>
                <input
                  id="servingSize"
                  name="servingSize"
                  type="number"
                  step="0.1"
                  required
                  placeholder="100"
                  value={formData.servingSize}
                  onChange={handleChange}
                  disabled={isLoading}
                  className="w-full px-4 py-2.5 bg-background-elevated/70 border border-border-subtle rounded-xl text-foreground-primary placeholder:text-foreground-muted/60 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors disabled:opacity-50"
                />
              </div>

              {/* Serving Unit */}
              <div className="space-y-1.5">
                <label
                  htmlFor="servingUnit"
                  className="block text-xs font-semibold uppercase tracking-wider text-foreground-secondary"
                >
                  Serving Unit *
                </label>
                <input
                  id="servingUnit"
                  name="servingUnit"
                  type="text"
                  required
                  placeholder="e.g. g, ml, serving, piece"
                  value={formData.servingUnit}
                  onChange={handleChange}
                  disabled={isLoading}
                  className="w-full px-4 py-2.5 bg-background-elevated/70 border border-border-subtle rounded-xl text-foreground-primary placeholder:text-foreground-muted/60 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors disabled:opacity-50"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Macronutrients */}
          <div className="space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-widest text-foreground-muted border-b border-border-subtle pb-2">
              3. Macronutrients (Per Reference Serving)
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {/* Calories */}
              <div className="space-y-1.5">
                <label
                  htmlFor="calories"
                  className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-brand-400"
                >
                  <Flame className="h-3.5 w-3.5" />
                  <span>Calories (kcal)</span>
                </label>
                <input
                  id="calories"
                  name="calories"
                  type="number"
                  step="0.1"
                  placeholder="0"
                  value={formData.calories}
                  onChange={handleChange}
                  disabled={isLoading}
                  className="w-full px-3.5 py-2 bg-background-elevated/70 border border-border-subtle rounded-xl text-foreground-primary text-sm focus:outline-none focus:border-brand-500 transition-colors"
                />
              </div>

              {/* Protein */}
              <div className="space-y-1.5">
                <label
                  htmlFor="protein"
                  className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-blue-400"
                >
                  <Dna className="h-3.5 w-3.5" />
                  <span>Protein (g)</span>
                </label>
                <input
                  id="protein"
                  name="protein"
                  type="number"
                  step="0.1"
                  placeholder="0"
                  value={formData.protein}
                  onChange={handleChange}
                  disabled={isLoading}
                  className="w-full px-3.5 py-2 bg-background-elevated/70 border border-border-subtle rounded-xl text-foreground-primary text-sm focus:outline-none focus:border-brand-500 transition-colors"
                />
              </div>

              {/* Carbohydrates */}
              <div className="space-y-1.5">
                <label
                  htmlFor="carbohydrates"
                  className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-amber-400"
                >
                  <Wheat className="h-3.5 w-3.5" />
                  <span>Carbs (g)</span>
                </label>
                <input
                  id="carbohydrates"
                  name="carbohydrates"
                  type="number"
                  step="0.1"
                  placeholder="0"
                  value={formData.carbohydrates}
                  onChange={handleChange}
                  disabled={isLoading}
                  className="w-full px-3.5 py-2 bg-background-elevated/70 border border-border-subtle rounded-xl text-foreground-primary text-sm focus:outline-none focus:border-brand-500 transition-colors"
                />
              </div>

              {/* Fat */}
              <div className="space-y-1.5">
                <label
                  htmlFor="fat"
                  className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-rose-400"
                >
                  <Droplet className="h-3.5 w-3.5" />
                  <span>Fat (g)</span>
                </label>
                <input
                  id="fat"
                  name="fat"
                  type="number"
                  step="0.1"
                  placeholder="0"
                  value={formData.fat}
                  onChange={handleChange}
                  disabled={isLoading}
                  className="w-full px-3.5 py-2 bg-background-elevated/70 border border-border-subtle rounded-xl text-foreground-primary text-sm focus:outline-none focus:border-brand-500 transition-colors"
                />
              </div>

              {/* Fiber */}
              <div className="space-y-1.5">
                <label
                  htmlFor="fiber"
                  className="block text-xs font-semibold uppercase tracking-wider text-foreground-secondary"
                >
                  Fiber (g)
                </label>
                <input
                  id="fiber"
                  name="fiber"
                  type="number"
                  step="0.1"
                  placeholder="0"
                  value={formData.fiber}
                  onChange={handleChange}
                  disabled={isLoading}
                  className="w-full px-3.5 py-2 bg-background-elevated/70 border border-border-subtle rounded-xl text-foreground-primary text-sm focus:outline-none focus:border-brand-500 transition-colors"
                />
              </div>

              {/* Sugar */}
              <div className="space-y-1.5">
                <label
                  htmlFor="sugar"
                  className="block text-xs font-semibold uppercase tracking-wider text-foreground-secondary"
                >
                  Sugar (g)
                </label>
                <input
                  id="sugar"
                  name="sugar"
                  type="number"
                  step="0.1"
                  placeholder="0"
                  value={formData.sugar}
                  onChange={handleChange}
                  disabled={isLoading}
                  className="w-full px-3.5 py-2 bg-background-elevated/70 border border-border-subtle rounded-xl text-foreground-primary text-sm focus:outline-none focus:border-brand-500 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Micronutrients */}
          <div className="space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-widest text-foreground-muted border-b border-border-subtle pb-2">
              4. Key Micronutrients (Optional)
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label htmlFor="sodium" className="block text-[11px] font-semibold text-foreground-muted uppercase">
                  Sodium (mg)
                </label>
                <input
                  id="sodium"
                  name="sodium"
                  type="number"
                  step="0.1"
                  placeholder="0"
                  value={formData.sodium}
                  onChange={handleChange}
                  className="w-full px-3 py-1.5 mt-1 bg-background-elevated/70 border border-border-subtle rounded-lg text-sm text-foreground-primary"
                />
              </div>

              <div>
                <label htmlFor="calcium" className="block text-[11px] font-semibold text-foreground-muted uppercase">
                  Calcium (mg)
                </label>
                <input
                  id="calcium"
                  name="calcium"
                  type="number"
                  step="0.1"
                  placeholder="0"
                  value={formData.calcium}
                  onChange={handleChange}
                  className="w-full px-3 py-1.5 mt-1 bg-background-elevated/70 border border-border-subtle rounded-lg text-sm text-foreground-primary"
                />
              </div>

              <div>
                <label htmlFor="iron" className="block text-[11px] font-semibold text-foreground-muted uppercase">
                  Iron (mg)
                </label>
                <input
                  id="iron"
                  name="iron"
                  type="number"
                  step="0.1"
                  placeholder="0"
                  value={formData.iron}
                  onChange={handleChange}
                  className="w-full px-3 py-1.5 mt-1 bg-background-elevated/70 border border-border-subtle rounded-lg text-sm text-foreground-primary"
                />
              </div>

              <div>
                <label htmlFor="potassium" className="block text-[11px] font-semibold text-foreground-muted uppercase">
                  Potassium (mg)
                </label>
                <input
                  id="potassium"
                  name="potassium"
                  type="number"
                  step="0.1"
                  placeholder="0"
                  value={formData.potassium}
                  onChange={handleChange}
                  className="w-full px-3 py-1.5 mt-1 bg-background-elevated/70 border border-border-subtle rounded-lg text-sm text-foreground-primary"
                />
              </div>

              <div>
                <label htmlFor="vitaminC" className="block text-[11px] font-semibold text-foreground-muted uppercase">
                  Vitamin C (mg)
                </label>
                <input
                  id="vitaminC"
                  name="vitaminC"
                  type="number"
                  step="0.1"
                  placeholder="0"
                  value={formData.vitaminC}
                  onChange={handleChange}
                  className="w-full px-3 py-1.5 mt-1 bg-background-elevated/70 border border-border-subtle rounded-lg text-sm text-foreground-primary"
                />
              </div>

              <div>
                <label htmlFor="vitaminD" className="block text-[11px] font-semibold text-foreground-muted uppercase">
                  Vitamin D (mcg)
                </label>
                <input
                  id="vitaminD"
                  name="vitaminD"
                  type="number"
                  step="0.1"
                  placeholder="0"
                  value={formData.vitaminD}
                  onChange={handleChange}
                  className="w-full px-3 py-1.5 mt-1 bg-background-elevated/70 border border-border-subtle rounded-lg text-sm text-foreground-primary"
                />
              </div>

              <div>
                <label htmlFor="zinc" className="block text-[11px] font-semibold text-foreground-muted uppercase">
                  Zinc (mg)
                </label>
                <input
                  id="zinc"
                  name="zinc"
                  type="number"
                  step="0.1"
                  placeholder="0"
                  value={formData.zinc}
                  onChange={handleChange}
                  className="w-full px-3 py-1.5 mt-1 bg-background-elevated/70 border border-border-subtle rounded-lg text-sm text-foreground-primary"
                />
              </div>

              <div>
                <label htmlFor="magnesium" className="block text-[11px] font-semibold text-foreground-muted uppercase">
                  Magnesium (mg)
                </label>
                <input
                  id="magnesium"
                  name="magnesium"
                  type="number"
                  step="0.1"
                  placeholder="0"
                  value={formData.magnesium}
                  onChange={handleChange}
                  className="w-full px-3 py-1.5 mt-1 bg-background-elevated/70 border border-border-subtle rounded-lg text-sm text-foreground-primary"
                />
              </div>
            </div>
          </div>

          {/* Section 5: Additional Info & Options */}
          <div className="space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-widest text-foreground-muted border-b border-border-subtle pb-2">
              5. Notes &amp; Favorite Setting
            </h2>

            <div className="space-y-3">
              <div>
                <label
                  htmlFor="notes"
                  className="block text-xs font-semibold uppercase tracking-wider text-foreground-secondary mb-1"
                >
                  Notes / Preparation Tips
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  rows={2}
                  placeholder="e.g. Boiled with salt, skin removed, brand specific flavor..."
                  value={formData.notes}
                  onChange={handleChange}
                  disabled={isLoading}
                  className="w-full px-4 py-2.5 bg-background-elevated/70 border border-border-subtle rounded-xl text-foreground-primary placeholder:text-foreground-muted/60 text-sm focus:outline-none focus:border-brand-500 transition-colors disabled:opacity-50"
                />
              </div>

              <div className="flex items-center gap-2.5 pt-1">
                <input
                  id="isFavorite"
                  name="isFavorite"
                  type="checkbox"
                  checked={formData.isFavorite}
                  onChange={handleChange}
                  disabled={isLoading}
                  className="w-4 h-4 rounded bg-background-elevated border-border-subtle text-brand-500 focus:ring-brand-500 focus:ring-offset-0 cursor-pointer"
                />
                <label
                  htmlFor="isFavorite"
                  className="text-xs font-semibold text-foreground-secondary cursor-pointer select-none"
                >
                  Mark as Favorite for quick access
                </label>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-black font-bold text-sm rounded-xl transition-all duration-200 shadow-brand-glow hover:shadow-brand-glow-lg flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Saving Food Item...</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>{mode === "create" ? "Save Food Item" : "Update Food Item"}</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default FoodForm;
