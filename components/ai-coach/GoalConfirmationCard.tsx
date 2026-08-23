"use client";

import React, { useState } from "react";
import { CheckCircle2, XCircle, Sparkles, ArrowRight, Loader2, Flame, Droplets, Footprints, Target, Edit3 } from "lucide-react";

export interface GoalProposalData {
  isProposal?: boolean;
  isPackage?: boolean;
  targetKey?: string;
  targetLabel?: string;
  currentValue?: number;
  proposedValue?: number;
  unit?: string;
  reason?: string;
  package?: {
    calories?: number;
    protein?: number;
    carbohydrates?: number;
    fat?: number;
    fiber?: number;
    dailyHydrationTargetMl?: number;
    dailyStepTarget?: number;
    primaryGoal?: string;
    reason?: string;
  };
}

export interface GoalConfirmationCardProps {
  proposal: GoalProposalData;
  onConfirmed?: () => void;
  onModify?: (text: string) => void;
}

export function GoalConfirmationCard({ proposal, onConfirmed, onModify }: GoalConfirmationCardProps) {
  const [status, setStatus] = useState<"IDLE" | "SAVING" | "CONFIRMED" | "DISMISSED">("IDLE");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isPackage = Boolean(proposal.isPackage || proposal.package);
  const pkg = proposal.package;

  const handleConfirm = async () => {
    try {
      setStatus("SAVING");
      setErrorMessage(null);

      const payload = isPackage
        ? { goalsPackage: pkg }
        : { targetKey: proposal.targetKey, newValue: proposal.proposedValue };

      const res = await fetch("/api/ai/goals/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to update target");
      }

      setStatus("CONFIRMED");
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("nutritrack:data-updated"));
      }
      if (onConfirmed) onConfirmed();
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to save goal");
      setStatus("IDLE");
    }
  };

  if (status === "DISMISSED") {
    return (
      <div className="my-3 p-3 rounded-xl border border-neutral-800 bg-neutral-950/60 text-xs text-neutral-500 italic">
        Target proposal dismissed. Your targets remain at their previous values.
      </div>
    );
  }

  if (status === "CONFIRMED") {
    return (
      <div className="my-3 p-4 rounded-2xl border border-emerald-500/30 bg-emerald-950/30 text-emerald-300 animate-fade-in">
        <div className="flex items-center gap-2 font-bold text-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          {isPackage ? "Personalized Blueprint Applied Successfully! 🎯✨" : "Target Updated Successfully! 🎯"}
        </div>
        <p className="text-xs text-emerald-200/80 mt-1.5 leading-relaxed">
          {isPackage
            ? "Your new calories, protein, carbs, fats, hydration, and steps are now active across your dashboard, nutrition tracker, and Dynamic Nutrition."
            : `${proposal.targetLabel} set to ${proposal.proposedValue}${proposal.unit}. All metrics and reports will dynamically use this target.`}
        </p>
      </div>
    );
  }

  // Multi-target Goal Package View
  if (isPackage && pkg) {
    return (
      <div className="my-3 p-4 rounded-2xl border border-emerald-500/30 bg-neutral-900/95 shadow-xl backdrop-blur-md text-left space-y-3">
        <div className="flex items-center justify-between gap-2 border-b border-neutral-800 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              Personalized Nutrition Blueprint
            </span>
          </div>
          <span className="text-[10px] text-neutral-300 bg-neutral-800 px-2 py-0.5 rounded-full font-medium">
            Requires Approval
          </span>
        </div>

        {pkg.primaryGoal && (
          <div className="flex items-center gap-2 text-xs font-semibold text-neutral-200">
            <Target className="w-3.5 h-3.5 text-brand-400" />
            <span>Primary Focus: <strong className="text-emerald-400 capitalize">{pkg.primaryGoal.toLowerCase().replace(/_/g, " ")}</strong></span>
          </div>
        )}

        {/* Macro & Hydration Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 py-1">
          {pkg.calories !== undefined && (
            <div className="bg-neutral-950 p-2.5 rounded-xl border border-neutral-800">
              <span className="text-[10px] text-neutral-400 block font-medium">Calories</span>
              <span className="text-sm font-bold text-white flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                {pkg.calories} <span className="text-[10px] font-normal text-neutral-400">kcal</span>
              </span>
            </div>
          )}
          {pkg.protein !== undefined && (
            <div className="bg-neutral-950 p-2.5 rounded-xl border border-neutral-800">
              <span className="text-[10px] text-neutral-400 block font-medium">Protein</span>
              <span className="text-sm font-bold text-blue-400">{pkg.protein} <span className="text-[10px] font-normal text-neutral-400">g</span></span>
            </div>
          )}
          {pkg.carbohydrates !== undefined && (
            <div className="bg-neutral-950 p-2.5 rounded-xl border border-neutral-800">
              <span className="text-[10px] text-neutral-400 block font-medium">Carbohydrates</span>
              <span className="text-sm font-bold text-amber-300">{pkg.carbohydrates} <span className="text-[10px] font-normal text-neutral-400">g</span></span>
            </div>
          )}
          {pkg.fat !== undefined && (
            <div className="bg-neutral-950 p-2.5 rounded-xl border border-neutral-800">
              <span className="text-[10px] text-neutral-400 block font-medium">Fats</span>
              <span className="text-sm font-bold text-rose-300">{pkg.fat} <span className="text-[10px] font-normal text-neutral-400">g</span></span>
            </div>
          )}
          {pkg.dailyHydrationTargetMl !== undefined && (
            <div className="bg-neutral-950 p-2.5 rounded-xl border border-neutral-800">
              <span className="text-[10px] text-neutral-400 block font-medium">Daily Water</span>
              <span className="text-sm font-bold text-cyan-400 flex items-center gap-1">
                <Droplets className="w-3 h-3 text-cyan-400" />
                {pkg.dailyHydrationTargetMl} <span className="text-[10px] font-normal text-neutral-400">ml</span>
              </span>
            </div>
          )}
          {pkg.dailyStepTarget !== undefined && (
            <div className="bg-neutral-950 p-2.5 rounded-xl border border-neutral-800">
              <span className="text-[10px] text-neutral-400 block font-medium">Daily Steps</span>
              <span className="text-sm font-bold text-emerald-400 flex items-center gap-1">
                <Footprints className="w-3 h-3 text-emerald-400" />
                {pkg.dailyStepTarget.toLocaleString()}
              </span>
            </div>
          )}
        </div>

        {pkg.reason && (
          <p className="text-xs text-neutral-300 bg-neutral-950/60 p-2.5 rounded-xl border border-neutral-800/60 leading-relaxed">
            💡 <span className="italic">{pkg.reason}</span>
          </p>
        )}

        {errorMessage && (
          <div className="text-xs text-rose-400">
            {errorMessage}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button
            onClick={handleConfirm}
            disabled={status === "SAVING"}
            className="flex-1 py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20 disabled:opacity-50 cursor-pointer"
          >
            {status === "SAVING" ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Applying Targets...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                Confirm & Apply All Targets
              </>
            )}
          </button>

          {onModify && (
            <button
              onClick={() => onModify("Please adjust the proposed protein and calorie targets...")}
              disabled={status === "SAVING"}
              className="py-2.5 px-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs rounded-xl font-semibold transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              Modify
            </button>
          )}

          <button
            onClick={() => setStatus("DISMISSED")}
            disabled={status === "SAVING"}
            className="py-2.5 px-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white text-xs rounded-xl font-semibold transition-colors flex items-center gap-1 cursor-pointer"
          >
            <XCircle className="w-3.5 h-3.5" />
            Dismiss
          </button>
        </div>
      </div>
    );
  }

  // Single Target View
  return (
    <div className="my-3 p-4 rounded-2xl border border-emerald-500/30 bg-neutral-900/90 shadow-lg backdrop-blur-sm text-left">
      <div className="flex items-center justify-between gap-2 border-b border-neutral-800 pb-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-emerald-500/10 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
            Target Adjustment Proposal
          </span>
        </div>
        <span className="text-[10px] text-neutral-400 bg-neutral-800 px-2 py-0.5 rounded">
          Requires Approval
        </span>
      </div>

      <div className="text-sm font-medium text-white mb-2">
        Adjust {proposal.targetLabel}
      </div>

      <div className="flex items-center gap-3 bg-neutral-950 p-2.5 rounded-lg border border-neutral-800 mb-3">
        <div className="text-xs text-neutral-400">
          Current: <span className="font-semibold text-neutral-200">{proposal.currentValue}{proposal.unit}</span>
        </div>
        <ArrowRight className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
        <div className="text-xs text-emerald-400 font-bold">
          Proposed: {proposal.proposedValue}{proposal.unit}
        </div>
      </div>

      {proposal.reason && (
        <p className="text-xs text-neutral-300 mb-4 bg-neutral-950/40 p-2 rounded border border-neutral-800/50">
          💡 <span className="italic">{proposal.reason}</span>
        </p>
      )}

      {errorMessage && (
        <div className="text-xs text-rose-400 mb-3">
          {errorMessage}
        </div>
      )}

      <div className="flex items-center gap-2">
        <button
          onClick={handleConfirm}
          disabled={status === "SAVING"}
          className="flex-1 py-2 px-3 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer"
        >
          {status === "SAVING" ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Saving Target...
            </>
          ) : (
            <>
              <CheckCircle2 className="w-3.5 h-3.5" />
              Confirm & Save Target
            </>
          )}
        </button>

        <button
          onClick={() => setStatus("DISMISSED")}
          disabled={status === "SAVING"}
          className="py-2 px-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer"
        >
          <XCircle className="w-3.5 h-3.5" />
          Dismiss
        </button>
      </div>
    </div>
  );
}
