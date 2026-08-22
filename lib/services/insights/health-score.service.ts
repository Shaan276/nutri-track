import { FullReportResponse } from "@/lib/validations/report";
import { HealthScoreResult, CategoryScoreDetail } from "./insight-types";

export class HealthScoreService {
  /**
   * Calculates a transparent, deterministic 100-point Health & Consistency Score
   * based on the aggregated data from FullReportResponse.
   */
  static calculateHealthScore(report: FullReportResponse): HealthScoreResult {
    const daysCount = Math.max(1, report.dateRange?.daysCount || 1);

    // -------------------------------------------------------------------------
    // 1. NUTRITION SCORE (Max: 30 points)
    // -------------------------------------------------------------------------
    let nutritionScore = 0;
    let nutritionChecksMet = 0;
    let nutritionChecksTotal = 0;
    let nutritionStatus: CategoryScoreDetail["status"] = "NO_DATA";
    let nutritionDesc = "No nutrition targets configured or logged.";

    const hasNutritionData = (report.overview?.nutrition?.loggedDaysCount || 0) > 0;
    const targetCalories = report.overview?.nutrition?.targetCalories || 0;
    const targetProtein = report.charts?.proteinConsistency?.[0]?.targetG || 0;

    if (hasNutritionData) {
      nutritionChecksTotal = 2; // Caloric check + Protein check

      // Check A: Caloric Adherence (15 pts) - within ±15% of target
      const avgCalories = report.overview.nutrition.avgCalories || 0;
      if (targetCalories && targetCalories > 0) {
        const calRatio = avgCalories / targetCalories;
        if (calRatio >= 0.85 && calRatio <= 1.15) {
          nutritionScore += 15;
          nutritionChecksMet += 1;
        } else if (calRatio >= 0.70 && calRatio <= 1.30) {
          nutritionScore += 10;
        } else if (calRatio >= 0.50 && calRatio <= 1.50) {
          nutritionScore += 5;
        }
      } else {
        nutritionScore += 10;
      }

      // Check B: Protein Adherence (15 pts) - at least 85% of target
      const avgProtein = report.overview.nutrition.avgProteinG || 0;
      if (targetProtein && targetProtein > 0) {
        const proteinRatio = avgProtein / targetProtein;
        if (proteinRatio >= 0.85) {
          nutritionScore += 15;
          nutritionChecksMet += 1;
        } else if (proteinRatio >= 0.65) {
          nutritionScore += 10;
        } else if (proteinRatio >= 0.40) {
          nutritionScore += 5;
        }
      } else {
        nutritionScore += 10;
      }

      if (nutritionScore >= 25) {
        nutritionStatus = "OPTIMAL";
        nutritionDesc = "Consistently meeting macro and caloric goals.";
      } else if (nutritionScore >= 18) {
        nutritionStatus = "MODERATE";
        nutritionDesc = "Moderate nutrition adherence with room for protein or calorie fine-tuning.";
      } else {
        nutritionStatus = "NEEDS_ATTENTION";
        nutritionDesc = "Daily calorie or protein intake is falling below target levels.";
      }
    }

    // -------------------------------------------------------------------------
    // 2. HYDRATION SCORE (Max: 20 points)
    // -------------------------------------------------------------------------
    let hydrationScore = 0;
    let hydrationChecksMet = 0;
    let hydrationChecksTotal = 0;
    let hydrationStatus: CategoryScoreDetail["status"] = "NO_DATA";
    let hydrationDesc = "No hydration logs recorded.";

    const hydOverview = report.overview?.hydration;
    const avgHydration = hydOverview?.avgIntakeMl || 0;
    const streakDays = hydOverview?.currentStreakDays || 0;
    const hasHydrationData = avgHydration > 0 || streakDays > 0;
    const targetHydration = hydOverview?.dailyTargetMl || 2500;
    const goalCompletionPct = hydOverview?.goalAchievementPct || 0;

    if (hasHydrationData) {
      hydrationChecksTotal = 2; // Target ratio + Streak/Consistency

      // Check A: Intake Ratio (12 pts)
      const intakeRatio = avgHydration / targetHydration;
      if (intakeRatio >= 0.90) {
        hydrationScore += 12;
        hydrationChecksMet += 1;
      } else if (intakeRatio >= 0.70) {
        hydrationScore += 8;
      } else if (intakeRatio >= 0.40) {
        hydrationScore += 4;
      }

      // Check B: Streak & Consistency (8 pts)
      if (streakDays >= 5) {
        hydrationScore += 8;
        hydrationChecksMet += 1;
      } else if (streakDays >= 2) {
        hydrationScore += 5;
        hydrationChecksMet += 1;
      } else if (goalCompletionPct >= 50) {
        hydrationScore += 5;
        hydrationChecksMet += 1;
      } else if (streakDays >= 1) {
        hydrationScore += 2;
      }

      if (hydrationScore >= 16) {
        hydrationStatus = "OPTIMAL";
        hydrationDesc = `Achieving ${Math.round(intakeRatio * 100)}% of daily fluid target with consistent streak.`;
      } else if (hydrationScore >= 10) {
        hydrationStatus = "MODERATE";
        hydrationDesc = "Good fluid intake, keep building consistency towards your target.";
      } else {
        hydrationStatus = "NEEDS_ATTENTION";
        hydrationDesc = "Hydration is below optimal daily levels.";
      }
    }

    // -------------------------------------------------------------------------
    // 3. ACTIVITY SCORE (Max: 20 points)
    // -------------------------------------------------------------------------
    let activityScore = 0;
    let activityChecksMet = 0;
    let activityChecksTotal = 0;
    let activityStatus: CategoryScoreDetail["status"] = "NO_DATA";
    let activityDesc = "No runs or activity sessions recorded.";

    const totalActivities = report.overview?.activities?.totalSessions || 0;
    const totalDistance = report.overview?.activities?.totalDistanceKm || 0;
    const totalSteps = report.overview?.activities?.totalSteps || 0;
    const hasActivityData = totalActivities > 0 || totalDistance > 0 || totalSteps > 0;

    if (hasActivityData) {
      activityChecksTotal = 2; // Frequency + Volume

      // Frequency check (10 pts)
      const expectedSessions = Math.min(3, Math.ceil(daysCount / 2));
      if (totalActivities >= expectedSessions) {
        activityScore += 10;
        activityChecksMet += 1;
      } else if (totalActivities >= 1) {
        activityScore += 6;
      }

      // Volume / Steps check (10 pts)
      const avgSteps = Math.round(totalSteps / daysCount);
      if (avgSteps >= 8000 || totalDistance >= 10) {
        activityScore += 10;
        activityChecksMet += 1;
      } else if (avgSteps >= 5000 || totalDistance >= 5) {
        activityScore += 7;
      } else if (totalDistance > 0 || totalSteps > 0) {
        activityScore += 4;
      }

      if (activityScore >= 16) {
        activityStatus = "OPTIMAL";
        activityDesc = "Active and meeting physical movement milestones.";
      } else if (activityScore >= 10) {
        activityStatus = "MODERATE";
        activityDesc = "Moderate activity level. Additional movement will boost score.";
      } else {
        activityStatus = "NEEDS_ATTENTION";
        activityDesc = "Low movement frequency during this period.";
      }
    }

    // -------------------------------------------------------------------------
    // 4. WORKOUT SCORE (Max: 15 points)
    // -------------------------------------------------------------------------
    let workoutScore = 0;
    let workoutChecksMet = 0;
    let workoutChecksTotal = 0;
    let workoutStatus: CategoryScoreDetail["status"] = "NO_DATA";
    let workoutDesc = "No workout sessions recorded.";

    const totalWorkouts = report.overview?.workouts?.totalSessions || 0;
    const totalSets = report.overview?.workouts?.totalSets || 0;
    const totalVolumeKg = report.overview?.workouts?.totalVolumeKg || 0;
    const hasWorkoutData = totalWorkouts > 0 || totalSets > 0;

    if (hasWorkoutData) {
      workoutChecksTotal = 2; // Frequency + Volume

      // Workout frequency check (10 pts)
      const expectedWorkouts = Math.min(2, Math.ceil(daysCount / 3));
      if (totalWorkouts >= expectedWorkouts) {
        workoutScore += 10;
        workoutChecksMet += 1;
      } else if (totalWorkouts >= 1) {
        workoutScore += 6;
      }

      // Tonnage / Sets check (5 pts)
      if (totalSets >= 10 || totalVolumeKg >= 1000) {
        workoutScore += 5;
        workoutChecksMet += 1;
      } else if (totalSets >= 3) {
        workoutScore += 3;
      }

      if (workoutScore >= 12) {
        workoutStatus = "OPTIMAL";
        workoutDesc = "Consistent strength/hypertrophy training routine.";
      } else if (workoutScore >= 8) {
        workoutStatus = "MODERATE";
        workoutDesc = "Good workout engagement; keep building training volume.";
      } else {
        workoutStatus = "NEEDS_ATTENTION";
        workoutDesc = "Low workout volume recorded.";
      }
    }

    // -------------------------------------------------------------------------
    // 5. OVERALL CONSISTENCY (Max: 15 points)
    // -------------------------------------------------------------------------
    let consistencyScore = 0;
    let consistencyChecksMet = 0;
    let consistencyChecksTotal = 2;
    let consistencyStatus: CategoryScoreDetail["status"] = "NO_DATA";
    let consistencyDesc = "Logging consistency across nutrition, hydration, and fitness.";

    if (report.consistencyScore && report.consistencyScore.totalChecksEvaluated > 0) {
      const consistencyRatio = report.consistencyScore.score / 100;
      consistencyScore = Math.round(consistencyRatio * 15);
      if (consistencyRatio >= 0.75) {
        consistencyChecksMet = 2;
        consistencyStatus = "OPTIMAL";
        consistencyDesc = "High multi-pillar consistency across logged days.";
      } else if (consistencyRatio >= 0.50) {
        consistencyChecksMet = 1;
        consistencyStatus = "MODERATE";
        consistencyDesc = "Consistent in some pillars, but gaps in others.";
      } else {
        consistencyChecksMet = 0;
        consistencyStatus = "NEEDS_ATTENTION";
        consistencyDesc = "Irregular logging or frequent missed targets.";
      }
    } else {
      const loggedDays = report.overview?.nutrition?.loggedDaysCount || 0;
      if (loggedDays >= Math.ceil(daysCount * 0.7)) {
        consistencyScore = 12;
        consistencyChecksMet = 2;
        consistencyStatus = "OPTIMAL";
      } else if (loggedDays >= 1) {
        consistencyScore = 6;
        consistencyChecksMet = 1;
        consistencyStatus = "MODERATE";
      }
    }

    // -------------------------------------------------------------------------
    // OVERALL SCORE & GRADE AGGREGATION
    // -------------------------------------------------------------------------
    const activePillars = [
      hasNutritionData,
      hasHydrationData,
      hasActivityData,
      hasWorkoutData,
    ].filter(Boolean).length;

    const hasSufficientData = activePillars > 0;
    const overallScore = hasSufficientData
      ? Math.min(100, Math.max(0, nutritionScore + hydrationScore + activityScore + workoutScore + consistencyScore))
      : 0;

    let grade: HealthScoreResult["grade"] = "F";
    let gradeLabel = "Needs Attention";
    let gradeColor = "#ef4444"; // Red

    if (!hasSufficientData) {
      grade = "PENDING";
      gradeLabel = "Getting Started";
      gradeColor = "#94a3b8"; // Slate neutral
    } else if (overallScore >= 85) {
      grade = "A";
      gradeLabel = "Optimal / Excellent";
      gradeColor = "#10b981"; // Emerald
    } else if (overallScore >= 70) {
      grade = "B";
      gradeLabel = "Good Progress";
      gradeColor = "#3b82f6"; // Blue
    } else if (overallScore >= 55) {
      grade = "C";
      gradeLabel = "Moderate / Fair";
      gradeColor = "#f59e0b"; // Amber
    } else if (overallScore >= 40) {
      grade = "D";
      gradeLabel = "Needs Focus";
      gradeColor = "#f97316"; // Orange
    } else {
      grade = "F";
      gradeLabel = "Low Consistency";
      gradeColor = "#ef4444"; // Red
    }

    const explanation = hasSufficientData
      ? `Calculated from ${activePillars} active tracking pillars: Nutrition (${nutritionScore}/30), Hydration (${hydrationScore}/20), Activity (${activityScore}/20), Workout (${workoutScore}/15), and Logging Consistency (${consistencyScore}/15).`
      : "Log your meals, hydration, and activities to begin building your health score.";

    return {
      overallScore,
      grade,
      gradeLabel,
      gradeColor,
      isPending: !hasSufficientData,
      categoryScores: {
        nutrition: {
          score: nutritionScore,
          max: 30,
          label: "Nutrition & Macros",
          status: nutritionStatus,
          description: nutritionDesc,
          checksMet: nutritionChecksMet,
          checksTotal: nutritionChecksTotal,
        },
        hydration: {
          score: hydrationScore,
          max: 20,
          label: "Daily Hydration",
          status: hydrationStatus,
          description: hydrationDesc,
          checksMet: hydrationChecksMet,
          checksTotal: hydrationChecksTotal,
        },
        activity: {
          score: activityScore,
          max: 20,
          label: "Running & Activity",
          status: activityStatus,
          description: activityDesc,
          checksMet: activityChecksMet,
          checksTotal: activityChecksTotal,
        },
        workout: {
          score: workoutScore,
          max: 15,
          label: "Workout Volume",
          status: workoutStatus,
          description: workoutDesc,
          checksMet: workoutChecksMet,
          checksTotal: workoutChecksTotal,
        },
        consistency: {
          score: consistencyScore,
          max: 15,
          label: "Overall Consistency",
          status: consistencyStatus,
          description: consistencyDesc,
          checksMet: consistencyChecksMet,
          checksTotal: consistencyChecksTotal,
        },
      },
      explanation,
      hasSufficientData,
      activePillarsCount: activePillars,
    };
  }
}
