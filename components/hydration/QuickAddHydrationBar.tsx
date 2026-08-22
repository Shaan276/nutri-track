"use client";

import React, { useState } from "react";
import { Plus, Droplets, Loader2, Zap } from "lucide-react";
import { commonQuickAmounts } from "@/lib/validations/hydration";

interface QuickAddHydrationBarProps {
  selectedDate: string;
  onSuccess: () => void;
  onOpenCustomLog: () => void;
}

export function QuickAddHydrationBar({
  selectedDate,
  onSuccess,
  onOpenCustomLog,
}: QuickAddHydrationBarProps) {
  const [loadingAmount, setLoadingAmount] = useState<number | null>(null);

  const handleQuickAdd = async (amountMl: number) => {
    if (loadingAmount !== null) return;
    setLoadingAmount(amountMl);

    try {
      const res = await fetch("/api/hydration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: selectedDate,
          amountMl,
          beverageType: "WATER",
        }),
      });

      if (res.ok) {
        onSuccess();
      }
    } catch (err) {
      console.error("Quick add hydration error:", err);
    } finally {
      setLoadingAmount(null);
    }
  };

  return (
    <div className="w-full bg-background-surface border border-border-default rounded-3xl p-5 shadow-surface-card space-y-3 text-left">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-blue-500/15 text-blue-400">
            <Zap className="h-4 w-4 fill-blue-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground-primary">
              One-Click Quick Add
            </h3>
            <p className="text-xs text-foreground-muted">
              Instantly log water without opening a form
            </p>
          </div>
        </div>

        <button
          onClick={onOpenCustomLog}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-500/15 hover:bg-blue-500/25 text-blue-400 border border-blue-500/30 text-xs font-bold transition-colors cursor-pointer"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Custom Beverage</span>
        </button>
      </div>

      {/* Preset Amount Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-1">
        {commonQuickAmounts.map((amt) => {
          const isLoading = loadingAmount === amt;
          return (
            <button
              key={amt}
              onClick={() => handleQuickAdd(amt)}
              disabled={loadingAmount !== null}
              className="py-3 px-3 rounded-2xl bg-background-elevated/70 hover:bg-blue-500/15 text-foreground-primary hover:text-blue-400 border border-border-subtle hover:border-blue-500/40 transition-all duration-150 flex flex-col items-center justify-center space-y-1 shadow-sm disabled:opacity-50 cursor-pointer group"
            >
              <div className="flex items-center gap-1">
                {isLoading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-400" />
                ) : (
                  <Droplets className="h-3.5 w-3.5 text-blue-400 group-hover:scale-110 transition-transform" />
                )}
                <span className="text-xs font-extrabold font-mono">+{amt} ml</span>
              </div>
              <span className="text-[10px] text-foreground-muted">
                {amt === 250 ? "1 Glass" : amt === 500 ? "1 Bottle" : amt === 750 ? "Large Bottle" : "Quick Cup"}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default QuickAddHydrationBar;
