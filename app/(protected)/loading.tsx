import React from "react";
import { Loader2, Sparkles } from "lucide-react";

export default function ProtectedLoading() {
  return (
    <div className="w-full space-y-6 animate-pulse text-left">
      {/* Top Banner Skeleton */}
      <div className="bg-background-surface border border-border-default rounded-3xl p-6 sm:p-7 shadow-surface-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="w-36 h-5 bg-neutral-800 rounded-full" />
          <div className="w-64 h-8 bg-neutral-800 rounded-xl" />
          <div className="w-80 h-4 bg-neutral-850 rounded-md" />
        </div>
        <div className="flex items-center gap-2">
          <div className="w-24 h-9 bg-neutral-800 rounded-xl" />
          <div className="w-24 h-9 bg-neutral-800 rounded-xl" />
        </div>
      </div>

      {/* Target Summary Skeleton */}
      <div className="bg-background-surface border border-border-default rounded-3xl p-6 space-y-4 shadow-surface-card">
        <div className="flex justify-between items-center border-b border-border-subtle pb-4">
          <div className="w-48 h-6 bg-neutral-800 rounded-lg" />
          <div className="w-32 h-6 bg-neutral-800 rounded-lg" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="h-28 bg-neutral-900 border border-neutral-800 rounded-2xl p-4" />
          <div className="h-28 bg-neutral-900 border border-neutral-800 rounded-2xl p-4" />
          <div className="h-28 bg-neutral-900 border border-neutral-800 rounded-2xl p-4" />
          <div className="h-28 bg-neutral-900 border border-neutral-800 rounded-2xl p-4" />
        </div>
      </div>

      {/* Grid Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="h-40 bg-neutral-900 border border-neutral-800 rounded-2xl" />
        <div className="h-40 bg-neutral-900 border border-neutral-800 rounded-2xl" />
        <div className="h-40 bg-neutral-900 border border-neutral-800 rounded-2xl" />
      </div>
    </div>
  );
}
