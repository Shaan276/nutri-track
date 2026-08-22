"use client";

import React, { useState, useEffect } from "react";
import {
  Trophy,
  Plus,
  Trash2,
  Users,
  CheckCircle2,
  Calendar,
  Flame,
  Droplets,
  Utensils,
  Dumbbell,
  Footprints,
  Sparkles,
  Shield,
  Loader2,
  AlertCircle,
  Clock,
  Layers,
} from "lucide-react";

interface AdminChallenge {
  id: string;
  code: string;
  title: string;
  description: string;
  category: string;
  targetValue: number;
  unit: string;
  durationDays: number;
  badgeIcon: string;
  isSystem: boolean;
  isPublic: boolean;
  participantsCount: number;
  completionsCount: number;
  createdAt: string;
}

const BADGE_ICONS = [
  { name: "Trophy", icon: Trophy, label: "Trophy" },
  { name: "Flame", icon: Flame, label: "Flame" },
  { name: "Droplets", icon: Droplets, label: "Droplets" },
  { name: "Utensils", icon: Utensils, label: "Utensils" },
  { name: "Dumbbell", icon: Dumbbell, label: "Dumbbell" },
  { name: "Footprints", icon: Footprints, label: "Footprints" },
  { name: "Sparkles", icon: Sparkles, label: "Sparkles" },
  { name: "Shield", icon: Shield, label: "Shield" },
];

const CATEGORIES = [
  { value: "NUTRITION", label: "🥗 Nutrition & Diet" },
  { value: "HYDRATION", label: "💧 Hydration" },
  { value: "RUNNING", label: "🏃 Running & Cardio" },
  { value: "WORKOUTS", label: "🏋️ Strength & Workouts" },
  { value: "ACTIVITIES", label: "⚡ Steps & Daily Activity" },
  { value: "CONSISTENCY", label: "🔥 General Consistency" },
];

export default function AdminChallengesPage() {
  const [challenges, setChallenges] = useState<AdminChallenge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("NUTRITION");
  const [targetValue, setTargetValue] = useState("30");
  const [unit, setUnit] = useState("days");
  const [durationDays, setDurationDays] = useState("30");
  const [badgeIcon, setBadgeIcon] = useState("Trophy");

  const loadChallenges = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/admin/challenges");
      if (!res.ok) throw new Error("Failed to load challenges");
      const data = await res.json();
      setChallenges(data.challenges || []);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to load challenges");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadChallenges();
  }, []);

  const handleCreateChallenge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      const res = await fetch("/api/admin/challenges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          category,
          targetValue: parseFloat(targetValue),
          unit,
          durationDays: parseInt(durationDays, 10),
          badgeIcon,
          isPublic: true,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create challenge");
      }

      setSuccessMessage("🏆 New Challenge created and published successfully!");
      setShowCreateModal(false);
      setTitle("");
      setDescription("");
      loadChallenges();
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to create challenge");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteChallenge = async (id: string, challengeTitle: string) => {
    if (!confirm(`Are you sure you want to delete the challenge "${challengeTitle}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/challenges/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete challenge");
      }

      setChallenges((prev) => prev.filter((c) => c.id !== id));
      setSuccessMessage("Challenge removed successfully.");
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to delete challenge");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#161B22] p-6 rounded-2xl border border-[#21262D]">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Challenges & Badges Hub</h1>
            <p className="text-xs text-slate-400">
              Create and manage fitness, nutrition, and community challenges that users can join
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Challenge</span>
        </button>
      </div>

      {/* Alerts */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Challenges Grid */}
      {isLoading ? (
        <div className="p-12 flex flex-col items-center justify-center gap-3 text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
          <span className="text-xs">Loading challenges...</span>
        </div>
      ) : challenges.length === 0 ? (
        <div className="p-12 rounded-2xl bg-[#161B22] border border-[#21262D] text-center space-y-3">
          <Trophy className="w-10 h-10 text-slate-600 mx-auto" />
          <p className="text-sm font-bold text-white">No challenges created yet</p>
          <p className="text-xs text-slate-400">Click &quot;Create New Challenge&quot; to publish your first challenge.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {challenges.map((ch) => (
            <div
              key={ch.id}
              className="p-5 rounded-2xl bg-[#161B22] border border-[#21262D] hover:border-[#30363D] transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-bold uppercase tracking-wider">
                      {ch.category}
                    </span>
                    {ch.isSystem && (
                      <span className="px-2 py-0.5 rounded-md bg-slate-700/40 text-slate-400 text-[10px] font-bold">
                        SYSTEM
                      </span>
                    )}
                  </div>

                  {!ch.isSystem && (
                    <button
                      onClick={() => handleDeleteChallenge(ch.id, ch.title)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Delete Challenge"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div>
                  <h3 className="text-sm font-bold text-white">{ch.title}</h3>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">{ch.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#21262D] text-center">
                  <div className="p-2 rounded-xl bg-[#0D1117]">
                    <span className="text-[10px] uppercase font-bold text-slate-500">Goal Target</span>
                    <p className="text-xs font-bold text-amber-400">
                      {ch.targetValue} {ch.unit}
                    </p>
                  </div>
                  <div className="p-2 rounded-xl bg-[#0D1117]">
                    <span className="text-[10px] uppercase font-bold text-slate-500">Duration</span>
                    <p className="text-xs font-bold text-blue-400">{ch.durationDays} Days</p>
                  </div>
                </div>
              </div>

              {/* Footer / Stats */}
              <div className="flex items-center justify-between pt-2 border-t border-[#21262D] text-[11px] text-slate-400">
                <div className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{ch.participantsCount} Joined</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>{ch.completionsCount} Completed</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE CHALLENGE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in text-left">
          <div className="w-full max-w-lg bg-[#0D1117] border border-[#21262D] rounded-3xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-[#21262D] pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                  <Trophy className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Create New Challenge</h2>
                  <p className="text-[11px] text-slate-400">Publish a fitness or nutrition goal for all users</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateChallenge} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-300">Challenge Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. 100g Daily Protein Challenge, 10K Steps Daily"
                  className="w-full px-3 py-2 rounded-xl bg-[#161B22] border border-[#21262D] text-white focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-300">Description</label>
                <textarea
                  required
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Explain the rules and target for users to complete this challenge..."
                  className="w-full px-3 py-2 rounded-xl bg-[#161B22] border border-[#21262D] text-white focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-300">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#161B22] border border-[#21262D] text-white focus:border-amber-500 focus:outline-none"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-300">Duration (Days)</label>
                  <input
                    type="number"
                    min="1"
                    max="365"
                    required
                    value={durationDays}
                    onChange={(e) => setDurationDays(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#161B22] border border-[#21262D] text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-300">Target Value</label>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    required
                    value={targetValue}
                    onChange={(e) => setTargetValue(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#161B22] border border-[#21262D] text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-300">Unit</label>
                  <input
                    type="text"
                    required
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder="days, km, workouts, ml"
                    className="w-full px-3 py-2 rounded-xl bg-[#161B22] border border-[#21262D] text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Badge Icon Picker */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-300">Reward Badge Icon</label>
                <div className="grid grid-cols-4 gap-2">
                  {BADGE_ICONS.map((b) => {
                    const IconComp = b.icon;
                    return (
                      <button
                        key={b.name}
                        type="button"
                        onClick={() => setBadgeIcon(b.name)}
                        className={`p-2 rounded-xl border flex items-center justify-center gap-1.5 transition-all ${
                          badgeIcon === b.name
                            ? "bg-amber-500/20 border-amber-500 text-amber-300 font-bold"
                            : "bg-[#161B22] border-[#21262D] text-slate-400 hover:text-white"
                        }`}
                      >
                        <IconComp className="w-4 h-4" />
                        <span className="text-[10px]">{b.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-[#161B22] text-slate-300 font-bold hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? "Publishing..." : "Publish Challenge"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
