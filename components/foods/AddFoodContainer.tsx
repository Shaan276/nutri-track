"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Apple, ChefHat, Sparkles } from "lucide-react";
import { AddIngredientForm } from "./AddIngredientForm";
import { AddRecipeFoodForm } from "./AddRecipeFoodForm";

export type AddFoodMode = "INGREDIENT" | "RECIPE";

export function AddFoodContainer() {
  const [activeMode, setActiveMode] = useState<AddFoodMode>("INGREDIENT");

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6 text-left animate-fade-in">
      {/* Top Navigation & Title */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/foods"
            className="p-2.5 rounded-2xl bg-background-surface hover:bg-background-elevated border border-border-default text-foreground-muted hover:text-foreground-primary transition-all cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-foreground-primary tracking-tight">
              Add to Food Database
            </h1>
            <p className="text-xs text-foreground-muted">
              Choose whether to register a base ingredient or compose a prepared dish
            </p>
          </div>
        </div>
      </div>

      {/* Two-Option Mode Switcher */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Option 1: Add Ingredient Card */}
        <button
          type="button"
          onClick={() => setActiveMode("INGREDIENT")}
          className={`p-5 rounded-3xl border text-left transition-all cursor-pointer relative overflow-hidden ${
            activeMode === "INGREDIENT"
              ? "bg-emerald-500/10 border-emerald-500/40 shadow-lg shadow-emerald-500/10 ring-2 ring-emerald-500/20"
              : "bg-background-surface border-border-default hover:border-border-hover hover:bg-background-elevated"
          }`}
        >
          <div className="flex items-start justify-between">
            <div
              className={`p-3 rounded-2xl ${
                activeMode === "INGREDIENT"
                  ? "bg-emerald-500 text-black font-extrabold"
                  : "bg-emerald-500/15 text-emerald-400"
              }`}
            >
              <Apple className="h-6 w-6" />
            </div>
            {activeMode === "INGREDIENT" && (
              <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                ACTIVE
              </span>
            )}
          </div>

          <div className="mt-4 space-y-1">
            <h3 className="text-base font-extrabold text-foreground-primary">
              1. Add Raw Ingredient
            </h3>
            <p className="text-xs text-foreground-muted leading-relaxed">
              Base raw ingredients with standard 100g macros (e.g. Raw Paneer, Whole Wheat Flour, Rolled Oats, Chicken, Olive Oil).
            </p>
          </div>
        </button>

        {/* Option 2: Add Food / Recipe Card */}
        <button
          type="button"
          onClick={() => setActiveMode("RECIPE")}
          className={`p-5 rounded-3xl border text-left transition-all cursor-pointer relative overflow-hidden ${
            activeMode === "RECIPE"
              ? "bg-amber-500/10 border-amber-500/40 shadow-lg shadow-amber-500/10 ring-2 ring-amber-500/20"
              : "bg-background-surface border-border-default hover:border-border-hover hover:bg-background-elevated"
          }`}
        >
          <div className="flex items-start justify-between">
            <div
              className={`p-3 rounded-2xl ${
                activeMode === "RECIPE"
                  ? "bg-amber-500 text-black font-extrabold"
                  : "bg-amber-500/15 text-amber-400"
              }`}
            >
              <ChefHat className="h-6 w-6" />
            </div>
            {activeMode === "RECIPE" && (
              <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                ACTIVE
              </span>
            )}
          </div>

          <div className="mt-4 space-y-1">
            <h3 className="text-base font-extrabold text-foreground-primary">
              2. Add Food / Recipe
            </h3>
            <p className="text-xs text-foreground-muted leading-relaxed">
              Prepared foods &amp; dishes cooked from ingredients. Macro totals are computed automatically from selections.
            </p>
          </div>
        </button>
      </div>

      {/* Render Selected Form */}
      {activeMode === "INGREDIENT" ? <AddIngredientForm /> : <AddRecipeFoodForm />}
    </div>
  );
}
