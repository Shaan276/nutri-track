"use client";

import React from "react";
import { Search, Star, Archive, Layers, X, Filter } from "lucide-react";
import { FoodCategory, categoryDisplayNames } from "@/lib/validations/food";

interface FoodFiltersProps {
  search: string;
  onSearchChange: (val: string) => void;
  selectedCategory: string;
  onCategoryChange: (val: string) => void;
  statusFilter: "active" | "favorites" | "archived" | "all";
  onStatusFilterChange: (val: "active" | "favorites" | "archived" | "all") => void;
  totalCount: number;
  favoritesCount: number;
  activeCount: number;
  archivedCount: number;
}

export function FoodFilters({
  search,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  statusFilter,
  onStatusFilterChange,
  totalCount,
  favoritesCount,
  activeCount,
  archivedCount,
}: FoodFiltersProps) {
  const categories: FoodCategory[] = [
    "FRUITS",
    "VEGETABLES",
    "GRAINS_CEREALS",
    "PULSES_LEGUMES",
    "DAIRY",
    "NUTS_SEEDS",
    "OILS_FATS",
    "BEVERAGES",
    "SNACKS",
    "SWEETS",
    "SUPPLEMENTS",
    "OTHER",
  ];

  return (
    <div className="w-full space-y-4">
      {/* Top Bar: Search and Category Dropdown */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {/* Search Bar */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-foreground-muted">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            placeholder="Search foods by name, brand, or category..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-9 py-2.5 bg-background-elevated/70 border border-border-subtle rounded-xl text-foreground-primary placeholder:text-foreground-muted/60 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
          />
          {search && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-foreground-muted hover:text-foreground-primary transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Category Dropdown */}
        <div className="relative min-w-[200px]">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-foreground-muted">
            <Filter className="h-4 w-4" />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="w-full pl-10 pr-8 py-2.5 bg-background-elevated/70 border border-border-subtle rounded-xl text-foreground-primary text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors cursor-pointer"
          >
            <option value="" className="bg-background-surface text-foreground-primary">
              All Categories
            </option>
            {categories.map((cat) => (
              <option key={cat} value={cat} className="bg-background-surface text-foreground-primary">
                {categoryDisplayNames[cat]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Filter Tabs & Quick Counters */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-1.5 p-1 bg-background-elevated/50 border border-border-subtle rounded-xl overflow-x-auto max-w-full">
          <button
            onClick={() => onStatusFilterChange("active")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              statusFilter === "active"
                ? "bg-brand-500 text-black shadow-sm"
                : "text-foreground-secondary hover:text-foreground-primary hover:bg-background-elevated"
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Active Foods</span>
            <span
              className={`ml-1 text-[11px] px-1.5 py-0.2 rounded-full ${
                statusFilter === "active" ? "bg-black/20 text-black font-bold" : "bg-background-elevated text-foreground-muted font-normal"
              }`}
            >
              {activeCount}
            </span>
          </button>

          <button
            onClick={() => onStatusFilterChange("favorites")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              statusFilter === "favorites"
                ? "bg-brand-500 text-black shadow-sm"
                : "text-foreground-secondary hover:text-foreground-primary hover:bg-background-elevated"
            }`}
          >
            <Star className="h-3.5 w-3.5 fill-current" />
            <span>Favorites</span>
            <span
              className={`ml-1 text-[11px] px-1.5 py-0.2 rounded-full ${
                statusFilter === "favorites" ? "bg-black/20 text-black font-bold" : "bg-background-elevated text-foreground-muted font-normal"
              }`}
            >
              {favoritesCount}
            </span>
          </button>

          <button
            onClick={() => onStatusFilterChange("archived")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              statusFilter === "archived"
                ? "bg-brand-500 text-black shadow-sm"
                : "text-foreground-secondary hover:text-foreground-primary hover:bg-background-elevated"
            }`}
          >
            <Archive className="h-3.5 w-3.5" />
            <span>Archived</span>
            <span
              className={`ml-1 text-[11px] px-1.5 py-0.2 rounded-full ${
                statusFilter === "archived" ? "bg-black/20 text-black font-bold" : "bg-background-elevated text-foreground-muted font-normal"
              }`}
            >
              {archivedCount}
            </span>
          </button>

          <button
            onClick={() => onStatusFilterChange("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              statusFilter === "all"
                ? "bg-brand-500 text-black shadow-sm"
                : "text-foreground-secondary hover:text-foreground-primary hover:bg-background-elevated"
            }`}
          >
            <span>All Items</span>
            <span
              className={`ml-1 text-[11px] px-1.5 py-0.2 rounded-full ${
                statusFilter === "all" ? "bg-black/20 text-black font-bold" : "bg-background-elevated text-foreground-muted font-normal"
              }`}
            >
              {totalCount}
            </span>
          </button>
        </div>

        {/* Selected category pill if any */}
        {selectedCategory && (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-brand-500/10 border border-brand-500/30 text-brand-400 text-xs font-semibold">
            <span>Category: {categoryDisplayNames[selectedCategory as FoodCategory] || selectedCategory}</span>
            <button
              onClick={() => onCategoryChange("")}
              className="hover:text-foreground-primary transition-colors cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default FoodFilters;
