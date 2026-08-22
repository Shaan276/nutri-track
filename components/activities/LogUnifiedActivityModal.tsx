"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Plus,
  Trash2,
  Activity,
  Dumbbell,
  Home,
  Flame,
  Clock,
  Gauge,
  Loader2,
  AlertCircle,
  Save,
  TrendingUp,
  FolderOpen,
  Check,
} from "lucide-react";
import {
  ActivityType,
  RunningType,
  HiitIntensity,
  activityTypeDisplayNames,
  activityTypeIcons,
  calculateAveragePace,
  calculateCyclingSpeed,
  formatPace,
  runningTypeDisplayNames,
} from "@/lib/validations/activity";
import { RunningTypeTooltip } from "@/components/activity/RunningTypeTooltip";
import { WorkoutType } from "@/lib/validations/workout";
import { WorkoutTemplateDto } from "@/lib/validations/workout-template";

export type SelectedCategory = ActivityType | WorkoutType;
export type PrimaryGroup = "RUNNING" | "WORKOUT" | "OTHER_GROUP";

interface LogUnifiedActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultDate?: string;
  initialCategory?: SelectedCategory;
  initialTemplateId?: string | null;
  onSuccess: () => void;
}

interface ExerciseFormState {
  id: string;
  name: string;
  category: string;
  sets: {
    setNumber: number;
    reps: string;
    weightKg: string;
    durationSeconds: string;
    notes: string;
  }[];
}

export function LogUnifiedActivityModal({
  isOpen,
  onClose,
  defaultDate,
  initialCategory = "RUN",
  initialTemplateId,
  onSuccess,
}: LogUnifiedActivityModalProps) {
  // Primary Group: RUNNING | WORKOUT | OTHER_GROUP
  const getPrimaryGroupFromCategory = (cat: SelectedCategory): PrimaryGroup => {
    if (cat === "RUN") return "RUNNING";
    if (cat === "HOME_WORKOUT" || cat === "GYM_WORKOUT") return "WORKOUT";
    return "OTHER_GROUP";
  };

  const [primaryGroup, setPrimaryGroup] = useState<PrimaryGroup>(
    getPrimaryGroupFromCategory(initialCategory)
  );
  const [category, setCategory] = useState<SelectedCategory>(initialCategory);
  const [date, setDate] = useState<string>(
    defaultDate || new Date().toISOString().split("T")[0]
  );

  // Templates from Workout Database
  const [availableTemplates, setAvailableTemplates] = useState<WorkoutTemplateDto[]>([]);
  const [isChoosingTemplate, setIsChoosingTemplate] = useState(false);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  const [selectedTemplateName, setSelectedTemplateName] = useState<string | null>(null);

  // Cardio fields
  const [runningType, setRunningType] = useState<RunningType>("EASY");
  const [distanceKm, setDistanceKm] = useState<string>("5.0");
  const [durationMinutes, setDurationMinutes] = useState<string>("25");
  const [durationSeconds, setDurationSeconds] = useState<string>("0");
  const [steps, setSteps] = useState<string>("6000");
  const [caloriesBurned, setCaloriesBurned] = useState<string>("350");
  const [elevationGainMeters, setElevationGainMeters] = useState<string>("25");
  const [hiitWorkoutName, setHiitWorkoutName] = useState<string>("Full Body HIIT Circuit");
  const [hiitIntensity, setHiitIntensity] = useState<HiitIntensity>("HIGH");
  const [otherActivityName, setOtherActivityName] = useState<string>("Yoga / Mobility");
  const [notes, setNotes] = useState<string>("");

  // Workout fields
  const [workoutName, setWorkoutName] = useState<string>("Upper Body Strength");
  const [workoutDurationMinutes, setWorkoutDurationMinutes] = useState<string>("45");
  const [workoutCalories, setWorkoutCalories] = useState<string>("300");
  const [exercises, setExercises] = useState<ExerciseFormState[]>([
    {
      id: "ex_1",
      name: "Barbell Bench Press",
      category: "Chest",
      sets: [
        { setNumber: 1, reps: "12", weightKg: "40", durationSeconds: "", notes: "" },
        { setNumber: 2, reps: "10", weightKg: "50", durationSeconds: "", notes: "" },
        { setNumber: 3, reps: "8", weightKg: "55", durationSeconds: "", notes: "" },
      ],
    },
  ]);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load template helper
  const loadTemplateIntoSession = (tpl: WorkoutTemplateDto) => {
    setWorkoutName(tpl.name);
    setCategory(tpl.workoutType);
    setSelectedTemplateName(tpl.name);
    setExercises(
      tpl.exercises.map((ex, exIdx) => ({
        id: `ex_${Date.now()}_${exIdx}`,
        name: ex.name,
        category: ex.category || "",
        sets: Array.from({ length: ex.defaultSets || 3 }, (_, sIdx) => ({
          setNumber: sIdx + 1,
          reps: ex.defaultReps !== null && ex.defaultReps !== undefined ? String(ex.defaultReps) : "10",
          weightKg: ex.defaultWeightKg !== null && ex.defaultWeightKg !== undefined ? String(ex.defaultWeightKg) : "",
          durationSeconds: ex.defaultDurationSeconds !== null && ex.defaultDurationSeconds !== undefined ? String(ex.defaultDurationSeconds) : "",
          notes: ex.notes || "",
        })),
      }))
    );
    setIsChoosingTemplate(false);
  };

  // Fetch templates when modal opens
  useEffect(() => {
    if (isOpen) {
      const pGroup = getPrimaryGroupFromCategory(initialCategory);
      setPrimaryGroup(pGroup);
      setCategory(initialCategory);
      setDate(defaultDate || new Date().toISOString().split("T")[0]);
      setError(null);
      setSelectedTemplateName(null);

      // Fetch saved templates
      const fetchTemplates = async () => {
        setIsLoadingTemplates(true);
        try {
          const res = await fetch("/api/workout-templates");
          if (res.ok) {
            const json = await res.json();
            setAvailableTemplates(json.data || []);

            // If initialTemplateId is provided, auto-load it
            if (initialTemplateId) {
              const matched = (json.data || []).find((t: WorkoutTemplateDto) => t.id === initialTemplateId);
              if (matched) {
                loadTemplateIntoSession(matched);
              }
            }
          }
        } catch (e) {
          console.error("Failed to load workout templates:", e);
        } finally {
          setIsLoadingTemplates(false);
        }
      };

      fetchTemplates();
    }
  }, [isOpen, defaultDate, initialCategory, initialTemplateId]);

  if (!isOpen) return null;

  const handlePrimaryGroupSwitch = (group: PrimaryGroup) => {
    setPrimaryGroup(group);
    setError(null);
    if (group === "RUNNING") {
      setCategory("RUN");
    } else if (group === "WORKOUT") {
      setCategory("GYM_WORKOUT");
    } else if (group === "OTHER_GROUP") {
      setCategory("WALK");
    }
  };

  const handleCategorySwitch = (newCat: SelectedCategory) => {
    setCategory(newCat);
    setError(null);
    setSelectedTemplateName(null);

    if (newCat === "HOME_WORKOUT") {
      setWorkoutName("Morning Calisthenics & Core");
      setWorkoutDurationMinutes("30");
      setWorkoutCalories("220");
      setExercises([
        {
          id: "ex_1",
          name: "Push-ups",
          category: "Chest / Bodyweight",
          sets: [
            { setNumber: 1, reps: "20", weightKg: "", durationSeconds: "", notes: "" },
            { setNumber: 2, reps: "18", weightKg: "", durationSeconds: "", notes: "" },
            { setNumber: 3, reps: "15", weightKg: "", durationSeconds: "", notes: "" },
          ],
        },
        {
          id: "ex_2",
          name: "Plank Hold",
          category: "Core",
          sets: [
            { setNumber: 1, reps: "", weightKg: "", durationSeconds: "60", notes: "" },
            { setNumber: 2, reps: "", weightKg: "", durationSeconds: "45", notes: "" },
          ],
        },
      ]);
    } else if (newCat === "GYM_WORKOUT") {
      setWorkoutName("Push Day Hypertrophy");
      setWorkoutDurationMinutes("50");
      setWorkoutCalories("350");
      setExercises([
        {
          id: "ex_1",
          name: "Barbell Bench Press",
          category: "Chest",
          sets: [
            { setNumber: 1, reps: "12", weightKg: "50", durationSeconds: "", notes: "" },
            { setNumber: 2, reps: "10", weightKg: "55", durationSeconds: "", notes: "" },
            { setNumber: 3, reps: "8", weightKg: "60", durationSeconds: "", notes: "" },
          ],
        },
      ]);
    }
  };

  // Workout Exercise & Set Handlers
  const handleAddExercise = (presetName?: string, isPlank?: boolean) => {
    const isHome = category === "HOME_WORKOUT";
    const newEx: ExerciseFormState = {
      id: `ex_${Date.now()}`,
      name: presetName || (isHome ? "Bodyweight Squats" : "Incline Dumbbell Press"),
      category: isHome ? "Bodyweight" : "Chest",
      sets: [
        {
          setNumber: 1,
          reps: isPlank ? "" : isHome ? "20" : "10",
          weightKg: isHome ? "" : "20",
          durationSeconds: isPlank ? "45" : "",
          notes: "",
        },
      ],
    };
    setExercises([...exercises, newEx]);
  };

  const handleRemoveExercise = (exId: string) => {
    if (exercises.length <= 1) {
      setError("A workout session must contain at least 1 exercise.");
      return;
    }
    setExercises(exercises.filter((e) => e.id !== exId));
  };

  const handleAddSet = (exIndex: number) => {
    const updated = [...exercises];
    const targetEx = updated[exIndex];
    const newSetNum = targetEx.sets.length + 1;
    const prevSet = targetEx.sets[targetEx.sets.length - 1];

    targetEx.sets.push({
      setNumber: newSetNum,
      reps: prevSet ? prevSet.reps : "10",
      weightKg: prevSet ? prevSet.weightKg : "",
      durationSeconds: prevSet ? prevSet.durationSeconds : "",
      notes: "",
    });
    setExercises(updated);
  };

  const handleRemoveSet = (exIndex: number, setIndex: number) => {
    const updated = [...exercises];
    if (updated[exIndex].sets.length <= 1) {
      setError("Each exercise must have at least 1 set.");
      return;
    }
    updated[exIndex].sets.splice(setIndex, 1);
    updated[exIndex].sets.forEach((s, idx) => {
      s.setNumber = idx + 1;
    });
    setExercises(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (category === "HOME_WORKOUT" || category === "GYM_WORKOUT") {
        if (!workoutName.trim()) {
          setError("Please provide a workout session name.");
          setIsLoading(false);
          return;
        }

        const payload = {
          workoutType: category,
          name: workoutName.trim(),
          date,
          durationSeconds: (parseInt(workoutDurationMinutes, 10) || 0) * 60,
          caloriesBurned: parseInt(workoutCalories, 10) || 0,
          notes: notes.trim() ? notes.trim() : null,
          exercises: exercises.map((ex, idx) => ({
            name: ex.name.trim() || `Exercise ${idx + 1}`,
            category: ex.category.trim() ? ex.category.trim() : null,
            orderIndex: idx,
            sets: ex.sets.map((s) => ({
              setNumber: s.setNumber,
              reps: s.reps.trim() ? parseInt(s.reps, 10) : null,
              weightKg: s.weightKg.trim() ? parseFloat(s.weightKg) : null,
              durationSeconds: s.durationSeconds.trim() ? parseInt(s.durationSeconds, 10) : null,
              notes: s.notes.trim() ? s.notes.trim() : null,
            })),
          })),
        };

        const res = await fetch("/api/workouts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Failed to save workout session.");
          return;
        }

        onSuccess();
        onClose();
      } else {
        // Cardio Activity
        const dist = category === "HIIT" ? 0 : parseFloat(distanceKm) || 0;
        const durSec =
          (parseInt(durationMinutes, 10) || 0) * 60 +
          (parseInt(durationSeconds, 10) || 0);

        if (durSec <= 0) {
          setError("Duration must be greater than 0 seconds.");
          setIsLoading(false);
          return;
        }

        let activityNameNotes = notes.trim();
        if (category === "HIIT" && hiitWorkoutName.trim()) {
          activityNameNotes = `[HIIT: ${hiitWorkoutName.trim()} | Intensity: ${hiitIntensity}] ${activityNameNotes}`.trim();
        } else if (category === "OTHER" && otherActivityName.trim()) {
          activityNameNotes = `[Activity: ${otherActivityName.trim()}] ${activityNameNotes}`.trim();
        }

        const payload = {
          activityType: category,
          runningType: category === "RUN" ? runningType : null,
          date,
          distanceKm: dist,
          movingDurationSeconds: durSec,
          steps: parseInt(steps, 10) || 0,
          caloriesBurned: parseInt(caloriesBurned, 10) || 0,
          elevationGainMeters: parseInt(elevationGainMeters, 10) || 0,
          notes: activityNameNotes || null,
        };

        const res = await fetch("/api/activity", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Failed to log activity.");
          return;
        }

        onSuccess();
        onClose();
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const parsedDist = parseFloat(distanceKm) || 0;
  const parsedDurSec =
    (parseInt(durationMinutes, 10) || 0) * 60 +
    (parseInt(durationSeconds, 10) || 0);
  const livePace = calculateAveragePace(parsedDist, parsedDurSec);
  const liveSpeed = calculateCyclingSpeed(parsedDist, parsedDurSec);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 animate-fade-in">
      <div className="relative w-full max-w-2xl bg-background-surface border border-border-default rounded-3xl p-5 sm:p-7 shadow-2xl space-y-5 text-left max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border-subtle pb-4 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-brand-500/15 text-brand-400 border border-brand-500/30">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-foreground-primary tracking-tight">
                Log Physical Activity
              </h3>
              <p className="text-xs text-foreground-muted font-medium">
                Record your runs, workouts, and training sessions in PostgreSQL
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-foreground-muted hover:text-foreground-primary hover:bg-background-elevated transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-2 shrink-0">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* PRIMARY GROUP SELECTION (Running | Workout | Other Activities) */}
        <div className="grid grid-cols-3 gap-2 p-1.5 rounded-2xl bg-background-elevated/70 border border-border-subtle shrink-0">
          <button
            type="button"
            onClick={() => handlePrimaryGroupSwitch("RUNNING")}
            className={`py-2.5 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
              primaryGroup === "RUNNING"
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-sm"
                : "text-foreground-muted hover:text-foreground-primary"
            }`}
          >
            <span>🏃</span>
            <span>Running</span>
          </button>

          <button
            type="button"
            onClick={() => handlePrimaryGroupSwitch("WORKOUT")}
            className={`py-2.5 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
              primaryGroup === "WORKOUT"
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-sm"
                : "text-foreground-muted hover:text-foreground-primary"
            }`}
          >
            <span>🏋️</span>
            <span>Workout</span>
          </button>

          <button
            type="button"
            onClick={() => handlePrimaryGroupSwitch("OTHER_GROUP")}
            className={`py-2.5 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
              primaryGroup === "OTHER_GROUP"
                ? "bg-blue-500/20 text-blue-300 border border-blue-500/50 shadow-sm"
                : "text-foreground-muted hover:text-foreground-primary"
            }`}
          >
            <span>⋯</span>
            <span>Other Activities</span>
          </button>
        </div>

        {/* SECONDARY SELECTION: WORKOUT (Home / Gym / Choose Template) */}
        {primaryGroup === "WORKOUT" && (
          <div className="space-y-2 shrink-0">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCategorySwitch("GYM_WORKOUT")}
                  className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    category === "GYM_WORKOUT"
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                      : "bg-background-elevated text-foreground-secondary border border-border-subtle"
                  }`}
                >
                  <Dumbbell className="h-3.5 w-3.5" />
                  <span>Gym Workout</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleCategorySwitch("HOME_WORKOUT")}
                  className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    category === "HOME_WORKOUT"
                      ? "bg-purple-500/20 text-purple-300 border border-purple-500/40"
                      : "bg-background-elevated text-foreground-secondary border border-border-subtle"
                  }`}
                >
                  <Home className="h-3.5 w-3.5" />
                  <span>Home Workout</span>
                </button>
              </div>

              {/* Template Selector Button */}
              <button
                type="button"
                onClick={() => setIsChoosingTemplate(!isChoosingTemplate)}
                className="py-1.5 px-3 rounded-xl bg-brand-500/15 hover:bg-brand-500/25 border border-brand-500/40 text-brand-300 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all"
              >
                <FolderOpen className="h-3.5 w-3.5 text-brand-400" />
                <span>{selectedTemplateName ? `Loaded: ${selectedTemplateName}` : "Choose from Workout Database"}</span>
              </button>
            </div>

            {/* Template Selection Dropdown Panel */}
            {isChoosingTemplate && (
              <div className="p-3.5 rounded-2xl bg-background-elevated border border-brand-500/40 space-y-2 animate-fade-in max-h-44 overflow-y-auto">
                <div className="flex items-center justify-between pb-1 border-b border-border-subtle">
                  <span className="text-[11px] font-bold text-brand-400 uppercase tracking-wider">
                    Select a Saved Workout Routine:
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsChoosingTemplate(false)}
                    className="text-xs text-foreground-muted hover:text-foreground-primary"
                  >
                    Close
                  </button>
                </div>

                {isLoadingTemplates ? (
                  <p className="text-xs text-foreground-muted py-2">Loading routines...</p>
                ) : availableTemplates.length === 0 ? (
                  <p className="text-xs text-foreground-muted py-2">
                    No workout blueprints created yet in the Workout Database.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {availableTemplates.map((tpl) => (
                      <button
                        key={tpl.id}
                        type="button"
                        onClick={() => loadTemplateIntoSession(tpl)}
                        className="p-2.5 rounded-xl bg-background-surface hover:bg-brand-500/10 border border-border-subtle hover:border-brand-500/40 text-left transition-all flex items-center justify-between cursor-pointer"
                      >
                        <div className="truncate">
                          <p className="text-xs font-bold text-foreground-primary truncate">
                            {tpl.name}
                          </p>
                          <p className="text-[10px] text-foreground-muted font-medium">
                            {tpl.workoutType === "HOME_WORKOUT" ? "🏠 Home" : "🏋️ Gym"} &bull; {tpl.totalExercises} exercises
                          </p>
                        </div>
                        <Check className="h-3.5 w-3.5 text-brand-400 shrink-0 ml-2" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* SECONDARY SELECTION: OTHER ACTIVITIES (Walking | Cycling | HIIT | Other) */}
        {primaryGroup === "OTHER_GROUP" && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 shrink-0">
            {[
              { type: "WALK" as SelectedCategory, label: "Walking", icon: "🚶" },
              { type: "CYCLING" as SelectedCategory, label: "Cycling", icon: "🚴" },
              { type: "HIIT" as SelectedCategory, label: "HIIT", icon: "🔥" },
              { type: "OTHER" as SelectedCategory, label: "Other", icon: "➕" },
            ].map((sub) => (
              <button
                key={sub.type}
                type="button"
                onClick={() => setCategory(sub.type)}
                className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                  category === sub.type
                    ? "bg-blue-500/20 text-blue-300 border border-blue-500/40"
                    : "bg-background-elevated text-foreground-secondary border border-border-subtle"
                }`}
              >
                <span>{sub.icon}</span>
                <span>{sub.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* Dynamic Form Content */}
        <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto pr-1 flex-1">
          {/* Date Selector */}
          <div>
            <label className="block text-xs font-bold text-foreground-secondary uppercase tracking-wider mb-1.5">
              Activity Date *
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-background-elevated border border-border-default text-foreground-primary text-xs font-bold focus:outline-none focus:border-brand-500"
            />
          </div>

          {/* ======================= RUNNING SECTION ======================= */}
          {category === "RUN" && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-foreground-secondary uppercase tracking-wider">
                  Run Type *
                </label>
                <RunningTypeTooltip />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { type: "EASY" as RunningType, label: "Easy Run", emoji: "🟢" },
                  { type: "LONG" as RunningType, label: "Long Run", emoji: "🏃‍♂️" },
                  { type: "TEMPO" as RunningType, label: "Tempo Run", emoji: "⚡" },
                  { type: "INTERVAL" as RunningType, label: "Interval Run", emoji: "⏱️" },
                  { type: "RECOVERY" as RunningType, label: "Recovery", emoji: "🧘" },
                  { type: "RACE" as RunningType, label: "Race Run", emoji: "🏁" },
                  { type: "OTHER" as RunningType, label: "Other", emoji: "👟" },
                ].map((item) => (
                  <button
                    key={item.type}
                    type="button"
                    onClick={() => setRunningType(item.type)}
                    className={`py-2 px-2.5 rounded-xl text-xs font-bold text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      runningType === item.type
                        ? "bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-sm"
                        : "bg-background-elevated text-foreground-secondary hover:text-foreground-primary border border-border-subtle"
                    }`}
                  >
                    <span>{item.emoji}</span>
                    <span className="truncate">{item.label}</span>
                  </button>
                ))}
              </div>

              {/* Distance and Duration */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-foreground-secondary uppercase tracking-wider mb-1.5">
                    Distance (km) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.1"
                    required
                    value={distanceKm}
                    onChange={(e) => setDistanceKm(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-background-elevated border border-border-default text-foreground-primary text-xs font-mono font-bold focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground-secondary uppercase tracking-wider mb-1.5">
                    Duration (Minutes : Seconds) *
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      required
                      value={durationMinutes}
                      onChange={(e) => setDurationMinutes(e.target.value)}
                      placeholder="Min"
                      className="w-1/2 px-3 py-2.5 rounded-xl bg-background-elevated border border-border-default text-foreground-primary text-xs font-mono font-bold focus:outline-none focus:border-brand-500 text-center"
                    />
                    <span className="text-foreground-muted font-bold">:</span>
                    <input
                      type="number"
                      min="0"
                      max="59"
                      required
                      value={durationSeconds}
                      onChange={(e) => setDurationSeconds(e.target.value)}
                      placeholder="Sec"
                      className="w-1/2 px-3 py-2.5 rounded-xl bg-background-elevated border border-border-default text-foreground-primary text-xs font-mono font-bold focus:outline-none focus:border-brand-500 text-center"
                    />
                  </div>
                </div>
              </div>

              {/* Live Running Pace Banner */}
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-400">
                  <Gauge className="h-4 w-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">
                    Calculated Pace:
                  </span>
                </div>
                <span className="text-sm font-mono font-black text-amber-300">
                  {formatPace(livePace)}
                </span>
              </div>

              {/* Secondary Running Telemetry */}
              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-[10px] font-bold text-foreground-muted uppercase tracking-wider mb-1">
                    Steps
                  </label>
                  <input
                    type="number"
                    value={steps}
                    onChange={(e) => setSteps(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl bg-background-elevated border border-border-default text-foreground-primary text-xs font-mono focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-foreground-muted uppercase tracking-wider mb-1">
                    Calories (kcal)
                  </label>
                  <input
                    type="number"
                    value={caloriesBurned}
                    onChange={(e) => setCaloriesBurned(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl bg-background-elevated border border-border-default text-foreground-primary text-xs font-mono focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-foreground-muted uppercase tracking-wider mb-1">
                    Elevation (m)
                  </label>
                  <input
                    type="number"
                    value={elevationGainMeters}
                    onChange={(e) => setElevationGainMeters(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl bg-background-elevated border border-border-default text-foreground-primary text-xs font-mono focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ======================= CYCLING SECTION ======================= */}
          {category === "CYCLING" && (
            <div className="space-y-4 animate-fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-foreground-secondary uppercase tracking-wider mb-1.5">
                    Cycling Distance (km) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.1"
                    required
                    value={distanceKm}
                    onChange={(e) => setDistanceKm(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-background-elevated border border-border-default text-foreground-primary text-xs font-mono font-bold focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground-secondary uppercase tracking-wider mb-1.5">
                    Duration (Minutes : Seconds) *
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      required
                      value={durationMinutes}
                      onChange={(e) => setDurationMinutes(e.target.value)}
                      placeholder="Min"
                      className="w-1/2 px-3 py-2.5 rounded-xl bg-background-elevated border border-border-default text-foreground-primary text-xs font-mono font-bold focus:outline-none focus:border-brand-500 text-center"
                    />
                    <span className="text-foreground-muted font-bold">:</span>
                    <input
                      type="number"
                      min="0"
                      max="59"
                      required
                      value={durationSeconds}
                      onChange={(e) => setDurationSeconds(e.target.value)}
                      placeholder="Sec"
                      className="w-1/2 px-3 py-2.5 rounded-xl bg-background-elevated border border-border-default text-foreground-primary text-xs font-mono font-bold focus:outline-none focus:border-brand-500 text-center"
                    />
                  </div>
                </div>
              </div>

              {/* Live Speed Banner */}
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-400">
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">
                    Calculated Average Speed:
                  </span>
                </div>
                <span className="text-sm font-mono font-black text-amber-300">
                  {liveSpeed > 0 ? `${liveSpeed.toFixed(1)} km/h` : "--"}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-foreground-secondary uppercase tracking-wider mb-1.5">
                    Calories Burned (kcal)
                  </label>
                  <input
                    type="number"
                    value={caloriesBurned}
                    onChange={(e) => setCaloriesBurned(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-background-elevated border border-border-default text-foreground-primary text-xs font-mono focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-foreground-secondary uppercase tracking-wider mb-1.5">
                    Elevation Gain (m)
                  </label>
                  <input
                    type="number"
                    value={elevationGainMeters}
                    onChange={(e) => setElevationGainMeters(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-background-elevated border border-border-default text-foreground-primary text-xs font-mono focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ======================= WALKING SECTION ======================= */}
          {category === "WALK" && (
            <div className="space-y-4 animate-fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-foreground-secondary uppercase tracking-wider mb-1.5">
                    Walking Distance (km) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.1"
                    required
                    value={distanceKm}
                    onChange={(e) => setDistanceKm(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-background-elevated border border-border-default text-foreground-primary text-xs font-mono font-bold focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground-secondary uppercase tracking-wider mb-1.5">
                    Duration (Minutes) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-background-elevated border border-border-default text-foreground-primary text-xs font-mono font-bold focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-[10px] font-bold text-foreground-muted uppercase tracking-wider mb-1">
                    Step Count
                  </label>
                  <input
                    type="number"
                    value={steps}
                    onChange={(e) => setSteps(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl bg-background-elevated border border-border-default text-foreground-primary text-xs font-mono focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-foreground-muted uppercase tracking-wider mb-1">
                    Calories (kcal)
                  </label>
                  <input
                    type="number"
                    value={caloriesBurned}
                    onChange={(e) => setCaloriesBurned(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl bg-background-elevated border border-border-default text-foreground-primary text-xs font-mono focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-foreground-muted uppercase tracking-wider mb-1">
                    Elevation (m)
                  </label>
                  <input
                    type="number"
                    value={elevationGainMeters}
                    onChange={(e) => setElevationGainMeters(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl bg-background-elevated border border-border-default text-foreground-primary text-xs font-mono focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ======================= HIIT SECTION ======================= */}
          {category === "HIIT" && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <label className="block text-xs font-bold text-foreground-secondary uppercase tracking-wider mb-1.5">
                  HIIT Session Name *
                </label>
                <input
                  type="text"
                  required
                  value={hiitWorkoutName}
                  onChange={(e) => setHiitWorkoutName(e.target.value)}
                  placeholder="e.g. Tabata Intervals, Full Body Burn"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background-elevated border border-border-default text-foreground-primary text-xs font-bold focus:outline-none focus:border-brand-500"
                />
              </div>

              {/* Intensity Selector */}
              <div>
                <label className="block text-xs font-bold text-foreground-secondary uppercase tracking-wider mb-1.5">
                  Intensity Level *
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { level: "LOW" as HiitIntensity, label: "Low", emoji: "🟢" },
                    { level: "MODERATE" as HiitIntensity, label: "Moderate", emoji: "🟡" },
                    { level: "HIGH" as HiitIntensity, label: "High", emoji: "🟠" },
                    { level: "VERY_HIGH" as HiitIntensity, label: "Max Effort", emoji: "🔴" },
                  ].map((item) => (
                    <button
                      key={item.level}
                      type="button"
                      onClick={() => setHiitIntensity(item.level)}
                      className={`py-2 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex flex-col items-center gap-0.5 ${
                        hiitIntensity === item.level
                          ? "bg-rose-500/20 text-rose-300 border border-rose-500/50 shadow-sm"
                          : "bg-background-elevated text-foreground-secondary border border-border-subtle"
                      }`}
                    >
                      <span className="text-sm">{item.emoji}</span>
                      <span className="text-[10px] truncate">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-foreground-secondary uppercase tracking-wider mb-1.5">
                    Duration (Minutes) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-background-elevated border border-border-default text-foreground-primary text-xs font-mono font-bold focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground-secondary uppercase tracking-wider mb-1.5">
                    Calories Burned (kcal) *
                  </label>
                  <input
                    type="number"
                    required
                    value={caloriesBurned}
                    onChange={(e) => setCaloriesBurned(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-background-elevated border border-border-default text-foreground-primary text-xs font-mono font-bold focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ======================= OTHER ACTIVITY SECTION ======================= */}
          {category === "OTHER" && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <label className="block text-xs font-bold text-foreground-secondary uppercase tracking-wider mb-1.5">
                  Activity Name / Sport *
                </label>
                <input
                  type="text"
                  required
                  value={otherActivityName}
                  onChange={(e) => setOtherActivityName(e.target.value)}
                  placeholder="e.g. Yoga, Swimming, Rock Climbing"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background-elevated border border-border-default text-foreground-primary text-xs font-bold focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-foreground-secondary uppercase tracking-wider mb-1.5">
                    Duration (Minutes) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-background-elevated border border-border-default text-foreground-primary text-xs font-mono font-bold focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground-secondary uppercase tracking-wider mb-1.5">
                    Calories Burned (kcal)
                  </label>
                  <input
                    type="number"
                    value={caloriesBurned}
                    onChange={(e) => setCaloriesBurned(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-background-elevated border border-border-default text-foreground-primary text-xs font-mono focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ======================= WORKOUT SESSION SECTION ======================= */}
          {(category === "HOME_WORKOUT" || category === "GYM_WORKOUT") && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <label className="block text-xs font-bold text-foreground-secondary uppercase tracking-wider mb-1.5">
                  Workout Session Name *
                </label>
                <input
                  type="text"
                  required
                  value={workoutName}
                  onChange={(e) => setWorkoutName(e.target.value)}
                  placeholder={category === "HOME_WORKOUT" ? "e.g. Morning Bodyweight Circuit" : "e.g. Push Day Heavy Bench"}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background-elevated border border-border-default text-foreground-primary text-xs font-bold focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-foreground-secondary uppercase tracking-wider mb-1.5">
                    Duration (Minutes) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={workoutDurationMinutes}
                    onChange={(e) => setWorkoutDurationMinutes(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-background-elevated border border-border-default text-foreground-primary text-xs font-mono font-bold focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground-secondary uppercase tracking-wider mb-1.5">
                    Calories Burned (kcal)
                  </label>
                  <input
                    type="number"
                    value={workoutCalories}
                    onChange={(e) => setWorkoutCalories(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-background-elevated border border-border-default text-foreground-primary text-xs font-mono focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              {/* Quick Exercise Presets */}
              <div>
                <span className="block text-[11px] font-bold text-foreground-muted uppercase tracking-wider mb-1.5">
                  + Add Preset Exercises:
                </span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {(category === "HOME_WORKOUT"
                    ? ["Push-ups", "Plank Hold", "Bodyweight Squats", "Lunges", "Burpees", "Sit-ups"]
                    : ["Barbell Bench Press", "Incline Dumbbell Press", "Barbell Squats", "Deadlift", "Overhead Press", "Barbell Row"]
                  ).map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => handleAddExercise(preset, preset.toLowerCase().includes("plank"))}
                      className="px-2.5 py-1 rounded-lg bg-background-elevated text-foreground-secondary hover:text-brand-400 hover:border-brand-500/40 border border-border-subtle text-[11px] font-semibold transition-all cursor-pointer"
                    >
                      + {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Exercises & Per-Set Logging */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between border-t border-border-subtle pt-3">
                  <h4 className="text-xs font-extrabold text-foreground-primary uppercase tracking-wider">
                    Completed Exercises ({exercises.length})
                  </h4>

                  <button
                    type="button"
                    onClick={() => handleAddExercise()}
                    className="py-1.5 px-3 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>+ Custom Exercise</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {exercises.map((ex, exIdx) => (
                    <div
                      key={ex.id}
                      className="p-3.5 rounded-2xl bg-background-elevated border border-border-subtle space-y-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <input
                            type="text"
                            required
                            value={ex.name}
                            onChange={(e) => {
                              const updated = [...exercises];
                              updated[exIdx].name = e.target.value;
                              setExercises(updated);
                            }}
                            placeholder="Exercise Name"
                            className="px-3 py-1.5 rounded-lg bg-background-surface border border-border-default text-foreground-primary text-xs font-bold focus:outline-none focus:border-brand-500"
                          />
                          <input
                            type="text"
                            value={ex.category}
                            onChange={(e) => {
                              const updated = [...exercises];
                              updated[exIdx].category = e.target.value;
                              setExercises(updated);
                            }}
                            placeholder="Muscle / Category"
                            className="px-3 py-1.5 rounded-lg bg-background-surface border border-border-default text-foreground-secondary text-xs focus:outline-none focus:border-brand-500"
                          />
                        </div>

                        {exercises.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveExercise(ex.id)}
                            className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/20 transition-colors cursor-pointer shrink-0"
                            title="Remove Exercise"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>

                      {/* Sets Table */}
                      <div className="space-y-1.5">
                        <div className="grid grid-cols-12 gap-2 px-1 text-[10px] font-black text-foreground-muted uppercase tracking-wider">
                          <span className="col-span-2 text-center">Set</span>
                          <span className="col-span-3 text-center">Reps</span>
                          {category === "GYM_WORKOUT" ? (
                            <span className="col-span-3 text-center">Weight (kg)</span>
                          ) : (
                            <span className="col-span-3 text-center">Duration (s)</span>
                          )}
                          <span className="col-span-3">Notes</span>
                          <span className="col-span-1"></span>
                        </div>

                        {ex.sets.map((st, stIdx) => (
                          <div
                            key={st.setNumber}
                            className="grid grid-cols-12 gap-2 items-center text-xs"
                          >
                            <div className="col-span-2 text-center font-mono font-extrabold text-foreground-muted">
                              #{st.setNumber}
                            </div>
                            <div className="col-span-3">
                              <input
                                type="number"
                                min="0"
                                value={st.reps}
                                onChange={(e) => {
                                  const updated = [...exercises];
                                  updated[exIdx].sets[stIdx].reps = e.target.value;
                                  setExercises(updated);
                                }}
                                placeholder="10"
                                className="w-full px-2 py-1 rounded-lg bg-background-surface border border-border-default text-foreground-primary text-xs font-mono font-bold text-center focus:outline-none focus:border-brand-500"
                              />
                            </div>
                            <div className="col-span-3">
                              {category === "GYM_WORKOUT" ? (
                                <input
                                  type="number"
                                  step="0.5"
                                  min="0"
                                  value={st.weightKg}
                                  onChange={(e) => {
                                    const updated = [...exercises];
                                    updated[exIdx].sets[stIdx].weightKg = e.target.value;
                                    setExercises(updated);
                                  }}
                                  placeholder="50"
                                  className="w-full px-2 py-1 rounded-lg bg-background-surface border border-border-default text-foreground-primary text-xs font-mono font-bold text-center focus:outline-none focus:border-brand-500"
                                />
                              ) : (
                                <input
                                  type="number"
                                  min="0"
                                  value={st.durationSeconds}
                                  onChange={(e) => {
                                    const updated = [...exercises];
                                    updated[exIdx].sets[stIdx].durationSeconds = e.target.value;
                                    setExercises(updated);
                                  }}
                                  placeholder="45"
                                  className="w-full px-2 py-1 rounded-lg bg-background-surface border border-border-default text-foreground-primary text-xs font-mono font-bold text-center focus:outline-none focus:border-brand-500"
                                />
                              )}
                            </div>
                            <div className="col-span-3">
                              <input
                                type="text"
                                value={st.notes}
                                onChange={(e) => {
                                  const updated = [...exercises];
                                  updated[exIdx].sets[stIdx].notes = e.target.value;
                                  setExercises(updated);
                                }}
                                placeholder="notes"
                                className="w-full px-2 py-1 rounded-lg bg-background-surface border border-border-default text-foreground-secondary text-xs focus:outline-none focus:border-brand-500"
                              />
                            </div>
                            <div className="col-span-1 text-center">
                              {ex.sets.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveSet(exIdx, stIdx)}
                                  className="text-rose-400 hover:text-rose-300 p-1 cursor-pointer"
                                >
                                  &times;
                                </button>
                              )}
                            </div>
                          </div>
                        ))}

                        <button
                          type="button"
                          onClick={() => handleAddSet(exIdx)}
                          className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 mt-1 cursor-pointer flex items-center gap-1"
                        >
                          + Add Set
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Optional Notes */}
          <div>
            <label className="block text-xs font-bold text-foreground-secondary uppercase tracking-wider mb-1.5">
              Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="How did this session feel? Heart rate, conditions, RPE..."
              className="w-full px-3.5 py-2 rounded-xl bg-background-elevated border border-border-default text-foreground-primary text-xs focus:outline-none focus:border-brand-500"
            />
          </div>

          {/* Modal Actions */}
          <div className="pt-3 border-t border-border-subtle flex items-center justify-end gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 rounded-xl bg-background-elevated hover:bg-background-elevated/80 text-foreground-secondary hover:text-foreground-primary text-xs font-bold transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isLoading}
              className="py-2.5 px-5 rounded-xl bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-black font-black text-xs transition-all shadow-brand-glow flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Saving Session...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Save Activity Session</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default LogUnifiedActivityModal;
