import { ReportRangePreset } from "@/lib/validations/report";
import { ReportService } from "../report.service";
import { HealthScoreService } from "./health-score.service";
import { AchievementService } from "./achievement.service";
import { RecommendationService } from "./recommendation.service";
import { InsightEngineService } from "./insight-engine.service";
import { SmartInsightsResponse, SmartInsight } from "./insight-types";

export class SmartInsightsService {
  /**
   * Master orchestrator for Smart Insights. Reuses existing ReportService
   * calculations and generates deterministic, explainable insights, health score,
   * achievements, and actionable recommendations.
   */
  static async getSmartInsights(
    userId: string,
    preset: ReportRangePreset = "last7days",
    customStart?: string,
    customEnd?: string
  ): Promise<SmartInsightsResponse> {
    // 1. Fetch aggregated reports data across all domains
    const report = await ReportService.getFullReport(userId, preset, customStart, customEnd);

    // 2. Evaluate Health Score
    const healthScore = HealthScoreService.calculateHealthScore(report);

    // 3. Evaluate Rule-based Domain Insights & Trend Changes
    const { insights, trends } = InsightEngineService.evaluateInsights(report);

    // 4. Detect Historical Achievements & Personal Records
    const achievements = AchievementService.detectAchievements(report);

    // 5. Generate Actionable Next Steps & Recommendations
    const recommendations = RecommendationService.generateRecommendations(report);

    // 6. Classify & Prioritize Insights
    const attentionInsights = insights.filter(
      (ins) => ins.severity === "WARNING" || ins.severity === "ALERT" || ins.priority === "HIGH"
    );
    const positiveInsights = insights.filter(
      (ins) => ins.severity === "SUCCESS" || ins.priority === "POSITIVE"
    );

    // Hero Insight: Top warning if exists, otherwise top positive insight
    let heroInsight: SmartInsight | null = null;
    if (attentionInsights.length > 0) {
      heroInsight = { ...attentionInsights[0], isHero: true };
    } else if (positiveInsights.length > 0) {
      heroInsight = { ...positiveInsights[0], isHero: true };
    } else if (insights.length > 0) {
      heroInsight = { ...insights[0], isHero: true };
    }

    // Domain grouped insights
    const domainInsights = {
      nutrition: insights.filter(
        (ins) => ins.category === "NUTRITION" || ins.category === "MACRONUTRIENTS"
      ),
      micronutrients: insights.filter((ins) => ins.category === "MICRONUTRIENTS"),
      hydration: insights.filter((ins) => ins.category === "HYDRATION"),
      activities: insights.filter(
        (ins) => ins.category === "RUNNING" || ins.category === "ACTIVITY"
      ),
      workouts: insights.filter((ins) => ins.category === "WORKOUT"),
    };

    const hasSufficientData =
      (report.overview?.nutrition?.loggedDaysCount || 0) > 0 ||
      (report.overview?.activities?.totalSessions || 0) > 0 ||
      (report.overview?.workouts?.totalSessions || 0) > 0 ||
      (report.overview?.hydration?.avgIntakeMl || 0) > 0;

    return {
      dateRange: report.dateRange,
      healthScore,
      heroInsight,
      positiveInsights,
      attentionInsights,
      domainInsights,
      trends,
      achievements,
      recommendations,
      hasSufficientData,
      totalInsightsCount: insights.length,
    };
  }

  /**
   * Helper to retrieve only the 100-point Health Score
   */
  static async getHealthScore(userId: string) {
    const report = await ReportService.getFullReport(userId, "last7days");
    return HealthScoreService.calculateHealthScore(report);
  }
}
