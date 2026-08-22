"use client";

import React, { useState, useTransition } from "react";
import { SmartInsightsResponse } from "@/lib/services/insights/insight-types";
import { ReportRangePreset } from "@/lib/validations/report";
import { ReportDateSelector } from "@/components/reports/ReportDateSelector";
import { HealthScoreCard } from "./HealthScoreCard";
import { HeroInsightBanner } from "./HeroInsightBanner";
import { InsightCard } from "./InsightCard";
import { MicronutrientGroupCard } from "./MicronutrientGroupCard";
import { TrendChangesGrid } from "./TrendChangesGrid";
import { AchievementsGrid } from "./AchievementsGrid";
import { RecommendationsGrid } from "./RecommendationsGrid";
import { SmartInsightsEmptyState } from "./SmartInsightsEmptyState";
import { InsightCategoryTabs, InsightFilterTab } from "./InsightCategoryTabs";
import { Sparkles, RefreshCw, AlertTriangle, CheckCircle2, Award, Lightbulb, TrendingUp } from "lucide-react";

interface InsightsDashboardClientProps {
  initialData: SmartInsightsResponse;
  userId: string;
}

export function InsightsDashboardClient({ initialData, userId }: InsightsDashboardClientProps) {
  const [data, setData] = useState<SmartInsightsResponse>(initialData);
  const [preset, setPreset] = useState<ReportRangePreset>("last7days");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [activeTab, setActiveTab] = useState<InsightFilterTab>("ALL");
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(false);

  const fetchInsights = async (
    newPreset: ReportRangePreset,
    start?: string,
    end?: string
  ) => {
    setIsLoading(true);
    try {
      let url = `/api/insights?preset=${newPreset}`;
      if (newPreset === "custom" && start && end) {
        url += `&startDate=${start}&endDate=${end}`;
      }
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        startTransition(() => {
          setData(json);
        });
      }
    } catch (err) {
      console.error("Failed to fetch insights:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectPreset = (
    newPreset: ReportRangePreset,
    start?: string,
    end?: string
  ) => {
    setPreset(newPreset);
    if (start) setCustomStart(start);
    if (end) setCustomEnd(end);
    fetchInsights(newPreset, start, end);
  };

  const {
    healthScore,
    heroInsight,
    positiveInsights,
    attentionInsights,
    domainInsights,
    trends,
    achievements,
    recommendations,
    hasSufficientData,
    dateRange,
  } = data;

  const counts = {
    all: data.totalInsightsCount,
    attention: attentionInsights.length,
    goingWell: positiveInsights.length,
    nutrition: domainInsights.nutrition.length,
    micronutrients: domainInsights.micronutrients.length,
    hydration: domainInsights.hydration.length,
    activities: domainInsights.activities.length,
    workouts: domainInsights.workouts.length,
    trends: trends.length,
    achievements: achievements.length,
    recommendations: recommendations.length,
  };

  // Determine what to show based on activeTab
  const showAll = activeTab === "ALL";
  const showAttention = activeTab === "ALL" || activeTab === "ATTENTION";
  const showGoingWell = activeTab === "ALL" || activeTab === "GOING_WELL";
  const showNutrition = activeTab === "ALL" || activeTab === "NUTRITION";
  const showMicros = activeTab === "ALL" || activeTab === "MICRONUTRIENTS";
  const showHydration = activeTab === "ALL" || activeTab === "HYDRATION";
  const showActivities = activeTab === "ALL" || activeTab === "ACTIVITIES";
  const showWorkouts = activeTab === "ALL" || activeTab === "WORKOUTS";
  const showTrends = activeTab === "ALL" || activeTab === "TRENDS";
  const showAchievements = activeTab === "ALL" || activeTab === "ACHIEVEMENTS";
  const showRecommendations = activeTab === "ALL" || activeTab === "RECOMMENDATIONS";

  return (
    <div className="space-y-6 text-left">
      {/* Top Header & Range Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-background-surface border border-border-default rounded-3xl p-6 sm:p-7 shadow-surface-card">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-brand-500/15 border border-brand-500/30 text-brand-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <Sparkles className="h-3.5 w-3.5" />
            Explainable Health Intelligence &bull; Read-Only
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground-primary tracking-tight">
            Smart Insights &amp; Recommendations
          </h1>
          <p className="text-sm text-foreground-secondary mt-1 font-medium">
            Personalized behavioral analysis, micronutrient audits, and targeted actions for{" "}
            <strong className="text-brand-400 font-bold">{dateRange.label}</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchInsights(preset, customStart, customEnd)}
            disabled={isLoading || isPending}
            className="p-2.5 rounded-xl bg-background-elevated hover:bg-background-elevated/80 border border-border-subtle text-foreground-secondary hover:text-foreground-primary transition-colors cursor-pointer disabled:opacity-50"
            title="Refresh Insights"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading || isPending ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Timeframe Presets */}
      <ReportDateSelector
        currentPreset={preset}
        startDate={customStart}
        endDate={customEnd}
        onSelectPreset={handleSelectPreset}
      />

      {/* Main Content Area */}
      {!hasSufficientData ? (
        <SmartInsightsEmptyState />
      ) : (
        <div className="space-y-6">
          {/* 1. Health Score */}
          <HealthScoreCard healthScore={healthScore} />

          {/* 2. Hero Insight Banner (Today's Most Important Focus) */}
          {heroInsight && (showAll || showAttention || showGoingWell) && (
            <HeroInsightBanner insight={heroInsight} />
          )}

          {/* 3. Category Filter Tabs */}
          <div className="pt-2">
            <InsightCategoryTabs
              activeTab={activeTab}
              onTabChange={setActiveTab}
              counts={counts}
            />
          </div>

          {/* 4. Things Needing Attention */}
          {showAttention && attentionInsights.length > 0 && (
            <div className="p-6 rounded-3xl bg-background-surface border border-amber-500/30 shadow-surface-card space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground-primary">
                      Things Needing Attention
                    </h3>
                    <p className="text-xs text-foreground-secondary">
                      Priority optimization opportunities detected in this timeframe.
                    </p>
                  </div>
                </div>

                <span className="px-2.5 py-1 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-mono font-bold">
                  {attentionInsights.length} Priorities
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                {attentionInsights.map((ins) =>
                  ins.groupedItems && ins.groupedItems.length > 0 ? (
                    <MicronutrientGroupCard key={ins.id} insight={ins} />
                  ) : (
                    <InsightCard key={ins.id} insight={ins} />
                  )
                )}
              </div>
            </div>
          )}

          {/* 5. Things Going Well */}
          {showGoingWell && positiveInsights.length > 0 && (
            <div className="p-6 rounded-3xl bg-background-surface border border-brand-500/30 shadow-surface-card space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-brand-500/20 text-brand-400">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground-primary">
                      Things Going Well
                    </h3>
                    <p className="text-xs text-foreground-secondary">
                      Wellness habits, milestones, and nutritional targets achieved.
                    </p>
                  </div>
                </div>

                <span className="px-2.5 py-1 rounded-xl bg-brand-500/15 border border-brand-500/30 text-brand-300 text-xs font-mono font-bold">
                  {positiveInsights.length} Strengths
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                {positiveInsights.map((ins) => (
                  <InsightCard key={ins.id} insight={ins} />
                ))}
              </div>
            </div>
          )}

          {/* 6. Specific Domain Insights Grid (If Tab Selected) */}
          {(activeTab === "NUTRITION" || activeTab === "MICRONUTRIENTS") && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-foreground-primary px-1">
                {activeTab === "NUTRITION" ? "Nutrition & Macros Insights" : "Deep Micronutrient Analysis"}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(activeTab === "NUTRITION" ? domainInsights.nutrition : domainInsights.micronutrients).map((ins) =>
                  ins.groupedItems && ins.groupedItems.length > 0 ? (
                    <MicronutrientGroupCard key={ins.id} insight={ins} />
                  ) : (
                    <InsightCard key={ins.id} insight={ins} />
                  )
                )}
              </div>
            </div>
          )}

          {activeTab === "HYDRATION" && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-foreground-primary px-1">
                Hydration Insights
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {domainInsights.hydration.map((ins) => (
                  <InsightCard key={ins.id} insight={ins} />
                ))}
              </div>
            </div>
          )}

          {activeTab === "ACTIVITIES" && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-foreground-primary px-1">
                Running &amp; Activity Insights
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {domainInsights.activities.map((ins) => (
                  <InsightCard key={ins.id} insight={ins} />
                ))}
              </div>
            </div>
          )}

          {activeTab === "WORKOUTS" && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-foreground-primary px-1">
                Workout Insights
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {domainInsights.workouts.map((ins) => (
                  <InsightCard key={ins.id} insight={ins} />
                ))}
              </div>
            </div>
          )}

          {/* 7. Weekly Trends */}
          {showTrends && trends.length > 0 && <TrendChangesGrid trends={trends} />}

          {/* 8. Achievements */}
          {showAchievements && achievements.length > 0 && (
            <AchievementsGrid achievements={achievements} />
          )}

          {/* 9. Recommendations */}
          {showRecommendations && recommendations.length > 0 && (
            <RecommendationsGrid recommendations={recommendations} />
          )}
        </div>
      )}
    </div>
  );
}
