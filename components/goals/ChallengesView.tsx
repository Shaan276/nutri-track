"use client";
import React from "react";
import {
  Zap,
  CheckCircle2,
  Users,
  Clock,
  Droplets,
  Utensils,
  Footprints,
  Dumbbell,
  Sparkles,
  ArrowRight,
  LogOut,
} from "lucide-react";
import { ChallengeItemDto } from "@/lib/services/challenge.service";

interface ChallengesViewProps {
  challenges: ChallengeItemDto[];
  isLoading: boolean;
  onJoin: (challengeId: string) => Promise<void>;
  onLeave: (challengeId: string) => Promise<void>;
}

const ICON_MAP: Record<string, any> = {
  Droplets,
  Utensils,
  Footprints,
  Dumbbell,
  Zap,
  Sparkles,
};

export function ChallengesView({
  challenges,
  isLoading,
  onJoin,
  onLeave,
}: ChallengesViewProps) {
  const [loadingId, setLoadingId] = React.useState<string | null>(null);

  const handleJoin = async (id: string) => {
    try {
      setLoadingId(id);
      await onJoin(id);
    } finally {
      setLoadingId(null);
    }
  };

  const handleLeave = async (id: string) => {
    try {
      setLoadingId(id);
      await onLeave(id);
    } finally {
      setLoadingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-48 bg-[#161B26] border border-[#232936] rounded-2xl" />
        ))}
      </div>
    );
  }

  const activeJoined = challenges.filter((c) => c.isJoined && c.status !== "COMPLETED");
  const completed = challenges.filter((c) => c.status === "COMPLETED");
  const available = challenges.filter((c) => !c.isJoined && c.status !== "COMPLETED");

  return (
    <div className="space-y-8">
      {/* Active Joined Challenges */}
      {activeJoined.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-base font-semibold text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-400" />
            Your In-Progress Challenges ({activeJoined.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeJoined.map((ch) => {
              const IconComp = ICON_MAP[ch.badgeIcon] || Zap;
              const isSubmitting = loadingId === ch.id;
              return (
                <div
                  key={ch.id}
                  className="p-5 bg-gradient-to-br from-[#161B26] to-[#0E121A] border border-amber-500/30 rounded-2xl relative overflow-hidden transition-all shadow-lg shadow-amber-500/5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                        <IconComp className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                            {ch.category}
                          </span>
                          <span className="text-xs text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {ch.durationDays} Days
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-white mt-1">{ch.title}</h4>
                      </div>
                    </div>

                    <button
                      onClick={() => handleLeave(ch.id)}
                      disabled={isSubmitting}
                      className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors text-xs flex items-center gap-1"
                      title="Leave challenge"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <p className="text-xs text-slate-400 mt-3">{ch.description}</p>

                  {/* Progress Bar */}
                  <div className="mt-4 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-300 font-medium">
                        {ch.currentProgress} / {ch.targetValue} {ch.unit}
                      </span>
                      <span className="font-bold text-amber-400">{ch.progressPercentage}%</span>
                    </div>
                    <div className="h-2 w-full bg-[#1F2633] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, ch.progressPercentage)}%` }}
                      />
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#232936] flex items-center justify-between text-xs text-slate-400">
                    <span className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                      <Users className="w-3.5 h-3.5" />
                      {ch.participantCount} participants
                    </span>
                    <span className="text-emerald-400 font-medium text-[11px]">Active Tracking</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Completed Challenges */}
      {completed.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-base font-semibold text-emerald-400 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" />
            Completed Challenges ({completed.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {completed.map((ch) => {
              const IconComp = ICON_MAP[ch.badgeIcon] || Zap;
              return (
                <div
                  key={ch.id}
                  className="p-5 bg-[#121620] border border-emerald-500/30 rounded-2xl relative overflow-hidden"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                        <IconComp className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">{ch.title}</h4>
                        <p className="text-xs text-slate-400 mt-0.5">{ch.description}</p>
                      </div>
                    </div>
                    <div className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-xs font-semibold text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Completed
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Available Challenges to Join */}
      <div className="space-y-4">
        <h3 className="text-base font-semibold text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-400" />
          Available Challenges ({available.length})
        </h3>

        {available.length === 0 ? (
          <div className="p-8 text-center bg-[#161B26]/50 border border-[#232936] rounded-2xl">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
            <p className="text-sm text-slate-300 font-medium">You have joined all available challenges!</p>
            <p className="text-xs text-slate-500 mt-1">Keep logging your health progress to crush them.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {available.map((ch) => {
              const IconComp = ICON_MAP[ch.badgeIcon] || Zap;
              const isSubmitting = loadingId === ch.id;
              return (
                <div
                  key={ch.id}
                  className="p-5 bg-[#161B26] border border-[#232936] rounded-2xl hover:border-slate-700 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                        <IconComp className="w-6 h-6" />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-full border border-slate-700">
                          {ch.category}
                        </span>
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {ch.durationDays} Days
                        </span>
                      </div>
                    </div>

                    <div className="mt-3">
                      <h4 className="text-sm font-bold text-white">{ch.title}</h4>
                      <p className="text-xs text-slate-400 mt-1">{ch.description}</p>
                    </div>
                  </div>

                  <div className="mt-5 pt-4 border-t border-[#232936] flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-slate-500 text-xs">
                      <Users className="w-3.5 h-3.5" />
                      {ch.participantCount} active
                    </span>

                    <button
                      onClick={() => handleJoin(ch.id)}
                      disabled={isSubmitting}
                      className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs rounded-xl transition-colors flex items-center gap-1.5 shadow-lg shadow-indigo-600/20 disabled:opacity-50"
                    >
                      {isSubmitting ? "Joining..." : "Join Challenge"}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
