"use client";
import React, { useState } from "react";
import {
  X,
  Target,
  Sparkles,
  Utensils,
  Droplets,
  Footprints,
  Dumbbell,
  Flame,
  Calendar,
  AlertCircle,
} from "lucide-react";
import { GoalCategory, GoalType, CreateGoalInput } from "@/lib/validations/goals";

interface CreateGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateGoalInput) => Promise<void>;
}

const CATEGORIES: Array<{
  id: GoalCategory;
  label: string;
  icon: any;
  defaultUnit: string;
  defaultType: GoalType;
  presetName: string;
  presetTarget: number;
}> = [
  {
    id: "NUTRITION",
    label: "Nutrition",
    icon: Utensils,
    defaultUnit: "days",
    defaultType: "DAILY_TARGET_STREAK",
    presetName: "Hit 100g Protein Daily",
    presetTarget: 30,
  },
  {
    id: "HYDRATION",
    label: "Hydration",
    icon: Droplets,
    defaultUnit: "days",
    defaultType: "DAILY_TARGET_STREAK",
    presetName: "Drink 2,500 ml Daily",
    presetTarget: 14,
  },
  {
    id: "RUNNING",
    label: "Running",
    icon: Footprints,
    defaultUnit: "km",
    defaultType: "CUMULATIVE_VALUE",
    presetName: "Run 50 km This Month",
    presetTarget: 50,
  },
  {
    id: "ACTIVITIES",
    label: "Activities",
    icon: Flame,
    defaultUnit: "steps",
    defaultType: "CUMULATIVE_VALUE",
    presetName: "Walk 100,000 Steps",
    presetTarget: 100000,
  },
  {
    id: "WORKOUTS",
    label: "Workouts",
    icon: Dumbbell,
    defaultUnit: "workouts",
    defaultType: "SESSION_COUNT",
    presetName: "Complete 12 Workouts",
    presetTarget: 12,
  },
  {
    id: "CONSISTENCY",
    label: "Consistency",
    icon: Sparkles,
    defaultUnit: "days",
    defaultType: "DAILY_TARGET_STREAK",
    presetName: "Maintain 20-Day Healthy Streak",
    presetTarget: 20,
  },
];

export function CreateGoalModal({ isOpen, onClose, onSubmit }: CreateGoalModalProps) {
  const today = new Date().toISOString().split("T")[0];
  const defaultTargetDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const [category, setCategory] = useState<GoalCategory>("NUTRITION");
  const [goalType, setGoalType] = useState<GoalType>("DAILY_TARGET_STREAK");
  const [name, setName] = useState("Hit 100g Protein Daily");
  const [description, setDescription] = useState("");
  const [targetValue, setTargetValue] = useState<number | "">(30);
  const [unit, setUnit] = useState("days");
  const [startDate, setStartDate] = useState(today);
  const [targetDate, setTargetDate] = useState(defaultTargetDate);
  const [dailyNutrientTarget, setDailyNutrientTarget] = useState(100);
  const [workoutLocation, setWorkoutLocation] = useState<"ALL" | "GYM" | "HOME">("ALL");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCategorySelect = (cat: typeof CATEGORIES[0]) => {
    setCategory(cat.id);
    setGoalType(cat.defaultType);
    setUnit(cat.defaultUnit);
    setName(cat.presetName);
    setTargetValue(cat.presetTarget);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Please enter a goal name.");
      return;
    }
    if (!targetValue || Number(targetValue) <= 0) {
      setError("Please enter a valid positive target number.");
      return;
    }
    if (startDate > targetDate) {
      setError("Target date must be on or after start date.");
      return;
    }

    try {
      setIsSubmitting(true);
      const metadata: Record<string, any> = {};
      if (category === "NUTRITION") {
        metadata.nutrientKey = "protein";
        metadata.dailyTarget = dailyNutrientTarget;
      } else if (category === "WORKOUTS" && workoutLocation !== "ALL") {
        metadata.workoutLocation = workoutLocation;
      }

      await onSubmit({
        name: name.trim(),
        description: description.trim() || undefined,
        category,
        goalType,
        targetValue: Number(targetValue),
        unit: unit.trim(),
        startDate,
        targetDate,
        metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to create goal.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#121620] border border-[#232936] rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Create New Goal</h2>
            <p className="text-xs text-slate-400">Set a measurable health or fitness target.</p>
          </div>
        </div>

        {error && (
          <div className="mb-5 p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-2.5 text-xs text-rose-400">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Category Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Select Category
            </label>
            <div className="grid grid-cols-3 gap-2">
              {CATEGORIES.map((cat) => {
                const IconComponent = cat.icon;
                const isSelected = category === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleCategorySelect(cat)}
                    className={`p-3 rounded-xl border text-left transition-all flex items-center gap-2.5 ${
                      isSelected
                        ? "bg-emerald-500/15 border-emerald-500 text-white font-semibold"
                        : "bg-[#161B26] border-[#232936] text-slate-400 hover:text-slate-200 hover:border-slate-700"
                    }`}
                  >
                    <IconComponent
                      className={`w-4 h-4 ${isSelected ? "text-emerald-400" : "text-slate-500"}`}
                    />
                    <span className="text-xs">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Goal Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Goal Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Run 50 km this month"
              className="w-full bg-[#161B26] border border-[#232936] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
              required
            />
          </div>

          {/* Target Value & Unit */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Target Value *
              </label>
              <input
                type="number"
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value === "" ? "" : Number(e.target.value))}
                min={1}
                step="any"
                className="w-full bg-[#161B26] border border-[#232936] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Unit *
              </label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="days, km, workouts, steps..."
                className="w-full bg-[#161B26] border border-[#232936] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                required
              />
            </div>
          </div>

          {/* Category-Specific Filters */}
          {category === "NUTRITION" && (
            <div className="p-3.5 bg-[#161B26] border border-[#232936] rounded-xl space-y-2">
              <label className="block text-xs font-semibold text-slate-300">
                Daily Protein Target (grams per day)
              </label>
              <input
                type="number"
                value={dailyNutrientTarget}
                onChange={(e) => setDailyNutrientTarget(Number(e.target.value))}
                min={20}
                max={400}
                className="w-full bg-[#121620] border border-[#232936] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
              <p className="text-[11px] text-slate-500">
                Days with &ge; {dailyNutrientTarget}g protein will count towards your {targetValue} successful days.
              </p>
            </div>
          )}

          {category === "WORKOUTS" && (
            <div className="p-3.5 bg-[#161B26] border border-[#232936] rounded-xl space-y-2">
              <label className="block text-xs font-semibold text-slate-300">
                Workout Location Filter
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(["ALL", "GYM", "HOME"] as const).map((loc) => (
                  <button
                    key={loc}
                    type="button"
                    onClick={() => setWorkoutLocation(loc)}
                    className={`py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                      workoutLocation === loc
                        ? "bg-emerald-500/20 border-emerald-500 text-emerald-300"
                        : "bg-[#121620] border-[#232936] text-slate-400 hover:text-white"
                    }`}
                  >
                    {loc}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-[#161B26] border border-[#232936] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 transition-colors"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Target Date
              </label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full bg-[#161B26] border border-[#232936] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 transition-colors"
                required
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Why are you pursuing this goal?"
              rows={2}
              className="w-full bg-[#161B26] border border-[#232936] rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 transition-colors resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#232936]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-[#0E121A] font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50"
            >
              {isSubmitting ? "Creating..." : "Create Goal"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
