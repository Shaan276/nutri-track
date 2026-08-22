"use client";
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Target,
  Plus,
  Trophy,
  Zap,
  CheckCircle2,
  Clock,
  Sparkles,
  Utensils,
  Droplets,
  Footprints,
  Dumbbell,
  Flame,
  ArrowUpRight,
  TrendingUp,
} from "lucide-react";
import { GoalWithProgress } from "@/lib/services/goal.service";
import { GoalCategory, CreateGoalInput } from "@/lib/validations/goals";
import { AchievementsView } from "@/components/goals/AchievementsView";
import { ChallengesView } from "@/components/goals/ChallengesView";
import { CreateGoalModal } from "@/components/goals/CreateGoalModal";
import { GoalDetailModal } from "@/components/goals/GoalDetailModal";

const CATEGORY_TABS: Array<{ id: GoalCategory | "ALL"; label: string; icon: any }> = [
  { id: "ALL", label: "All Goals", icon: Target },
  { id: "NUTRITION", label: "Nutrition", icon: Utensils },
  { id: "HYDRATION", label: "Hydration", icon: Droplets },
  { id: "RUNNING", label: "Running", icon: Footprints },
  { id: "ACTIVITIES", label: "Activities", icon: Flame },
  { id: "WORKOUTS", label: "Workouts", icon: Dumbbell },
  { id: "CONSISTENCY", label: "Consistency", icon: Sparkles },
];

export function GoalsHubClient() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"goals" | "challenges" | "achievements">("goals");
  const [selectedCategory, setSelectedCategory] = useState<GoalCategory | "ALL">("ALL");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<GoalWithProgress | null>(null);

  // 1. Fetch Goals
  const { data: goalsData, isLoading: isLoadingGoals } = useQuery({
    queryKey: ["goals", selectedCategory],
    queryFn: async () => {
      const url =
        selectedCategory === "ALL"
          ? "/api/goals"
          : `/api/goals?category=${selectedCategory}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch goals");
      return res.json();
    },
    staleTime: 1000 * 30, // 30s
  });

  // 2. Fetch Achievements
  const { data: achievementsData, isLoading: isLoadingAchievements } = useQuery({
    queryKey: ["achievements"],
    queryFn: async () => {
      const res = await fetch("/api/achievements");
      if (!res.ok) throw new Error("Failed to fetch achievements");
      return res.json();
    },
    staleTime: 1000 * 30,
  });

  // 3. Fetch Challenges
  const { data: challengesData, isLoading: isLoadingChallenges } = useQuery({
    queryKey: ["challenges"],
    queryFn: async () => {
      const res = await fetch("/api/challenges");
      if (!res.ok) throw new Error("Failed to fetch challenges");
      return res.json();
    },
    staleTime: 1000 * 30,
  });

  // Mutations
  const createGoalMutation = useMutation({
    mutationFn: async (data: CreateGoalInput) => {
      const res = await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create goal");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      queryClient.invalidateQueries({ queryKey: ["achievements"] });
      queryClient.invalidateQueries({ queryKey: ["health-snapshot"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  const pauseGoalMutation = useMutation({
    mutationFn: async (goalId: string) => {
      const res = await fetch(`/api/goals/${goalId}/pause`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to pause goal");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      setSelectedGoal(null);
    },
  });

  const resumeGoalMutation = useMutation({
    mutationFn: async (goalId: string) => {
      const res = await fetch(`/api/goals/${goalId}/resume`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to resume goal");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      setSelectedGoal(null);
    },
  });

  const cancelGoalMutation = useMutation({
    mutationFn: async (goalId: string) => {
      const res = await fetch(`/api/goals/${goalId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED" }),
      });
      if (!res.ok) throw new Error("Failed to cancel goal");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      setSelectedGoal(null);
    },
  });

  const deleteGoalMutation = useMutation({
    mutationFn: async (goalId: string) => {
      const res = await fetch(`/api/goals/${goalId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete goal");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      setSelectedGoal(null);
    },
  });

  const joinChallengeMutation = useMutation({
    mutationFn: async (challengeId: string) => {
      const res = await fetch(`/api/challenges/${challengeId}/join`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to join challenge");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["challenges"] });
    },
  });

  const leaveChallengeMutation = useMutation({
    mutationFn: async (challengeId: string) => {
      const res = await fetch(`/api/challenges/${challengeId}/leave`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to leave challenge");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["challenges"] });
    },
  });

  const goals: GoalWithProgress[] = goalsData?.goals || [];
  const activeCount = goalsData?.activeCount || 0;
  const completedCount = goalsData?.completedCount || 0;
  const featuredGoal: GoalWithProgress | null = goalsData?.featuredGoal || null;

  const activeGoals = goals.filter((g) => g.status === "ACTIVE");
  const completedGoals = goals.filter((g) => g.status === "COMPLETED");
  const pausedGoals = goals.filter((g) => g.status === "PAUSED");

  return (
    <div className="space-y-8 pb-16 animate-fadeIn">
      {/* Header & High-Level Consistency Summary */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20">
              Consistency & Gamification
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white mt-1 flex items-center gap-2.5">
            <Target className="w-7 h-7 text-emerald-400" />
            Goals, Challenges & Milestones
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Track meaningful personal health targets automatically derived from your real nutrition, hydration, and activity logs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-[#0E121A] font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" />
            New Goal
          </button>
        </div>
      </div>

      {/* Main Tab Switcher */}
      <div className="flex items-center justify-between border-b border-[#232936] pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("goals")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === "goals"
                ? "bg-[#161B26] text-white border border-[#232936] shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Target className="w-4 h-4 text-emerald-400" />
            🎯 Personal Goals ({activeCount})
          </button>
          <button
            onClick={() => setActiveTab("challenges")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === "challenges"
                ? "bg-[#161B26] text-white border border-[#232936] shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Zap className="w-4 h-4 text-amber-400" />
            ⚡ Challenges
          </button>
          <button
            onClick={() => setActiveTab("achievements")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === "achievements"
                ? "bg-[#161B26] text-white border border-[#232936] shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Trophy className="w-4 h-4 text-amber-400" />
            🏆 Achievements ({achievementsData?.unlockedCount || 0})
          </button>
        </div>

        {/* Global Summary Badge */}
        <div className="hidden lg:flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5 text-slate-400">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span><strong className="text-white">{completedCount}</strong> Completed</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-400">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span><strong className="text-amber-400">{achievementsData?.totalPoints || 0}</strong> Points</span>
          </div>
        </div>
      </div>

      {/* Tab 1: Goals */}
      {activeTab === "goals" && (
        <div className="space-y-8">
          {/* Featured Goal Hero Card (If active goals exist) */}
          {featuredGoal && (
            <div className="p-6 bg-gradient-to-br from-[#161B26] via-[#121620] to-[#0E121A] border border-emerald-500/30 rounded-2xl relative overflow-hidden shadow-xl shadow-emerald-500/5">
              <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 z-10 relative">
                <div className="space-y-2 max-w-xl">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 rounded-full border border-emerald-500/30">
                      FEATURED GOAL
                    </span>
                    <span className="text-xs text-slate-400 font-medium uppercase">{featuredGoal.category}</span>
                  </div>
                  <h2 className="text-2xl font-black text-white">{featuredGoal.name}</h2>
                  {featuredGoal.description && (
                    <p className="text-xs text-slate-400">{featuredGoal.description}</p>
                  )}

                  <div className="pt-2 flex items-center gap-4 text-xs text-slate-300">
                    <span className="flex items-center gap-1">
                      <TrendingUp className="w-4 h-4 text-emerald-400" />
                      <strong>{featuredGoal.currentValue}</strong> / {featuredGoal.targetValue} {featuredGoal.unit}
                    </span>
                    <span className="flex items-center gap-1 text-slate-400">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      {featuredGoal.daysRemaining} days remaining
                    </span>
                  </div>
                </div>

                {/* Progress Ring / Gauge */}
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <div className="text-3xl font-black text-emerald-400">{featuredGoal.progressPercentage}%</div>
                    <div className="text-xs text-slate-400">
                      {featuredGoal.remainingAmount > 0
                        ? `${featuredGoal.remainingAmount} ${featuredGoal.unit} left`
                        : "Completed 🎉"}
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedGoal(featuredGoal)}
                    className="p-3 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-2xl transition-all"
                  >
                    <ArrowUpRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {CATEGORY_TABS.map((cat) => {
              const IconComp = cat.icon;
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-medium border flex items-center gap-1.5 whitespace-nowrap transition-all ${
                    isSelected
                      ? "bg-emerald-500/20 border-emerald-500 text-emerald-300 font-semibold"
                      : "bg-[#161B26] border-[#232936] text-slate-400 hover:text-white hover:border-slate-700"
                  }`}
                >
                  <IconComp className={`w-3.5 h-3.5 ${isSelected ? "text-emerald-400" : "text-slate-500"}`} />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* Active Goals Grid */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                Active Goals ({activeGoals.length})
              </h3>
            </div>

            {isLoadingGoals ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-44 bg-[#161B26] border border-[#232936] rounded-2xl" />
                ))}
              </div>
            ) : activeGoals.length === 0 ? (
              <div className="p-8 text-center bg-[#161B26]/50 border border-[#232936] rounded-2xl">
                <Target className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                <p className="text-sm text-slate-300 font-medium">No active goals in this category.</p>
                <p className="text-xs text-slate-500 mt-1">Create your first goal to begin automatic tracking!</p>
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="mt-4 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-[#0E121A] font-bold text-xs rounded-xl inline-flex items-center gap-1.5 transition-all shadow-md shadow-emerald-500/10"
                >
                  <Plus className="w-4 h-4" />
                  Create Goal
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeGoals.map((goal) => (
                  <div
                    key={goal.id}
                    onClick={() => setSelectedGoal(goal)}
                    className="p-5 bg-[#161B26] border border-[#232936] rounded-2xl hover:border-emerald-500/40 transition-all cursor-pointer group flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                          {goal.category}
                        </span>
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-500" />
                          {goal.daysRemaining}d left
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-white mt-2 group-hover:text-emerald-300 transition-colors">
                        {goal.name}
                      </h4>
                      {goal.description && (
                        <p className="text-xs text-slate-400 mt-1 line-clamp-2">{goal.description}</p>
                      )}
                    </div>

                    <div className="mt-5 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-300 font-medium">
                          {goal.currentValue} / {goal.targetValue} {goal.unit}
                        </span>
                        <span className="font-bold text-emerald-400">{goal.progressPercentage}%</span>
                      </div>

                      <div className="h-2 w-full bg-[#1F2633] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, goal.progressPercentage)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Completed Goals History */}
          {completedGoals.length > 0 && (
            <div className="space-y-4 pt-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Completed Goals ({completedGoals.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {completedGoals.map((goal) => (
                  <div
                    key={goal.id}
                    onClick={() => setSelectedGoal(goal)}
                    className="p-4 bg-[#121620] border border-emerald-500/30 rounded-2xl hover:border-emerald-500 transition-all cursor-pointer flex items-center justify-between"
                  >
                    <div>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400">
                        {goal.category}
                      </span>
                      <h4 className="text-xs font-bold text-white mt-0.5">{goal.name}</h4>
                      <p className="text-[11px] text-slate-400">
                        {goal.targetValue} {goal.unit} achieved
                      </p>
                    </div>
                    <div className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-xs font-semibold text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      100%
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Paused Goals */}
          {pausedGoals.length > 0 && (
            <div className="space-y-4 pt-2">
              <h3 className="text-sm font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                Paused Goals ({pausedGoals.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pausedGoals.map((goal) => (
                  <div
                    key={goal.id}
                    onClick={() => setSelectedGoal(goal)}
                    className="p-4 bg-[#121620] border border-amber-500/20 rounded-2xl hover:border-amber-500/40 transition-all cursor-pointer flex items-center justify-between"
                  >
                    <div>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-400">
                        {goal.category}
                      </span>
                      <h4 className="text-xs font-bold text-white mt-0.5">{goal.name}</h4>
                      <p className="text-[11px] text-slate-400">
                        {goal.currentValue} / {goal.targetValue} {goal.unit} (Paused)
                      </p>
                    </div>
                    <span className="text-xs font-bold text-amber-400">{goal.progressPercentage}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Challenges */}
      {activeTab === "challenges" && (
        <ChallengesView
          challenges={challengesData?.challenges || []}
          isLoading={isLoadingChallenges}
          onJoin={async (id) => {
            await joinChallengeMutation.mutateAsync(id);
          }}
          onLeave={async (id) => {
            await leaveChallengeMutation.mutateAsync(id);
          }}
        />
      )}

      {/* Tab 3: Achievements */}
      {activeTab === "achievements" && (
        <AchievementsView
          achievements={achievementsData?.achievements || []}
          unlockedCount={achievementsData?.unlockedCount || 0}
          totalPoints={achievementsData?.totalPoints || 0}
          isLoading={isLoadingAchievements}
        />
      )}

      {/* Create Goal Modal */}
      <CreateGoalModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={async (data) => {
          await createGoalMutation.mutateAsync(data);
        }}
      />

      {/* Goal Detail Modal */}
      <GoalDetailModal
        goal={selectedGoal}
        isOpen={Boolean(selectedGoal)}
        onClose={() => setSelectedGoal(null)}
        onPause={async (id) => {
          await pauseGoalMutation.mutateAsync(id);
        }}
        onResume={async (id) => {
          await resumeGoalMutation.mutateAsync(id);
        }}
        onCancel={async (id) => {
          await cancelGoalMutation.mutateAsync(id);
        }}
        onDelete={async (id) => {
          await deleteGoalMutation.mutateAsync(id);
        }}
      />
    </div>
  );
}
