"use client";

import React, { useState, useTransition } from "react";
import {
  User,
  Flame,
  Dna,
  Droplets,
  Activity,
  Sparkles,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Calculator,
  RefreshCw,
  FileSpreadsheet,
  Target,
  Dumbbell,
  Footprints,
  Info,
  ShieldCheck,
  Lock,
  Users,
  Globe,
  Apple,
  LineChart,
  UtensilsCrossed,
  Bell,
  Moon,
  Clock,
} from "lucide-react";
import { UserSettingsResponse } from "@/lib/services/user-settings.service";
import {
  BiologicalSex,
  ActivityLevel,
} from "@/lib/validations/profile";
import {
  PrimaryGoal,
  primaryGoalDisplayNames,
  calculateMetabolicTargets,
  calculateAge,
} from "@/lib/validations/settings";
import {
  UserGranularPrivacyDto,
  PrivacyVisibility,
  DEFAULT_GRANULAR_PRIVACY,
} from "@/lib/validations/privacy";
import { ConnectedServicesSection } from "@/components/settings/ConnectedServicesSection";
import Link from "next/link";

interface SettingsHubClientProps {
  initialSettings: UserSettingsResponse;
}

type TabKey = "PROFILE" | "NUTRITION" | "ACTIVITY" | "MICRONUTRIENTS" | "NOTIFICATIONS" | "PRIVACY" | "SYNC";

const activityDescriptions: Record<ActivityLevel, string> = {
  SEDENTARY: "Little to no exercise, desk job (1.2x)",
  LIGHTLY_ACTIVE: "Light exercise/sports 1-3 days/week (1.375x)",
  MODERATELY_ACTIVE: "Moderate exercise/sports 3-5 days/week (1.55x)",
  VERY_ACTIVE: "Heavy exercise/sports 6-7 days/week (1.725x)",
  EXTREMELY_ACTIVE: "Very hard training, physical job or 2x/day (1.9x)",
};

interface ProfileFormData {
  dateOfBirth: string;
  biologicalSex: BiologicalSex;
  heightCm: number | string;
  weightKg: number | string;
  activityLevel: ActivityLevel;
  primaryGoal: PrimaryGoal;
  dailyHydrationTargetMl: number;
  dailyStepTarget: number;
  weeklyRunningDistanceKm: number;
  weeklyWorkoutSessions: number;
}

export function SettingsHubClient({ initialSettings }: SettingsHubClientProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("PROFILE");
  const [isPending, startTransition] = useTransition();

  // Profile Form State
  const [profileData, setProfileData] = useState<ProfileFormData>({
    dateOfBirth: initialSettings.profile?.dateOfBirth || "",
    biologicalSex: (initialSettings.profile?.biologicalSex as BiologicalSex) || "MALE",
    heightCm: initialSettings.profile?.heightCm !== null && initialSettings.profile?.heightCm !== undefined ? initialSettings.profile.heightCm : "",
    weightKg: initialSettings.profile?.weightKg !== null && initialSettings.profile?.weightKg !== undefined ? initialSettings.profile.weightKg : "",
    activityLevel: (initialSettings.profile?.activityLevel as ActivityLevel) || "MODERATELY_ACTIVE",
    primaryGoal: (initialSettings.profile?.primaryGoal as PrimaryGoal) || "MAINTAIN",
    dailyHydrationTargetMl: initialSettings.profile?.dailyHydrationTargetMl || 2500,
    dailyStepTarget: initialSettings.profile?.dailyStepTarget || 10000,
    weeklyRunningDistanceKm: initialSettings.profile?.weeklyRunningDistanceKm || 15.0,
    weeklyWorkoutSessions: initialSettings.profile?.weeklyWorkoutSessions || 3,
  });

  // Nutrition Goals Form State
  const [nutritionGoals, setNutritionGoals] = useState({
    calories: initialSettings.nutritionGoals?.calories || 2000,
    protein: initialSettings.nutritionGoals?.protein || 120,
    carbohydrates: initialSettings.nutritionGoals?.carbohydrates || 250,
    fat: initialSettings.nutritionGoals?.fat || 65,
    fiber: initialSettings.nutritionGoals?.fiber || 30,
    sugar: initialSettings.nutritionGoals?.sugar || 35,
  });

  // Notification Preferences State
  const [notifPrefs, setNotifPrefs] = useState({
    hydrationReminders: true,
    nutritionReminders: true,
    workoutReminders: false,
    activityReminders: true,
    friendNotifications: true,
    insightNotifications: true,
    featureRequestNotifications: true,
    systemNotifications: true,
    quietHoursEnabled: false,
    quietHoursStart: "22:00",
    quietHoursEnd: "08:00",
    reminderFrequency: "MODERATE",
  });

  // Granular Privacy & Sharing Form State (8 categories)
  const [privacySettings, setPrivacySettings] = useState<UserGranularPrivacyDto>({
    ...DEFAULT_GRANULAR_PRIVACY,
  });

  // Load privacy & notification settings on mount
  React.useEffect(() => {
    fetch("/api/settings/privacy")
      .then((res) => res.json())
      .then((data) => {
        if (data && !data.error) {
          setPrivacySettings({
            profile: data.profile || "FRIENDS",
            nutrition: data.nutrition || (data.shareNutrition as any) || "FRIENDS",
            deepNutrition: data.deepNutrition || "FRIENDS",
            hydration: data.hydration || (data.shareHydration as any) || "FRIENDS",
            activities: data.activities || (data.shareActivities as any) || "FRIENDS",
            workouts: data.workouts || (data.shareWorkouts as any) || "FRIENDS",
            insightsProgress: data.insightsProgress || (data.shareHealthScore as any) || "FRIENDS",
            reports: data.reports || "FRIENDS",
          });
        }
      })
      .catch(() => {});

    fetch("/api/settings/notifications")
      .then((res) => res.json())
      .then((data) => {
        if (data?.preferences) {
          setNotifPrefs({
            hydrationReminders: Boolean(data.preferences.hydrationReminders),
            nutritionReminders: Boolean(data.preferences.nutritionReminders),
            workoutReminders: Boolean(data.preferences.workoutReminders),
            activityReminders: Boolean(data.preferences.activityReminders),
            friendNotifications: Boolean(data.preferences.friendNotifications),
            insightNotifications: Boolean(data.preferences.insightNotifications),
            featureRequestNotifications: Boolean(data.preferences.featureRequestNotifications),
            systemNotifications: Boolean(data.preferences.systemNotifications),
            quietHoursEnabled: Boolean(data.preferences.quietHoursEnabled),
            quietHoursStart: data.preferences.quietHoursStart || "22:00",
            quietHoursEnd: data.preferences.quietHoursEnd || "08:00",
            reminderFrequency: data.preferences.reminderFrequency || "MODERATE",
          });
        }
      })
      .catch(() => {});
  }, []);

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Real-time live metabolic calculation based on current form inputs
  const numWeight = Number(profileData.weightKg);
  const numHeight = Number(profileData.heightCm);
  const hasValidBiometrics = numWeight > 0 && numHeight > 0 && Boolean(profileData.dateOfBirth);

  const liveMetabolic = hasValidBiometrics
    ? calculateMetabolicTargets(
        numWeight,
        numHeight,
        profileData.biologicalSex,
        profileData.dateOfBirth,
        profileData.activityLevel,
        profileData.primaryGoal
      )
    : {
        ageYears: profileData.dateOfBirth ? calculateAge(profileData.dateOfBirth) : 25,
        bmr: 1650,
        tdee: 2200,
        recommendedCalories: 2000,
        recommendedProteinG: 120,
        recommendedCarbsG: 250,
        recommendedFatG: 65,
        recommendedFiberG: 30,
        recommendedSugarG: 35,
        recommendedHydrationMl: 2500,
        recommendedDailySteps: 10000,
      };

  // Apply auto-calculated targets to state
  const handleAutoCalculate = () => {
    setNutritionGoals({
      calories: liveMetabolic.recommendedCalories,
      protein: liveMetabolic.recommendedProteinG,
      carbohydrates: liveMetabolic.recommendedCarbsG,
      fat: liveMetabolic.recommendedFatG,
      fiber: liveMetabolic.recommendedFiberG,
      sugar: liveMetabolic.recommendedSugarG,
    });
    setProfileData((prev: any) => ({
      ...prev,
      dailyHydrationTargetMl: liveMetabolic.recommendedHydrationMl,
      dailyStepTarget: liveMetabolic.recommendedDailySteps,
    }));
    setSuccess("Calculated and applied recommended metabolic goals based on your profile!");
    setTimeout(() => setSuccess(null), 4000);
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile: profileData,
          nutritionGoals,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update profile settings.");
      }

      // Also save privacy settings
      await fetch("/api/settings/privacy", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(privacySettings),
      });

      // Also save notification preferences
      await fetch("/api/settings/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(notifPrefs),
      });

      setSuccess("Your profile, goals, privacy, and notification settings were saved successfully!");
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred while saving.");
    } finally {
      setIsSaving(false);
    }
  };

  // Macro calorie sum & percentage
  const totalMacroCals =
    nutritionGoals.protein * 4 + nutritionGoals.carbohydrates * 4 + nutritionGoals.fat * 9;
  const proteinPct =
    totalMacroCals > 0 ? Math.round(((nutritionGoals.protein * 4) / totalMacroCals) * 100) : 0;
  const carbsPct =
    totalMacroCals > 0 ? Math.round(((nutritionGoals.carbohydrates * 4) / totalMacroCals) * 100) : 0;
  const fatPct =
    totalMacroCals > 0 ? Math.round(((nutritionGoals.fat * 9) / totalMacroCals) * 100) : 0;

  const tabs: { key: TabKey; label: string; icon: any }[] = [
    { key: "PROFILE", label: "Profile & BMR/TDEE", icon: User },
    { key: "NUTRITION", label: "Nutrition & Macros", icon: Flame },
    { key: "ACTIVITY", label: "Activity & Integrations", icon: Activity },
    { key: "MICRONUTRIENTS", label: "Deep Micronutrients", icon: Sparkles },
    { key: "NOTIFICATIONS", label: "Notifications & Reminders", icon: Bell },
    { key: "PRIVACY", label: "Privacy & Sharing", icon: ShieldCheck },
    { key: "SYNC", label: "Google Sheets Sync", icon: FileSpreadsheet },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 text-left animate-fade-in pb-16">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-background-surface border border-border-default rounded-3xl p-6 sm:p-7 shadow-surface-card">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-brand-500/15 border border-brand-500/30 text-brand-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <Target className="h-3.5 w-3.5" />
            Centralized Preferences &bull; Goal Engine
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground-primary tracking-tight">
            Settings &amp; Personalized Goals
          </h1>
          <p className="text-sm text-foreground-secondary mt-1 font-medium">
            Configure your physical metrics, calorie targets, macro splits, and daily fitness milestones.
          </p>
        </div>

        <button
          onClick={handleSaveSettings}
          disabled={isSaving}
          className="inline-flex items-center justify-center gap-2 py-3 px-6 bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-black font-extrabold text-sm rounded-xl shadow-brand-glow transition-all duration-200 cursor-pointer disabled:opacity-50"
        >
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          <span>Save Changes</span>
        </button>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs sm:text-sm font-semibold flex items-center gap-3">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs sm:text-sm font-semibold flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-b border-border-subtle">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? "bg-brand-500/20 text-brand-400 border border-brand-500/40 shadow-sm"
                  : "text-foreground-secondary hover:text-foreground-primary hover:bg-background-elevated"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: PROFILE & METABOLIC STATS */}
      {activeTab === "PROFILE" && (
        <div className="space-y-6">
          {/* BMR & TDEE Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-background-surface border border-border-default space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-foreground-muted">
                Basal Metabolic Rate (BMR)
              </span>
              <div className="text-2xl sm:text-3xl font-black font-mono text-foreground-primary">
                {liveMetabolic.bmr} <span className="text-xs text-foreground-muted font-sans font-bold">kcal/day</span>
              </div>
              <p className="text-[11px] text-foreground-secondary">
                Calories burned at complete rest (Mifflin-St Jeor).
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-background-surface border border-border-default space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">
                Total Daily Energy (TDEE)
              </span>
              <div className="text-2xl sm:text-3xl font-black font-mono text-blue-400">
                {liveMetabolic.tdee} <span className="text-xs text-foreground-muted font-sans font-bold">kcal/day</span>
              </div>
              <p className="text-[11px] text-foreground-secondary">
                Maintenance energy expenditure based on activity.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-background-surface border border-brand-500/30 bg-brand-500/5 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-brand-400">
                Target Calories ({profileData.primaryGoal})
              </span>
              <div className="text-2xl sm:text-3xl font-black font-mono text-brand-400">
                {liveMetabolic.recommendedCalories} <span className="text-xs text-foreground-muted font-sans font-bold">kcal/day</span>
              </div>
              <p className="text-[11px] text-foreground-secondary">
                Adjusted for your primary goal.
              </p>
            </div>
          </div>

          {/* Profile Form Card */}
          <div className="p-6 rounded-3xl bg-background-surface border border-border-default space-y-5">
            <h3 className="text-base font-bold text-foreground-primary">Physical Metrics &amp; Lifestyle</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Biological Sex */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground-secondary">Biological Sex</label>
                <select
                  value={profileData.biologicalSex}
                  onChange={(e) =>
                    setProfileData((prev) => ({ ...prev, biologicalSex: e.target.value as BiologicalSex }))
                  }
                  className="w-full px-4 py-2.5 rounded-xl bg-background-elevated border border-border-subtle text-foreground-primary text-xs font-medium focus:border-brand-500 outline-none"
                >
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other / Non-Binary</option>
                </select>
              </div>

              {/* Date of Birth */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground-secondary">Date of Birth</label>
                <input
                  type="date"
                  value={profileData.dateOfBirth}
                  onChange={(e) => setProfileData((prev) => ({ ...prev, dateOfBirth: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl bg-background-elevated border border-border-subtle text-foreground-primary text-xs font-medium focus:border-brand-500 outline-none"
                />
              </div>

              {/* Height */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground-secondary">Height (cm)</label>
                <input
                  type="number"
                  min="50"
                  max="300"
                  value={profileData.heightCm}
                  onChange={(e) =>
                    setProfileData((prev) => ({ ...prev, heightCm: parseFloat(e.target.value) || 0 }))
                  }
                  className="w-full px-4 py-2.5 rounded-xl bg-background-elevated border border-border-subtle text-foreground-primary text-xs font-medium focus:border-brand-500 outline-none"
                />
              </div>

              {/* Weight */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground-secondary">Weight (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  min="20"
                  max="500"
                  value={profileData.weightKg}
                  onChange={(e) =>
                    setProfileData((prev) => ({ ...prev, weightKg: parseFloat(e.target.value) || 0 }))
                  }
                  className="w-full px-4 py-2.5 rounded-xl bg-background-elevated border border-border-subtle text-foreground-primary text-xs font-medium focus:border-brand-500 outline-none"
                />
              </div>

              {/* Activity Level */}
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-semibold text-foreground-secondary">Activity Level</label>
                <select
                  value={profileData.activityLevel}
                  onChange={(e) =>
                    setProfileData((prev) => ({ ...prev, activityLevel: e.target.value as ActivityLevel }))
                  }
                  className="w-full px-4 py-2.5 rounded-xl bg-background-elevated border border-border-subtle text-foreground-primary text-xs font-medium focus:border-brand-500 outline-none"
                >
                  <option value="SEDENTARY">Sedentary — Little or no exercise</option>
                  <option value="LIGHTLY_ACTIVE">Lightly Active — Exercise 1–3 days/week</option>
                  <option value="MODERATELY_ACTIVE">Moderately Active — Exercise 3–5 days/week</option>
                  <option value="VERY_ACTIVE">Very Active — Hard exercise 6–7 days/week</option>
                  <option value="EXTREMELY_ACTIVE">Extremely Active — Physical job or 2x/day training</option>
                </select>
                <p className="text-[11px] text-foreground-muted">
                  {activityDescriptions[profileData.activityLevel]}
                </p>
              </div>

              {/* Primary Goal */}
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-semibold text-foreground-secondary">Primary Goal</label>
                <select
                  value={profileData.primaryGoal}
                  onChange={(e) =>
                    setProfileData((prev) => ({ ...prev, primaryGoal: e.target.value as PrimaryGoal }))
                  }
                  className="w-full px-4 py-2.5 rounded-xl bg-background-elevated border border-border-subtle text-foreground-primary text-xs font-medium focus:border-brand-500 outline-none"
                >
                  <option value="FAT_LOSS">Fat Loss (Caloric Deficit -500 kcal)</option>
                  <option value="MAINTAIN">Weight Maintenance (Energy Balance)</option>
                  <option value="MUSCLE_GAIN">Lean Muscle Gain (Caloric Surplus +300 kcal)</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: NUTRITION & MACROS */}
      {activeTab === "NUTRITION" && (
        <div className="space-y-6">
          {/* Auto Calculate Helper Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-brand-500/10 border border-brand-500/30">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-brand-500/20 text-brand-400">
                <Calculator className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-foreground-primary">
                  Auto-Calculate Optimal Targets
                </h4>
                <p className="text-xs text-foreground-secondary">
                  Based on your weight ({profileData.weightKg} kg), BMR ({liveMetabolic.bmr} kcal), and {profileData.primaryGoal} goal.
                </p>
              </div>
            </div>

            <button
              onClick={handleAutoCalculate}
              className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-black font-extrabold text-xs rounded-xl shadow-sm transition-all cursor-pointer whitespace-nowrap"
            >
              Apply Recommended Goals
            </button>
          </div>

          {/* Macro Split Distribution Bar */}
          <div className="p-5 rounded-2xl bg-background-surface border border-border-default space-y-3">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-foreground-secondary">Macronutrient Energy Distribution</span>
              <span className="text-foreground-muted font-mono">{totalMacroCals} / {nutritionGoals.calories} kcal accounted</span>
            </div>

            <div className="w-full h-3.5 bg-background-elevated rounded-full overflow-hidden flex">
              <div
                style={{ width: `${proteinPct}%` }}
                className="bg-blue-500 h-full transition-all"
                title={`Protein: ${proteinPct}%`}
              />
              <div
                style={{ width: `${carbsPct}%` }}
                className="bg-amber-500 h-full transition-all"
                title={`Carbs: ${carbsPct}%`}
              />
              <div
                style={{ width: `${fatPct}%` }}
                className="bg-rose-500 h-full transition-all"
                title={`Fat: ${fatPct}%`}
              />
            </div>

            <div className="flex items-center justify-between text-xs font-semibold pt-1">
              <div className="flex items-center gap-1.5 text-blue-400">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <span>Protein: {proteinPct}% ({nutritionGoals.protein}g)</span>
              </div>
              <div className="flex items-center gap-1.5 text-amber-400">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span>Carbs: {carbsPct}% ({nutritionGoals.carbohydrates}g)</span>
              </div>
              <div className="flex items-center gap-1.5 text-rose-400">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span>Fat: {fatPct}% ({nutritionGoals.fat}g)</span>
              </div>
            </div>
          </div>

          {/* Form Inputs Grid */}
          <div className="p-6 rounded-3xl bg-background-surface border border-border-default space-y-5">
            <h3 className="text-base font-bold text-foreground-primary">Custom Macronutrient Goals</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Daily Calories */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-brand-400 flex items-center gap-1.5">
                  <Flame className="h-3.5 w-3.5" />
                  Daily Calories (kcal)
                </label>
                <input
                  type="number"
                  min="500"
                  max="10000"
                  value={nutritionGoals.calories}
                  onChange={(e) =>
                    setNutritionGoals((prev) => ({ ...prev, calories: parseInt(e.target.value) || 0 }))
                  }
                  className="w-full px-4 py-2.5 rounded-xl bg-background-elevated border border-border-subtle text-foreground-primary text-xs font-mono font-bold focus:border-brand-500 outline-none"
                />
              </div>

              {/* Daily Protein */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-blue-400 flex items-center gap-1.5">
                  <Dna className="h-3.5 w-3.5" />
                  Protein Target (g)
                </label>
                <input
                  type="number"
                  min="10"
                  max="500"
                  value={nutritionGoals.protein}
                  onChange={(e) =>
                    setNutritionGoals((prev) => ({ ...prev, protein: parseInt(e.target.value) || 0 }))
                  }
                  className="w-full px-4 py-2.5 rounded-xl bg-background-elevated border border-border-subtle text-foreground-primary text-xs font-mono font-bold focus:border-brand-500 outline-none"
                />
              </div>

              {/* Daily Carbohydrates */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-amber-400 flex items-center gap-1.5">
                  <Flame className="h-3.5 w-3.5" />
                  Carbohydrates Target (g)
                </label>
                <input
                  type="number"
                  min="10"
                  max="1000"
                  value={nutritionGoals.carbohydrates}
                  onChange={(e) =>
                    setNutritionGoals((prev) => ({ ...prev, carbohydrates: parseInt(e.target.value) || 0 }))
                  }
                  className="w-full px-4 py-2.5 rounded-xl bg-background-elevated border border-border-subtle text-foreground-primary text-xs font-mono font-bold focus:border-brand-500 outline-none"
                />
              </div>

              {/* Daily Fat */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-rose-400 flex items-center gap-1.5">
                  <Droplets className="h-3.5 w-3.5" />
                  Fats Target (g)
                </label>
                <input
                  type="number"
                  min="5"
                  max="400"
                  value={nutritionGoals.fat}
                  onChange={(e) =>
                    setNutritionGoals((prev) => ({ ...prev, fat: parseInt(e.target.value) || 0 }))
                  }
                  className="w-full px-4 py-2.5 rounded-xl bg-background-elevated border border-border-subtle text-foreground-primary text-xs font-mono font-bold focus:border-brand-500 outline-none"
                />
              </div>

              {/* Daily Fiber */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" />
                  Fiber Target (g)
                </label>
                <input
                  type="number"
                  min="0"
                  max="150"
                  value={nutritionGoals.fiber}
                  onChange={(e) =>
                    setNutritionGoals((prev) => ({ ...prev, fiber: parseInt(e.target.value) || 0 }))
                  }
                  className="w-full px-4 py-2.5 rounded-xl bg-background-elevated border border-border-subtle text-foreground-primary text-xs font-mono font-bold focus:border-brand-500 outline-none"
                />
              </div>

              {/* Daily Sugar Max */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-violet-400 flex items-center gap-1.5">
                  <Info className="h-3.5 w-3.5" />
                  Sugar Max (g)
                </label>
                <input
                  type="number"
                  min="0"
                  max="300"
                  value={nutritionGoals.sugar}
                  onChange={(e) =>
                    setNutritionGoals((prev) => ({ ...prev, sugar: parseInt(e.target.value) || 0 }))
                  }
                  className="w-full px-4 py-2.5 rounded-xl bg-background-elevated border border-border-subtle text-foreground-primary text-xs font-mono font-bold focus:border-brand-500 outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: HYDRATION & FITNESS GOALS */}
      {activeTab === "ACTIVITY" && (
        <div className="p-6 rounded-3xl bg-background-surface border border-border-default space-y-5">
          <h3 className="text-base font-bold text-foreground-primary">Hydration &amp; Physical Activity Targets</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Daily Hydration Target */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-blue-400 flex items-center gap-1.5">
                <Droplets className="h-4 w-4" />
                Daily Hydration Target (ml)
              </label>
              <input
                type="number"
                step="50"
                min="500"
                max="10000"
                value={profileData.dailyHydrationTargetMl}
                onChange={(e) =>
                  setProfileData((prev) => ({
                    ...prev,
                    dailyHydrationTargetMl: parseInt(e.target.value) || 0,
                  }))
                }
                className="w-full px-4 py-2.5 rounded-xl bg-background-elevated border border-border-subtle text-foreground-primary text-xs font-mono font-bold focus:border-brand-500 outline-none"
              />
              <div className="flex items-center gap-1.5 pt-1">
                {[2000, 2500, 3000, 3500].map((ml) => (
                  <button
                    key={ml}
                    type="button"
                    onClick={() =>
                      setProfileData((prev) => ({ ...prev, dailyHydrationTargetMl: ml }))
                    }
                    className="px-2.5 py-1 rounded-lg bg-background-elevated hover:bg-brand-500/20 text-foreground-secondary hover:text-brand-400 border border-border-subtle text-[11px] font-mono cursor-pointer transition-colors"
                  >
                    {ml} ml
                  </button>
                ))}
              </div>
            </div>

            {/* Daily Step Target */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                <Footprints className="h-4 w-4" />
                Daily Step Target (steps)
              </label>
              <input
                type="number"
                step="500"
                min="1000"
                max="100000"
                value={profileData.dailyStepTarget}
                onChange={(e) =>
                  setProfileData((prev) => ({
                    ...prev,
                    dailyStepTarget: parseInt(e.target.value) || 0,
                  }))
                }
                className="w-full px-4 py-2.5 rounded-xl bg-background-elevated border border-border-subtle text-foreground-primary text-xs font-mono font-bold focus:border-brand-500 outline-none"
              />
              <div className="flex items-center gap-1.5 pt-1">
                {[8000, 10000, 12500, 15000].map((steps) => (
                  <button
                    key={steps}
                    type="button"
                    onClick={() =>
                      setProfileData((prev) => ({ ...prev, dailyStepTarget: steps }))
                    }
                    className="px-2.5 py-1 rounded-lg bg-background-elevated hover:bg-brand-500/20 text-foreground-secondary hover:text-brand-400 border border-border-subtle text-[11px] font-mono cursor-pointer transition-colors"
                  >
                    {steps.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

            {/* Weekly Running Distance Goal */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-amber-400 flex items-center gap-1.5">
                <Activity className="h-4 w-4" />
                Weekly Running Distance (km)
              </label>
              <input
                type="number"
                step="1"
                min="0"
                max="500"
                value={profileData.weeklyRunningDistanceKm}
                onChange={(e) =>
                  setProfileData((prev) => ({
                    ...prev,
                    weeklyRunningDistanceKm: parseFloat(e.target.value) || 0,
                  }))
                }
                className="w-full px-4 py-2.5 rounded-xl bg-background-elevated border border-border-subtle text-foreground-primary text-xs font-mono font-bold focus:border-brand-500 outline-none"
              />
            </div>

            {/* Weekly Workout Sessions Goal */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-purple-400 flex items-center gap-1.5">
                <Dumbbell className="h-4 w-4" />
                Weekly Workout Sessions (sessions/week)
              </label>
              <input
                type="number"
                step="1"
                min="0"
                max="28"
                value={profileData.weeklyWorkoutSessions}
                onChange={(e) =>
                  setProfileData((prev) => ({
                    ...prev,
                    weeklyWorkoutSessions: parseInt(e.target.value) || 0,
                  }))
                }
                className="w-full px-4 py-2.5 rounded-xl bg-background-elevated border border-border-subtle text-foreground-primary text-xs font-mono font-bold focus:border-brand-500 outline-none"
              />
            </div>
          </div>

          {/* Connected Services & Activity Integrations */}
          <div className="pt-6 border-t border-border-subtle">
            <ConnectedServicesSection />
          </div>
        </div>
      )}

      {/* TAB 4: DEEP MICRONUTRIENT TARGETS */}
      {activeTab === "MICRONUTRIENTS" && (
        <div className="p-6 rounded-3xl bg-background-surface border border-border-default space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-foreground-primary">Deep Micronutrient RDA Targets</h3>
              <p className="text-xs text-foreground-secondary">
                Configure customized Recommended Daily Allowances (RDA) for all 13 Vitamins and 13 Minerals.
              </p>
            </div>
            <Link
              href="/deep-nutrition"
              className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-black font-extrabold text-xs rounded-xl shadow-sm transition-all cursor-pointer"
            >
              Open Deep Nutrition
            </Link>
          </div>

          <div className="p-4 rounded-2xl bg-background-elevated border border-border-subtle text-xs text-foreground-secondary leading-relaxed">
            Nutri-Track automatically correlates all 26 vitamins and minerals against standard RDA recommendations based on your biological sex and age. You can inspect daily coverage or adjust custom RDA values in the Deep Nutrition module.
          </div>
        </div>
      )}

      {/* TAB 5: PRIVACY & SHARING */}
      {activeTab === "PRIVACY" && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-background-surface border border-border-default space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground-primary">Privacy &amp; Sharing Controls</h3>
                <p className="text-xs text-foreground-secondary">
                  Configure granular visibility (Public, Friends, or Private) for your health and progress categories.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-brand-500/5 border border-brand-500/20 text-xs text-foreground-secondary leading-relaxed flex items-start gap-2.5">
              <Lock className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" />
              <span>
                <strong>Friend-First Sharing Architecture:</strong> Most health &amp; progress metrics default to <strong>Friends</strong>. Individual raw meal logs, foods consumed, weights, personal notes, and AI Coach conversations are <strong>strictly private</strong> and never shared with anyone.
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {/* Category 1: Profile Visibility */}
              <div className="p-4 rounded-2xl bg-background-elevated border border-border-subtle flex flex-col justify-between gap-3">
                <div className="space-y-1">
                  <div className="text-xs font-bold text-foreground-primary flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-sky-400" />
                    Profile Visibility
                  </div>
                  <p className="text-[11px] text-foreground-secondary">
                    Display name, username, and avatar. Email and passwords are never exposed.
                  </p>
                </div>
                <div className="flex items-center gap-1 bg-background-surface p-1 rounded-xl border border-border-subtle self-end">
                  {(["PUBLIC", "FRIENDS", "PRIVATE"] as PrivacyVisibility[]).map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setPrivacySettings((prev) => ({ ...prev, profile: level }))}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                        privacySettings.profile === level
                          ? level === "PUBLIC"
                            ? "bg-sky-500/20 text-sky-400 border border-sky-500/30"
                            : level === "FRIENDS"
                            ? "bg-brand-500 text-black shadow-sm"
                            : "bg-neutral-800 text-neutral-300 border border-neutral-700"
                          : "text-foreground-muted hover:text-foreground-secondary"
                      }`}
                    >
                      {level === "PUBLIC" ? "🌐 Public" : level === "FRIENDS" ? "👥 Friends" : "🔒 Private"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Category 2: Nutrition Progress */}
              <div className="p-4 rounded-2xl bg-background-elevated border border-border-subtle flex flex-col justify-between gap-3">
                <div className="space-y-1">
                  <div className="text-xs font-bold text-foreground-primary flex items-center gap-1.5">
                    <UtensilsCrossed className="w-3.5 h-3.5 text-rose-400" />
                    Nutrition &amp; Macros Progress
                  </div>
                  <p className="text-[11px] text-foreground-secondary">
                    Weekly calorie &amp; macro goal adherence %. Individual meals stay private.
                  </p>
                </div>
                <div className="flex items-center gap-1 bg-background-surface p-1 rounded-xl border border-border-subtle self-end">
                  {(["PUBLIC", "FRIENDS", "PRIVATE"] as PrivacyVisibility[]).map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setPrivacySettings((prev) => ({ ...prev, nutrition: level }))}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                        privacySettings.nutrition === level
                          ? level === "PUBLIC"
                            ? "bg-sky-500/20 text-sky-400 border border-sky-500/30"
                            : level === "FRIENDS"
                            ? "bg-brand-500 text-black shadow-sm"
                            : "bg-neutral-800 text-neutral-300 border border-neutral-700"
                          : "text-foreground-muted hover:text-foreground-secondary"
                      }`}
                    >
                      {level === "PUBLIC" ? "🌐 Public" : level === "FRIENDS" ? "👥 Friends" : "🔒 Private"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Category 3: Deep Nutrition */}
              <div className="p-4 rounded-2xl bg-background-elevated border border-border-subtle flex flex-col justify-between gap-3">
                <div className="space-y-1">
                  <div className="text-xs font-bold text-foreground-primary flex items-center gap-1.5">
                    <Apple className="w-3.5 h-3.5 text-lime-400" />
                    Deep Nutrition &amp; Micronutrients
                  </div>
                  <p className="text-[11px] text-foreground-secondary">
                    Micronutrient coverage score and vitamin/mineral target adherence.
                  </p>
                </div>
                <div className="flex items-center gap-1 bg-background-surface p-1 rounded-xl border border-border-subtle self-end">
                  {(["PUBLIC", "FRIENDS", "PRIVATE"] as PrivacyVisibility[]).map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setPrivacySettings((prev) => ({ ...prev, deepNutrition: level }))}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                        privacySettings.deepNutrition === level
                          ? level === "PUBLIC"
                            ? "bg-sky-500/20 text-sky-400 border border-sky-500/30"
                            : level === "FRIENDS"
                            ? "bg-brand-500 text-black shadow-sm"
                            : "bg-neutral-800 text-neutral-300 border border-neutral-700"
                          : "text-foreground-muted hover:text-foreground-secondary"
                      }`}
                    >
                      {level === "PUBLIC" ? "🌐 Public" : level === "FRIENDS" ? "👥 Friends" : "🔒 Private"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Category 4: Hydration Progress */}
              <div className="p-4 rounded-2xl bg-background-elevated border border-border-subtle flex flex-col justify-between gap-3">
                <div className="space-y-1">
                  <div className="text-xs font-bold text-foreground-primary flex items-center gap-1.5">
                    <Droplets className="w-3.5 h-3.5 text-cyan-400" />
                    Hydration Progress &amp; Streak
                  </div>
                  <p className="text-[11px] text-foreground-secondary">
                    Daily water intake adherence and consecutive logging streak days.
                  </p>
                </div>
                <div className="flex items-center gap-1 bg-background-surface p-1 rounded-xl border border-border-subtle self-end">
                  {(["PUBLIC", "FRIENDS", "PRIVATE"] as PrivacyVisibility[]).map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setPrivacySettings((prev) => ({ ...prev, hydration: level }))}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                        privacySettings.hydration === level
                          ? level === "PUBLIC"
                            ? "bg-sky-500/20 text-sky-400 border border-sky-500/30"
                            : level === "FRIENDS"
                            ? "bg-brand-500 text-black shadow-sm"
                            : "bg-neutral-800 text-neutral-300 border border-neutral-700"
                          : "text-foreground-muted hover:text-foreground-secondary"
                      }`}
                    >
                      {level === "PUBLIC" ? "🌐 Public" : level === "FRIENDS" ? "👥 Friends" : "🔒 Private"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Category 5: Activity & Running */}
              <div className="p-4 rounded-2xl bg-background-elevated border border-border-subtle flex flex-col justify-between gap-3">
                <div className="space-y-1">
                  <div className="text-xs font-bold text-foreground-primary flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-emerald-400" />
                    Activities &amp; Running
                  </div>
                  <p className="text-[11px] text-foreground-secondary">
                    Weekly running distance (km), average pace, daily steps, and cardio calories.
                  </p>
                </div>
                <div className="flex items-center gap-1 bg-background-surface p-1 rounded-xl border border-border-subtle self-end">
                  {(["PUBLIC", "FRIENDS", "PRIVATE"] as PrivacyVisibility[]).map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setPrivacySettings((prev) => ({ ...prev, activities: level }))}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                        privacySettings.activities === level
                          ? level === "PUBLIC"
                            ? "bg-sky-500/20 text-sky-400 border border-sky-500/30"
                            : level === "FRIENDS"
                            ? "bg-brand-500 text-black shadow-sm"
                            : "bg-neutral-800 text-neutral-300 border border-neutral-700"
                          : "text-foreground-muted hover:text-foreground-secondary"
                      }`}
                    >
                      {level === "PUBLIC" ? "🌐 Public" : level === "FRIENDS" ? "👥 Friends" : "🔒 Private"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Category 6: Workouts & Strength */}
              <div className="p-4 rounded-2xl bg-background-elevated border border-border-subtle flex flex-col justify-between gap-3">
                <div className="space-y-1">
                  <div className="text-xs font-bold text-foreground-primary flex items-center gap-1.5">
                    <Dumbbell className="w-3.5 h-3.5 text-purple-400" />
                    Workouts &amp; Strength
                  </div>
                  <p className="text-[11px] text-foreground-secondary">
                    Weekly workout session frequency, completed sets, and total volume.
                  </p>
                </div>
                <div className="flex items-center gap-1 bg-background-surface p-1 rounded-xl border border-border-subtle self-end">
                  {(["PUBLIC", "FRIENDS", "PRIVATE"] as PrivacyVisibility[]).map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setPrivacySettings((prev) => ({ ...prev, workouts: level }))}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                        privacySettings.workouts === level
                          ? level === "PUBLIC"
                            ? "bg-sky-500/20 text-sky-400 border border-sky-500/30"
                            : level === "FRIENDS"
                            ? "bg-brand-500 text-black shadow-sm"
                            : "bg-neutral-800 text-neutral-300 border border-neutral-700"
                          : "text-foreground-muted hover:text-foreground-secondary"
                      }`}
                    >
                      {level === "PUBLIC" ? "🌐 Public" : level === "FRIENDS" ? "👥 Friends" : "🔒 Private"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Category 7: Insights & Health Score */}
              <div className="p-4 rounded-2xl bg-background-elevated border border-border-subtle flex flex-col justify-between gap-3">
                <div className="space-y-1">
                  <div className="text-xs font-bold text-foreground-primary flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    Insights &amp; Health Score
                  </div>
                  <p className="text-[11px] text-foreground-secondary">
                    100-point Health Score, letter grade, and personal records.
                  </p>
                </div>
                <div className="flex items-center gap-1 bg-background-surface p-1 rounded-xl border border-border-subtle self-end">
                  {(["PUBLIC", "FRIENDS", "PRIVATE"] as PrivacyVisibility[]).map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setPrivacySettings((prev) => ({ ...prev, insightsProgress: level }))}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                        privacySettings.insightsProgress === level
                          ? level === "PUBLIC"
                            ? "bg-sky-500/20 text-sky-400 border border-sky-500/30"
                            : level === "FRIENDS"
                            ? "bg-brand-500 text-black shadow-sm"
                            : "bg-neutral-800 text-neutral-300 border border-neutral-700"
                          : "text-foreground-muted hover:text-foreground-secondary"
                      }`}
                    >
                      {level === "PUBLIC" ? "🌐 Public" : level === "FRIENDS" ? "👥 Friends" : "🔒 Private"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Category 8: Reports & Summaries */}
              <div className="p-4 rounded-2xl bg-background-elevated border border-border-subtle flex flex-col justify-between gap-3">
                <div className="space-y-1">
                  <div className="text-xs font-bold text-foreground-primary flex items-center gap-1.5">
                    <LineChart className="w-3.5 h-3.5 text-indigo-400" />
                    Reports &amp; Comparisons
                  </div>
                  <p className="text-[11px] text-foreground-secondary">
                    Weekly &amp; monthly period summaries and mutual comparisons with friends.
                  </p>
                </div>
                <div className="flex items-center gap-1 bg-background-surface p-1 rounded-xl border border-border-subtle self-end">
                  {(["PUBLIC", "FRIENDS", "PRIVATE"] as PrivacyVisibility[]).map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setPrivacySettings((prev) => ({ ...prev, reports: level }))}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                        privacySettings.reports === level
                          ? level === "PUBLIC"
                            ? "bg-sky-500/20 text-sky-400 border border-sky-500/30"
                            : level === "FRIENDS"
                            ? "bg-brand-500 text-black shadow-sm"
                            : "bg-neutral-800 text-neutral-300 border border-neutral-700"
                          : "text-foreground-muted hover:text-foreground-secondary"
                      }`}
                    >
                      {level === "PUBLIC" ? "🌐 Public" : level === "FRIENDS" ? "👥 Friends" : "🔒 Private"}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: NOTIFICATIONS & REMINDERS */}
      {activeTab === "NOTIFICATIONS" && (
        <div className="space-y-6 animate-fade-in">
          {/* Card 1: Reminder Categories */}
          <div className="bg-background-surface border border-border-default rounded-3xl p-6 sm:p-7 shadow-surface-card space-y-5">
            <div>
              <h2 className="text-lg font-bold text-foreground-primary">Notification &amp; Reminder Categories</h2>
              <p className="text-xs text-foreground-secondary mt-0.5">
                Customize which health vectors, community events, and progress alerts deliver in-app notifications.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Hydration Reminders */}
              <div className="p-4 rounded-2xl bg-background-elevated border border-border-subtle flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-foreground-primary flex items-center gap-1.5">
                    <Droplets className="w-3.5 h-3.5 text-blue-400" />
                    Hydration Reminders &amp; Milestones
                  </div>
                  <p className="text-[11px] text-foreground-secondary">
                    Contextual check-ins when hydration is behind target and streak alerts.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={notifPrefs.hydrationReminders}
                  onChange={(e) => setNotifPrefs((prev) => ({ ...prev, hydrationReminders: e.target.checked }))}
                  className="w-4 h-4 accent-brand-500 rounded cursor-pointer"
                />
              </div>

              {/* Nutrition Reminders */}
              <div className="p-4 rounded-2xl bg-background-elevated border border-border-subtle flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-foreground-primary flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 text-brand-400" />
                    Nutrition &amp; Meal Tracking
                  </div>
                  <p className="text-[11px] text-foreground-secondary">
                    Informative afternoon check-ins if no meals have been logged.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={notifPrefs.nutritionReminders}
                  onChange={(e) => setNotifPrefs((prev) => ({ ...prev, nutritionReminders: e.target.checked }))}
                  className="w-4 h-4 accent-brand-500 rounded cursor-pointer"
                />
              </div>

              {/* Workout Reminders */}
              <div className="p-4 rounded-2xl bg-background-elevated border border-border-subtle flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-foreground-primary flex items-center gap-1.5">
                    <Dumbbell className="w-3.5 h-3.5 text-purple-400" />
                    Gym &amp; Workout Reminders
                  </div>
                  <p className="text-[11px] text-foreground-secondary">
                    Evening check-in to log your training session and keep your streak alive.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={notifPrefs.workoutReminders}
                  onChange={(e) => setNotifPrefs((prev) => ({ ...prev, workoutReminders: e.target.checked }))}
                  className="w-4 h-4 accent-brand-500 rounded cursor-pointer"
                />
              </div>

              {/* Activity & Running Milestones */}
              <div className="p-4 rounded-2xl bg-background-elevated border border-border-subtle flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-foreground-primary flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-amber-400" />
                    Movement &amp; Distance Milestones
                  </div>
                  <p className="text-[11px] text-foreground-secondary">
                    Weekly distance goals achieved, personal records, and sync notices.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={notifPrefs.activityReminders}
                  onChange={(e) => setNotifPrefs((prev) => ({ ...prev, activityReminders: e.target.checked }))}
                  className="w-4 h-4 accent-brand-500 rounded cursor-pointer"
                />
              </div>

              {/* Friend Notifications */}
              <div className="p-4 rounded-2xl bg-background-elevated border border-border-subtle flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-foreground-primary flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-emerald-400" />
                    Community &amp; Friend Events
                  </div>
                  <p className="text-[11px] text-foreground-secondary">
                    Incoming friend requests, acceptances, and shared peer recommendations.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={notifPrefs.friendNotifications}
                  onChange={(e) => setNotifPrefs((prev) => ({ ...prev, friendNotifications: e.target.checked }))}
                  className="w-4 h-4 accent-brand-500 rounded cursor-pointer"
                />
              </div>

              {/* AI Health Insights */}
              <div className="p-4 rounded-2xl bg-background-elevated border border-border-subtle flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-foreground-primary flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    AI Health Insights &amp; Trends
                  </div>
                  <p className="text-[11px] text-foreground-secondary">
                    Meaningful positive trends, micronutrient patterns, and actionable coaching tips.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={notifPrefs.insightNotifications}
                  onChange={(e) => setNotifPrefs((prev) => ({ ...prev, insightNotifications: e.target.checked }))}
                  className="w-4 h-4 accent-brand-500 rounded cursor-pointer"
                />
              </div>

              {/* Feature Requests */}
              <div className="p-4 rounded-2xl bg-background-elevated border border-border-subtle flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-foreground-primary flex items-center gap-1.5">
                    <Bell className="w-3.5 h-3.5 text-violet-400" />
                    Feature Request Updates
                  </div>
                  <p className="text-[11px] text-foreground-secondary">
                    Alerts when your requested features change status or receive developer responses.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={notifPrefs.featureRequestNotifications}
                  onChange={(e) => setNotifPrefs((prev) => ({ ...prev, featureRequestNotifications: e.target.checked }))}
                  className="w-4 h-4 accent-brand-500 rounded cursor-pointer"
                />
              </div>

              {/* System Announcements */}
              <div className="p-4 rounded-2xl bg-background-elevated border border-border-subtle flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-foreground-primary flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-foreground-secondary" />
                    System &amp; Account Alerts
                  </div>
                  <p className="text-[11px] text-foreground-secondary">
                    Critical account lifecycle notices (approvals, security, essential updates).
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={notifPrefs.systemNotifications}
                  onChange={(e) => setNotifPrefs((prev) => ({ ...prev, systemNotifications: e.target.checked }))}
                  className="w-4 h-4 accent-brand-500 rounded cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Card 2: Quiet Hours */}
          <div className="bg-background-surface border border-border-default rounded-3xl p-6 sm:p-7 shadow-surface-card space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-foreground-primary flex items-center gap-2">
                  <Moon className="h-5 w-5 text-indigo-400" />
                  Quiet Hours
                </h2>
                <p className="text-xs text-foreground-secondary mt-0.5">
                  During quiet hours, non-critical reminders and notifications are silenced.
                </p>
              </div>

              <input
                type="checkbox"
                checked={notifPrefs.quietHoursEnabled}
                onChange={(e) => setNotifPrefs((prev) => ({ ...prev, quietHoursEnabled: e.target.checked }))}
                className="w-5 h-5 accent-brand-500 rounded cursor-pointer"
              />
            </div>

            {notifPrefs.quietHoursEnabled && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-border-subtle animate-fade-in">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground-secondary flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-foreground-muted" />
                    Quiet Hours Start Time
                  </label>
                  <input
                    type="time"
                    value={notifPrefs.quietHoursStart}
                    onChange={(e) => setNotifPrefs((prev) => ({ ...prev, quietHoursStart: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-background-elevated border border-border-subtle rounded-xl text-xs text-foreground-primary font-mono focus:border-brand-500 outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground-secondary flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-foreground-muted" />
                    Quiet Hours End Time
                  </label>
                  <input
                    type="time"
                    value={notifPrefs.quietHoursEnd}
                    onChange={(e) => setNotifPrefs((prev) => ({ ...prev, quietHoursEnd: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-background-elevated border border-border-subtle rounded-xl text-xs text-foreground-primary font-mono focus:border-brand-500 outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Card 3: Reminder Frequency */}
          <div className="bg-background-surface border border-border-default rounded-3xl p-6 sm:p-7 shadow-surface-card space-y-4">
            <div>
              <h2 className="text-lg font-bold text-foreground-primary">Reminder Frequency</h2>
              <p className="text-xs text-foreground-secondary mt-0.5">
                Set how often smart reminders evaluate your health tracking status.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[
                { key: "LOW", label: "Low", desc: "Max 1 per day" },
                { key: "MODERATE", label: "Moderate", desc: "2-3 per day" },
                { key: "HIGH", label: "Frequent", desc: "Real-time pacing" },
              ].map((freq) => (
                <button
                  key={freq.key}
                  type="button"
                  onClick={() => setNotifPrefs((prev) => ({ ...prev, reminderFrequency: freq.key }))}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                    notifPrefs.reminderFrequency === freq.key
                      ? "bg-brand-500/15 text-brand-400 border-brand-500/40 shadow-sm"
                      : "bg-background-elevated text-foreground-secondary border-border-subtle hover:text-foreground-primary"
                  }`}
                >
                  <span className="font-extrabold text-xs block">{freq.label}</span>
                  <span className="text-[10px] text-foreground-muted block mt-0.5">{freq.desc}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: DATA SYNC & CONNECTED SERVICES */}
      {activeTab === "SYNC" && (
        <div className="space-y-6">
          <ConnectedServicesSection />
        </div>
      )}
    </div>
  );
}
