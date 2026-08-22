"use client";

import React, { useEffect, useState } from "react";
import {
  X,
  Scale,
  Sparkles,
  Flame,
  Droplets,
  Activity,
  Dumbbell,
  Lock,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { MutualComparisonMetric } from "@/lib/services/community.service";

interface FriendComparisonDrawerProps {
  friendUsername: string;
  isOpen: boolean;
  onClose: () => void;
}

export function FriendComparisonDrawer({
  friendUsername,
  isOpen,
  onClose,
}: FriendComparisonDrawerProps) {
  const [data, setData] = useState<{
    friend: { id: string; name: string; username: string };
    metrics: MutualComparisonMetric[];
    supportiveInsight: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !friendUsername) return;

    setLoading(true);
    setError(null);

    fetch(`/api/community/compare/${encodeURIComponent(friendUsername)}`)
      .then(async (res) => {
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "Failed to load comparison.");
        }
        return res.json();
      })
      .then((resData) => {
        setData(resData);
      })
      .catch((err) => {
        setError(err.message || "Failed to load comparison data.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [isOpen, friendUsername]);

  if (!isOpen) return null;

  const getCategoryIcon = (key: string) => {
    if (key.includes("health")) return Sparkles;
    if (key.includes("running")) return Activity;
    if (key.includes("workout")) return Dumbbell;
    if (key.includes("hydration")) return Droplets;
    return Flame;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-xl rounded-3xl bg-[#121212] border border-neutral-800 p-6 sm:p-7 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
              <Scale className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">
                Mutual Progress Comparison
              </span>
              <h3 className="text-lg font-bold text-white">
                You vs. {data?.friend.name || friendUsername}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
            <p className="text-xs text-neutral-400">Loading mutual progress comparisons...</p>
          </div>
        ) : error ? (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        ) : data ? (
          <div className="space-y-5">
            {/* Supportive Insight Banner */}
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-xs text-emerald-300 flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-emerald-400 shrink-0" />
              <span className="leading-relaxed font-medium">{data.supportiveInsight}</span>
            </div>

            {/* Comparison Metrics Grid */}
            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
              {data.metrics.map((m) => {
                const Icon = getCategoryIcon(m.key);
                return (
                  <div
                    key={m.key}
                    className="p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800/80 space-y-2.5"
                  >
                    <div className="flex items-center justify-between text-xs font-bold">
                      <div className="flex items-center gap-2 text-neutral-200">
                        <Icon className="w-4 h-4 text-emerald-400" />
                        <span>{m.label}</span>
                      </div>
                      <span className="text-[10px] text-neutral-500 uppercase">{m.unit}</span>
                    </div>

                    {m.isSharedByBoth ? (
                      <div className="grid grid-cols-2 gap-3 pt-1">
                        <div className="p-3 rounded-xl bg-neutral-950/80 border border-neutral-800 text-center">
                          <div className="text-[10px] font-semibold text-neutral-400">You</div>
                          <div className="text-base font-black font-mono text-white mt-0.5">
                            {m.myValue !== null ? m.myValue : "—"}{" "}
                            <span className="text-[10px] font-normal text-neutral-500">{m.unit}</span>
                          </div>
                        </div>

                        <div className="p-3 rounded-xl bg-neutral-950/80 border border-neutral-800 text-center">
                          <div className="text-[10px] font-semibold text-emerald-400">
                            {data.friend.name}
                          </div>
                          <div className="text-base font-black font-mono text-emerald-400 mt-0.5">
                            {m.friendValue !== null ? m.friendValue : "—"}{" "}
                            <span className="text-[10px] font-normal text-neutral-500">{m.unit}</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 rounded-xl bg-neutral-950/40 border border-neutral-800/50 flex items-center gap-2 text-xs text-neutral-500">
                        <Lock className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                        <span>{m.unavailableReason || "Private metric"}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <p className="text-[11px] text-neutral-500 text-center">
              🔒 Comparison displays data only when <strong>both</strong> you and {data.friend.name} have enabled sharing for that category.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
