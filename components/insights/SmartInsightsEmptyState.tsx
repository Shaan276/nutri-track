"use client";

import React from "react";
import Link from "next/link";
import { Sparkles, UtensilsCrossed, Droplets, Activity, Dumbbell, ArrowRight } from "lucide-react";

export function SmartInsightsEmptyState() {
  const starterActions = [
    {
      title: "Log a Meal",
      description: "Track breakfast, lunch, or dinner to analyze your macros & micronutrients.",
      href: "/nutrition",
      icon: UtensilsCrossed,
      color: "text-brand-400",
      bg: "bg-brand-500/15 border-brand-500/30",
    },
    {
      title: "Track Hydration",
      description: "Log your daily water intake to build a healthy hydration streak.",
      href: "/hydration",
      icon: Droplets,
      color: "text-blue-400",
      bg: "bg-blue-500/15 border-blue-500/30",
    },
    {
      title: "Record an Activity",
      description: "Log your run, walk, or cardio workout to start tracking endurance.",
      href: "/activities",
      icon: Activity,
      color: "text-emerald-400",
      bg: "bg-emerald-500/15 border-emerald-500/30",
    },
    {
      title: "Start a Workout",
      description: "Record strength training exercises, sets, reps, and tonnage volume.",
      href: "/workouts",
      icon: Dumbbell,
      color: "text-amber-400",
      bg: "bg-amber-500/15 border-amber-500/30",
    },
  ];

  return (
    <div className="p-8 sm:p-12 rounded-3xl bg-background-surface border border-border-default text-center space-y-6 shadow-surface-card animate-fade-in">
      <div className="mx-auto w-14 h-14 rounded-2xl bg-brand-500/15 border border-brand-500/30 flex items-center justify-center text-brand-400">
        <Sparkles className="h-7 w-7" />
      </div>

      <div className="max-w-lg mx-auto space-y-2">
        <h3 className="text-xl sm:text-2xl font-black text-foreground-primary tracking-tight">
          Unlock Your Smart Insights
        </h3>
        <p className="text-sm font-medium text-foreground-secondary leading-relaxed">
          Nutri-Track generates personalized, explainable insights once you start logging your daily nutrition, fluids, activities, or workouts.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto text-left pt-4">
        {starterActions.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.title}
              href={item.href}
              className="p-5 rounded-2xl bg-background-elevated border border-border-subtle hover:border-brand-500/40 transition-all flex flex-col justify-between space-y-3 cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <div className={`p-2.5 rounded-xl border ${item.bg} ${item.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <ArrowRight className="h-4 w-4 text-foreground-muted group-hover:text-brand-400 group-hover:translate-x-1 transition-all" />
              </div>

              <div>
                <h4 className="text-sm font-bold text-foreground-primary group-hover:text-brand-300 transition-colors">
                  {item.title}
                </h4>
                <p className="text-xs text-foreground-secondary mt-1 leading-snug">
                  {item.description}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
