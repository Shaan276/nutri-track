import { FullReportResponse } from "@/lib/validations/report";
import { RecommendationItem } from "./insight-types";

export class RecommendationService {
  /**
   * Generates prioritized, actionable, non-medical next steps
   * with deep links to Nutri-Track application modules.
   */
  static generateRecommendations(report: FullReportResponse): RecommendationItem[] {
    const recommendations: RecommendationItem[] = [];

    const hasMeals = (report.overview?.nutrition?.loggedDaysCount || 0) > 0;
    const avgCalories = report.overview?.nutrition?.avgCalories || 0;
    const targetCalories = report.overview?.nutrition?.targetCalories || 0;
    const avgProtein = report.overview?.nutrition?.avgProteinG || 0;
    const targetProtein = report.charts?.proteinConsistency?.[0]?.targetG || 0;

    // 1. Protein Recommendation
    if (hasMeals && targetProtein && targetProtein > 0 && avgProtein < targetProtein * 0.85) {
      const deficit = Math.round(targetProtein - avgProtein);
      recommendations.push({
        id: "rec_protein_deficit",
        title: "Add a High-Protein Food to Your Next Meal",
        explanation: `Your average protein intake (${Math.round(avgProtein)}g) is ~${deficit}g below your daily ${targetProtein}g target. Adding chicken, wild salmon, eggs, tofu, or protein shake will close this gap.`,
        priority: "HIGH",
        actionLabel: "Browse High-Protein Foods",
        actionUrl: "/foods",
        category: "NUTRITION",
        iconName: "UtensilsCrossed",
      });
    }

    // 2. Hydration Recommendation
    const targetHydration = report.overview?.hydration?.dailyTargetMl || 2500;
    const avgHydration = report.overview?.hydration?.avgIntakeMl || 0;
    if (avgHydration > 0 && avgHydration < targetHydration * 0.80) {
      recommendations.push({
        id: "rec_hydration_intake",
        title: "Drink 300–500 ml of Fluids",
        explanation: `You're currently averaging ${Math.round(avgHydration)} ml vs your ${targetHydration} ml goal. Having a tall glass of water or herbal tea now will keep you hydrated.`,
        priority: "HIGH",
        actionLabel: "Log Water in Hydration",
        actionUrl: "/hydration",
        category: "HYDRATION",
        iconName: "Droplets",
      });
    }

    // 3. Micronutrient Gaps Recommendation
    const lowMicros = (report.micronutrients || []).filter(
      (m) => m.hasTarget && m.percentage !== null && m.percentage < 65
    );
    if (lowMicros.length >= 2) {
      const names = lowMicros.slice(0, 3).map((m) => m.label).join(", ");
      recommendations.push({
        id: "rec_micronutrient_gaps",
        title: "Review Micronutrient Gaps in Deep Nutrition",
        explanation: `${lowMicros.length} micronutrients (${names}) are below 65% of daily targets. Check whole food sources to balance your micronutrient profile.`,
        priority: "MEDIUM",
        actionLabel: "Open Deep Nutrition",
        actionUrl: "/deep-nutrition",
        category: "MICRONUTRIENTS",
        iconName: "Sparkles",
      });
    }

    // 4. Workout / Strength Recommendation
    if ((report.overview?.workouts?.totalSessions || 0) === 0) {
      recommendations.push({
        id: "rec_workout_log",
        title: "Schedule or Record a Workout Session",
        explanation: "No workout sessions recorded in this period. Strength and resistance training support lean muscle mass and metabolic health.",
        priority: "MEDIUM",
        actionLabel: "Open Workout Database",
        actionUrl: "/workouts",
        category: "WORKOUT",
        iconName: "Dumbbell",
      });
    }

    // 5. Running & Activity Recommendation
    if ((report.overview?.activities?.totalSessions || 0) === 0 && (report.overview?.activities?.totalSteps || 0) < 4000) {
      recommendations.push({
        id: "rec_activity_movement",
        title: "Log Today's Run or Step Count",
        explanation: "Track your running sessions, daily walks, or cardio activities to maintain physical endurance and cardiovascular health.",
        priority: "LOW",
        actionLabel: "Log Activity",
        actionUrl: "/activities",
        category: "ACTIVITY",
        iconName: "Activity",
      });
    }

    // 6. Caloric Over/Under Balance Recommendation
    if (hasMeals && targetCalories && targetCalories > 0) {
      if (avgCalories < targetCalories * 0.70) {
        recommendations.push({
          id: "rec_calorie_undereating",
          title: "Ensure Adequate Daily Fueling",
          explanation: `Your daily calorie intake (${Math.round(avgCalories)} kcal) is significantly below your ${targetCalories} kcal goal. Ensure you are getting sufficient nourishment.`,
          priority: "HIGH",
          actionLabel: "Log Meal in Nutrition",
          actionUrl: "/nutrition",
          category: "NUTRITION",
          iconName: "UtensilsCrossed",
        });
      }
    }

    // 7. New User / Starter Recommendations (if list is empty)
    if (recommendations.length === 0) {
      if (!hasMeals) {
        recommendations.push({
          id: "rec_starter_meal",
          title: "Log Your First Meal Today",
          explanation: "Begin tracking your breakfast, lunch, or dinner to unlock deep macronutrient and micronutrient insights.",
          priority: "HIGH",
          actionLabel: "Log a Meal",
          actionUrl: "/nutrition",
          category: "NUTRITION",
          iconName: "UtensilsCrossed",
        });
      }

      recommendations.push({
        id: "rec_starter_hydration",
        title: "Track Your Daily Hydration",
        explanation: "Quickly record water, tea, or coffee to monitor your hydration level and build a daily streak.",
        priority: "MEDIUM",
        actionLabel: "Open Hydration",
        actionUrl: "/hydration",
        category: "HYDRATION",
        iconName: "Droplets",
      });
    }

    return recommendations;
  }
}
