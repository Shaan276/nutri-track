"use client";

import React from "react";
import { Trophy, Award, Flame, Footprints, Droplets, Dumbbell, Timer, Mountain, Utensils } from "lucide-react";
import { PersonalRecordItem } from "@/lib/validations/report";

interface PersonalRecordsCardProps {
  records: PersonalRecordItem[];
}

export function PersonalRecordsCard({ records }: PersonalRecordsCardProps) {
  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case "RUNNING":
        return <Timer className="w-4 h-4 text-emerald-400" />;
      case "NUTRITION":
        return <Utensils className="w-4 h-4 text-blue-400" />;
      case "HYDRATION":
        return <Droplets className="w-4 h-4 text-cyan-400" />;
      case "ACTIVITY":
        return <Footprints className="w-4 h-4 text-purple-400" />;
      case "WORKOUT":
        return <Dumbbell className="w-4 h-4 text-amber-400" />;
      default:
        return <Trophy className="w-4 h-4 text-yellow-400" />;
    }
  };

  const getCategoryBadgeClass = (cat: string) => {
    switch (cat) {
      case "RUNNING":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "NUTRITION":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "HYDRATION":
        return "bg-cyan-500/10 text-cyan-400 border-cyan-500/20";
      case "ACTIVITY":
        return "bg-purple-500/10 text-purple-400 border-purple-500/20";
      case "WORKOUT":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      default:
        return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
    }
  };

  if (records.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center space-y-2 text-left">
        <h3 className="text-sm font-bold text-white tracking-tight">Personal Records</h3>
        <p className="text-xs text-slate-400">
          No records logged yet. Start logging runs, meals, hydration, and workouts to unlock personal milestones!
        </p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4 text-left">
      <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3.5">
        <div className="w-8 h-8 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-400 flex-shrink-0">
          <Trophy className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-base font-bold text-white tracking-tight">Personal Records</h3>
          <p className="text-xs text-slate-400">
            All-time historical milestones across your health and performance journey
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 pt-1">
        {records.map((item) => (
          <div
            key={item.key}
            className="bg-slate-950/70 border border-slate-800/90 rounded-xl p-4 flex flex-col justify-between space-y-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                {getCategoryIcon(item.category)}
                <h4 className="text-xs font-bold text-slate-200">{item.title}</h4>
              </div>
              <span
                className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${getCategoryBadgeClass(
                  item.category
                )}`}
              >
                {item.category}
              </span>
            </div>

            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-black text-white font-mono tracking-tight">
                  {item.value}
                </span>
                <span className="text-xs text-slate-400 font-semibold">{item.unit}</span>
              </div>
              {item.detail && (
                <p className="text-[10px] text-slate-500 mt-0.5 truncate">{item.detail}</p>
              )}
            </div>

            <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-400">
              <span>Achieved on:</span>
              <span className="font-semibold text-slate-300">
                {new Date(item.achievedDate + "T00:00:00").toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
