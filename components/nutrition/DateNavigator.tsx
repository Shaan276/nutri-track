"use client";

import React from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";

interface DateNavigatorProps {
  selectedDate: string; // YYYY-MM-DD
  onDateChange: (newDate: string) => void;
}

export function DateNavigator({ selectedDate, onDateChange }: DateNavigatorProps) {
  const currentDateObj = new Date(selectedDate + "T00:00:00");
  const todayStr = new Date().toISOString().split("T")[0];
  const isToday = selectedDate === todayStr;

  const handlePrevDay = () => {
    const d = new Date(currentDateObj);
    d.setDate(d.getDate() - 1);
    onDateChange(d.toISOString().split("T")[0]);
  };

  const handleNextDay = () => {
    const d = new Date(currentDateObj);
    d.setDate(d.getDate() + 1);
    onDateChange(d.toISOString().split("T")[0]);
  };

  const handleToday = () => {
    onDateChange(todayStr);
  };

  const formattedDate = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(currentDateObj);

  return (
    <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3 bg-background-surface border border-border-default rounded-2xl p-3 sm:px-4 shadow-sm">
      {/* Navigation Buttons */}
      <div className="flex items-center gap-1.5 w-full sm:w-auto justify-between sm:justify-start">
        <button
          onClick={handlePrevDay}
          title="Previous Day"
          className="p-2 rounded-xl bg-background-elevated/70 hover:bg-background-elevated text-foreground-secondary hover:text-foreground-primary border border-border-subtle transition-colors cursor-pointer"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-2 px-2">
          <CalendarIcon className="h-4 w-4 text-brand-400" />
          <span className="text-sm font-bold text-foreground-primary tracking-tight">
            {formattedDate}
          </span>
          {isToday && (
            <span className="px-2 py-0.5 rounded-md bg-brand-500/20 text-brand-400 text-[10px] font-bold uppercase tracking-wider">
              Today
            </span>
          )}
        </div>

        <button
          onClick={handleNextDay}
          title="Next Day"
          className="p-2 rounded-xl bg-background-elevated/70 hover:bg-background-elevated text-foreground-secondary hover:text-foreground-primary border border-border-subtle transition-colors cursor-pointer"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Date Picker & Jump to Today */}
      <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => e.target.value && onDateChange(e.target.value)}
          className="px-3 py-1.5 bg-background-elevated/70 border border-border-subtle rounded-xl text-foreground-primary text-xs font-semibold focus:outline-none focus:border-brand-500 transition-colors cursor-pointer"
        />

        {!isToday && (
          <button
            onClick={handleToday}
            className="px-3 py-1.5 bg-brand-500/15 hover:bg-brand-500/25 text-brand-400 border border-brand-500/30 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Jump to Today
          </button>
        )}
      </div>
    </div>
  );
}

export default DateNavigator;
