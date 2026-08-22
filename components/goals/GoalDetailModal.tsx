"use client";
import React, { useState } from "react";
import {
  X,
  Target,
  Calendar,
  Clock,
  CheckCircle2,
  PauseCircle,
  PlayCircle,
  Trash2,
  XCircle,
  Award,
  Sparkles,
} from "lucide-react";
import { GoalWithProgress } from "@/lib/services/goal.service";

interface GoalDetailModalProps {
  goal: GoalWithProgress | null;
  isOpen: boolean;
  onClose: () => void;
  onPause: (id: string) => Promise<void>;
  onResume: (id: string) => Promise<void>;
  onCancel: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const MILESTONES = [25, 50, 75, 90, 100];

export function GoalDetailModal({
  goal,
  isOpen,
  onClose,
  onPause,
  onResume,
  onCancel,
  onDelete,
}: GoalDetailModalProps) {
  const [actionLoading, setActionLoading] = useState(false);

  if (!isOpen || !goal) return null;

  const handleAction = async (fn: () => Promise<void>) => {
    try {
      setActionLoading(true);
      await fn();
    } finally {
      setActionLoading(false);
    }
  };

  const reachedPercentages = new Set(goal.milestones.map((m) => m.percentage));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#121620] border border-[#232936] rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Goal Header */}
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 flex-shrink-0">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                {goal.category}
              </span>
              <span
                className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                  goal.status === "COMPLETED"
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                    : goal.status === "PAUSED"
                    ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                    : goal.status === "CANCELLED"
                    ? "bg-rose-500/20 text-rose-300 border-rose-500/30"
                    : "bg-blue-500/20 text-blue-300 border-blue-500/30"
                }`}
              >
                {goal.status}
              </span>
            </div>
            <h2 className="text-xl font-bold text-white mt-1.5">{goal.name}</h2>
            {goal.description && <p className="text-xs text-slate-400 mt-1">{goal.description}</p>}
          </div>
        </div>

        {/* Big Progress Card */}
        <div className="mt-6 p-5 bg-[#161B26] border border-[#232936] rounded-2xl">
          <div className="flex items-baseline justify-between">
            <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Current Progress</span>
            <span className="text-2xl font-black text-emerald-400">{goal.progressPercentage}%</span>
          </div>

          <div className="mt-2 text-3xl font-extrabold text-white flex items-baseline gap-2">
            <span>{goal.currentValue}</span>
            <span className="text-lg text-slate-400 font-normal">
              / {goal.targetValue} {goal.unit}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="h-3 w-full bg-[#1F2633] rounded-full overflow-hidden mt-3">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                goal.status === "COMPLETED"
                  ? "bg-emerald-400"
                  : "bg-gradient-to-r from-emerald-500 to-teal-400"
              }`}
              style={{ width: `${Math.min(100, goal.progressPercentage)}%` }}
            />
          </div>

          <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
            <span>
              {goal.remainingAmount > 0 ? `${goal.remainingAmount} ${goal.unit} remaining` : "Goal Achieved! 🎉"}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              {goal.daysRemaining} days left
            </span>
          </div>
        </div>

        {/* Date Details */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="p-3 bg-[#161B26]/60 border border-[#232936] rounded-xl flex items-center gap-2.5 text-xs text-slate-300">
            <Calendar className="w-4 h-4 text-slate-500" />
            <div>
              <div className="text-[10px] text-slate-500 font-medium uppercase">Start Date</div>
              <div className="font-semibold text-white">{goal.startDate}</div>
            </div>
          </div>
          <div className="p-3 bg-[#161B26]/60 border border-[#232936] rounded-xl flex items-center gap-2.5 text-xs text-slate-300">
            <Calendar className="w-4 h-4 text-slate-500" />
            <div>
              <div className="text-[10px] text-slate-500 font-medium uppercase">Target Date</div>
              <div className="font-semibold text-white">{goal.targetDate}</div>
            </div>
          </div>
        </div>

        {/* Milestone Progression */}
        <div className="mt-6">
          <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Award className="w-4 h-4 text-amber-400" />
            Milestones (Automatic Recognition)
          </h3>
          <div className="grid grid-cols-5 gap-2">
            {MILESTONES.map((pct) => {
              const isReached = reachedPercentages.has(pct);
              return (
                <div
                  key={pct}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    isReached
                      ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300"
                      : "bg-[#161B26] border-[#232936] text-slate-500"
                  }`}
                >
                  <div className="flex justify-center mb-1">
                    {isReached ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5 text-slate-600" />
                    )}
                  </div>
                  <div className="text-xs font-bold">{pct}%</div>
                  <div className="text-[9px] mt-0.5 opacity-80">{isReached ? "Reached" : "Locked"}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions Footer */}
        <div className="mt-8 pt-4 border-t border-[#232936] flex items-center justify-between gap-3">
          <button
            onClick={() => handleAction(() => onDelete(goal.id))}
            disabled={actionLoading}
            className="px-3.5 py-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Delete Goal
          </button>

          <div className="flex items-center gap-2">
            {goal.status === "ACTIVE" && (
              <button
                onClick={() => handleAction(() => onPause(goal.id))}
                disabled={actionLoading}
                className="px-4 py-2 bg-[#161B26] hover:bg-[#1E2433] text-amber-400 border border-amber-500/30 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <PauseCircle className="w-4 h-4" />
                Pause
              </button>
            )}

            {goal.status === "PAUSED" && (
              <button
                onClick={() => handleAction(() => onResume(goal.id))}
                disabled={actionLoading}
                className="px-4 py-2 bg-[#161B26] hover:bg-[#1E2433] text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <PlayCircle className="w-4 h-4" />
                Resume
              </button>
            )}

            {goal.status !== "CANCELLED" && goal.status !== "COMPLETED" && (
              <button
                onClick={() => handleAction(() => onCancel(goal.id))}
                disabled={actionLoading}
                className="px-4 py-2 bg-[#161B26] hover:bg-[#1E2433] text-slate-400 border border-[#232936] rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <XCircle className="w-4 h-4" />
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
