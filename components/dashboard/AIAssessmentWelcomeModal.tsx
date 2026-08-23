"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Bot, ArrowRight, X, CheckCircle2, Flame, Activity } from "lucide-react";

export interface AIAssessmentWelcomeModalProps {
  initialStatus?: string | null;
}

export function AIAssessmentWelcomeModal({
  initialStatus = "NOT_STARTED",
}: AIAssessmentWelcomeModalProps) {
  const router = useRouter();
  const [status, setStatus] = useState<string>(initialStatus || "NOT_STARTED");
  const [isOpen, setIsOpen] = useState<boolean>(initialStatus === "NOT_STARTED");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleStartAssessment = async () => {
    try {
      setIsLoading(true);
      await fetch("/api/ai/assessment/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "IN_PROGRESS" }),
      });
      setStatus("IN_PROGRESS");
      setIsOpen(false);
      router.push("/ai-coach?mode=assessment");
    } catch (err) {
      console.error("Failed to update assessment status:", err);
      router.push("/ai-coach?mode=assessment");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDismissForNow = async () => {
    try {
      setIsLoading(true);
      await fetch("/api/ai/assessment/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "DISMISSED_FOR_NOW" }),
      });
      setStatus("DISMISSED_FOR_NOW");
      setIsOpen(false);
    } catch (err) {
      console.error("Failed to dismiss assessment:", err);
      setIsOpen(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* 1. Lightweight First-Login Modal (Only pops up on NOT_STARTED) */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg bg-neutral-900 border border-emerald-500/30 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5 text-left">
            {/* Close button */}
            <button
              onClick={handleDismissForNow}
              className="absolute top-5 right-5 p-1.5 text-neutral-400 hover:text-white rounded-full hover:bg-neutral-800 transition-colors cursor-pointer"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              AI Health Intelligence
            </div>

            {/* Greeting & Title */}
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
                <span>Welcome to Nutri-Track</span>
                <span className="text-2xl">👋</span>
              </h2>
              <p className="text-sm text-neutral-300 mt-2 leading-relaxed font-medium">
                Your AI Health Coach can analyze your nutrition, activity, hydration, workouts, and metabolic data to help personalize your daily targets.
              </p>
            </div>

            {/* Quick Benefits Bullet Points */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 py-1">
              <div className="flex items-center gap-2 bg-neutral-950/70 border border-neutral-800/80 rounded-xl p-2.5 text-xs text-neutral-300">
                <Flame className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Custom Calories & Macros</span>
              </div>
              <div className="flex items-center gap-2 bg-neutral-950/70 border border-neutral-800/80 rounded-xl p-2.5 text-xs text-neutral-300">
                <Activity className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Activity & Running Sync</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                onClick={handleStartAssessment}
                disabled={isLoading}
                className="w-full sm:flex-1 py-3 px-5 bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-black font-extrabold text-xs sm:text-sm rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <span>Start AI Health Assessment</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={handleDismissForNow}
                disabled={isLoading}
                className="w-full sm:w-auto py-3 px-4 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-semibold text-xs sm:text-sm rounded-xl border border-neutral-700 transition-colors cursor-pointer"
              >
                I&apos;ll do it later
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Subtle, Non-Intrusive Resume Banner on Dashboard (When Incomplete or Dismissed) */}
      {(status === "DISMISSED_FOR_NOW" || status === "IN_PROGRESS") && !isOpen && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-neutral-900/80 border border-emerald-500/20 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
              <Bot className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-bold text-white">
                {status === "IN_PROGRESS"
                  ? "AI Health Assessment In Progress"
                  : "Personalize your nutrition with AI Health Assessment"}
              </p>
              <p className="text-[11px] sm:text-xs text-neutral-400">
                Let your AI Coach analyze your data and propose custom calorie, protein, and hydration targets.
              </p>
            </div>
          </div>

          <button
            onClick={handleStartAssessment}
            className="inline-flex items-center justify-center gap-1.5 py-2 px-3.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 text-xs font-bold rounded-xl transition-colors shrink-0 cursor-pointer"
          >
            <span>{status === "IN_PROGRESS" ? "Resume Assessment" : "Start Assessment"}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </>
  );
}
