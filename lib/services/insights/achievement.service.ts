import { FullReportResponse } from "@/lib/validations/report";
import { AchievementItem } from "./insight-types";

export class AchievementService {
  /**
   * Identifies real, deterministic personal records and historical achievements
   * from the aggregated FullReportResponse and user history.
   */
  static detectAchievements(report: FullReportResponse): AchievementItem[] {
    const achievements: AchievementItem[] = [];

    // 1. Process all personal records extracted across history
    if (report.personalRecords && report.personalRecords.length > 0) {
      report.personalRecords.forEach((pr) => {
        let badgeIcon = "🏆";
        let category: AchievementItem["category"] = "GENERAL";

        switch (pr.category) {
          case "RUNNING":
            badgeIcon = pr.key === "fastestPace" ? "⚡" : "🏃";
            category = "RUNNING";
            break;
          case "NUTRITION":
            badgeIcon = pr.key === "highestProtein" ? "🥩" : "🥗";
            category = "NUTRITION";
            break;
          case "HYDRATION":
            badgeIcon = "💧";
            category = "HYDRATION";
            break;
          case "WORKOUT":
            badgeIcon = "🏋️";
            category = "WORKOUT";
            break;
          case "ACTIVITY":
            badgeIcon = "🔥";
            category = "GENERAL";
            break;
        }

        achievements.push({
          id: `ach_${pr.key}_${pr.achievedDate || "alltime"}`,
          title: pr.title,
          description: pr.detail || `All-time personal record achieved on ${pr.achievedDate}`,
          date: pr.achievedDate,
          category,
          metric: `${pr.value} ${pr.unit}`.trim(),
          badgeIcon,
        });
      });
    }

    // 2. Hydration Streak Milestone
    const longestStreak = report.overview?.hydration?.longestStreakDays || 0;
    if (longestStreak >= 3) {
      achievements.push({
        id: `ach_hyd_streak_${longestStreak}`,
        title: `${longestStreak}-Day Hydration Streak`,
        description: `Maintained optimal fluid intake for ${longestStreak} consecutive days.`,
        date: report.dateRange?.endDate || "",
        category: "HYDRATION",
        metric: `${longestStreak} consecutive days`,
        badgeIcon: "🌊",
      });
    }

    // 3. Multi-Pillar Consistency Achievement
    const consistencyScore = report.consistencyScore?.score || 0;
    const totalChecks = report.consistencyScore?.totalChecksEvaluated || 0;
    if (consistencyScore >= 80 && totalChecks >= 5) {
      achievements.push({
        id: `ach_consistency_${consistencyScore}`,
        title: "Pillar of Consistency",
        description: `Achieved an outstanding ${consistencyScore}% adherence score across active targets.`,
        date: report.dateRange?.endDate || "",
        category: "GENERAL",
        metric: `${consistencyScore}% target completion`,
        badgeIcon: "⭐",
      });
    }

    // 4. Heavy Strength Training Session
    const totalVolumeKg = report.overview?.workouts?.totalVolumeKg || 0;
    if (totalVolumeKg >= 2000) {
      achievements.push({
        id: `ach_wk_volume_${Math.round(totalVolumeKg)}`,
        title: "Tonnage Titan",
        description: `Lifted over ${Math.round(totalVolumeKg).toLocaleString()} kg total training volume this period.`,
        date: report.dateRange?.endDate || "",
        category: "WORKOUT",
        metric: `${Math.round(totalVolumeKg).toLocaleString()} kg tonnage`,
        badgeIcon: "💪",
      });
    }

    // Deduplicate by ID
    const uniqueMap = new Map<string, AchievementItem>();
    achievements.forEach((a) => {
      if (!uniqueMap.has(a.id)) {
        uniqueMap.set(a.id, a);
      }
    });

    return Array.from(uniqueMap.values());
  }
}
