"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Activity, Plus, Sparkles, Loader2, Dumbbell, Home, ChevronRight } from "lucide-react";
import { DateNavigator } from "@/components/nutrition/DateNavigator";
import { ActivitiesOverviewCards } from "@/components/activities/ActivitiesOverviewCards";
import { WeeklyActivityVolumeChart } from "@/components/activities/WeeklyActivityVolumeChart";
import { ActivityDistributionChart } from "@/components/activities/ActivityDistributionChart";
import { ActivitiesTimeline } from "@/components/activities/ActivitiesTimeline";
import { RunningAnalysisCard } from "@/components/activities/RunningAnalysisCard";
import { WorkoutAnalysisCard } from "@/components/activities/WorkoutAnalysisCard";
import { LogUnifiedActivityModal, SelectedCategory } from "@/components/activities/LogUnifiedActivityModal";
import { EditUnifiedActivityModal } from "@/components/activities/EditUnifiedActivityModal";
import { DeleteUnifiedActivityModal } from "@/components/activities/DeleteUnifiedActivityModal";
import {
  UnifiedDailyActivitiesSummary,
  UnifiedWeeklyActivitiesSummary,
  UnifiedActivityItem,
} from "@/lib/services/unified-activity.service";

function ActivitiesContent() {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();

  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );

  // Modals state
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<SelectedCategory>("RUN");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [showOtherSubmenu, setShowOtherSubmenu] = useState(false);
  const [editingItem, setEditingItem] = useState<UnifiedActivityItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<UnifiedActivityItem | null>(null);

  // Check URL query parameters on mount or change
  useEffect(() => {
    const action = searchParams?.get("action");
    const type = searchParams?.get("type") as SelectedCategory;
    const templateId = searchParams?.get("templateId");

    if (templateId) {
      setSelectedTemplateId(templateId);
      setActiveCategory("GYM_WORKOUT");
      setIsLogModalOpen(true);
    } else if (action === "log" || type) {
      if (type) {
        setActiveCategory(type);
      }
      setIsLogModalOpen(true);
    }
  }, [searchParams]);

  // Daily Unified Activities Query
  const {
    data: dailyData,
    isLoading: isDailyLoading,
    refetch: refetchDaily,
  } = useQuery<UnifiedDailyActivitiesSummary>({
    queryKey: ["activities", selectedDate],
    queryFn: async () => {
      const res = await fetch(`/api/activities?date=${selectedDate}`);
      if (!res.ok) throw new Error("Failed to fetch daily activities");
      const json = await res.json();
      return json.data;
    },
  });

  // Weekly Unified Activities Summary Query
  const {
    data: weeklyData,
    isLoading: isWeeklyLoading,
    refetch: refetchWeekly,
  } = useQuery<UnifiedWeeklyActivitiesSummary>({
    queryKey: ["activities-weekly", selectedDate],
    queryFn: async () => {
      const res = await fetch(`/api/activities?date=${selectedDate}&view=weekly`);
      if (!res.ok) throw new Error("Failed to fetch weekly activities summary");
      const json = await res.json();
      return json.data;
    },
  });

  const handleMutationSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["activities"] });
    queryClient.invalidateQueries({ queryKey: ["activities-weekly"] });
    refetchDaily();
    refetchWeekly();
  };

  const handleOpenLogWithCategory = (cat: SelectedCategory, tplId: string | null = null) => {
    setActiveCategory(cat);
    setSelectedTemplateId(tplId);
    setIsLogModalOpen(true);
  };

  const totalActiveDurationSeconds = dailyData?.totalActiveDurationSeconds || 0;
  const totalCaloriesBurned = dailyData?.totalCaloriesBurned || 0;
  const totalDistanceKm = dailyData?.totalDistanceKm || 0;
  const totalSteps = dailyData?.totalSteps || 0;
  const items = dailyData?.items || [];

  // Filter running items and workout items for telemetry cards
  const runningItems = items.filter((i) => i.kind === "CARDIO" && i.categoryKey === "RUN");
  const workoutItems = items.filter((i) => i.kind === "WORKOUT");

  const runningDistance = runningItems.reduce((acc, i) => acc + (i.distanceKm || 0), 0);
  const runningDuration = runningItems.reduce((acc, i) => acc + (i.durationSeconds || 0), 0);
  const runningElevation = runningItems.reduce((acc, i) => acc + (i.elevationGainMeters || 0), 0);
  const runningPace = runningDistance > 0 ? Math.round(runningDuration / runningDistance) : 0;

  return (
    <div className="w-full space-y-6 text-left animate-fade-in pb-10">
      {/* Top Header & Fast Activity Launchpad */}
      <div className="bg-background-surface border border-border-default rounded-3xl p-6 sm:p-7 shadow-surface-card space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2">
              <Sparkles className="h-3.5 w-3.5" />
              Unified Activities Hub
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground-primary tracking-tight">
              Activities
            </h1>
            <p className="text-sm text-foreground-secondary mt-1 font-medium">
              Track your running, workouts, training sessions, and physical movement in one unified place.
            </p>
          </div>

          <button
            onClick={() => handleOpenLogWithCategory("RUN")}
            className="inline-flex items-center justify-center gap-2 py-3 px-5 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-black font-extrabold text-xs rounded-xl shadow-brand-glow hover:shadow-brand-glow-lg transition-all duration-200 cursor-pointer shrink-0"
          >
            <Plus className="h-4 w-4 stroke-[3]" />
            <span>+ Log Activity</span>
          </button>
        </div>

        {/* Simplified Activities Hierarchy (Running | Workout | Other Activities) */}
        <div className="pt-3 border-t border-border-subtle space-y-2">
          <p className="text-xs font-bold text-foreground-muted uppercase tracking-wider">
            Quick Log Activity:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {/* 1. Running */}
            <button
              type="button"
              onClick={() => handleOpenLogWithCategory("RUN")}
              className="py-3 px-4 rounded-2xl bg-background-elevated hover:bg-amber-500/10 border border-border-subtle hover:border-amber-500/40 text-foreground-primary text-xs font-bold transition-all flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <span className="text-lg">🏃</span>
                <div className="text-left">
                  <p className="font-extrabold text-foreground-primary">Running</p>
                  <p className="text-[10px] text-foreground-muted font-medium">Intervals, Tempo, Long Runs</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-foreground-muted" />
            </button>

            {/* 2. Workout */}
            <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-background-elevated border border-border-subtle">
              <button
                type="button"
                onClick={() => handleOpenLogWithCategory("GYM_WORKOUT")}
                className="flex-1 py-2 px-2.5 rounded-xl hover:bg-emerald-500/15 text-foreground-primary text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                title="Gym Workout"
              >
                <span>🏋️</span>
                <span className="truncate">Gym</span>
              </button>
              <button
                type="button"
                onClick={() => handleOpenLogWithCategory("HOME_WORKOUT")}
                className="flex-1 py-2 px-2.5 rounded-xl hover:bg-purple-500/15 text-foreground-primary text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                title="Home Workout"
              >
                <span>🏠</span>
                <span className="truncate">Home</span>
              </button>
            </div>

            {/* 3. Other Activities */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowOtherSubmenu(!showOtherSubmenu)}
                className="w-full py-3 px-4 rounded-2xl bg-background-elevated hover:bg-blue-500/10 border border-border-subtle hover:border-blue-500/40 text-foreground-primary text-xs font-bold transition-all flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-lg">⋯</span>
                  <div className="text-left">
                    <p className="font-extrabold text-foreground-primary">Other Activities</p>
                    <p className="text-[10px] text-foreground-muted font-medium">Walking, Cycling, HIIT, Other</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-foreground-muted" />
              </button>

              {/* Sub-menu for Other Activities */}
              {showOtherSubmenu && (
                <div className="absolute top-full left-0 right-0 mt-1.5 p-2 rounded-2xl bg-background-surface border border-border-default shadow-2xl z-30 grid grid-cols-2 sm:grid-cols-4 gap-1.5 animate-fade-in">
                  {[
                    { type: "WALK" as SelectedCategory, label: "Walking", icon: "🚶" },
                    { type: "CYCLING" as SelectedCategory, label: "Cycling", icon: "🚴" },
                    { type: "HIIT" as SelectedCategory, label: "HIIT", icon: "🔥" },
                    { type: "OTHER" as SelectedCategory, label: "Other", icon: "➕" },
                  ].map((sub) => (
                    <button
                      key={sub.type}
                      type="button"
                      onClick={() => {
                        setShowOtherSubmenu(false);
                        handleOpenLogWithCategory(sub.type);
                      }}
                      className="py-2 px-2 rounded-xl bg-background-elevated hover:bg-brand-500/15 border border-border-subtle text-foreground-primary text-xs font-bold flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <span>{sub.icon}</span>
                      <span>{sub.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Date Navigation Bar */}
      <DateNavigator
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
      />

      {/* Today's Unified Overview Cards */}
      <ActivitiesOverviewCards
        totalActiveDurationSeconds={totalActiveDurationSeconds}
        totalCaloriesBurned={totalCaloriesBurned}
        totalDistanceKm={totalDistanceKm}
        totalSteps={totalSteps}
      />

      {/* Visualizations Grid: 7-Day Volume Trend + Activity Distribution Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <WeeklyActivityVolumeChart
            days={weeklyData?.days || []}
            totalDurationSeconds={weeklyData?.totalActiveDurationSeconds || 0}
            totalDistanceKm={weeklyData?.totalDistanceKm || 0}
            totalCaloriesBurned={weeklyData?.totalCaloriesBurned || 0}
            totalActivitiesCount={weeklyData?.totalActivitiesCount || 0}
            isLoading={isWeeklyLoading}
          />
        </div>

        <div className="lg:col-span-1">
          <ActivityDistributionChart
            distribution={weeklyData?.distribution || []}
            isLoading={isWeeklyLoading}
          />
        </div>
      </div>

      {/* Specialized Telemetry Analysis (Running & Workout) */}
      {runningItems.length > 0 && (
        <RunningAnalysisCard
          runs={runningItems}
          totalDistanceKm={runningDistance}
          totalDurationSeconds={runningDuration}
          averagePaceSecondsPerKm={runningPace}
          totalElevationGainMeters={runningElevation}
        />
      )}

      {workoutItems.length > 0 && (
        <WorkoutAnalysisCard workouts={workoutItems} />
      )}

      {/* Unified Chronological Activity Timeline */}
      <ActivitiesTimeline
        items={items}
        selectedDate={selectedDate}
        onEdit={(item) => setEditingItem(item)}
        onDelete={(item) => setDeletingItem(item)}
        onOpenLogModal={() => handleOpenLogWithCategory("RUN")}
      />

      {/* Log Activity Modal */}
      <LogUnifiedActivityModal
        isOpen={isLogModalOpen}
        onClose={() => {
          setIsLogModalOpen(false);
          setSelectedTemplateId(null);
        }}
        defaultDate={selectedDate}
        initialCategory={activeCategory}
        initialTemplateId={selectedTemplateId}
        onSuccess={handleMutationSuccess}
      />

      {/* Edit Activity Modal */}
      {editingItem && (
        <EditUnifiedActivityModal
          isOpen={!!editingItem}
          onClose={() => setEditingItem(null)}
          item={editingItem}
          onSuccess={handleMutationSuccess}
        />
      )}

      {/* Delete Activity Modal */}
      {deletingItem && (
        <DeleteUnifiedActivityModal
          isOpen={!!deletingItem}
          onClose={() => setDeletingItem(null)}
          item={deletingItem}
          onSuccess={handleMutationSuccess}
        />
      )}
    </div>
  );
}

export default function ActivitiesPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full py-20 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="h-8 w-8 text-emerald-400 animate-spin" />
          <p className="text-xs text-foreground-muted font-bold">Loading Activities Hub...</p>
        </div>
      }
    >
      <ActivitiesContent />
    </Suspense>
  );
}
