"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { DateNavigator } from "@/components/nutrition/DateNavigator";
import { DailyNutritionSummary } from "@/components/nutrition/DailyNutritionSummary";
import { MealSection } from "@/components/nutrition/MealSection";
import { AddFoodModal } from "@/components/nutrition/AddFoodModal";
import { EditMealEntryModal } from "@/components/nutrition/EditMealEntryModal";
import { MealEntryItem } from "@/components/nutrition/MealEntryRow";
import { MealType } from "@/lib/validations/meal";
import { DailyNutritionResponse } from "@/lib/services/nutrition.service";

export default function NutritionTrackingPage() {
  const queryClient = useQueryClient();

  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [activeMealType, setActiveMealType] = useState<MealType>("BREAKFAST");

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<MealEntryItem | null>(null);

  // Fetch daily nutrition with TanStack Query
  const { data, isLoading, isError } = useQuery<{ status: string; data: DailyNutritionResponse }>({
    queryKey: ["nutrition", selectedDate],
    queryFn: async () => {
      const res = await fetch(`/api/nutrition/daily?date=${selectedDate}`);
      if (!res.ok) throw new Error("Failed to fetch daily nutrition");
      return res.json();
    },
  });

  const dailyData = data?.data;

  // Delete meal entry mutation
  const deleteMutation = useMutation({
    mutationFn: async (entryId: string) => {
      const res = await fetch(`/api/meals/${entryId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete meal entry");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nutrition"] });
    },
  });

  const handleOpenAddModal = (mealType: MealType) => {
    setActiveMealType(mealType);
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (entry: MealEntryItem) => {
    setEditingEntry(entry);
    setIsEditModalOpen(true);
  };

  const handleDeleteEntry = async (entryId: string) => {
    await deleteMutation.mutateAsync(entryId);
  };

  const handleMutationSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["nutrition"] });
  };

  return (
    <div className="w-full space-y-6 text-left animate-fade-in">
      {/* Date Navigator */}
      <DateNavigator
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
      />

      {/* Main Content Area */}
      {isLoading ? (
        <div className="py-24 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="h-8 w-8 text-brand-400 animate-spin" />
          <p className="text-sm font-semibold text-foreground-muted">Loading nutrition logs...</p>
        </div>
      ) : isError || !dailyData ? (
        <div className="py-16 text-center bg-background-surface/50 border border-system-error/30 rounded-3xl p-6 space-y-3">
          <p className="text-sm font-semibold text-red-200">Failed to load nutrition logs for this date.</p>
          <button
            onClick={() => queryClient.invalidateQueries({ queryKey: ["nutrition"] })}
            className="px-4 py-2 bg-background-elevated hover:bg-background-elevated/80 text-foreground-primary text-xs font-semibold rounded-xl border border-border-subtle cursor-pointer"
          >
            Retry
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Daily Nutrition Summary Overview */}
          <DailyNutritionSummary
            totals={dailyData.totals}
            targets={dailyData.targets}
            progress={dailyData.progress}
          />

          {/* 4 Meal Sections Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {dailyData.meals.map((section) => (
              <MealSection
                key={section.mealType}
                section={section}
                onOpenAddModal={handleOpenAddModal}
                onEditEntry={handleOpenEditModal}
                onDeleteEntry={handleDeleteEntry}
              />
            ))}
          </div>
        </div>
      )}

      {/* Add Food Modal */}
      <AddFoodModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        mealType={activeMealType}
        selectedDate={selectedDate}
        onSuccess={handleMutationSuccess}
      />

      {/* Edit Entry Modal */}
      <EditMealEntryModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        entry={editingEntry}
        onSuccess={handleMutationSuccess}
      />
    </div>
  );
}
