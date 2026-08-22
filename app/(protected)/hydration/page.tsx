"use client";

import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { DateNavigator } from "@/components/nutrition/DateNavigator";
import { WaterBottleContainer } from "@/components/hydration/WaterBottleContainer";
import { QuickAddHydrationBar } from "@/components/hydration/QuickAddHydrationBar";
import { HydrationHistoryList } from "@/components/hydration/HydrationHistoryList";
import { HydrationWeeklyChart } from "@/components/hydration/HydrationWeeklyChart";
import { EditHydrationModal } from "@/components/hydration/EditHydrationModal";
import { DeleteHydrationModal } from "@/components/hydration/DeleteHydrationModal";
import { UpdateHydrationGoalModal } from "@/components/hydration/UpdateHydrationGoalModal";
import { QuickLogModal } from "@/components/quick-log/QuickLogModal";
import {
  DailyHydrationSummary,
  HydrationEntryDto,
  WeeklyHydrationSummary,
} from "@/lib/services/hydration.service";

export default function HydrationTrackingPage() {
  const queryClient = useQueryClient();

  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );

  const [isQuickLogWaterOpen, setIsQuickLogWaterOpen] = useState(false);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);

  const [editingEntry, setEditingEntry] = useState<HydrationEntryDto | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const [deletingEntry, setDeletingEntry] = useState<HydrationEntryDto | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Fetch daily hydration
  const { data: dailyDataRes, isLoading: isDailyLoading, isError: isDailyError } = useQuery<{
    status: string;
    data: DailyHydrationSummary;
  }>({
    queryKey: ["hydration", selectedDate],
    queryFn: async () => {
      const res = await fetch(`/api/hydration?date=${selectedDate}`);
      if (!res.ok) throw new Error("Failed to fetch hydration data");
      return res.json();
    },
  });

  // Fetch weekly hydration trend
  const { data: weeklyDataRes, isLoading: isWeeklyLoading } = useQuery<{
    status: string;
    data: WeeklyHydrationSummary;
  }>({
    queryKey: ["hydration", "weekly", selectedDate],
    queryFn: async () => {
      const res = await fetch(`/api/hydration?date=${selectedDate}&view=weekly`);
      if (!res.ok) throw new Error("Failed to fetch weekly hydration");
      return res.json();
    },
  });

  const dailyData = dailyDataRes?.data;
  const weeklyData = weeklyDataRes?.data;

  const handleMutationSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["hydration"] });
  };

  const handleOpenEdit = (entry: HydrationEntryDto) => {
    setEditingEntry(entry);
    setIsEditModalOpen(true);
  };

  const handleOpenDelete = (entry: HydrationEntryDto) => {
    setDeletingEntry(entry);
    setIsDeleteModalOpen(true);
  };

  return (
    <div className="w-full space-y-6 text-left animate-fade-in">
      {/* Date Navigator */}
      <DateNavigator
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
      />

      {/* Main Content */}
      {isDailyLoading ? (
        <div className="py-24 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="h-8 w-8 text-blue-400 animate-spin" />
          <p className="text-sm font-semibold text-foreground-muted">Loading hydration metrics...</p>
        </div>
      ) : isDailyError || !dailyData ? (
        <div className="py-16 text-center bg-background-surface/50 border border-system-error/30 rounded-3xl p-6 space-y-3">
          <p className="text-sm font-semibold text-red-200">Failed to load hydration metrics for this date.</p>
          <button
            onClick={() => queryClient.invalidateQueries({ queryKey: ["hydration"] })}
            className="px-4 py-2 bg-background-elevated hover:bg-background-elevated/80 text-foreground-primary text-xs font-semibold rounded-xl border border-border-subtle cursor-pointer"
          >
            Retry
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Realistic Water Container Visualization */}
          <WaterBottleContainer
            totalMl={dailyData.totalMl}
            targetMl={dailyData.targetMl}
            percentage={dailyData.percentage}
            remainingMl={dailyData.remainingMl}
            isGoalReached={dailyData.isGoalReached}
            streakDays={dailyData.streakDays}
          />

          {/* One-Click Quick Add Bar */}
          <QuickAddHydrationBar
            selectedDate={selectedDate}
            onSuccess={handleMutationSuccess}
            onOpenCustomLog={() => setIsQuickLogWaterOpen(true)}
          />

          {/* Weekly 7-Day Chart & Daily Timeline Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <HydrationWeeklyChart
              data={weeklyData?.days || []}
              targetMl={dailyData.targetMl}
              isLoading={isWeeklyLoading}
            />

            <HydrationHistoryList
              entries={dailyData.entries}
              onEdit={handleOpenEdit}
              onDelete={handleOpenDelete}
              onOpenCustomLog={() => setIsQuickLogWaterOpen(true)}
            />
          </div>
        </div>
      )}

      {/* Edit Entry Modal */}
      <EditHydrationModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        entry={editingEntry}
        onSuccess={handleMutationSuccess}
      />

      {/* Delete Entry Modal */}
      <DeleteHydrationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        entry={deletingEntry}
        onSuccess={handleMutationSuccess}
      />

      {/* Update Goal Modal */}
      <UpdateHydrationGoalModal
        isOpen={isGoalModalOpen}
        onClose={() => setIsGoalModalOpen(false)}
        currentTargetMl={dailyData?.targetMl || 2500}
        onSuccess={handleMutationSuccess}
      />

      {/* Custom Log Modal (opens QuickLog in Water tab) */}
      <QuickLogModal
        isOpen={isQuickLogWaterOpen}
        onClose={() => setIsQuickLogWaterOpen(false)}
        defaultTab="WATER"
      />
    </div>
  );
}
