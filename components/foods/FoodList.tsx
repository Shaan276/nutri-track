"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, UtensilsCrossed, Loader2, Sparkles } from "lucide-react";
import { FoodCard, FoodItem } from "./FoodCard";
import { FoodFilters } from "./FoodFilters";
import { DeleteFoodModal } from "./DeleteFoodModal";

interface FoodListProps {
  currentUserId: string;
}

export function FoodList({ currentUserId }: FoodListProps) {
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [statusFilter, setStatusFilter] = useState<"active" | "favorites" | "archived" | "all">("active");

  const [deletingFood, setDeletingFood] = useState<FoodItem | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Fetch foods query with TanStack Query
  const { data, isLoading, isError } = useQuery<{ status: string; count: number; foods: FoodItem[] }>({
    queryKey: ["foods", { search, category, statusFilter }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (category) params.set("category", category);

      if (statusFilter === "favorites") {
        params.set("favorites", "true");
        params.set("status", "all");
      } else if (statusFilter === "archived") {
        params.set("status", "archived");
      } else if (statusFilter === "all") {
        params.set("status", "all");
      } else {
        params.set("status", "active");
      }

      const res = await fetch(`/api/foods?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch foods");
      return res.json();
    },
  });

  const foods = data?.foods || [];

  // Toggle favorite mutation
  const favoriteMutation = useMutation({
    mutationFn: async (foodId: string) => {
      const res = await fetch(`/api/foods/${foodId}/favorite`, { method: "PATCH" });
      if (!res.ok) throw new Error("Failed to toggle favorite");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["foods"] });
    },
  });

  // Toggle archive mutation
  const archiveMutation = useMutation({
    mutationFn: async ({ foodId, isArchived }: { foodId: string; isArchived: boolean }) => {
      const res = await fetch(`/api/foods/${foodId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to archive food");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["foods"] });
    },
  });

  const handleToggleFavorite = async (id: string) => {
    await favoriteMutation.mutateAsync(id);
  };

  const handleToggleArchive = async (id: string, isArchived: boolean) => {
    await archiveMutation.mutateAsync({ foodId: id, isArchived });
  };

  const handleDeleteTrigger = (food: FoodItem) => {
    setDeletingFood(food);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["foods"] });
  };

  // Compute live counters
  const totalCount = foods.length;
  const favoritesCount = foods.filter((f) => f.isFavorite).length;
  const activeCount = foods.filter((f) => !f.isArchived).length;
  const archivedCount = foods.filter((f) => f.isArchived).length;

  return (
    <div className="w-full space-y-6 text-left">
      {/* Top Header / Action Area */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-brand-500/15 border border-brand-500/30 text-brand-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <Sparkles className="h-3.5 w-3.5" />
            Food Library
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground-primary tracking-tight">
            Food Database
          </h1>
          <p className="text-sm text-foreground-secondary mt-1 font-medium">
            Manage your personal nutrition library, reference servings, and macros.
          </p>
        </div>

        <Link
          href="/foods/add"
          className="inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-black font-bold text-sm rounded-xl transition-all duration-200 shadow-brand-glow hover:shadow-brand-glow-lg cursor-pointer shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Add New Food</span>
        </Link>
      </div>

      {/* Filter Toolbar */}
      <FoodFilters
        search={search}
        onSearchChange={setSearch}
        selectedCategory={category}
        onCategoryChange={setCategory}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        totalCount={totalCount}
        favoritesCount={favoritesCount}
        activeCount={activeCount}
        archivedCount={archivedCount}
      />

      {/* Main Content Area */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="h-8 w-8 text-brand-400 animate-spin" />
          <p className="text-sm font-semibold text-foreground-muted">Loading foods library...</p>
        </div>
      ) : isError ? (
        <div className="py-16 text-center bg-background-surface/50 border border-system-error/30 rounded-2xl p-6">
          <p className="text-sm font-semibold text-red-200">Failed to load foods from database.</p>
          <button
            onClick={() => queryClient.invalidateQueries({ queryKey: ["foods"] })}
            className="mt-3 px-4 py-2 bg-background-elevated hover:bg-background-elevated/80 text-foreground-primary text-xs font-semibold rounded-xl border border-border-subtle cursor-pointer"
          >
            Retry
          </button>
        </div>
      ) : foods.length === 0 ? (
        <div className="py-16 text-center bg-background-surface/40 border border-border-subtle rounded-3xl p-8 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-500/10 border border-brand-500/20 text-brand-400 flex items-center justify-center mx-auto">
            <UtensilsCrossed className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-foreground-primary">No Foods Found</h3>
            <p className="text-sm text-foreground-muted max-w-md mx-auto">
              {search || category || statusFilter !== "active"
                ? "No food items matched your selected search and filters."
                : "Your nutrition library is currently empty. Start by adding your first food item!"}
            </p>
          </div>
          <Link
            href="/foods/add"
            className="inline-flex items-center gap-2 py-2 px-4 bg-brand-500 hover:bg-brand-600 text-black font-bold text-xs rounded-xl shadow-brand-glow transition-colors cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Create First Food</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {foods.map((food) => (
            <FoodCard
              key={food.id}
              food={food}
              currentUserId={currentUserId}
              onToggleFavorite={handleToggleFavorite}
              onToggleArchive={handleToggleArchive}
              onDelete={handleDeleteTrigger}
            />
          ))}
        </div>
      )}

      {/* Delete Food Confirmation Modal */}
      <DeleteFoodModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        food={deletingFood}
        onSuccess={handleDeleteSuccess}
      />
    </div>
  );
}

export default FoodList;
