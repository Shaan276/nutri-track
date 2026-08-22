import { z } from "zod";

export const PrivacyVisibilityEnum = z.enum(["PUBLIC", "FRIENDS", "PRIVATE"]);
export type PrivacyVisibility = z.infer<typeof PrivacyVisibilityEnum>;

export const PrivacyCategoryEnum = z.enum([
  "PROFILE",
  "NUTRITION",
  "DEEP_NUTRITION",
  "HYDRATION",
  "ACTIVITIES",
  "WORKOUTS",
  "INSIGHTS_PROGRESS",
  "REPORTS",
]);
export type PrivacyCategory = z.infer<typeof PrivacyCategoryEnum>;

export interface PrivacyCategoryMeta {
  key: PrivacyCategory;
  fieldKey: keyof UserGranularPrivacyDto;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  defaultVisibility: PrivacyVisibility;
}

export const PRIVACY_CATEGORIES_META: PrivacyCategoryMeta[] = [
  {
    key: "PROFILE",
    fieldKey: "profile",
    title: "Profile Visibility",
    subtitle: "Basic profile information & avatar",
    description: "Display name, username, bio, and avatar. Never exposes email or passwords.",
    icon: "User",
    defaultVisibility: "FRIENDS",
  },
  {
    key: "NUTRITION",
    fieldKey: "nutrition",
    title: "Nutrition & Macros",
    subtitle: "Calories, protein, carbohydrates, and fat adherence",
    description: "Daily calorie and macro targets progress. Individual meal entries and notes remain private.",
    icon: "UtensilsCrossed",
    defaultVisibility: "FRIENDS",
  },
  {
    key: "DEEP_NUTRITION",
    fieldKey: "deepNutrition",
    title: "Deep Nutrition & Micronutrients",
    subtitle: "Vitamins, minerals, and RDA target coverage",
    description: "Aggregated micronutrient coverage score and vitamin/mineral target adherence.",
    icon: "Apple",
    defaultVisibility: "FRIENDS",
  },
  {
    key: "HYDRATION",
    fieldKey: "hydration",
    title: "Hydration Progress",
    subtitle: "Daily water intake, streak, and goal progress",
    description: "Total daily fluid volume in ml, streak days, and hydration goal achievement.",
    icon: "Droplets",
    defaultVisibility: "FRIENDS",
  },
  {
    key: "ACTIVITIES",
    fieldKey: "activities",
    title: "Activities & Running",
    subtitle: "Runs, cardio, distance, steps, and calories burned",
    description: "Weekly running distance, pace statistics, daily steps, and total calories burned from cardio.",
    icon: "Footprints",
    defaultVisibility: "FRIENDS",
  },
  {
    key: "WORKOUTS",
    fieldKey: "workouts",
    title: "Workouts & Strength",
    subtitle: "Gym and home workout frequency, exercises, and volume",
    description: "Weekly workout session count, training tonnage volume, and exercise completion.",
    icon: "Dumbbell",
    defaultVisibility: "FRIENDS",
  },
  {
    key: "INSIGHTS_PROGRESS",
    fieldKey: "insightsProgress",
    title: "Insights & Health Score",
    subtitle: "100-point Health Score, grade, streaks, and PRs",
    description: "Overall transparent Health Score (0-100), health grade, milestones, and personal records.",
    icon: "Sparkles",
    defaultVisibility: "FRIENDS",
  },
  {
    key: "REPORTS",
    fieldKey: "reports",
    title: "Reports & Comparisons",
    subtitle: "Weekly & monthly progress summaries and comparisons",
    description: "Aggregated period analytics and mutual side-by-side progress comparisons with friends.",
    icon: "LineChart",
    defaultVisibility: "FRIENDS",
  },
];

export interface UserGranularPrivacyDto {
  profile: PrivacyVisibility;
  nutrition: PrivacyVisibility;
  deepNutrition: PrivacyVisibility;
  hydration: PrivacyVisibility;
  activities: PrivacyVisibility;
  workouts: PrivacyVisibility;
  insightsProgress: PrivacyVisibility;
  reports: PrivacyVisibility;
}

export const DEFAULT_GRANULAR_PRIVACY: UserGranularPrivacyDto = {
  profile: "FRIENDS",
  nutrition: "FRIENDS",
  deepNutrition: "FRIENDS",
  hydration: "FRIENDS",
  activities: "FRIENDS",
  workouts: "FRIENDS",
  insightsProgress: "FRIENDS",
  reports: "FRIENDS",
};

export const UpdatePrivacySettingsSchema = z.object({
  profile: PrivacyVisibilityEnum.optional(),
  nutrition: PrivacyVisibilityEnum.optional(),
  deepNutrition: PrivacyVisibilityEnum.optional(),
  hydration: PrivacyVisibilityEnum.optional(),
  activities: PrivacyVisibilityEnum.optional(),
  workouts: PrivacyVisibilityEnum.optional(),
  insightsProgress: PrivacyVisibilityEnum.optional(),
  reports: PrivacyVisibilityEnum.optional(),
  // Legacy aliases for backward compatibility
  shareHealthScore: z.enum(["PUBLIC", "FRIENDS", "PRIVATE"]).optional(),
  shareNutrition: z.enum(["PUBLIC", "FRIENDS", "PRIVATE"]).optional(),
  shareHydration: z.enum(["PUBLIC", "FRIENDS", "PRIVATE"]).optional(),
  shareActivities: z.enum(["PUBLIC", "FRIENDS", "PRIVATE"]).optional(),
  shareWorkouts: z.enum(["PUBLIC", "FRIENDS", "PRIVATE"]).optional(),
  shareAchievements: z.enum(["PUBLIC", "FRIENDS", "PRIVATE"]).optional(),
});

export type UpdatePrivacySettingsInput = z.infer<typeof UpdatePrivacySettingsSchema>;
