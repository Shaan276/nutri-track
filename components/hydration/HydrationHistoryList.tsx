"use client";

import React from "react";
import { Droplets, Clock } from "lucide-react";
import { HydrationEntryDto } from "@/lib/services/hydration.service";
import { HydrationEntryRow } from "./HydrationEntryRow";

interface HydrationHistoryListProps {
  entries: HydrationEntryDto[];
  onEdit: (entry: HydrationEntryDto) => void;
  onDelete: (entry: HydrationEntryDto) => void;
  onOpenCustomLog: () => void;
}

export function HydrationHistoryList({
  entries,
  onEdit,
  onDelete,
  onOpenCustomLog,
}: HydrationHistoryListProps) {
  const count = entries.length;

  return (
    <div className="w-full bg-background-surface border border-border-default rounded-3xl p-5 sm:p-6 shadow-surface-card space-y-4 text-left">
      <div className="flex items-center justify-between border-b border-border-subtle pb-3.5">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-blue-400" />
          <h3 className="text-base font-bold text-foreground-primary tracking-tight">
            Today&apos;s Fluid Timeline
          </h3>
        </div>

        <span className="px-2.5 py-0.5 rounded-full bg-background-elevated border border-border-subtle text-xs font-bold text-foreground-secondary font-mono">
          {count} {count === 1 ? "entry" : "entries"}
        </span>
      </div>

      {count === 0 ? (
        <div className="py-12 px-4 text-center rounded-2xl bg-background-elevated/20 border border-dashed border-border-subtle flex flex-col items-center justify-center space-y-2.5">
          <Droplets className="h-7 w-7 text-blue-400/40" />
          <p className="text-xs font-semibold text-foreground-muted">
            No fluid intake recorded for this day yet.
          </p>
          <button
            onClick={onOpenCustomLog}
            className="text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
          >
            + Log First Drink
          </button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {entries.map((entry) => (
            <HydrationEntryRow
              key={entry.id}
              entry={entry}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default HydrationHistoryList;
