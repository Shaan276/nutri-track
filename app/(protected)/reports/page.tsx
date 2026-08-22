"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  LineChart as LineChartIcon,
  RefreshCw,
  Sparkles,
  Utensils,
  Droplets,
  Flame,
  Dumbbell,
  Activity,
  AlertCircle,
  Trophy,
  Target,
  Layers,
} from "lucide-react";
import { FullReportResponse, ReportRangePreset } from "@/lib/validations/report";
import { ReportDateSelector } from "@/components/reports/ReportDateSelector";
import { ReportOverviewCards } from "@/components/reports/ReportOverviewCards";
import { ConsistencyScoreCard } from "@/components/reports/ConsistencyScoreCard";
import { WeeklyComparisonCard } from "@/components/reports/WeeklyComparisonCard";
import { PersonalRecordsCard } from "@/components/reports/PersonalRecordsCard";
import { NutritionAnalyticsSection } from "@/components/reports/NutritionAnalyticsSection";
import { HydrationAnalyticsSection } from "@/components/reports/HydrationAnalyticsSection";
import { ActivityAnalyticsSection } from "@/components/reports/ActivityAnalyticsSection";
import { WorkoutAnalyticsSection } from "@/components/reports/WorkoutAnalyticsSection";

export default function ReportsPage() {
  const [report, setReport] = useState<FullReportResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [preset, setPreset] = useState<ReportRangePreset>("last7days");
  const [customStart, setCustomStart] = useState<string | undefined>();
  const [customEnd, setCustomEnd] = useState<string | undefined>();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"ALL" | "NUTRITION" | "HYDRATION" | "ACTIVITY" | "WORKOUTS" | "RECORDS">("ALL");

  const fetchReport = useCallback(
    async (selectedPreset: ReportRangePreset, start?: string, end?: string) => {
      try {
        setLoading(true);
        setErrorMsg(null);

        const params = new URLSearchParams();
        params.set("range", selectedPreset);
        if (start && end) {
          params.set("startDate", start);
          params.set("endDate", end);
        }

        const res = await fetch(`/api/reports?${params.toString()}`);
        const data = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(data.error || "Failed to load reports");
        }

        setReport(data.data);
      } catch (err: any) {
        console.error("Failed to load reports data:", err);
        setErrorMsg(err.message || "Failed to load analytical telemetry.");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchReport(preset, customStart, customEnd);
  }, [preset, customStart, customEnd, fetchReport]);

  const handleSelectPreset = (newPreset: ReportRangePreset, start?: string, end?: string) => {
    setPreset(newPreset);
    setCustomStart(start);
    setCustomEnd(end);
    fetchReport(newPreset, start, end);
  };

  return (
    <div className="space-y-6 pb-12 text-left">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Reports &amp; Analytics
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
              Insights Hub
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
            Understand your nutrition, hydration, activity, and workout telemetry with high-contrast data visualizations and comparative period analysis.
          </p>
        </div>

        <button
          type="button"
          onClick={() => fetchReport(preset, customStart, customEnd)}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-semibold rounded-xl transition-colors cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh Analytics
        </button>
      </div>

      {/* Date Range Selector */}
      <ReportDateSelector
        currentPreset={preset}
        startDate={customStart}
        endDate={customEnd}
        onSelectPreset={handleSelectPreset}
      />

      {/* Error Alert */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-3">
          <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && !report && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-44 bg-slate-900/60 border border-slate-800 rounded-2xl animate-pulse" />
            ))}
          </div>
          <div className="h-64 bg-slate-900/60 border border-slate-800 rounded-2xl animate-pulse" />
        </div>
      )}

      {/* Main Analytical Dashboard Content */}
      {report && (
        <div className="space-y-8 animate-in fade-in duration-200">
          {/* 1. Overview Metric Cards */}
          <ReportOverviewCards
            nutrition={report.overview.nutrition}
            hydration={report.overview.hydration}
            activities={report.overview.activities}
            workouts={report.overview.workouts}
            comparisons={report.comparisons}
          />

          {/* 2. Deterministic Consistency Score */}
          <ConsistencyScoreCard scoreBreakdown={report.consistencyScore} />

          {/* Section Navigation Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-2xl">
            {(
              [
                { key: "ALL", label: "All Analytics", icon: Layers },
                { key: "NUTRITION", label: "Nutrition & Micros", icon: Utensils },
                { key: "HYDRATION", label: "Hydration", icon: Droplets },
                { key: "ACTIVITY", label: "Running & Activity", icon: Activity },
                { key: "WORKOUTS", label: "Workouts", icon: Dumbbell },
                { key: "RECORDS", label: "Personal Records", icon: Trophy },
              ] as const
            ).map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    isActive
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "text-slate-400 hover:text-white hover:bg-slate-800"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* 3. Nutrition Section */}
          {(activeTab === "ALL" || activeTab === "NUTRITION") && (
            <NutritionAnalyticsSection
              calorieTrend={report.charts.calorieTrend}
              macroTrend={report.charts.macroTrend}
              macroDistribution={report.charts.macroDistribution}
              proteinConsistency={report.charts.proteinConsistency}
              fiberSugarTrend={report.charts.fiberSugarTrend}
              micronutrients={report.micronutrients}
            />
          )}

          {/* 4. Hydration Section */}
          {(activeTab === "ALL" || activeTab === "HYDRATION") && (
            <HydrationAnalyticsSection
              overview={report.overview.hydration}
              trend={report.charts.hydrationTrend}
            />
          )}

          {/* 5. Activity & Running Section */}
          {(activeTab === "ALL" || activeTab === "ACTIVITY") && (
            <ActivityAnalyticsSection
              overview={report.overview.activities}
              activityTrend={report.charts.activityTrend}
              runningPaceTrend={report.charts.runningPaceTrend}
              stepsTrend={report.charts.stepsTrend}
              activityDistribution={report.charts.activityDistribution}
            />
          )}

          {/* 6. Workout Section */}
          {(activeTab === "ALL" || activeTab === "WORKOUTS") && (
            <WorkoutAnalyticsSection
              overview={report.overview.workouts}
              trend={report.charts.workoutTrend}
              exerciseDistribution={report.charts.exerciseDistribution}
            />
          )}

          {/* 7. Period Comparisons */}
          {(activeTab === "ALL" || activeTab === "NUTRITION" || activeTab === "ACTIVITY") && (
            <WeeklyComparisonCard
              comparisons={report.comparisons}
              periodLabel={`vs Previous ${report.dateRange.daysCount} Days`}
            />
          )}

          {/* 8. Personal Records */}
          {(activeTab === "ALL" || activeTab === "RECORDS") && (
            <PersonalRecordsCard records={report.personalRecords} />
          )}
        </div>
      )}
    </div>
  );
}
