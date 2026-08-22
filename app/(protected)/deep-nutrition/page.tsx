"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Calendar,
  RefreshCw,
  Zap,
  Layers,
  Activity,
  Award,
} from "lucide-react";
import { DeepNutritionResponse } from "@/lib/services/deep-nutrition.service";
import { NutrientCoverageScore } from "@/components/deep-nutrition/NutrientCoverageScore";
import { MacroDonutChart } from "@/components/deep-nutrition/MacroDonutChart";
import { NutrientBarChart } from "@/components/deep-nutrition/NutrientBarChart";
import { NutrientCard } from "@/components/deep-nutrition/NutrientCard";
import { GoogleSheetsSection } from "@/components/profile/GoogleSheetsSection";

export default function DeepNutritionPage() {
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [analysis, setAnalysis] = useState<DeepNutritionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"ALL" | "MACROS" | "VITAMINS" | "MINERALS">("ALL");

  const fetchDeepNutrition = useCallback(async (date: string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/deep-nutrition?date=${date}`);
      const data = await res.json();
      if (data.success && data.data) {
        setAnalysis(data.data);
      }
    } catch (err) {
      console.error("Failed to load deep nutrition analysis:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDeepNutrition(selectedDate);
  }, [selectedDate, fetchDeepNutrition]);

  // Date Navigation Handlers
  const handlePrevDay = () => {
    const d = new Date(selectedDate + "T00:00:00");
    d.setDate(d.getDate() - 1);
    setSelectedDate(d.toISOString().split("T")[0]);
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate + "T00:00:00");
    d.setDate(d.getDate() + 1);
    setSelectedDate(d.toISOString().split("T")[0]);
  };

  const handleToday = () => {
    setSelectedDate(new Date().toISOString().split("T")[0]);
  };

  const isToday = selectedDate === new Date().toISOString().split("T")[0];

  const formattedDateString = new Date(selectedDate + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="w-full space-y-8 animate-fade-in text-left pb-16">
      {/* Top Header & Date Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Deep Nutrition</h1>
          </div>
          <p className="text-xs text-slate-400">
            Comprehensive macro and micronutrient analysis, RDA targets, and biological coverage.
          </p>
        </div>

        {/* Date Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handlePrevDay}
            className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-xl transition-colors"
            title="Previous Day"
            aria-label="Previous Day"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {!isToday && (
            <button
              onClick={handleToday}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold rounded-xl transition-colors"
            >
              Today
            </button>
          )}

          <div className="relative flex items-center">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3.5 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs font-semibold text-white focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          <button
            onClick={handleNextDay}
            className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-xl transition-colors"
            title="Next Day"
            aria-label="Next Day"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => fetchDeepNutrition(selectedDate)}
            disabled={loading}
            className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-xl transition-colors"
            title="Refresh Data"
            aria-label="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-emerald-400" : ""}`} />
          </button>
        </div>
      </div>

      {/* Date Banner */}
      <div className="flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-1.5 font-medium text-slate-300">
          <Calendar className="w-3.5 h-3.5 text-emerald-400" />
          <span>{formattedDateString}</span>
        </div>
        {analysis && (
          <span className="text-slate-500">
            {analysis.loggedMealsCount} meal{analysis.loggedMealsCount === 1 ? "" : "s"} logged ({analysis.loggedFoodsCount} food items)
          </span>
        )}
      </div>

      {/* Loading Skeleton or Main Content */}
      {loading && !analysis ? (
        <div className="space-y-6 animate-pulse">
          <div className="h-36 bg-slate-900/60 rounded-2xl border border-slate-800" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-64 bg-slate-900/60 rounded-2xl border border-slate-800" />
            <div className="h-64 bg-slate-900/60 rounded-2xl border border-slate-800" />
          </div>
        </div>
      ) : analysis ? (
        <div className="space-y-8">
          {/* Section 1: Overview Score */}
          <NutrientCoverageScore overview={analysis.overview} />

          {/* Tab Filter Pills */}
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            {[
              { key: "ALL", label: "All Nutrients", count: analysis.overview.totalNutrientsTracked },
              { key: "MACROS", label: "Macronutrients", count: analysis.macros.length },
              { key: "VITAMINS", label: "Vitamins", count: analysis.vitamins.length },
              { key: "MINERALS", label: "Minerals", count: analysis.minerals.length },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl border transition-colors ${
                  activeTab === tab.key
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                    : "bg-slate-900/60 text-slate-400 border-slate-800 hover:text-slate-200 hover:bg-slate-800"
                }`}
              >
                {tab.label} <span className="opacity-60 ml-1">({tab.count})</span>
              </button>
            ))}
          </div>

          {/* Section 2: Macronutrients */}
          {(activeTab === "ALL" || activeTab === "MACROS") && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  <h2 className="text-lg font-bold text-white tracking-tight">Macronutrients</h2>
                </div>
                <span className="text-xs text-slate-400">Energy & Structural Substrates</span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Donut Chart */}
                <div className="lg:col-span-1">
                  <MacroDonutChart
                    distribution={analysis.macroDistribution}
                    totalCalories={
                      analysis.macroDistribution.reduce((acc, m) => acc + m.calories, 0) ||
                      analysis.macros.find((m) => m.key === "calories")?.consumedAmount ||
                      0
                    }
                  />
                </div>

                {/* Macro Cards Grid */}
                <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                  {analysis.macros.map((m) => (
                    <NutrientCard key={m.key} nutrient={m} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Section 3: Vitamins */}
          {(activeTab === "ALL" || activeTab === "VITAMINS") && (
            <div className="space-y-4 pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <h2 className="text-lg font-bold text-white tracking-tight">Vitamins</h2>
                </div>
                <span className="text-xs text-slate-400">Essential Micronutrient Coenzymes</span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Vitamin Coverage Chart */}
                <div className="lg:col-span-1">
                  <NutrientBarChart title="Vitamin Coverage (% Target)" nutrients={analysis.vitamins} />
                </div>

                {/* Vitamin Cards Grid */}
                <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                  {analysis.vitamins.map((v) => (
                    <NutrientCard key={v.key} nutrient={v} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Section 4: Minerals */}
          {(activeTab === "ALL" || activeTab === "MINERALS") && (
            <div className="space-y-4 pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-cyan-400" />
                  <h2 className="text-lg font-bold text-white tracking-tight">Minerals & Electrolytes</h2>
                </div>
                <span className="text-xs text-slate-400">Inorganic Catalysts & Electrolytes</span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Mineral Coverage Chart */}
                <div className="lg:col-span-1">
                  <NutrientBarChart title="Mineral Coverage (% Target)" nutrients={analysis.minerals} />
                </div>

                {/* Mineral Cards Grid */}
                <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                  {analysis.minerals.map((m) => (
                    <NutrientCard key={m.key} nutrient={m} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Section 5: Google Sheets Nutrition Sync */}
          <div className="pt-6 border-t border-slate-800">
            <GoogleSheetsSection
              title="Google Sheets Nutrition Repository"
              subtitle="Synchronize your deep daily macro and micronutrient logs directly to your private Google Spreadsheet."
            />
          </div>
        </div>
      ) : (
        <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-2xl">
          <p className="text-sm text-slate-400">No deep nutrition data available for this date.</p>
        </div>
      )}
    </div>
  );
}
