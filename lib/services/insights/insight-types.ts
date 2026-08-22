import { ReportDateRange, ReportRangePreset } from "@/lib/validations/report";

export type InsightCategory =
  | "NUTRITION"
  | "MACRONUTRIENTS"
  | "MICRONUTRIENTS"
  | "HYDRATION"
  | "RUNNING"
  | "ACTIVITY"
  | "WORKOUT"
  | "CONSISTENCY"
  | "GOALS"
  | "ACHIEVEMENT";

export type InsightPriority = "HIGH" | "MEDIUM" | "LOW" | "POSITIVE" | "INFORMATIONAL";

export type InsightSeverity = "SUCCESS" | "WARNING" | "ALERT" | "INFO";

export interface GroupedNutrientItem {
  key: string;
  name: string;
  category: "VITAMIN" | "MINERAL";
  current: number;
  target: number;
  unit: string;
  percentage: number;
  statusLabel: string;
}

export interface SmartInsight {
  id: string;
  category: InsightCategory;
  priority: InsightPriority;
  severity: InsightSeverity;
  title: string;
  summary: string;
  whatHappened: string;
  whyItMatters: string;
  suggestedAction: string;
  relatedModule: string;
  actionUrl?: string;
  actionLabel?: string;
  icon?: string;
  metric?: {
    current: number | string;
    target?: number | string;
    unit?: string;
    change?: number;
    changeDirection?: "INCREASE" | "DECREASE" | "NO_CHANGE";
    formattedText?: string;
  };
  groupedItems?: GroupedNutrientItem[];
  isHero?: boolean;
}

export interface CategoryScoreDetail {
  score: number;
  max: number;
  label: string;
  status: "OPTIMAL" | "MODERATE" | "NEEDS_ATTENTION" | "NO_DATA";
  description: string;
  checksMet: number;
  checksTotal: number;
}

export interface HealthScoreResult {
  overallScore: number;
  grade: "A" | "B" | "C" | "D" | "F" | "PENDING";
  gradeLabel: string;
  gradeColor: string;
  categoryScores: {
    nutrition: CategoryScoreDetail;
    hydration: CategoryScoreDetail;
    activity: CategoryScoreDetail;
    workout: CategoryScoreDetail;
    consistency: CategoryScoreDetail;
  };
  explanation: string;
  hasSufficientData: boolean;
  activePillarsCount: number;
  isPending?: boolean;
}

export interface RecommendationItem {
  id: string;
  title: string;
  explanation: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
  actionLabel: string;
  actionUrl: string;
  category: InsightCategory;
  iconName: string;
}

export interface AchievementItem {
  id: string;
  title: string;
  description: string;
  date: string;
  category: "RUNNING" | "NUTRITION" | "HYDRATION" | "WORKOUT" | "GENERAL";
  metric: string;
  previousRecord?: string;
  badgeIcon: string;
  isNew?: boolean;
}

export interface TrendChangeItem {
  key: string;
  label: string;
  category: "NUTRITION" | "HYDRATION" | "ACTIVITY" | "WORKOUT";
  direction: "IMPROVING" | "DECLINING" | "STABLE";
  currentValue: number;
  previousValue: number;
  unit: string;
  percentChange: number | null;
  formattedText: string;
  threshold: number; // e.g. 5%
  isPositiveChange: boolean;
}

export interface SmartInsightsResponse {
  dateRange: ReportDateRange;
  healthScore: HealthScoreResult;
  heroInsight: SmartInsight | null;
  positiveInsights: SmartInsight[];
  attentionInsights: SmartInsight[];
  domainInsights: {
    nutrition: SmartInsight[];
    micronutrients: SmartInsight[];
    hydration: SmartInsight[];
    activities: SmartInsight[];
    workouts: SmartInsight[];
  };
  trends: TrendChangeItem[];
  achievements: AchievementItem[];
  recommendations: RecommendationItem[];
  hasSufficientData: boolean;
  totalInsightsCount: number;
}
