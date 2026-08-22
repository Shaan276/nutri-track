"use client";

import React, { useState } from "react";
import { Info, X, Sparkles, Check } from "lucide-react";
import {
  RunningType,
  runningTypeDescriptions,
  runningTypeDisplayNames,
  runningTypeBadges,
} from "@/lib/validations/activity";

interface RunningTypeTooltipProps {
  selectedType?: RunningType | null;
  onSelect?: (type: RunningType) => void;
  showSelector?: boolean;
}

export function RunningTypeTooltip({
  selectedType,
  onSelect,
  showSelector = false,
}: RunningTypeTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);

  const types: RunningType[] = [
    "EASY",
    "LONG",
    "TEMPO",
    "RECOVERY",
    "INTERVAL",
    "RACE",
    "OTHER",
  ];

  return (
    <div className="relative inline-flex items-center">
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 font-bold transition-colors focus:outline-none cursor-pointer"
        aria-label="Running types explanation"
      >
        <Info className="h-4 w-4 text-amber-400" />
        <span className="underline decoration-dotted underline-offset-2">Running Types Guide</span>
      </button>

      {/* Centered Modal Dialog (No clipping / No absolute overflow) */}
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 animate-fade-in">
          {/* Backdrop */}
          <div
            className="fixed inset-0"
            onClick={() => setIsOpen(false)}
          />

          <div className="relative w-full max-w-md bg-background-surface border border-border-default rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 text-left z-10 max-h-[85vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border-subtle pb-3.5 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-foreground-primary uppercase tracking-wider">
                    Running Session Types
                  </h4>
                  <p className="text-xs text-foreground-muted font-medium">
                    Training intensity &amp; aerobic targets
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-xl text-foreground-muted hover:text-foreground-primary hover:bg-background-elevated transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* List of running types */}
            <div className="space-y-2.5 overflow-y-auto pr-1 flex-1">
              {types.map((type) => {
                const badge = runningTypeBadges[type];
                const isSelected = selectedType === type;

                return (
                  <div
                    key={type}
                    onClick={() => {
                      if (onSelect && showSelector) {
                        onSelect(type);
                        setIsOpen(false);
                      }
                    }}
                    className={`p-3 rounded-2xl border transition-all text-xs space-y-1.5 ${
                      isSelected
                        ? "border-amber-400 bg-amber-500/15"
                        : "border-border-subtle bg-background-elevated/70 hover:border-border-default hover:bg-background-elevated"
                    } ${showSelector ? "cursor-pointer" : ""}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-foreground-primary text-sm">
                          {runningTypeDisplayNames[type]}
                        </span>
                        {isSelected && (
                          <span className="p-0.5 rounded-full bg-amber-500 text-black">
                            <Check className="h-3 w-3 stroke-[3]" />
                          </span>
                        )}
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${badge.color}`}>
                        {badge.label}
                      </span>
                    </div>
                    <p className="text-xs text-foreground-secondary leading-relaxed font-medium">
                      {runningTypeDescriptions[type]}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="pt-3 border-t border-border-subtle flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="py-2 px-4 rounded-xl bg-background-elevated hover:bg-background-elevated/80 text-foreground-primary text-xs font-extrabold transition-colors cursor-pointer"
              >
                Close Guide
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RunningTypeTooltip;
