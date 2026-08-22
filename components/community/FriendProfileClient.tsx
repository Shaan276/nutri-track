"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  User,
  Sparkles,
  Flame,
  Droplets,
  Activity,
  Dumbbell,
  Target,
  Lock,
  Scale,
  Send,
  CheckCircle2,
  Calendar,
  Shield,
  Footprints,
} from "lucide-react";
import { FriendSharedProfileDto } from "@/lib/services/community.service";
import { SendRecommendationModal } from "./SendRecommendationModal";
import { FriendComparisonDrawer } from "./FriendComparisonDrawer";

interface FriendProfileClientProps {
  initialProfile: FriendSharedProfileDto;
}

export function FriendProfileClient({ initialProfile }: FriendProfileClientProps) {
  const [profile, setProfile] = useState<FriendSharedProfileDto>(initialProfile);
  const [showRecommendModal, setShowRecommendModal] = useState(false);
  const [showCompareDrawer, setShowCompareDrawer] = useState(false);

  const { user, isSelf, relationshipStatus, healthScore, nutrition, hydration, activities, workouts, achievements } =
    profile;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 text-left animate-fade-in pb-16">
      {/* Top Breadcrumb & Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/community"
          className="inline-flex items-center gap-2 text-xs font-semibold text-neutral-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Community</span>
        </Link>
      </div>

      {/* Friend Header Card */}
      <div className="p-6 sm:p-7 rounded-3xl bg-background-surface border border-border-default shadow-surface-card space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-extrabold text-2xl">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold text-foreground-primary">
                  {user.name}
                </h1>
                <span className="text-xs font-mono text-foreground-muted">
                  @{user.username}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1 text-xs text-foreground-secondary">
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase tracking-wider ${
                    relationshipStatus === "ACCEPTED"
                      ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-400"
                      : "bg-neutral-800 text-neutral-400 border border-neutral-700"
                  }`}
                >
                  {isSelf ? "Your Profile" : relationshipStatus === "ACCEPTED" ? "Friends" : "Community Member"}
                </span>
                {profile.friendsSince && (
                  <span className="text-[11px] text-neutral-500">
                    &bull; Connected {new Date(profile.friendsSince).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          </div>

          {!isSelf && relationshipStatus === "ACCEPTED" && (
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setShowCompareDrawer(true)}
                className="px-4 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-xs font-bold text-neutral-200 flex items-center gap-2 transition-all cursor-pointer"
              >
                <Scale className="w-4 h-4 text-indigo-400" />
                <span>Compare</span>
              </button>

              <button
                onClick={() => setShowRecommendModal(true)}
                className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-black font-extrabold text-xs flex items-center gap-2 shadow-emerald-500/20 shadow-sm transition-all cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Recommend Item</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Grid of Shared Progress Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Section 1: Health Score */}
        <div className="p-6 rounded-3xl bg-background-surface border border-border-default space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 text-xs font-bold text-foreground-primary">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-amber-400" />
              </div>
              <span>Shared Health Score</span>
            </div>
            {healthScore.isPrivate && (
              <span className="text-[10px] px-2 py-0.5 rounded bg-neutral-800 text-neutral-400 border border-neutral-700 flex items-center gap-1 font-semibold">
                <Lock className="w-3 h-3" /> Private
              </span>
            )}
          </div>

          {healthScore.isPrivate ? (
            <div className="py-6 text-center text-xs text-neutral-500 bg-neutral-900/40 rounded-2xl border border-neutral-800/40 space-y-1">
              <Lock className="w-5 h-5 mx-auto text-neutral-600 mb-2" />
              <p className="font-semibold text-neutral-400">Health Score is Private</p>
              <p className="text-[11px] text-neutral-600">{user.name} keeps their health score private.</p>
            </div>
          ) : healthScore.data ? (
            <div className="p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800 space-y-2">
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-3xl font-black font-mono text-emerald-400">
                    {healthScore.data.isPending ? "—" : healthScore.data.score}
                  </span>
                  <span className="text-xs text-neutral-400 font-sans font-bold"> / 100</span>
                </div>
                <span className="text-xs font-extrabold px-3 py-1 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                  Grade {healthScore.data.grade}
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 font-medium">{healthScore.data.gradeLabel}</p>
            </div>
          ) : (
            <p className="text-xs text-neutral-500 py-4 text-center">No score recorded yet.</p>
          )}
        </div>

        {/* Section 2: Nutrition Adherence */}
        <div className="p-6 rounded-3xl bg-background-surface border border-border-default space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 text-xs font-bold text-foreground-primary">
              <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                <Flame className="w-4 h-4 text-rose-400" />
              </div>
              <span>Nutrition Adherence</span>
            </div>
            {nutrition.isPrivate && (
              <span className="text-[10px] px-2 py-0.5 rounded bg-neutral-800 text-neutral-400 border border-neutral-700 flex items-center gap-1 font-semibold">
                <Lock className="w-3 h-3" /> Private
              </span>
            )}
          </div>

          {nutrition.isPrivate ? (
            <div className="py-6 text-center text-xs text-neutral-500 bg-neutral-900/40 rounded-2xl border border-neutral-800/40 space-y-1">
              <Lock className="w-5 h-5 mx-auto text-neutral-600 mb-2" />
              <p className="font-semibold text-neutral-400">Nutrition Data is Private</p>
              <p className="text-[11px] text-neutral-600">{user.name} keeps their nutrition summary private.</p>
            </div>
          ) : nutrition.data ? (
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-2xl bg-neutral-900/80 border border-neutral-800">
                <span className="text-[10px] font-bold text-neutral-400 uppercase">Calorie Target</span>
                <div className="text-xl font-black font-mono text-white mt-1">
                  {Math.round(nutrition.data.calorieAdherencePercent)}%
                </div>
                <span className="text-[10px] text-neutral-500">weekly adherence</span>
              </div>
              <div className="p-3 rounded-2xl bg-neutral-900/80 border border-neutral-800">
                <span className="text-[10px] font-bold text-neutral-400 uppercase">Protein Goal</span>
                <div className="text-xl font-black font-mono text-emerald-400 mt-1">
                  {Math.round(nutrition.data.proteinAdherencePercent)}%
                </div>
                <span className="text-[10px] text-neutral-500">weekly adherence</span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-neutral-500 py-4 text-center">No nutrition data logged yet.</p>
          )}
        </div>

        {/* Section 3: Hydration Progress */}
        <div className="p-6 rounded-3xl bg-background-surface border border-border-default space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 text-xs font-bold text-foreground-primary">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                <Droplets className="w-4 h-4 text-cyan-400" />
              </div>
              <span>Hydration Progress</span>
            </div>
            {hydration.isPrivate && (
              <span className="text-[10px] px-2 py-0.5 rounded bg-neutral-800 text-neutral-400 border border-neutral-700 flex items-center gap-1 font-semibold">
                <Lock className="w-3 h-3" /> Private
              </span>
            )}
          </div>

          {hydration.isPrivate ? (
            <div className="py-6 text-center text-xs text-neutral-500 bg-neutral-900/40 rounded-2xl border border-neutral-800/40 space-y-1">
              <Lock className="w-5 h-5 mx-auto text-neutral-600 mb-2" />
              <p className="font-semibold text-neutral-400">Hydration Data is Private</p>
              <p className="text-[11px] text-neutral-600">{user.name} keeps their hydration progress private.</p>
            </div>
          ) : hydration.data ? (
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-2xl bg-neutral-900/80 border border-neutral-800">
                <span className="text-[10px] font-bold text-neutral-400 uppercase">Logging Streak</span>
                <div className="text-xl font-black font-mono text-cyan-400 mt-1">
                  {hydration.data.streakDays}{" "}
                  <span className="text-xs font-sans text-neutral-400 font-bold">days</span>
                </div>
                <span className="text-[10px] text-neutral-500">consecutive streak</span>
              </div>
              <div className="p-3 rounded-2xl bg-neutral-900/80 border border-neutral-800">
                <span className="text-[10px] font-bold text-neutral-400 uppercase">Daily Intake</span>
                <div className="text-xl font-black font-mono text-white mt-1">
                  {Math.round(hydration.data.weeklyAverageMl)}{" "}
                  <span className="text-xs font-sans text-neutral-400 font-bold">ml</span>
                </div>
                <span className="text-[10px] text-neutral-500">weekly average</span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-neutral-500 py-4 text-center">No hydration logged yet.</p>
          )}
        </div>

        {/* Section 4: Activities & Running */}
        <div className="p-6 rounded-3xl bg-background-surface border border-border-default space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 text-xs font-bold text-foreground-primary">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <Activity className="w-4 h-4 text-emerald-400" />
              </div>
              <span>Activity &amp; Running</span>
            </div>
            {activities.isPrivate && (
              <span className="text-[10px] px-2 py-0.5 rounded bg-neutral-800 text-neutral-400 border border-neutral-700 flex items-center gap-1 font-semibold">
                <Lock className="w-3 h-3" /> Private
              </span>
            )}
          </div>

          {activities.isPrivate ? (
            <div className="py-6 text-center text-xs text-neutral-500 bg-neutral-900/40 rounded-2xl border border-neutral-800/40 space-y-1">
              <Lock className="w-5 h-5 mx-auto text-neutral-600 mb-2" />
              <p className="font-semibold text-neutral-400">Activity Data is Private</p>
              <p className="text-[11px] text-neutral-600">{user.name} keeps their activity progress private.</p>
            </div>
          ) : activities.data ? (
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-2xl bg-neutral-900/80 border border-neutral-800">
                <span className="text-[10px] font-bold text-neutral-400 uppercase">Running Distance</span>
                <div className="text-xl font-black font-mono text-emerald-400 mt-1">
                  {activities.data.weeklyRunningKm}{" "}
                  <span className="text-xs font-sans text-neutral-400 font-bold">km</span>
                </div>
                <span className="text-[10px] text-neutral-500">this week ({activities.data.weeklySessions} runs)</span>
              </div>
              <div className="p-3 rounded-2xl bg-neutral-900/80 border border-neutral-800">
                <span className="text-[10px] font-bold text-neutral-400 uppercase">Average Pace</span>
                <div className="text-xl font-black font-mono text-white mt-1">
                  {activities.data.avgPaceFormatted || "—"}
                </div>
                <span className="text-[10px] text-neutral-500">min/km</span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-neutral-500 py-4 text-center">No runs logged yet this week.</p>
          )}
        </div>

        {/* Section 5: Workouts */}
        <div className="p-6 rounded-3xl bg-background-surface border border-border-default space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 text-xs font-bold text-foreground-primary">
              <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                <Dumbbell className="w-4 h-4 text-purple-400" />
              </div>
              <span>Workout Progress</span>
            </div>
            {workouts.isPrivate && (
              <span className="text-[10px] px-2 py-0.5 rounded bg-neutral-800 text-neutral-400 border border-neutral-700 flex items-center gap-1 font-semibold">
                <Lock className="w-3 h-3" /> Private
              </span>
            )}
          </div>

          {workouts.isPrivate ? (
            <div className="py-6 text-center text-xs text-neutral-500 bg-neutral-900/40 rounded-2xl border border-neutral-800/40 space-y-1">
              <Lock className="w-5 h-5 mx-auto text-neutral-600 mb-2" />
              <p className="font-semibold text-neutral-400">Workout Data is Private</p>
              <p className="text-[11px] text-neutral-600">{user.name} keeps their workout progress private.</p>
            </div>
          ) : workouts.data ? (
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-2xl bg-neutral-900/80 border border-neutral-800">
                <span className="text-[10px] font-bold text-neutral-400 uppercase">Sessions Logged</span>
                <div className="text-xl font-black font-mono text-purple-400 mt-1">
                  {workouts.data.weeklySessions}{" "}
                  <span className="text-xs font-sans text-neutral-400 font-bold">sessions</span>
                </div>
                <span className="text-[10px] text-neutral-500">{workouts.data.weeklySets} total sets</span>
              </div>
              <div className="p-3 rounded-2xl bg-neutral-900/80 border border-neutral-800">
                <span className="text-[10px] font-bold text-neutral-400 uppercase">Volume Lifted</span>
                <div className="text-xl font-black font-mono text-white mt-1">
                  {workouts.data.totalVolumeKg.toLocaleString()}{" "}
                  <span className="text-xs font-sans text-neutral-400 font-bold">kg</span>
                </div>
                <span className="text-[10px] text-neutral-500">tonnage this week</span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-neutral-500 py-4 text-center">No workouts logged yet this week.</p>
          )}
        </div>

        {/* Section 6: Achievements */}
        <div className="p-6 rounded-3xl bg-background-surface border border-border-default space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 text-xs font-bold text-foreground-primary">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                <Target className="w-4 h-4 text-indigo-400" />
              </div>
              <span>Personal Records &amp; Milestones</span>
            </div>
            {achievements.isPrivate && (
              <span className="text-[10px] px-2 py-0.5 rounded bg-neutral-800 text-neutral-400 border border-neutral-700 flex items-center gap-1 font-semibold">
                <Lock className="w-3 h-3" /> Private
              </span>
            )}
          </div>

          {achievements.isPrivate ? (
            <div className="py-6 text-center text-xs text-neutral-500 bg-neutral-900/40 rounded-2xl border border-neutral-800/40 space-y-1">
              <Lock className="w-5 h-5 mx-auto text-neutral-600 mb-2" />
              <p className="font-semibold text-neutral-400">Achievements are Private</p>
              <p className="text-[11px] text-neutral-600">{user.name} keeps their personal records private.</p>
            </div>
          ) : achievements.data && achievements.data.length > 0 ? (
            <div className="space-y-2">
              {achievements.data.map((ach) => (
                <div
                  key={ach.key}
                  className="p-3 rounded-2xl bg-neutral-900/80 border border-neutral-800 flex items-center justify-between"
                >
                  <div>
                    <div className="text-xs font-bold text-neutral-200">{ach.title}</div>
                    <div className="text-[10px] text-neutral-500 font-mono">
                      Achieved {new Date(ach.achievedDate).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-xs font-mono font-black text-indigo-400">
                    {ach.value} {ach.unit}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-neutral-500 py-4 text-center">No personal records shared yet.</p>
          )}
        </div>
      </div>

      {/* Modals & Drawers */}
      <SendRecommendationModal
        friendId={user.id}
        friendName={user.name}
        friendUsername={user.username}
        isOpen={showRecommendModal}
        onClose={() => setShowRecommendModal(false)}
      />

      <FriendComparisonDrawer
        friendUsername={user.username}
        isOpen={showCompareDrawer}
        onClose={() => setShowCompareDrawer(false)}
      />
    </div>
  );
}
