"use client";

import React, { useState } from "react";
import { Edit2, Trash2, Loader2, Clock } from "lucide-react";
import { HydrationEntryDto } from "@/lib/services/hydration.service";
import {
  beverageTypeDisplayNames,
  beverageTypeIcons,
} from "@/lib/validations/hydration";

interface HydrationEntryRowProps {
  entry: HydrationEntryDto;
  onEdit: (entry: HydrationEntryDto) => void;
  onDelete: (entry: HydrationEntryDto) => void;
}

export function HydrationEntryRow({
  entry,
  onEdit,
  onDelete,
}: HydrationEntryRowProps) {
  const icon = beverageTypeIcons[entry.beverageType] || "💧";
  const name = beverageTypeDisplayNames[entry.beverageType] || entry.beverageType;

  const timeFormatted = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(entry.consumedAt));

  return (
    <div className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-background-elevated/50 hover:bg-background-elevated/80 border border-border-subtle transition-all duration-150 text-left">
      {/* Left: Beverage Icon + Name & Time */}
      <div className="flex items-center gap-3.5 min-w-0">
        <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-lg flex items-center justify-center shrink-0">
          <span role="img" aria-label={name}>
            {icon}
          </span>
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-bold text-foreground-primary truncate">
              {name}
            </h4>
            {entry.notes && (
              <span className="px-2 py-0.2 rounded-md bg-background-surface border border-border-subtle text-[10px] text-foreground-muted truncate max-w-[150px]">
                {entry.notes}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 text-xs text-foreground-muted mt-0.5">
            <Clock className="h-3 w-3" />
            <span>{timeFormatted}</span>
          </div>
        </div>
      </div>

      {/* Right: Volume in ml + Edit/Delete Actions */}
      <div className="flex items-center gap-3 shrink-0">
        <span className="text-base font-extrabold text-blue-400 font-mono">
          {entry.amountMl} <span className="text-xs text-foreground-muted font-normal">ml</span>
        </span>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onEdit(entry)}
            title="Edit entry"
            className="p-1.5 rounded-lg text-foreground-muted hover:text-foreground-primary hover:bg-background-surface transition-colors cursor-pointer"
          >
            <Edit2 className="h-3.5 w-3.5" />
          </button>

          <button
            onClick={() => onDelete(entry)}
            title="Delete entry"
            className="p-1.5 rounded-lg text-foreground-muted hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default HydrationEntryRow;
