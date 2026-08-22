import React from "react";
import { Loader2 } from "lucide-react";

export default function GlobalLoading() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 space-y-4">
      {/* Top progress line */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 animate-pulse shadow-md shadow-emerald-500/30" />

      <div className="w-12 h-12 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center shadow-2xl animate-pulse">
        <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
      </div>

      <div className="text-center space-y-1">
        <h3 className="text-sm font-bold text-neutral-200">Loading Nutri-Track</h3>
        <p className="text-xs text-neutral-500">Preparing your live nutrition and fitness dashboard...</p>
      </div>
    </div>
  );
}
