import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NutritionService } from "@/lib/services/nutrition.service";
import { HydrationService } from "@/lib/services/hydration.service";
import { UnifiedActivityService } from "@/lib/services/unified-activity.service";
import {
  Flame,
  UtensilsCrossed,
  Apple,
  ArrowRight,
  Sparkles,
  Droplets,
  Activity,
  Clock,
  Footprints,
} from "lucide-react";
import { DailyNutritionSummary } from "@/components/nutrition/DailyNutritionSummary";
import { mealTypeDisplayNames, mealTypeIcons } from "@/lib/validations/meal";
import { formatDuration } from "@/lib/validations/activity";

import { SmartInsightsService } from "@/lib/services/insights/smart-insights.service";
import { SmartInsightsWidget } from "@/components/dashboard/SmartInsightsWidget";
import { AIAssessmentWelcomeModal } from "@/components/dashboard/AIAssessmentWelcomeModal";

export const dynamic = "force-dynamic";

export default async function ProtectedAppPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.id) {
    redirect("/login?callbackUrl=/app");
  }

  const profile = await prisma.userProfile.findUnique({
    where: { userId: session.user.id },
  }).catch(() => null);

  if (!profile) {
    redirect("/onboarding");
  }

  const todayStr = new Date().toISOString().split("T")[0];

  // Fetch today's aggregated nutrition, hydration, unified activities, and smart insights in parallel
  const [dailyData, hydrationData, activitiesData, smartInsights, userFoodsCount, assessmentMem] = await Promise.all([
    NutritionService.getDailyNutrition(session.user.id, todayStr),
    HydrationService.getDailyHydration(session.user.id, todayStr),
    UnifiedActivityService.getDailyActivities(session.user.id, todayStr),
    SmartInsightsService.getSmartInsights(session.user.id, "last7days"),
    prisma.food.count({
      where: {
        OR: [{ userId: session.user.id }, { isSystemFood: true }],
        isArchived: false,
      },
    }).catch(() => 0),
    prisma.aIMemory.findFirst({
      where: { userId: session.user.id, category: "ASSESSMENT_STATUS" },
    }).catch(() => null),
  ]);

  const totalEntriesCount = (dailyData?.meals || []).reduce((acc, m) => acc + (m.entries?.length || 0), 0);

  return (
    <div className="w-full space-y-6 text-left animate-fade-in">
      {/* First-Login / Resumable AI Assessment Modal & Banner */}
      <AIAssessmentWelcomeModal initialStatus={assessmentMem?.content || "NOT_STARTED"} />

      {/* Top Greeting Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-background-surface border border-border-default rounded-3xl p-6 sm:p-7 shadow-surface-card">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-brand-500/15 border border-brand-500/30 text-brand-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <Sparkles className="h-3.5 w-3.5" />
            Live Dashboard &bull; Daily Overview
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground-primary tracking-tight">
            Welcome back, {session.user.name || "Piyush"}!
          </h1>
          <p className="text-sm text-foreground-secondary mt-1 font-medium">
            Logged <strong className="text-brand-400 font-bold">{totalEntriesCount} foods</strong> &bull; <strong className="text-blue-400 font-bold">{hydrationData.totalMl} ml fluid</strong> &bull; <strong className="text-emerald-400 font-bold">{activitiesData.totalActivitiesCount} activities</strong> today.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Link
            href="/nutrition"
            className="inline-flex items-center gap-2 py-2.5 px-4 bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-black font-extrabold text-xs rounded-xl shadow-brand-glow transition-all duration-200 cursor-pointer"
          >
            <UtensilsCrossed className="h-4 w-4" />
            <span>Nutrition</span>
          </Link>
          <Link
            href="/hydration"
            className="inline-flex items-center gap-2 py-2.5 px-4 bg-blue-500/15 hover:bg-blue-500/25 text-blue-400 border border-blue-500/30 font-extrabold text-xs rounded-xl transition-all duration-200 cursor-pointer"
          >
            <Droplets className="h-4 w-4 fill-blue-400" />
            <span>Hydration</span>
          </Link>
          <Link
            href="/activities"
            className="inline-flex items-center gap-2 py-2.5 px-4 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 font-extrabold text-xs rounded-xl transition-all duration-200 cursor-pointer"
          >
            <Activity className="h-4 w-4" />
            <span>Activities</span>
          </Link>
        </div>
      </div>

      {/* Main Nutrition Summary */}
      <DailyNutritionSummary
        totals={dailyData.totals}
        targets={dailyData.targets}
        progress={dailyData.progress}
      />

      {/* Smart Insights & Health Score Widget */}
      <SmartInsightsWidget insights={smartInsights} />

      {/* Meal Breakdown Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground-primary tracking-tight">
            Today&apos;s Meal Journal
          </h2>
          <Link
            href="/nutrition"
            className="text-xs font-semibold text-brand-400 hover:text-brand-300 flex items-center gap-1 cursor-pointer transition-colors"
          >
            <span>Open Nutrition Journal</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {dailyData.meals.map((meal) => {
            const hasItems = meal.entries.length > 0;
            return (
              <div
                key={meal.mealType}
                className={`p-5 rounded-2xl border transition-all shadow-sm ${
                  hasItems
                    ? "bg-background-surface border-border-default hover:border-brand-500/40"
                    : "bg-background-surface border-dashed border-border-subtle"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{mealTypeIcons[meal.mealType]}</span>
                    <span className="text-sm font-bold text-foreground-primary">
                      {mealTypeDisplayNames[meal.mealType]}
                    </span>
                  </div>
                  <span className="text-xs font-mono font-bold text-brand-400">
                    {Math.round(meal.totals.calories)} kcal
                  </span>
                </div>

                {hasItems ? (
                  <div className="space-y-2">
                    <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
                      {meal.entries.map((entry) => (
                        <div
                          key={entry.id}
                          className="flex items-center justify-between text-xs text-foreground-secondary"
                        >
                          <span className="truncate pr-2 font-medium">{entry.foodName}</span>
                          <span className="text-foreground-muted font-mono shrink-0">
                            {Math.round(entry.calories)} kcal
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-2 border-t border-border-subtle/50 flex items-center justify-between text-[11px] font-mono text-foreground-muted">
                      <span>P: {Math.round(meal.totals.protein)}g</span>
                      <span>C: {Math.round(meal.totals.carbs)}g</span>
                      <span>F: {Math.round(meal.totals.fat)}g</span>
                    </div>
                  </div>
                ) : (
                  <div className="py-4 text-center">
                    <p className="text-xs text-foreground-muted font-medium">No foods logged</p>
                    <Link
                      href="/nutrition"
                      className="inline-block mt-2 text-xs font-semibold text-brand-400 hover:underline cursor-pointer"
                    >
                      + Log Meal
                    </Link>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Secondary Dashboard Cards (Hydration, Unified Activities, and Food Database) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Live Hydration Progress Card */}
        <Link
          href="/hydration"
          className="group p-5 rounded-2xl bg-gradient-to-br from-blue-500/15 via-background-elevated to-background-surface border border-blue-500/30 hover:border-blue-500/60 transition-all shadow-sm flex flex-col justify-between space-y-3 cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-xl bg-blue-500/20 text-blue-400 group-hover:scale-105 transition-transform">
              <Droplets className="h-5 w-5 fill-blue-400" />
            </div>
            <span className="px-2 py-0.5 rounded-md bg-blue-500/15 text-blue-300 text-xs font-bold font-mono">
              {hydrationData.percentage}%
            </span>
          </div>

          <div>
            <h3 className="text-sm font-bold text-foreground-primary group-hover:text-blue-300 transition-colors">
              Hydration Tracking
            </h3>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-lg font-extrabold text-foreground-primary font-mono">
                {hydrationData.totalMl}
              </span>
              <span className="text-xs text-foreground-muted">/ {hydrationData.targetMl} ml</span>
            </div>

            <div className="w-full h-2 bg-background-surface rounded-full overflow-hidden mt-2">
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(hydrationData.percentage, 100)}%` }}
              />
            </div>
          </div>
        </Link>

        {/* Live Unified Activities Card */}
        <Link
          href="/activities"
          className="group p-5 rounded-2xl bg-gradient-to-br from-emerald-500/15 via-background-elevated to-background-surface border border-emerald-500/30 hover:border-emerald-500/60 transition-all shadow-sm flex flex-col justify-between space-y-3 cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 group-hover:scale-105 transition-transform">
              <Activity className="h-5 w-5" />
            </div>
            <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 text-xs font-bold font-mono">
              {activitiesData.totalActivitiesCount} {activitiesData.totalActivitiesCount === 1 ? "session" : "sessions"}
            </span>
          </div>

          <div>
            <h3 className="text-sm font-bold text-foreground-primary group-hover:text-emerald-300 transition-colors">
              Activities &amp; Fitness
            </h3>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-lg font-extrabold text-foreground-primary font-mono">
                {formatDuration(activitiesData.totalActiveDurationSeconds)}
              </span>
              <span className="text-xs text-emerald-400 font-bold font-mono">
                {activitiesData.totalCaloriesBurned} kcal
              </span>
            </div>

            <div className="flex items-center justify-between text-xs text-foreground-muted mt-2 pt-2 border-t border-border-subtle/40">
              <span className="flex items-center gap-1 font-mono">
                <Footprints className="h-3.5 w-3.5 text-cyan-400" />
                {activitiesData.totalSteps.toLocaleString()} steps
              </span>
              <span className="flex items-center gap-1 font-mono">
                <Clock className="h-3.5 w-3.5 text-amber-400" />
                {activitiesData.totalDistanceKm} km
              </span>
            </div>
          </div>
        </Link>

        {/* Food Library Card */}
        <Link
          href="/foods"
          className="group p-5 rounded-2xl bg-background-surface border border-border-default hover:border-brand-500/50 transition-all shadow-sm flex flex-col justify-between space-y-3 cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-xl bg-brand-500/10 text-brand-400 group-hover:scale-105 transition-transform">
              <Apple className="h-5 w-5" />
            </div>
            <ArrowRight className="h-4 w-4 text-foreground-muted group-hover:text-brand-400 group-hover:translate-x-1 transition-transform" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground-primary group-hover:text-brand-300 transition-colors">
              Food Database Library
            </h3>
            <p className="text-xs text-foreground-secondary mt-0.5">
              {userFoodsCount} reference foods &bull; Macronutrient profiles
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}
