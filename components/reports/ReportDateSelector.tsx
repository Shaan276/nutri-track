"use client";

import React, { useState } from "react";
import { Calendar } from "lucide-react";
import { ReportRangePreset } from "@/lib/validations/report";

interface ReportDateSelectorProps {
  currentPreset: ReportRangePreset;
  startDate?: string;
  endDate?: string;
  onSelectPreset: (preset: ReportRangePreset, customStart?: string, customEnd?: string) => void;
}

const PRESET_OPTIONS: { key: ReportRangePreset; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "last7days", label: "Last 7 Days" },
  { key: "last30days", label: "Last 30 Days" },
  { key: "thisWeek", label: "This Week" },
  { key: "thisMonth", label: "This Month" },
  { key: "custom", label: "Custom Range" },
];

export function ReportDateSelector({
  currentPreset,
  startDate,
  endDate,
  onSelectPreset,
}: ReportDateSelectorProps) {
  const [customStart, setCustomStart] = useState(startDate || new Date().toISOString().split("T")[0]);
  const [customEnd, setCustomEnd] = useState(endDate || new Date().toISOString().split("T")[0]);
  const [showCustomInputs, setShowCustomInputs] = useState(currentPreset === "custom");

  const handlePresetClick = (preset: ReportRangePreset) => {
    if (preset === "custom") {
      setShowCustomInputs(true);
      onSelectPreset("custom", customStart, customEnd);
    } else {
      setShowCustomInputs(false);
      onSelectPreset(preset);
    }
  };

  const handleApplyCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (customStart && customEnd) {
      onSelectPreset("custom", customStart, customEnd);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4 text-left">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 flex-shrink-0">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">Timeframe Analysis</h3>
            <p className="text-xs text-slate-400">Filter metrics, charts, and comparisons across time</p>
          </div>
        </div>

        {/* Preset Pills */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-950/80 border border-slate-800 rounded-xl">
          {PRESET_OPTIONS.map((opt) => {
            const isActive = currentPreset === opt.key;
            return (
              <button
                key={opt.key}
                type="button"
                onClick={() => handlePresetClick(opt.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? "bg-emerald-500 text-slate-950 shadow-sm"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom Range Picker Drawer */}
      {showCustomInputs && (
        <form
          onSubmit={handleApplyCustom}
          className="pt-3 border-t border-slate-800 flex flex-wrap items-center gap-3"
        >
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Start Date:</span>
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">End Date:</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          <button
            type="submit"
            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-colors shadow-sm cursor-pointer"
          >
            Apply Range
          </button>
        </form>
      )}
    </div>
  );
}
