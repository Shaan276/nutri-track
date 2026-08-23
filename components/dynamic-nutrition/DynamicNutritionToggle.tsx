"use client";

import React, { useState, useEffect } from "react";
import { Zap, Sparkles, Loader2, Info } from "lucide-react";

interface DynamicNutritionToggleProps {
  className?: string;
  onToggleChange?: (enabled: boolean) => void;
}

export function DynamicNutritionToggle({ className = "", onToggleChange }: DynamicNutritionToggleProps) {
  const [isEnabled, setIsEnabled] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [showTooltip, setShowTooltip] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    async function fetchStatus() {
      try {
        const res = await fetch("/api/nutrition/dynamic");
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setIsEnabled(data.isDynamicEnabled);
          }
        }
      } catch (err) {
        console.error("Failed to load dynamic nutrition state:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    fetchStatus();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleToggle = async () => {
    if (isUpdating) return;
    const nextState = !isEnabled;
    setIsEnabled(nextState);
    setIsUpdating(true);

    try {
      const res = await fetch("/api/nutrition/dynamic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: nextState }),
      });

      if (res.ok) {
        const data = await res.json();
        onToggleChange?.(data.isDynamicEnabled);
        // Dispatch global event for other widgets to refresh
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("dynamic-nutrition-toggled", { detail: { enabled: nextState } }));
        }
      } else {
        // Rollback on error
        setIsEnabled(!nextState);
      }
    } catch (err) {
      console.error("Failed to toggle dynamic nutrition:", err);
      setIsEnabled(!nextState);
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-background-elevated border border-border-subtle text-xs text-foreground-muted animate-pulse ${className}`}>
        <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-400" />
        <span className="hidden sm:inline">Dynamic Nutrition</span>
      </div>
    );
  }

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <button
        type="button"
        onClick={handleToggle}
        disabled={isUpdating}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className={`group flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all duration-200 cursor-pointer select-none ${
          isEnabled
            ? "bg-emerald-950/60 border-emerald-700/60 text-emerald-300 shadow-md shadow-emerald-950/40 hover:bg-emerald-900/60 hover:border-emerald-500"
            : "bg-background-elevated border-border-subtle text-foreground-muted hover:text-foreground-secondary hover:border-border-default"
        }`}
        title="Toggle Dynamic Nutrition Auto-Optimization"
      >
        <div className="relative">
          <Zap
            className={`w-3.5 h-3.5 transition-transform group-hover:scale-110 ${
              isEnabled ? "text-emerald-400 fill-emerald-400" : "text-neutral-500"
            }`}
          />
          {isEnabled && (
            <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping opacity-75" />
          )}
        </div>

        <span className="hidden sm:inline">Dynamic Nutrition:</span>
        <span
          className={`font-bold uppercase tracking-wider text-[11px] px-1.5 py-0.5 rounded-md transition-colors ${
            isEnabled ? "bg-emerald-500/20 text-emerald-300" : "bg-neutral-800 text-neutral-400"
          }`}
        >
          {isUpdating ? "..." : isEnabled ? "ON" : "OFF"}
        </span>
      </button>

      {/* Hover Info Tooltip */}
      {showTooltip && (
        <div className="absolute right-0 top-full mt-2 w-72 p-3 rounded-xl bg-neutral-900 border border-neutral-700 shadow-2xl text-[11px] text-neutral-300 z-50 pointer-events-none space-y-1.5 backdrop-blur-md">
          <div className="font-bold text-white flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            {isEnabled ? "Dynamic Nutrition Active ⚡" : "Static Profile Targets 🔒"}
          </div>
          <p className="text-neutral-400 leading-relaxed">
            {isEnabled
              ? "Every new day, AI checks yesterday's runs, lifting volume, and intake to automatically optimize today's protein, carbs, and hydration for your goals."
              : "Targets are fixed at your profile baseline. Turn ON to let AI auto-adjust targets daily from yesterday's activity!"}
          </p>
        </div>
      )}
    </div>
  );
}
