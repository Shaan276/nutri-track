"use client";

import React, { useState } from "react";
import {
  X,
  Send,
  Dumbbell,
  Activity,
  Apple,
  Target,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

interface SendRecommendationModalProps {
  friendId: string;
  friendName: string;
  friendUsername: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

type ItemType = "WORKOUT" | "RUNNING_IDEA" | "FOOD_ITEM" | "GOAL_SUGGESTION";

export function SendRecommendationModal({
  friendId,
  friendName,
  friendUsername,
  isOpen,
  onClose,
  onSuccess,
}: SendRecommendationModalProps) {
  const [itemType, setItemType] = useState<ItemType>("WORKOUT");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Please enter a title for the recommendation.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const payload: Record<string, any> = {
        itemType,
        title: title.trim(),
        sentAt: new Date().toISOString(),
      };

      if (itemType === "WORKOUT") {
        payload.details = "Recommended workout routine to try!";
      } else if (itemType === "RUNNING_IDEA") {
        payload.details = "Try this tempo run / interval workout for aerobic conditioning.";
      } else if (itemType === "FOOD_ITEM") {
        payload.details = "Nutrient-dense meal recommendation.";
      } else if (itemType === "GOAL_SUGGESTION") {
        payload.details = "Suggested milestone for progressive improvement.";
      }

      const res = await fetch("/api/community/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiverId: friendId,
          itemType,
          title: title.trim(),
          payload,
          message: message.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to send recommendation.");
      }

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setTitle("");
        setMessage("");
        onSuccess?.();
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const itemOptions: { type: ItemType; label: string; icon: any; placeholder: string }[] = [
    { type: "WORKOUT", label: "Workout Routine", icon: Dumbbell, placeholder: "e.g. Upper Body Hypertrophy 4x8" },
    { type: "RUNNING_IDEA", label: "Running Idea", icon: Activity, placeholder: "e.g. 5K Easy Pace with 4 Strides" },
    { type: "FOOD_ITEM", label: "Food / Recipe", icon: Apple, placeholder: "e.g. High-Protein Greek Yogurt Bowl" },
    { type: "GOAL_SUGGESTION", label: "Goal Suggestion", icon: Target, placeholder: "e.g. 3,000 ml Hydration Target" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg rounded-3xl bg-[#121212] border border-neutral-800 p-6 sm:p-7 shadow-2xl space-y-6">
        {/* Modal Header */}
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
              Positive Community Sharing
            </span>
            <h3 className="text-lg font-bold text-white">
              Recommend to {friendName}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success ? (
          <div className="py-8 flex flex-col items-center justify-center space-y-3 text-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 animate-bounce" />
            <h4 className="text-base font-bold text-white">Recommendation Sent!</h4>
            <p className="text-xs text-neutral-400">
              {friendName} will receive your suggestion in their Community drawer.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Category Selection */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-neutral-300">Choose Recommendation Type</label>
              <div className="grid grid-cols-2 gap-2">
                {itemOptions.map((opt) => {
                  const Icon = opt.icon;
                  const isSelected = itemType === opt.type;
                  return (
                    <button
                      key={opt.type}
                      type="button"
                      onClick={() => setItemType(opt.type)}
                      className={`p-3 rounded-2xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                        isSelected
                          ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-400"
                          : "bg-neutral-900/60 border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200"
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="text-xs font-semibold">{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Title Input */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-neutral-300">Title / Recommendation</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={itemOptions.find((o) => o.type === itemType)?.placeholder}
                className="w-full px-4 py-3 rounded-2xl bg-neutral-900 border border-neutral-800 text-white text-xs placeholder:text-neutral-600 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            {/* Optional Personal Note */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-neutral-300">
                Personal Note <span className="text-neutral-500 font-normal">(Optional)</span>
              </label>
              <textarea
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Add an encouraging note or tips for your friend..."
                className="w-full px-4 py-3 rounded-2xl bg-neutral-900 border border-neutral-800 text-white text-xs placeholder:text-neutral-600 focus:border-emerald-500 focus:outline-none resize-none"
              />
            </div>

            <div className="p-3 rounded-xl bg-neutral-900/40 border border-neutral-800 text-[11px] text-neutral-400 leading-relaxed">
              💡 <strong>Controlled Suggestion:</strong> Sending this recommendation will <strong>not</strong> modify {friendName}&apos;s database or targets. They can choose to view, save, or dismiss it.
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-neutral-800 text-xs font-semibold text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-black font-extrabold text-xs flex items-center gap-2 shadow-emerald-500/20 shadow-md transition-all disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                <span>Send Recommendation</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
