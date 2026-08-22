import { z } from "zod";

export type ReportRangePreset =
  | "today"
  | "last7days"
  | "last30days"
  | "thisWeek"
  | "thisMonth"
  | "custom";

export const reportQuerySchema = z.object({
  range: z
    .enum(["today", "last7days", "last30days", "thisWeek", "thisMonth", "custom"])
    .default("last7days"),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format must be YYYY-MM-DD").optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format must be YYYY-MM-DD").optional(),
});

export type ReportQueryInput = z.infer<typeof reportQuerySchema>;

export interface ReportDateRange {
  startDate: string;
  endDate: string;
  label: string;
  preset: ReportRangePreset;
  daysCount: number;
}

export interface NutritionOverviewMetrics {
  avgCalories: number;
  targetCalories: number;
  avgProteinG: number;
  avgCarbsG: number;
  avgFatG: number;
  avgFiberG: number;
  avgSugarG: number;
  goalAdherencePct: number;
  totalDaysInPeriod: number;
  loggedDaysCount: number;
}

export interface HydrationOverviewMetrics {
  avgIntakeMl: number;
  dailyTargetMl: number;
  goalAchievementPct: number;
  currentStreakDays: number;
  longestStreakDays: number;
  loggedDaysCount: number;
}

export interface ActivityOverviewMetrics {
  totalSessions: number;
  totalDistanceKm: number;
  totalDurationMinutes: number;
  totalCaloriesBurned: number;
  totalSteps: number;
  runningSessionsCount: number;
  otherSessionsCount: number;
  avgPaceFormatted: string | null;
  totalElevationGainMeters: number;
  highestElevationMeters: number;
}

export interface WorkoutOverviewMetrics {
  totalSessions: number;
  totalExercises: number;
  totalSets: number;
  totalReps: number;
  totalVolumeKg: number;
  gymSessionsCount: number;
  homeSessionsCount: number;
  avgDurationMinutes: number;
}

export interface DeepNutritionOverviewMetrics {
  avgCoverageScore: number;
  coverageRatingLabel: string;
  totalNutrientsTracked: number;
}

export interface WeeklyComparisonMetric {
  key: string;
  label: string;
  category: "NUTRITION" | "HYDRATION" | "ACTIVITY" | "WORKOUT";
  unit: string;
  currentPeriodValue: number;
  previousPeriodValue: number;
  percentChange: number | null; // null if no previous comparison data
  direction: "INCREASE" | "DECREASE" | "NO_CHANGE" | "NEW";
  formattedChange: string;
}

export interface PersonalRecordItem {
  key: string;
  title: string;
  category: "RUNNING" | "NUTRITION" | "HYDRATION" | "ACTIVITY" | "WORKOUT";
  value: string;
  unit: string;
  achievedDate: string;
  detail?: string;
}

export interface CalorieTrendPoint {
  date: string;
  label: string;
  calories: number;
  target: number;
}

export interface MacroTrendPoint {
  date: string;
  label: string;
  protein: number;
  carbs: number;
  fat: number;
}

export interface MacroDistributionSlice {
  name: string;
  key: string;
  grams: number;
  calories: number;
  percentage: number;
  color: string;
}

export interface FiberSugarTrendPoint {
  date: string;
  label: string;
  fiberG: number;
  sugarG: number;
}

export interface ProteinConsistencyPoint {
  date: string;
  label: string;
  proteinG: number;
  targetG: number;
  status: "MET" | "BELOW" | "ABOVE";
}

export interface MicronutrientReportItem {
  key: string;
  label: string;
  category: "VITAMIN" | "MINERAL";
  unit: string;
  avgIntake: number;
  target: number | null;
  percentage: number | null;
  hasTarget: boolean;
  statusLabel: string;
  statusColor: string;
}

export interface HydrationTrendPoint {
  date: string;
  label: string;
  intake: number;
  target: number;
  achieved: boolean;
}

export interface RunningPaceTrendPoint {
  date: string;
  label: string;
  distanceKm: number;
  paceSecondsPerKm: number;
  formattedPace: string;
  runningType: string;
}

export interface StepsTrendPoint {
  date: string;
  label: string;
  steps: number;
  target: number;
}

export interface ActivityDistributionItem {
  type: string;
  name: string;
  sessionsCount: number;
  durationMinutes: number;
  caloriesBurned: number;
  percentage: number;
  color: string;
}

export interface ExerciseDistributionItem {
  exerciseName: string;
  category: string;
  sessionsCount: number;
  totalSets: number;
  totalReps: number;
  totalVolumeKg: number;
}

export interface WorkoutTrendPoint {
  date: string;
  label: string;
  sessions: number;
  sets: number;
  volumeKg: number;
}

export interface ConsistencyScorePillar {
  key: string;
  label: string;
  metCount: number;
  totalCount: number;
  percentage: number;
  isConfigured: boolean;
  detail: string;
}

export interface ConsistencyScoreBreakdown {
  score: number; // 0 - 100
  rating: "EXCELLENT" | "GOOD" | "MODERATE" | "NEEDS_IMPROVEMENT" | "NO_TARGETS";
  ratingLabel: string;
  activePillarsCount: number;
  totalChecksMet: number;
  totalChecksEvaluated: number;
  pillars: ConsistencyScorePillar[];
}

export interface ReportChartData {
  calorieTrend: CalorieTrendPoint[];
  macroTrend: MacroTrendPoint[];
  macroDistribution: MacroDistributionSlice[];
  proteinConsistency: ProteinConsistencyPoint[];
  fiberSugarTrend: FiberSugarTrendPoint[];
  hydrationTrend: HydrationTrendPoint[];
  activityTrend: {
    date: string;
    label: string;
    distanceKm: number;
    calories: number;
    durationMinutes: number;
  }[];
  runningPaceTrend: RunningPaceTrendPoint[];
  stepsTrend: StepsTrendPoint[];
  activityDistribution: ActivityDistributionItem[];
  workoutTrend: WorkoutTrendPoint[];
  exerciseDistribution: ExerciseDistributionItem[];
}

export interface FullReportResponse {
  dateRange: ReportDateRange;
  overview: {
    nutrition: NutritionOverviewMetrics;
    hydration: HydrationOverviewMetrics;
    activities: ActivityOverviewMetrics;
    workouts: WorkoutOverviewMetrics;
    deepNutrition: DeepNutritionOverviewMetrics;
  };
  consistencyScore: ConsistencyScoreBreakdown;
  micronutrients: MicronutrientReportItem[];
  comparisons: WeeklyComparisonMetric[];
  personalRecords: PersonalRecordItem[];
  charts: ReportChartData;
}
