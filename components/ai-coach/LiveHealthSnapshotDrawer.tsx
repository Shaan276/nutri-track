"use client";

import React, { useState } from "react";
import {
  Activity,
  Flame,
  Droplets,
  Dumbbell,
  Brain,
  ChevronRight,
  ChevronLeft,
  ShieldCheck,
  RefreshCw,
  Award,
  Footprints,
  Zap,
} from "lucide-react";
import { HealthContextSnapshot } from "@/lib/services/health-context.service";

export interface LiveHealthSnapshotDrawerProps {
  snapshot?: HealthContextSnapshot | null;
  isLoading?: boolean;
  onRefresh?: () => void;
  onDeleteMemory?: (id: string) => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export function LiveHealthSnapshotDrawer({
  snapshot,
  isLoading = false,
  onRefresh,
  onDeleteMemory,
  isMobileOpen = false,
  onCloseMobile,
}: LiveHealthSnapshotDrawerProps) {
  const [isOpen, setIsOpen] = useState(true);

  if (!snapshot) {
    return (
      <div
        className={`hidden lg:flex flex-col border-l border-neutral-800 bg-neutral-950 transition-all duration-300 ${
          isOpen ? "w-80" : "w-12"
        }`}
      >
        <div className="flex items-center justify-between p-3 border-b border-neutral-800 bg-neutral-900/50">
          {isOpen && (
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-semibold uppercase tracking-wider text-neutral-300">
                Live Health Snapshot
              </span>
            </div>
          )}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-1 text-neutral-400 hover:text-white rounded hover:bg-neutral-800 transition-colors mx-auto"
          >
            {isOpen ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
        {isOpen && (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-xs text-neutral-400 space-y-3">
            {isLoading ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin text-emerald-400 mx-auto" />
                <span>Loading live health metrics...</span>
              </>
            ) : (
              <>
                <Activity className="w-8 h-8 text-neutral-600 mx-auto" />
                <div>
                  <p className="font-bold text-neutral-300">Live Health Context</p>
                  <p className="text-[11px] text-neutral-500 mt-1">
                    Your daily calories, hydration, workouts, and activity will appear here in real-time.
                  </p>
                </div>
                {onRefresh && (
                  <button
                    onClick={onRefresh}
                    className="px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Refresh Snapshot</span>
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>
    );
  }

  const { nutrition, hydration, movement, workouts, healthScore, profile, memories, integrations } =
    snapshot;

  return (
    <>
      {/* Mobile Drawer Overlay Backdrop */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/70 z-40 lg:hidden backdrop-blur-sm transition-opacity"
        />
      )}

      <div
        className={`${
          isMobileOpen
            ? "fixed inset-y-0 right-0 z-50 w-80 max-w-[90vw] flex flex-col bg-neutral-950 border-l border-neutral-800 shadow-2xl"
            : "hidden xl:flex flex-col border-l border-neutral-800 bg-neutral-950 transition-all duration-300"
        } ${!isMobileOpen && (isOpen ? "w-72 2xl:w-80" : "w-12")}`}
      >
        {/* Drawer Header Toggle */}
        <div className="flex items-center justify-between p-3 border-b border-neutral-800 bg-neutral-900/50">
          {(isOpen || isMobileOpen) && (
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-semibold uppercase tracking-wider text-neutral-300">
                  Live Health Snapshot
                </span>
              </div>
              {snapshot.generatedAt && (
              <p className="text-[10px] text-neutral-500 font-mono pl-6">
                Updated {new Date(snapshot.generatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </p>
            )}
          </div>
        )}
        <div className="flex items-center gap-1">
          {isOpen && onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="p-1 text-neutral-400 hover:text-emerald-400 rounded hover:bg-neutral-800 transition-colors cursor-pointer"
              title="Refresh live snapshot"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-emerald-400" : ""}`} />
            </button>
          )}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-1 text-neutral-400 hover:text-white rounded hover:bg-neutral-800 transition-colors cursor-pointer"
            title={isOpen ? "Collapse panel" : "Expand panel"}
          >
            {isOpen ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
          {/* Section 1: Today's Nutrition Progress */}
          <div className="p-3 rounded-xl border border-neutral-800 bg-neutral-900/60 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-medium text-neutral-200">
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                Today&apos;s Nutrition
              </div>
              <span
                className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                  nutrition.dataState === "LOGGED"
                    ? "bg-emerald-950/60 text-emerald-400 border border-emerald-800/40"
                    : "bg-neutral-800 text-neutral-400"
                }`}
              >
                {nutrition.dataState === "LOGGED" ? `${nutrition.mealCount} Logged` : "Not logged yet"}
              </span>
            </div>

            <div className="text-sm font-bold text-white">
              {nutrition.caloriesConsumed.toLocaleString()}{" "}
              <span className="text-neutral-400 font-normal text-xs">
                / {nutrition.calorieTarget.toLocaleString()} kcal
              </span>
            </div>

            {/* Protein bar */}
            <div>
              <div className="flex justify-between text-[11px] text-neutral-400 mb-1">
                <span>Protein</span>
                <span className="text-neutral-200 font-medium">
                  {nutrition.proteinConsumed} / {nutrition.proteinTarget}g
                </span>
              </div>
              <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.round((nutrition.proteinConsumed / (nutrition.proteinTarget || 1)) * 100)
                    )}%`,
                  }}
                />
              </div>
            </div>

            {/* Carbs, Fat, Fiber */}
            <div className="grid grid-cols-3 gap-1.5 pt-1 text-[10px] text-neutral-400 border-t border-neutral-800/60">
              <div>
                Carbs: <span className="text-neutral-200 font-medium">{nutrition.carbsConsumed}g</span>
              </div>
              <div>
                Fat: <span className="text-neutral-200 font-medium">{nutrition.fatsConsumed}g</span>
              </div>
              <div>
                Fiber: <span className="text-neutral-200 font-medium">{nutrition.fiberConsumed}g</span>
              </div>
            </div>
          </div>

          {/* Section 2: Hydration Intake */}
          <div className="p-3 rounded-xl border border-neutral-800 bg-neutral-900/60 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-medium text-neutral-200">
                <Droplets className="w-3.5 h-3.5 text-cyan-400" />
                Hydration Intake
              </div>
              <span className="text-[10px] text-cyan-400 font-medium">
                {hydration.streakDays}d streak
              </span>
            </div>

            <div className="text-sm font-bold text-white">
              {hydration.consumedMl.toLocaleString()}{" "}
              <span className="text-neutral-400 font-normal text-xs">
                / {hydration.targetMl.toLocaleString()} ml
              </span>
            </div>

            <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-cyan-500 rounded-full transition-all"
                style={{ width: `${Math.min(100, hydration.percentage)}%` }}
              />
            </div>
          </div>

          {/* Section 3: Active Energy & Movement */}
          <div className="p-3 rounded-xl border border-neutral-800 bg-neutral-900/60 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-medium text-neutral-200">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                Active Movement & Energy
              </div>
              <span className="text-[10px] text-neutral-400">
                {movement.todayActivitySessions} logged
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="p-2 rounded bg-neutral-950/70 border border-neutral-800/60">
                <div className="text-[10px] text-neutral-500">Active Burned</div>
                <div className="font-bold text-amber-400">
                  {movement.totalActiveCalories}{" "}
                  <span className="text-[10px] text-neutral-400 font-normal">kcal</span>
                </div>
              </div>
              <div className="p-2 rounded bg-neutral-950/70 border border-neutral-800/60">
                <div className="text-[10px] text-neutral-500">Distance</div>
                <div className="font-bold text-white">
                  {movement.todayDistanceKm}{" "}
                  <span className="text-[10px] text-neutral-400 font-normal">km</span>
                </div>
              </div>
            </div>

            {/* Steps Progress */}
            <div>
              <div className="flex justify-between text-[11px] text-neutral-400 mb-1">
                <span className="flex items-center gap-1">
                  <Footprints className="w-3 h-3 text-emerald-400" /> Steps
                </span>
                <span className="text-neutral-200 font-medium">
                  {movement.todaySteps.toLocaleString()} / {movement.dailyStepTarget.toLocaleString()}
                </span>
              </div>
              <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all"
                  style={{ width: `${movement.stepPercentage}%` }}
                />
              </div>
            </div>
          </div>

          {/* Section 4: Workouts & Strength */}
          <div className="p-3 rounded-xl border border-neutral-800 bg-neutral-900/60 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-medium text-neutral-200">
                <Dumbbell className="w-3.5 h-3.5 text-indigo-400" />
                Workouts & Strength
              </div>
              <span className="text-[10px] text-indigo-400 font-medium">
                {workouts.weeklyWorkoutSessions} / {workouts.weeklyWorkoutTarget} this week
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="p-2 rounded bg-neutral-950/70 border border-neutral-800/60">
                <div className="text-[10px] text-neutral-500">Today</div>
                <div className="font-bold text-white">
                  {workouts.todayWorkoutSessions}{" "}
                  <span className="text-[10px] text-neutral-400 font-normal">sessions</span>
                </div>
              </div>
              <div className="p-2 rounded bg-neutral-950/70 border border-neutral-800/60">
                <div className="text-[10px] text-neutral-500">Weekly Tonnage</div>
                <div className="font-bold text-indigo-400">
                  {workouts.weeklyWorkoutVolumeKg.toLocaleString()}{" "}
                  <span className="text-[10px] text-neutral-400 font-normal">kg</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 5: Health Score */}
          <div className="p-3 rounded-xl border border-neutral-800 bg-neutral-900/60 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-medium text-neutral-200">
                <Award className="w-3.5 h-3.5 text-emerald-400" />
                7-Day Health Score
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800/50 font-bold">
                {healthScore.isPending ? "PENDING" : `Grade ${healthScore.letterGrade}`}
              </span>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-lg font-black text-white">
                {healthScore.isPending ? "—" : healthScore.score}
              </span>
              <span className="text-xs text-neutral-400">
                {healthScore.isPending ? "Log meals & activity to unlock score" : "/ 100 — " + healthScore.gradeLabel}
              </span>
            </div>
          </div>

          {/* Section 6: Profile & Metabolic Baseline */}
          <div className="p-3 rounded-xl border border-neutral-800 bg-neutral-900/60 space-y-2">
            <div className="flex items-center gap-1.5 font-medium text-neutral-200">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              Metabolic Targets
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="p-2 rounded bg-neutral-950/70 border border-neutral-800/60">
                <div className="text-[10px] text-neutral-500">BMR</div>
                <div className="font-bold text-white">{profile.bmr} kcal</div>
              </div>
              <div className="p-2 rounded bg-neutral-950/70 border border-neutral-800/60">
                <div className="text-[10px] text-neutral-500">TDEE</div>
                <div className="font-bold text-emerald-400">{profile.tdee} kcal</div>
              </div>
            </div>

            <div className="text-[10px] text-neutral-400 space-y-1 pt-1 border-t border-neutral-800">
              <div>
                • Goal:{" "}
                <span className="text-neutral-200 capitalize">
                  {profile.primaryGoal?.toLowerCase()?.replace("_", " ") || "Maintain"}
                </span>
              </div>
              <div>
                • Target Running:{" "}
                <span className="text-neutral-200">{movement.weeklyRunningTargetKm} km/week</span>
              </div>
            </div>
          </div>

          {/* Section 7: AI Memories & Preferences */}
          <div className="p-3 rounded-xl border border-neutral-800 bg-neutral-900/60 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-medium text-neutral-200">
                <Brain className="w-3.5 h-3.5 text-purple-400" />
                AI Memories
              </div>
              <span className="text-[10px] text-neutral-500">{memories.length} saved</span>
            </div>

            {memories.length === 0 ? (
              <p className="text-[11px] text-neutral-500 italic">
                No custom preferences detected yet. The AI Coach automatically learns your dietary constraints as you chat.
              </p>
            ) : (
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {memories.map((m) => (
                  <div
                    key={m.id}
                    className="p-1.5 rounded bg-neutral-950/80 border border-neutral-800 text-[11px] text-neutral-300 flex items-start justify-between gap-1 group"
                  >
                    <div>
                      <span className="text-[9px] font-semibold uppercase text-purple-400 bg-purple-950/40 px-1 py-0.5 rounded mr-1">
                        {m.category}
                      </span>
                      {m.content}
                    </div>
                    {onDeleteMemory && (
                      <button
                        onClick={() => onDeleteMemory(m.id)}
                        className="text-neutral-500 hover:text-rose-400 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Delete memory"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 8: Connected Integrations */}
          {integrations && integrations.length > 0 && (
            <div className="p-2.5 rounded-lg border border-neutral-800/80 bg-neutral-950/60 text-[10px] text-neutral-400 space-y-1">
              <div className="font-semibold text-neutral-300">Connected Services:</div>
              <div className="flex flex-wrap gap-1.5">
                {integrations.map((i) => (
                  <span
                    key={i.provider}
                    className="px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-[10px] text-emerald-400 flex items-center gap-1"
                  >
                    ● {i.provider.replace("_", " ")}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Grounding & Privacy Guarantee */}
          <div className="p-2.5 rounded-lg border border-neutral-800/80 bg-neutral-950/40 text-[10px] text-neutral-500 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>Grounded strictly in your private Nutri-Track database. API keys & queries are encrypted & isolated.</span>
          </div>
        </div>
      )}
    </div>
    </>
  );
}
