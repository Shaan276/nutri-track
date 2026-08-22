"use client";

import React, { useState, useEffect } from "react";
import {
  Calendar,
  CheckCircle2,
  Circle,
  Plus,
  RefreshCw,
  Sparkles,
  TrendingUp,
  X,
  Loader2,
  Flame,
  Dumbbell,
  Droplets,
  Activity,
  Award,
} from "lucide-react";
import { WeeklyPlanDto, WeeklyPlanItemDto, WeeklyReviewResult } from "@/lib/services/weekly-plan.service";

interface WeeklyPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WeeklyPlanModal({ isOpen, onClose }: WeeklyPlanModalProps) {
  const [activeTab, setActiveTab] = useState<"PLAN" | "REVIEW">("PLAN");
  const [plan, setPlan] = useState<WeeklyPlanDto | null>(null);
  const [review, setReview] = useState<WeeklyReviewResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPlan = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await fetch("/api/weekly-plans?activeOnly=true");
      if (res.ok) {
        const json = await res.json();
        setPlan(json.data || null);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load weekly plan");
    } finally {
      setIsLoading(false);
    }
  };

  const loadReview = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/weekly-plans/review");
      if (res.ok) {
        const json = await res.json();
        setReview(json.data || null);
      }
    } catch (err) {
      console.error("Failed to load review:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      if (activeTab === "PLAN") {
        loadPlan();
      } else {
        loadReview();
      }
    }
  }, [isOpen, activeTab]);

  const handleGenerateAIPlan = async () => {
    try {
      setIsGenerating(true);
      const res = await fetch("/api/weekly-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "GENERATE_AI" }),
      });

      if (res.ok) {
        const json = await res.json();
        setPlan(json.data);
      }
    } catch (err) {
      console.error("Failed to generate AI plan:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleToggleItem = async (item: WeeklyPlanItemDto) => {
    if (!plan) return;

    try {
      const nextCompleted = !item.isCompleted;
      // Optimistic update
      setPlan((prev) => {
        if (!prev) return prev;
        const nextItems = prev.items.map((i) => (i.id === item.id ? { ...i, isCompleted: nextCompleted } : i));
        const completedCount = nextItems.filter((i) => i.isCompleted).length;
        return {
          ...prev,
          items: nextItems,
          completedItemsCount: completedCount,
          adherencePercentage: Math.round((completedCount / Math.max(1, nextItems.length)) * 100),
        };
      });

      await fetch(`/api/weekly-plans/${plan.id}/items/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isCompleted: nextCompleted }),
      });
    } catch (err) {
      console.error("Failed to toggle plan item:", err);
      await loadPlan();
    }
  };

  const handleEvaluatePlanVsActual = async () => {
    if (!plan) return;

    try {
      setIsEvaluating(true);
      const res = await fetch(`/api/weekly-plans/${plan.id}/evaluate`, { method: "POST" });
      if (res.ok) {
        const json = await res.json();
        setPlan(json.data);
      }
    } catch (err) {
      console.error("Failed to evaluate plan:", err);
    } finally {
      setIsEvaluating(false);
    }
  };

  if (!isOpen) return null;

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "RUNNING":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "WORKOUT":
        return "bg-cyan-500/10 text-cyan-400 border-cyan-500/20";
      case "NUTRITION":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "HYDRATION":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "RECOVERY":
        return "bg-purple-500/10 text-purple-400 border-purple-500/20";
      default:
        return "bg-neutral-800 text-neutral-300 border-neutral-700";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="bg-[#0e121a] border border-neutral-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-900/40">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <Calendar className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Weekly Health & Fitness Blueprint</h3>
              <p className="text-[11px] text-neutral-400">Personalized weekly planning & evidence retrospective</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-neutral-800 bg-neutral-950 px-4">
          <button
            onClick={() => setActiveTab("PLAN")}
            className={`py-2.5 px-4 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === "PLAN"
                ? "border-emerald-500 text-emerald-400"
                : "border-transparent text-neutral-400 hover:text-neutral-200"
            }`}
          >
            Current Blueprint
          </button>
          <button
            onClick={() => setActiveTab("REVIEW")}
            className={`py-2.5 px-4 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === "REVIEW"
                ? "border-emerald-500 text-emerald-400"
                : "border-transparent text-neutral-400 hover:text-neutral-200"
            }`}
          >
            Weekly Review & Metrics
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {activeTab === "PLAN" ? (
            <>
              {isLoading ? (
                <div className="py-12 flex flex-col items-center justify-center gap-2 text-neutral-500 text-xs">
                  <Loader2 className="w-5 h-5 animate-spin text-emerald-400" />
                  Loading weekly blueprint...
                </div>
              ) : !plan ? (
                <div className="py-10 text-center bg-neutral-900/20 border border-neutral-800/60 rounded-xl p-6 space-y-3">
                  <Sparkles className="w-10 h-10 text-emerald-400 mx-auto" />
                  <h4 className="text-sm font-semibold text-white">No active weekly blueprint found</h4>
                  <p className="text-xs text-neutral-400 max-w-md mx-auto">
                    Let AI formulate a structured 7-day plan grounded in your current metabolic targets, running goals, and strength preferences.
                  </p>
                  <button
                    onClick={handleGenerateAIPlan}
                    disabled={isGenerating}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold rounded-xl inline-flex items-center gap-2 shadow-lg shadow-emerald-950/40 transition-colors"
                  >
                    {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    Generate AI Weekly Blueprint
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Plan Summary Bar */}
                  <div className="p-4 bg-neutral-900/60 border border-neutral-800 rounded-xl flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="text-xs font-semibold text-neutral-200">{plan.goalSummary}</div>
                      <div className="text-[11px] text-neutral-400">
                        {plan.startDate} → {plan.endDate} • {plan.completedItemsCount}/{plan.totalItemsCount} items completed ({plan.adherencePercentage}%)
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleEvaluatePlanVsActual}
                        disabled={isEvaluating}
                        className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs rounded-lg flex items-center gap-1.5 transition-colors"
                        title="Sync with real logged workouts and runs"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isEvaluating ? "animate-spin text-emerald-400" : ""}`} />
                        Sync vs Logs
                      </button>
                      <button
                        onClick={handleGenerateAIPlan}
                        disabled={isGenerating}
                        className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs rounded-lg flex items-center gap-1.5 transition-colors"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        Regenerate
                      </button>
                    </div>
                  </div>

                  {/* Adherence Progress Bar */}
                  <div className="w-full bg-neutral-900 rounded-full h-2 overflow-hidden border border-neutral-800">
                    <div
                      className="bg-emerald-500 h-full transition-all duration-500 rounded-full"
                      style={{ width: `${plan.adherencePercentage}%` }}
                    />
                  </div>

                  {/* Daily Plan Items */}
                  <div className="space-y-2">
                    {plan.items.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => handleToggleItem(item)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
                          item.isCompleted
                            ? "bg-neutral-950/60 border-neutral-800/60 text-neutral-400 opacity-80"
                            : "bg-neutral-900/40 border-neutral-800 hover:border-neutral-700 text-white"
                        }`}
                      >
                        <button className="mt-0.5 text-neutral-400 hover:text-emerald-400 transition-colors">
                          {item.isCompleted ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <Circle className="w-4 h-4" />
                          )}
                        </button>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono text-neutral-500">{item.date}</span>
                            <span
                              className={`text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded border ${getCategoryColor(
                                item.category
                              )}`}
                            >
                              {item.category}
                            </span>
                            {item.matchedActivityId && (
                              <span className="text-[9px] text-emerald-400 font-medium">● Matched Log</span>
                            )}
                          </div>
                          <div className={`text-xs font-medium ${item.isCompleted ? "line-through text-neutral-400" : "text-neutral-100"}`}>
                            {item.title}
                          </div>
                          {item.description && (
                            <div className="text-[11px] text-neutral-400">{item.description}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              {isLoading ? (
                <div className="py-12 flex flex-col items-center justify-center gap-2 text-neutral-500 text-xs">
                  <Loader2 className="w-5 h-5 animate-spin text-emerald-400" />
                  Generating weekly retrospective...
                </div>
              ) : !review ? (
                <div className="py-8 text-center text-xs text-neutral-500">
                  No review data available. Log activities to generate a retrospective.
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Score Header */}
                  <div className="p-4 bg-gradient-to-r from-emerald-950/30 to-neutral-900 border border-emerald-500/20 rounded-xl flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-semibold text-emerald-300 uppercase tracking-wider">Weekly Score</h4>
                      <div className="text-2xl font-bold text-white mt-0.5">{review.overallScore} / 100</div>
                      <div className="text-[11px] text-neutral-400">{review.startDate} → {review.endDate}</div>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                      <Award className="w-6 h-6 text-emerald-400" />
                    </div>
                  </div>

                  {/* Metrics Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div className="p-3 bg-neutral-950 border border-neutral-800/80 rounded-xl text-center">
                      <div className="text-[10px] text-neutral-500 uppercase font-semibold">Running Dist</div>
                      <div className="text-sm font-bold text-emerald-400 mt-1">{review.metricsSummary.totalRunningDistanceKm} km</div>
                      <div className="text-[10px] text-neutral-400">{review.metricsSummary.avgRunningPace}</div>
                    </div>
                    <div className="p-3 bg-neutral-950 border border-neutral-800/80 rounded-xl text-center">
                      <div className="text-[10px] text-neutral-500 uppercase font-semibold">Workouts</div>
                      <div className="text-sm font-bold text-cyan-400 mt-1">{review.metricsSummary.totalWorkoutSessions} sessions</div>
                      <div className="text-[10px] text-neutral-400">Strength</div>
                    </div>
                    <div className="p-3 bg-neutral-950 border border-neutral-800/80 rounded-xl text-center">
                      <div className="text-[10px] text-neutral-500 uppercase font-semibold">Avg Daily Protein</div>
                      <div className="text-sm font-bold text-amber-400 mt-1">{review.metricsSummary.avgDailyProteinGrams}g</div>
                      <div className="text-[10px] text-neutral-400">{review.metricsSummary.proteinAdherenceRate}% hit rate</div>
                    </div>
                    <div className="p-3 bg-neutral-950 border border-neutral-800/80 rounded-xl text-center">
                      <div className="text-[10px] text-neutral-500 uppercase font-semibold">Total Hydration</div>
                      <div className="text-sm font-bold text-blue-400 mt-1">{Math.round(review.metricsSummary.totalHydrationMl / 1000)}L</div>
                      <div className="text-[10px] text-neutral-400">{review.metricsSummary.hydrationGoalDays}/7 days</div>
                    </div>
                  </div>

                  {/* Key Wins */}
                  {review.keyWins.length > 0 && (
                    <div className="p-3.5 bg-emerald-950/20 border border-emerald-800/40 rounded-xl space-y-1.5">
                      <div className="text-xs font-semibold text-emerald-300 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        Key Highlights & Wins
                      </div>
                      <ul className="text-xs text-neutral-300 space-y-1 list-disc list-inside">
                        {review.keyWins.map((w, idx) => (
                          <li key={idx}>{w}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Growth Areas */}
                  {review.growthAreas.length > 0 && (
                    <div className="p-3.5 bg-amber-950/20 border border-amber-800/40 rounded-xl space-y-1.5">
                      <div className="text-xs font-semibold text-amber-300 flex items-center gap-1.5">
                        <TrendingUp className="w-4 h-4 text-amber-400" />
                        Opportunities for Growth
                      </div>
                      <ul className="text-xs text-neutral-300 space-y-1 list-disc list-inside">
                        {review.growthAreas.map((g, idx) => (
                          <li key={idx}>{g}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Next Week Recommended Focus */}
                  <div className="p-3.5 bg-neutral-950 border border-neutral-800 rounded-xl space-y-1.5">
                    <div className="text-xs font-semibold text-neutral-200">Recommended Next Week Focus</div>
                    <ul className="text-xs text-neutral-400 space-y-1 list-disc list-inside">
                      {review.recommendedNextFocus.map((f, idx) => (
                        <li key={idx}>{f}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 border-t border-neutral-800/80 bg-neutral-900/30 flex items-center justify-between text-[11px] text-neutral-500">
          <span>Grounded strictly in your authenticated Nutri-Track logs.</span>
          <button
            onClick={onClose}
            className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-xs font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
