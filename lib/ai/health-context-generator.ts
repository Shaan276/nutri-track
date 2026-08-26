import { HealthContextService, HealthContextSnapshot } from "@/lib/services/health-context.service";

/**
 * Generates a clean, human-readable Markdown Health Context Summary
 * for the user to copy into their ChatGPT Project to refresh their health snapshot.
 *
 * Strict Rule: Never converts missing data into fake zeros.
 * Explicitly marks data as CONFIRMED DATA, NOT CONFIGURED, or NO RECENT DATA.
 */
export class HealthContextGenerator {
  static async generateMarkdownSummary(userId: string): Promise<string> {
    const snapshot: HealthContextSnapshot = await HealthContextService.getHealthSnapshot(userId);
    return this.formatSnapshotToMarkdown(snapshot);
  }

  static formatSnapshotToMarkdown(snapshot: HealthContextSnapshot): string {
    const { profile, nutrition, hydration, movement, workouts, memories, goals } = snapshot;

    const sections: string[] = [];

    // Header
    sections.push(`# NUTRI-TRACK CURRENT HEALTH SNAPSHOT`);
    sections.push(`*Generated on ${snapshot.date} (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})*\n`);

    // 1. Physical Profile & Core Goal
    sections.push(`## 1. USER PROFILE & PHYSICAL ATTRIBUTES`);
    sections.push(`- **Name**: ${profile.name || "Member"}`);
    sections.push(`- **Biological Sex**: ${profile.biologicalSex || "Not configured"}`);
    sections.push(`- **Height**: ${profile.heightCm !== null ? `${profile.heightCm} cm` : "Not configured"}`);
    sections.push(`- **Latest Weight**: ${profile.weightKg !== null ? `${profile.weightKg} kg` : "Not configured"}`);
    sections.push(`- **Primary Goal**: ${profile.primaryGoal || "Not configured"}`);
    if (profile.bmr && profile.tdee) {
      sections.push(`- **Estimated BMR**: ${Math.round(profile.bmr)} kcal`);
      sections.push(`- **Estimated TDEE**: ${Math.round(profile.tdee)} kcal`);
    }

    // 2. Configured Daily Targets
    sections.push(`\n## 2. CONFIGURED DAILY TARGETS`);
    if (nutrition.isTargetsConfigured) {
      sections.push(`- **Calories Target**: ${nutrition.calorieTarget !== null ? `${nutrition.calorieTarget} kcal [CONFIRMED DATA]` : "Not configured"}`);
      sections.push(`- **Protein Target**: ${nutrition.proteinTarget !== null ? `${nutrition.proteinTarget} g [CONFIRMED DATA]` : "Not configured"}`);
      sections.push(`- **Carbohydrates Target**: ${nutrition.carbsTarget !== null ? `${nutrition.carbsTarget} g [CONFIRMED DATA]` : "Not configured"}`);
      sections.push(`- **Fat Target**: ${nutrition.fatsTarget !== null ? `${nutrition.fatsTarget} g [CONFIRMED DATA]` : "Not configured"}`);
      sections.push(`- **Hydration Target**: ${hydration.targetMl ? `${hydration.targetMl} ml [CONFIRMED DATA]` : "Not configured"}`);
      sections.push(`- **Daily Step Target**: ${movement.dailyStepTarget ? `${movement.dailyStepTarget.toLocaleString()} steps [CONFIRMED DATA]` : "Not configured"}`);
      sections.push(`- **Weekly Running Target**: ${movement.weeklyRunningTargetKm ? `${movement.weeklyRunningTargetKm} km [CONFIRMED DATA]` : "Not configured"}`);
      sections.push(`- **Weekly Workout Target**: ${workouts.weeklyWorkoutTarget ? `${workouts.weeklyWorkoutTarget} sessions [CONFIRMED DATA]` : "Not configured"}`);
    } else {
      sections.push(`> [!NOTE]\n> **Target Status**: **NOT CONFIGURED YET**\n> Complete your Initial Health Assessment to personalize your calories, macros, hydration, and exercise targets.`);
      sections.push(`- **Calories**: Not configured`);
      sections.push(`- **Protein**: Not configured`);
      sections.push(`- **Carbohydrates**: Not configured`);
      sections.push(`- **Fat**: Not configured`);
      sections.push(`- **Hydration**: ${hydration.targetMl ? `${hydration.targetMl} ml` : "Not configured"}`);
      sections.push(`- **Daily Steps**: ${movement.dailyStepTarget ? `${movement.dailyStepTarget.toLocaleString()} steps` : "Not configured"}`);
      sections.push(`- **Weekly Running**: ${movement.weeklyRunningTargetKm ? `${movement.weeklyRunningTargetKm} km` : "Not configured"}`);
    }

    // 3. Today's Logged Nutrition
    sections.push(`\n## 3. TODAY'S LOGGED NUTRITION`);
    if (nutrition.hasLoggedMeals) {
      sections.push(`- **Calories Consumed**: ${nutrition.caloriesConsumed} kcal`);
      sections.push(`- **Protein Consumed**: ${nutrition.proteinConsumed} g`);
      sections.push(`- **Carbs Consumed**: ${nutrition.carbsConsumed} g`);
      sections.push(`- **Fat Consumed**: ${nutrition.fatsConsumed} g`);
      sections.push(`- **Fiber Consumed**: ${nutrition.fiberConsumed} g`);
      sections.push(`- **Meals Logged Today**: ${nutrition.mealCount} meal(s)`);
      if (nutrition.calorieTarget) {
        sections.push(`- **Calories Remaining**: ${nutrition.caloriesRemaining} kcal`);
      }
    } else {
      sections.push(`- **Status**: [NO RECENT DATA] No meals logged yet today.`);
    }

    // 4. Hydration Status
    sections.push(`\n## 4. TODAY'S HYDRATION STATUS`);
    if (hydration.hasLoggedHydration) {
      sections.push(`- **Water Consumed**: ${hydration.consumedMl} ml (${hydration.percentage}% of goal)`);
      sections.push(`- **Water Remaining**: ${hydration.remainingMl} ml`);
      sections.push(`- **Hydration Streak**: ${hydration.streakDays} day(s) 🔥`);
    } else {
      sections.push(`- **Status**: [NO RECENT DATA] 0 ml logged today.`);
      sections.push(`- **Current Streak**: ${hydration.streakDays} day(s)`);
    }

    // 5. Activity & Running Summary
    sections.push(`\n## 5. MOVEMENT & RUNNING`);
    sections.push(`- **Today's Steps**: ${movement.todaySteps.toLocaleString()} / ${movement.dailyStepTarget ? movement.dailyStepTarget.toLocaleString() : "Not set"} steps`);
    sections.push(`- **Today's Active Distance**: ${movement.todayDistanceKm} km`);
    sections.push(`- **Total Active Calories Burned**: ${movement.totalActiveCalories} kcal`);
    sections.push(`- **Weekly Running Volume**: ${movement.weeklyRunningDistanceKm} km / ${movement.weeklyRunningTargetKm} km target`);

    // 6. Resistance Training / Workouts
    sections.push(`\n## 6. WORKOUTS & STRENGTH`);
    sections.push(`- **Today's Sessions**: ${workouts.todayWorkoutSessions}`);
    sections.push(`- **Weekly Sessions Completed**: ${workouts.weeklyWorkoutSessions} / ${workouts.weeklyWorkoutTarget} target`);
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
        sections.push(`- **[${mem.category}]**: ${mem.content}`);
      });
    }

    sections.push(`\n---`);
    sections.push(`*To apply any new nutrition, fitness, or goal updates from ChatGPT into Nutri-Track, copy the structured \`NUTRI-TRACK ACTION\` JSON block and paste it into the Nutri-Track Action Bridge.*`);

    return sections.join("\n");
  }
}
