"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dumbbell,
  Home,
  Star,
  Play,
  Pencil,
  Copy,
  Archive,
  RotateCcw,
  Trash2,
  ChevronDown,
  ChevronUp,
  Layers,
} from "lucide-react";
import { WorkoutTemplateDto } from "@/lib/validations/workout-template";

interface WorkoutTemplateCardProps {
  template: WorkoutTemplateDto;
  onEdit: (template: WorkoutTemplateDto) => void;
  onDuplicate: (templateId: string) => void;
  onToggleFavorite: (templateId: string) => void;
  onToggleArchive: (templateId: string) => void;
  onDelete: (templateId: string) => void;
}

export function WorkoutTemplateCard({
  template,
  onEdit,
  onDuplicate,
  onToggleFavorite,
  onToggleArchive,
  onDelete,
}: WorkoutTemplateCardProps) {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);

  const isHome = template.workoutType === "HOME_WORKOUT";

  const handleStartWorkout = () => {
    router.push(`/activities?action=log&templateId=${template.id}`);
  };

  return (
    <div
      className={`rounded-3xl border transition-all duration-200 shadow-sm flex flex-col justify-between overflow-hidden text-left ${
        template.isArchived
          ? "bg-background-surface/60 border-dashed border-border-subtle opacity-75"
          : "bg-background-surface border-border-default hover:border-brand-500/40 hover:shadow-surface-card"
      }`}
    >
      {/* Card Header */}
      <div className="p-5 sm:p-6 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div
              className={`p-2.5 rounded-2xl border ${
                isHome
                  ? "bg-purple-500/15 text-purple-400 border-purple-500/30"
                  : "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
              }`}
            >
              {isHome ? <Home className="h-5 w-5" /> : <Dumbbell className="h-5 w-5" />}
            </div>

            <div>
              <h3 className="text-base font-extrabold text-foreground-primary tracking-tight">
                {template.name}
              </h3>
              <div className="flex items-center gap-2 mt-0.5">
                <span
                  className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase ${
                    isHome
                      ? "bg-purple-500/15 text-purple-300 border border-purple-500/30"
                      : "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                  }`}
                >
                  {isHome ? "Home Workout" : "Gym Workout"}
                </span>
                <span className="text-xs text-foreground-muted font-medium">
                  &bull; {template.totalExercises} {template.totalExercises === 1 ? "exercise" : "exercises"}
                </span>
              </div>
            </div>
          </div>

          {/* Favorite Button */}
          <button
            type="button"
            onClick={() => onToggleFavorite(template.id)}
            className={`p-2 rounded-xl transition-all cursor-pointer ${
              template.isFavorite
                ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                : "text-foreground-muted hover:text-amber-400 hover:bg-background-elevated"
            }`}
            title={template.isFavorite ? "Favorited Routine" : "Add to Favorites"}
          >
            <Star className={`h-4 w-4 ${template.isFavorite ? "fill-amber-400" : ""}`} />
          </button>
        </div>

        {template.description && (
          <p className="text-xs text-foreground-secondary line-clamp-2 font-medium">
            {template.description}
          </p>
        )}

        {/* Exercises Preview */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-foreground-muted uppercase tracking-wider">
              Routine Blueprint:
            </span>
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-[11px] font-bold text-brand-400 hover:text-brand-300 flex items-center gap-1 cursor-pointer"
            >
              <span>{isExpanded ? "Collapse" : "View Details"}</span>
              {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>
          </div>

          <div className="space-y-1">
            {template.exercises.slice(0, isExpanded ? undefined : 3).map((ex, idx) => (
              <div
                key={ex.id || idx}
                className="flex items-center justify-between text-xs py-1 px-2.5 rounded-lg bg-background-elevated border border-border-subtle"
              >
                <span className="font-semibold text-foreground-primary truncate pr-2">
                  {idx + 1}. {ex.name}
                </span>
                <span className="text-foreground-muted font-mono font-bold shrink-0">
                  {ex.defaultSets} sets
                  {ex.defaultReps ? ` × ${ex.defaultReps} reps` : ""}
                  {ex.defaultWeightKg ? ` @ ${ex.defaultWeightKg}kg` : ""}
                  {ex.defaultDurationSeconds ? ` × ${ex.defaultDurationSeconds}s` : ""}
                </span>
              </div>
            ))}
            {!isExpanded && template.exercises.length > 3 && (
              <p className="text-[11px] text-foreground-muted font-medium pl-1">
                + {template.exercises.length - 3} more exercises...
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Card Action Footer */}
      <div className="p-4 bg-background-elevated/70 border-t border-border-subtle flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={handleStartWorkout}
          className="flex-1 py-2 px-3.5 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-black font-extrabold text-xs rounded-xl shadow-brand-glow transition-all flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Play className="h-3.5 w-3.5 fill-black" />
          <span>Start Workout</span>
        </button>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onEdit(template)}
            className="p-2 rounded-xl text-foreground-secondary hover:text-foreground-primary hover:bg-background-surface transition-colors cursor-pointer"
            title="Edit Routine"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>

          <button
            type="button"
            onClick={() => onDuplicate(template.id)}
            className="p-2 rounded-xl text-foreground-secondary hover:text-foreground-primary hover:bg-background-surface transition-colors cursor-pointer"
            title="Duplicate Routine"
          >
            <Copy className="h-3.5 w-3.5" />
          </button>

          <button
            type="button"
            onClick={() => onToggleArchive(template.id)}
            className="p-2 rounded-xl text-foreground-secondary hover:text-foreground-primary hover:bg-background-surface transition-colors cursor-pointer"
            title={template.isArchived ? "Restore Routine" : "Archive Routine"}
          >
            {template.isArchived ? (
              <RotateCcw className="h-3.5 w-3.5 text-blue-400" />
            ) : (
              <Archive className="h-3.5 w-3.5" />
            )}
          </button>

          <button
            type="button"
            onClick={() => onDelete(template.id)}
            className="p-2 rounded-xl text-rose-400 hover:bg-rose-500/20 transition-colors cursor-pointer"
            title="Delete Routine"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default WorkoutTemplateCard;
