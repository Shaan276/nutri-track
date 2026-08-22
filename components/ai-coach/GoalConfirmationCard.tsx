"use client";

import React, { useState } from "react";
import { CheckCircle2, XCircle, Sparkles, ArrowRight, Loader2 } from "lucide-react";

export interface GoalConfirmationCardProps {
  proposal: {
    targetKey: string;
    targetLabel: string;
    currentValue: number;
    proposedValue: number;
    unit: string;
    reason: string;
  };
  onConfirmed?: () => void;
}

export function GoalConfirmationCard({ proposal, onConfirmed }: GoalConfirmationCardProps) {
  const [status, setStatus] = useState<"IDLE" | "SAVING" | "CONFIRMED" | "DISMISSED">("IDLE");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleConfirm = async () => {
    try {
      setStatus("SAVING");
      setErrorMessage(null);

      const res = await fetch("/api/ai/goals/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetKey: proposal.targetKey,
          newValue: proposal.proposedValue,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to update target");
      }

      setStatus("CONFIRMED");
      if (onConfirmed) onConfirmed();
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to save goal");
      setStatus("IDLE");
    }
  };

  if (status === "DISMISSED") {
    return (
      <div className="my-3 p-3 rounded-lg border border-neutral-800 bg-neutral-950/60 text-xs text-neutral-500 italic">
        Target proposal dismissed. Your {proposal.targetLabel} remains at {proposal.currentValue}
        {proposal.unit}.
      </div>
    );
  }

  if (status === "CONFIRMED") {
    return (
      <div className="my-3 p-4 rounded-xl border border-emerald-500/30 bg-emerald-950/20 text-emerald-300">
        <div className="flex items-center gap-2 font-medium text-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          Target Updated Successfully!
        </div>
        <p className="text-xs text-emerald-200/80 mt-1">
          {proposal.targetLabel} set to <strong>{proposal.proposedValue}{proposal.unit}</strong>. All dashboard metrics & reports will dynamically use this new target.
        </p>
      </div>
    );
  }

  return (
    <div className="my-3 p-4 rounded-xl border border-emerald-500/30 bg-neutral-900/90 shadow-lg backdrop-blur-sm">
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
          className="flex-1 py-2 px-3 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
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
          className="py-2 px-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs rounded-lg transition-colors flex items-center justify-center gap-1"
        >
          <XCircle className="w-3.5 h-3.5" />
          Dismiss
        </button>
      </div>
    </div>
  );
}
