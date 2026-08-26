import { HealthContextService, HealthContextSnapshot } from "@/lib/services/health-context.service";
import { DataProvenanceService } from "@/lib/ai/provenance";

/**
 * Generates a clean, provenance-tagged Markdown Health Context Summary
 * for the user to share with their ChatGPT Health Coach.
 *
 * Strict Rules:
 * 1. Never converts missing data into fake zeros.
 * 2. Explicitly tags provenance: [CONFIRMED], [USER_ENTERED], [UNVERIFIED / PRE-FILLED], [MISSING], [NOT CONFIGURED YET].
 * 3. Distinguishes 'No meals logged yet today' from '0 kcal intake'.
 */
export class HealthContextGenerator {
  static async generateMarkdownSummary(userId: string): Promise<string> {
    const snapshot: HealthContextSnapshot = await HealthContextService.getHealthSnapshot(userId);
    return this.formatSnapshotToMarkdown(snapshot);
  }

  static formatSnapshotToMarkdown(snapshot: HealthContextSnapshot): string {
    const { profile, nutrition, hydration, movement, workouts, memories, goals } = snapshot;

    const sections: string[] = [];

    // Header & Instructions for ChatGPT Coach
    sections.push(`# NUTRI-TRACK HEALTH SNAPSHOT & DATA PROVENANCE`);
    sections.push(`*Generated on ${snapshot.date} (${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })})*\n`);
    sections.push(`> [!IMPORTANT]\n> **DATA PROVENANCE GUIDE FOR COACH**:\n> - \`[CONFIRMED]\` / \`[USER_ENTERED]\`: Verified by user. Acknowledge and do not ask again.\n> - \`[UNVERIFIED / PRE-FILLED]\`: Pre-filled default or estimate. Ask the user for confirmation.\n> - \`[MISSING]\` / \`[NOT CONFIGURED YET]\`: Information is unknown. Collect naturally during assessment.`);

    // 1. Physical Profile & Core Goal
    sections.push(`\n## 1. USER PROFILE & PHYSICAL ATTRIBUTES`);
    sections.push(`- **Name**: ${profile.name || "Member"}`);

    const sexTag = profile.biologicalSex ? "[CONFIRMED]" : "[MISSING]";
    sections.push(`- **Biological Sex**: ${profile.biologicalSex || "Missing"} ${sexTag}`);

    const heightTag = profile.heightCm !== null ? "[CONFIRMED]" : "[MISSING]";
    sections.push(`- **Height**: ${profile.heightCm !== null ? `${profile.heightCm} cm` : "Missing"} ${heightTag}`);

    const weightTag = profile.weightKg !== null ? "[CONFIRMED]" : "[MISSING]";
    sections.push(`- **Latest Weight**: ${profile.weightKg !== null ? `${profile.weightKg} kg` : "Missing"} ${weightTag}`);

    const goalTag = profile.primaryGoal ? "[USER_ENTERED]" : "[MISSING]";
    sections.push(`- **Primary Goal**: ${profile.primaryGoal || "Missing"} ${goalTag}`);

    if (profile.bmr && profile.tdee) {
      sections.push(`- **Estimated BMR**: ${Math.round(profile.bmr)} kcal [ESTIMATED]`);
      sections.push(`- **Estimated TDEE**: ${Math.round(profile.tdee)} kcal [ESTIMATED]`);
    }

    // 2. Configured Daily Targets
    sections.push(`\n## 2. CONFIGURED DAILY TARGETS`);
    if (nutrition.isTargetsConfigured && nutrition.calorieTarget && nutrition.proteinTarget) {
      sections.push(`- **Calories Target**: ${nutrition.calorieTarget} kcal [CONFIRMED]`);
      sections.push(`- **Protein Target**: ${nutrition.proteinTarget} g [CONFIRMED]`);
      sections.push(`- **Carbohydrates Target**: ${nutrition.carbsTarget !== null ? `${nutrition.carbsTarget} g [CONFIRMED]` : "Not configured [NOT CONFIGURED]"}`);
      sections.push(`- **Fat Target**: ${nutrition.fatsTarget !== null ? `${nutrition.fatsTarget} g [CONFIRMED]` : "Not configured [NOT CONFIGURED]"}`);
      sections.push(`- **Hydration Target**: ${hydration.targetMl ? `${hydration.targetMl} ml [CONFIRMED]` : "Not configured [NOT CONFIGURED]"}`);
      sections.push(`- **Daily Step Target**: ${movement.dailyStepTarget ? `${movement.dailyStepTarget.toLocaleString()} steps [CONFIRMED]` : "Not configured [NOT CONFIGURED]"}`);
      sections.push(`- **Weekly Running Target**: ${movement.weeklyRunningTargetKm ? `${movement.weeklyRunningTargetKm} km [CONFIRMED]` : "Not configured [NOT CONFIGURED]"}`);
      sections.push(`- **Weekly Workout Target**: ${workouts.weeklyWorkoutTarget ? `${workouts.weeklyWorkoutTarget} sessions [CONFIRMED]` : "Not configured [NOT CONFIGURED]"}`);
    } else {
      sections.push(`> [!NOTE]\n> **Target Status**: **NOT CONFIGURED YET**\n> Complete your Initial Health Assessment with your Coach to establish personalized targets.`);
      sections.push(`- **Calories**: Not configured [NOT CONFIGURED]`);
      sections.push(`- **Protein**: Not configured [NOT CONFIGURED]`);
      sections.push(`- **Carbohydrates**: Not configured [NOT CONFIGURED]`);
      sections.push(`- **Fat**: Not configured [NOT CONFIGURED]`);
      sections.push(`- **Hydration**: ${hydration.targetMl ? `${hydration.targetMl} ml [UNVERIFIED]` : "Not configured [NOT CONFIGURED]"}`);
      sections.push(`- **Daily Steps**: ${movement.dailyStepTarget ? `${movement.dailyStepTarget.toLocaleString()} steps [UNVERIFIED]` : "Not configured [NOT CONFIGURED]"}`);
      sections.push(`- **Weekly Running**: ${movement.weeklyRunningTargetKm ? `${movement.weeklyRunningTargetKm} km [UNVERIFIED]` : "Not configured [NOT CONFIGURED]"}`);
    }

    // 3. Today's Logged Nutrition
    sections.push(`\n## 3. TODAY'S LOGGED NUTRITION`);
    if (nutrition.hasLoggedMeals) {
      sections.push(`- **Calories Consumed**: ${nutrition.caloriesConsumed} kcal [LOGGED DATA]`);
      sections.push(`- **Protein Consumed**: ${nutrition.proteinConsumed} g [LOGGED DATA]`);
      sections.push(`- **Carbs Consumed**: ${nutrition.carbsConsumed} g [LOGGED DATA]`);
      sections.push(`- **Fat Consumed**: ${nutrition.fatsConsumed} g [LOGGED DATA]`);
      sections.push(`- **Fiber Consumed**: ${nutrition.fiberConsumed} g [LOGGED DATA]`);
      sections.push(`- **Meals Logged Today**: ${nutrition.mealCount} meal(s)`);
      if (nutrition.calorieTarget) {
        sections.push(`- **Calories Remaining**: ${nutrition.caloriesRemaining} kcal`);
      }
    } else {
      sections.push(`- **Status**: [NO LOGGED DATA] No meals logged yet today (Intake is not 0 kcal, just unrecorded).`);
    }

    // 4. Hydration Status
    sections.push(`\n## 4. TODAY'S HYDRATION STATUS`);
    if (hydration.hasLoggedHydration) {
      sections.push(`- **Water Consumed**: ${hydration.consumedMl} ml [LOGGED DATA] (${hydration.percentage}% of goal)`);
      sections.push(`- **Water Remaining**: ${hydration.remainingMl} ml`);
      sections.push(`- **Hydration Streak**: ${hydration.streakDays} day(s) 🔥`);
    } else {
      sections.push(`- **Status**: [NO LOGGED DATA] No water logged yet today.`);
      sections.push(`- **Current Streak**: ${hydration.streakDays} day(s)`);
    }

    // 5. Activity & Running Summary
    sections.push(`\n## 5. MOVEMENT & RUNNING`);
    sections.push(`- **Today's Steps**: ${movement.todaySteps.toLocaleString()} steps [LOGGED DATA]`);
    sections.push(`- **Today's Active Distance**: ${movement.todayDistanceKm} km`);
    sections.push(`- **Total Active Calories Burned**: ${movement.totalActiveCalories} kcal`);
    sections.push(`- **Weekly Running Volume**: ${movement.weeklyRunningDistanceKm} km (${movement.weeklyRunningTargetKm ? `${movement.weeklyRunningTargetKm} km target` : "Target not set"})`);

    // 6. Resistance Training / Workouts
    sections.push(`\n## 6. WORKOUTS & STRENGTH`);
    sections.push(`- **Today's Sessions**: ${workouts.todayWorkoutSessions > 0 ? `${workouts.todayWorkoutSessions} session(s) [LOGGED DATA]` : "No workout logged today [NO LOGGED DATA]"}`);
    sections.push(`- **Weekly Sessions Completed**: ${workouts.weeklyWorkoutSessions} (${workouts.weeklyWorkoutTarget ? `${workouts.weeklyWorkoutTarget} target` : "Target not set"})`);
    if (workouts.weeklyWorkoutVolumeKg > 0) {
      sections.push(`- **Weekly Tonnage Lifted**: ${workouts.weeklyWorkoutVolumeKg.toLocaleString()} kg`);
    }

    // 7. Active Goals & Milestones
    if (goals.featuredGoal) {
      sections.push(`\n## 7. FEATURED ACTIVE GOAL`);
      sections.push(`- **Goal Name**: ${goals.featuredGoal.name}`);
      sections.push(`- **Category**: ${goals.featuredGoal.category}`);
      sections.push(`- **Progress**: ${goals.featuredGoal.progressPercentage}% (${goals.featuredGoal.remainingAmount} ${goals.featuredGoal.unit} remaining)`);
      sections.push(`- **Days Remaining**: ${goals.featuredGoal.daysRemaining} days`);
    }

    // 8. Saved Health Memories & Constraints
    if (memories && memories.length > 0) {
      sections.push(`\n## 8. SAVED HEALTH PREFERENCES & CONSTRAINTS`);
      memories.forEach((mem) => {
        sections.push(`- **[${mem.category}]**: ${mem.content} [CONFIRMED MEMORY]`);
      });
    }

    sections.push(`\n---`);
    sections.push(`*Nutri-Track Action Rule: When agreeing to new targets or logs, output a structured \`NUTRI-TRACK ACTION\` block.*`);

    return sections.join("\n");
  }
}
