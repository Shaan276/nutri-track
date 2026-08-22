"use client";

import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Dumbbell,
  Plus,
  Search,
  Filter,
  Loader2,
  Sparkles,
  Layers,
  AlertCircle,
  Home,
  Star,
  Archive,
} from "lucide-react";
import { WorkoutTemplateDto } from "@/lib/validations/workout-template";
import { WorkoutTemplateCard } from "@/components/workouts/WorkoutTemplateCard";
import { CreateWorkoutTemplateModal } from "@/components/workouts/CreateWorkoutTemplateModal";
import { EditWorkoutTemplateModal } from "@/components/workouts/EditWorkoutTemplateModal";

type FilterTab = "ALL" | "HOME" | "GYM" | "FAVORITES" | "ARCHIVED";

export default function WorkoutsDatabasePage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<FilterTab>("ALL");

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<WorkoutTemplateDto | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // TanStack Query for workout templates
  const {
    data: templates = [],
    isLoading,
    isError,
    refetch,
  } = useQuery<WorkoutTemplateDto[]>({
    queryKey: ["workout-templates", activeTab, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.set("search", searchQuery.trim());

      if (activeTab === "HOME") {
        params.set("type", "HOME_WORKOUT");
      } else if (activeTab === "GYM") {
        params.set("type", "GYM_WORKOUT");
      } else if (activeTab === "FAVORITES") {
        params.set("favorite", "true");
      } else if (activeTab === "ARCHIVED") {
        params.set("archived", "true");
      }

      const res = await fetch(`/api/workout-templates?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch workout blueprints");
      const json = await res.json();
      return json.data;
    },
  });

  const handleMutationSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["workout-templates"] });
    refetch();
  };

  const handleDuplicate = async (templateId: string) => {
    try {
      const res = await fetch(`/api/workout-templates/${templateId}/duplicate`, {
        method: "POST",
      });
      if (res.ok) {
        handleMutationSuccess();
      }
    } catch (err) {
      console.error("Failed to duplicate workout blueprint:", err);
    }
  };

  const handleToggleFavorite = async (templateId: string) => {
    try {
      const res = await fetch(`/api/workout-templates/${templateId}/favorite`, {
        method: "POST",
      });
      if (res.ok) {
        handleMutationSuccess();
      }
    } catch (err) {
      console.error("Failed to toggle favorite:", err);
    }
  };

  const handleToggleArchive = async (templateId: string) => {
    try {
      const res = await fetch(`/api/workout-templates/${templateId}/archive`, {
        method: "POST",
      });
      if (res.ok) {
        handleMutationSuccess();
      }
    } catch (err) {
      console.error("Failed to toggle archive:", err);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/workout-templates/${deletingId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setDeletingId(null);
        handleMutationSuccess();
      }
    } catch (err) {
      console.error("Failed to delete workout blueprint:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  const tabCounts = {
    ALL: templates.length,
    HOME: templates.filter((t) => t.workoutType === "HOME_WORKOUT").length,
    GYM: templates.filter((t) => t.workoutType === "GYM_WORKOUT").length,
    FAVORITES: templates.filter((t) => t.isFavorite).length,
    ARCHIVED: templates.filter((t) => t.isArchived).length,
  };

  return (
    <div className="w-full space-y-6 text-left animate-fade-in pb-12">
      {/* Top Header Card */}
      <div className="bg-background-surface border border-border-default rounded-3xl p-6 sm:p-7 shadow-surface-card space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2">
              <Sparkles className="h-3.5 w-3.5" />
              Workout Database
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground-primary tracking-tight">
              Workout Routines & Blueprints
            </h1>
            <p className="text-sm text-foreground-secondary mt-1 font-medium">
              Build, organize, and manage your reusable training routines for Home Calisthenics and Gym workouts.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 py-3 px-5 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-black font-extrabold text-xs rounded-xl shadow-brand-glow hover:shadow-brand-glow-lg transition-all duration-200 cursor-pointer shrink-0"
          >
            <Plus className="h-4 w-4 stroke-[3]" />
            <span>+ Create Workout Routine</span>
          </button>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-3 border-t border-border-subtle">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search workout blueprints (e.g. Push Day, Full Body, Squats)..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-background-elevated border border-border-default text-foreground-primary text-xs font-medium focus:outline-none focus:border-brand-500 transition-colors"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {[
              { id: "ALL" as FilterTab, label: "All Routines" },
              { id: "HOME" as FilterTab, label: "🏠 Home" },
              { id: "GYM" as FilterTab, label: "🏋️ Gym" },
              { id: "FAVORITES" as FilterTab, label: "⭐ Favorites" },
              { id: "ARCHIVED" as FilterTab, label: "📦 Archived" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-3 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? "bg-brand-500/20 text-brand-400 border border-brand-500/40 shadow-sm"
                    : "bg-background-elevated text-foreground-secondary hover:text-foreground-primary border border-border-subtle"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Routine Cards Grid */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="h-8 w-8 text-emerald-400 animate-spin" />
          <p className="text-xs text-foreground-muted font-bold">
            Loading workout routines from database...
          </p>
        </div>
      ) : isError ? (
        <div className="p-6 rounded-3xl bg-rose-500/10 border border-rose-500/30 text-center space-y-2">
          <AlertCircle className="h-6 w-6 text-rose-400 mx-auto" />
          <p className="text-sm font-bold text-rose-300">Failed to load workout database</p>
          <button
            onClick={() => refetch()}
            className="text-xs text-rose-400 underline font-bold cursor-pointer"
          >
            Try Again
          </button>
        </div>
      ) : templates.length === 0 ? (
        <div className="p-12 rounded-3xl bg-background-surface border border-border-default text-center space-y-4 shadow-surface-card">
          <div className="w-12 h-12 rounded-2xl bg-brand-500/15 border border-brand-500/30 text-brand-400 flex items-center justify-center mx-auto">
            <Dumbbell className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-foreground-primary">
              {searchQuery
                ? `No workout routines found matching "${searchQuery}"`
                : activeTab === "ARCHIVED"
                ? "No archived workout routines"
                : activeTab === "FAVORITES"
                ? "No favorite workout routines starred yet"
                : "Your Workout Database is empty"}
            </h3>
            <p className="text-xs text-foreground-muted mt-1 max-w-md mx-auto font-medium">
              Create reusable workout routine blueprints with preset exercises, default sets, reps, and weights.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-black font-extrabold text-xs rounded-xl shadow-brand-glow transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Create Your First Routine Blueprint</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {templates.map((template) => (
            <WorkoutTemplateCard
              key={template.id}
              template={template}
              onEdit={(t) => setEditingTemplate(t)}
              onDuplicate={handleDuplicate}
              onToggleFavorite={handleToggleFavorite}
              onToggleArchive={handleToggleArchive}
              onDelete={(id) => setDeletingId(id)}
            />
          ))}
        </div>
      )}

      {/* Create Workout Blueprint Modal */}
      <CreateWorkoutTemplateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleMutationSuccess}
      />

      {/* Edit Workout Blueprint Modal */}
      {editingTemplate && (
        <EditWorkoutTemplateModal
          isOpen={!!editingTemplate}
          onClose={() => setEditingTemplate(null)}
          template={editingTemplate}
          onSuccess={handleMutationSuccess}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 animate-fade-in">
          <div className="w-full max-w-md bg-background-surface border border-border-default rounded-3xl p-6 shadow-2xl space-y-4 text-left">
            <h3 className="text-lg font-extrabold text-foreground-primary">
              Delete Workout Blueprint?
            </h3>
            <p className="text-xs text-foreground-secondary font-medium leading-relaxed">
              Are you sure you want to permanently delete this routine blueprint from your Workout Database? Past recorded workout sessions logged from this blueprint will remain untouched in your Activities timeline.
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeletingId(null)}
                className="py-2 px-4 rounded-xl bg-background-elevated text-foreground-secondary hover:text-foreground-primary text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="py-2 px-4 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-extrabold text-xs cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? "Deleting..." : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
