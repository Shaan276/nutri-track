"use client";
import React from "react";
import {
  Trophy,
  Award,
  Lock,
  CheckCircle2,
  Sparkles,
  Flame,
  Droplets,
  Utensils,
  Footprints,
  Dumbbell,
  ShieldAlert,
  Zap,
  Salad,
  Waves,
  Crown,
} from "lucide-react";
import { AchievementItemDto } from "@/lib/services/achievement.service";

interface AchievementsViewProps {
  achievements: AchievementItemDto[];
  unlockedCount: number;
  totalPoints: number;
  isLoading: boolean;
}

const ICON_MAP: Record<string, any> = {
  Utensils,
  Salad,
  Droplets,
  Waves,
  Footprints,
  Trophy,
  Zap,
  Dumbbell,
  ShieldAlert,
  Flame,
  Sparkles,
  Crown,
};

export function AchievementsView({
  achievements,
  unlockedCount,
  totalPoints,
  isLoading,
}: AchievementsViewProps) {
  const unlocked = achievements.filter((a) => a.isUnlocked);
  const locked = achievements.filter((a) => !a.isUnlocked);

  // Compute Rank Badge
  let rankTier = "BRONZE";
  let rankTitle = "Health Explorer";
  if (totalPoints >= 1000) {
    rankTier = "CHAMPION";
    rankTitle = "Nutri-Track Legend";
  } else if (totalPoints >= 600) {
    rankTier = "GOLD";
    rankTitle = "Fitness Master";
  } else if (totalPoints >= 300) {
    rankTier = "SILVER";
    rankTitle = "Consistency Pro";
  }

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-28 bg-[#161B26] border border-[#232936] rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-44 bg-[#161B26] border border-[#232936] rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Rank & Stats Overview Banner */}
      <div className="p-6 bg-gradient-to-br from-[#161B26] to-[#0E121A] border border-[#232936] rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex items-center gap-5 z-10">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Trophy className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider bg-amber-500/20 text-amber-300 rounded-full border border-amber-500/30">
                {rankTier} TIER
              </span>
              <span className="text-xs text-slate-400">Gamification Level</span>
            </div>
            <h2 className="text-xl font-bold text-white mt-1">{rankTitle}</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Unlock achievements by consistently logging food, hydration, runs, and workouts.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6 z-10 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 border-[#232936] pt-4 md:pt-0">
          <div className="text-center md:text-right">
            <div className="text-xs text-slate-400 font-medium">Achievements</div>
            <div className="text-2xl font-bold text-white mt-0.5">
              <span className="text-emerald-400">{unlockedCount}</span>
              <span className="text-slate-500 text-lg"> / {achievements.length}</span>
            </div>
          </div>
          <div className="h-10 w-[1px] bg-[#232936]" />
          <div className="text-center md:text-right">
            <div className="text-xs text-slate-400 font-medium">Total Points</div>
            <div className="text-2xl font-bold text-amber-400 mt-0.5 flex items-center gap-1.5 justify-center md:justify-end">
              <Sparkles className="w-5 h-5" />
              {totalPoints}
            </div>
          </div>
        </div>
      </div>

      {/* Unlocked Achievements Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-white flex items-center gap-2">
            <Award className="w-5 h-5 text-emerald-400" />
            Unlocked Badges ({unlocked.length})
          </h3>
        </div>

        {unlocked.length === 0 ? (
          <div className="p-8 text-center bg-[#161B26]/50 border border-[#232936] rounded-2xl">
            <Trophy className="w-10 h-10 text-slate-600 mx-auto mb-2" />
            <p className="text-sm text-slate-400">No achievements unlocked yet.</p>
            <p className="text-xs text-slate-500 mt-1">Start logging your meals, hydration, and activities to earn your first badge!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {unlocked.map((ach) => {
              const IconComponent = ICON_MAP[ach.icon] || Trophy;
              return (
                <div
                  key={ach.id}
                  className="p-5 bg-gradient-to-b from-[#19202E] to-[#121620] border border-emerald-500/30 rounded-2xl relative overflow-hidden transition-all hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/5 group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                      <IconComponent className="w-6 h-6" />
                    </div>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span className="text-xs font-semibold text-amber-400">+{ach.points} pts</span>
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-white">{ach.name}</h4>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    </div>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">{ach.description}</p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#232936] flex items-center justify-between text-[11px] text-slate-500">
                    <span className="uppercase font-semibold tracking-wider text-slate-400">{ach.category}</span>
                    {ach.unlockedAt && (
                      <span>Unlocked {new Date(ach.unlockedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Locked Achievements Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-300 flex items-center gap-2">
            <Lock className="w-4 h-4 text-slate-500" />
            Locked Badges ({locked.length})
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {locked.map((ach) => {
            const IconComponent = ICON_MAP[ach.icon] || Trophy;
            return (
              <div
                key={ach.id}
                className="p-5 bg-[#121620]/60 border border-[#232936] rounded-2xl relative overflow-hidden opacity-80 hover:opacity-100 transition-all hover:border-slate-700"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-800/50 border border-slate-700/50 flex items-center justify-center text-slate-500">
                    <IconComponent className="w-6 h-6" />
                  </div>
                  <div className="flex items-center gap-1 px-2 py-0.5 bg-slate-800/60 border border-slate-700 rounded-full">
                    <Lock className="w-3 h-3 text-slate-400" />
                    <span className="text-[11px] font-medium text-slate-400">{ach.points} pts</span>
                  </div>
                </div>

                <div className="mt-4">
                  <h4 className="text-sm font-semibold text-slate-200">{ach.name}</h4>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">{ach.description}</p>
                </div>

                {/* Progress bar */}
                <div className="mt-4 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 text-[11px]">
                      {ach.currentProgress} / {ach.targetValue} {ach.unit}
                    </span>
                    <span className="font-semibold text-slate-300 text-[11px]">{ach.progressPercentage}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-[#1F2633] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-slate-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, ach.progressPercentage)}%` }}
                    />
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[#232936]/60 flex items-center justify-between text-[11px] text-slate-500">
                  <span className="uppercase font-semibold tracking-wider">{ach.category}</span>
                  <span>{Math.max(0, ach.targetValue - ach.currentProgress)} {ach.unit} to go</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
