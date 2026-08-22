import { prisma } from "@/lib/db";
import {
  ReportRangePreset,
  ReportDateRange,
  NutritionOverviewMetrics,
  HydrationOverviewMetrics,
  ActivityOverviewMetrics,
  WorkoutOverviewMetrics,
  DeepNutritionOverviewMetrics,
  WeeklyComparisonMetric,
  PersonalRecordItem,
  ReportChartData,
  FullReportResponse,
  MicronutrientReportItem,
  ConsistencyScoreBreakdown,
  ConsistencyScorePillar,
  FiberSugarTrendPoint,
  ProteinConsistencyPoint,
  ExerciseDistributionItem,
  ActivityDistributionItem,
  RunningPaceTrendPoint,
  StepsTrendPoint,
} from "@/lib/validations/report";
import { DeepNutritionService } from "./deep-nutrition.service";
import { NutrientTaxonomyRegistry } from "@/lib/validations/nutrient-taxonomy";

export class ReportService {
  static formatDate(d: Date): string {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  static parseDate(str: string): Date {
    const [y, m, d] = str.split("-").map(Number);
    return new Date(y, m - 1, d, 12, 0, 0);
  }

  /**
   * Resolves date range bounds and metadata from preset or custom bounds
   */
  static resolveDateRange(
    preset: ReportRangePreset,
    customStart?: string,
    customEnd?: string
  ): ReportDateRange {
    const today = new Date();

    let startDateStr = "";
    let endDateStr = this.formatDate(today);
    let label = "";

    switch (preset) {
      case "today": {
        startDateStr = endDateStr;
        label = "Today";
        break;
      }
      case "thisWeek": {
        const d = new Date(today);
        const dayOfWeek = d.getDay(); // 0 = Sunday, 1 = Monday
        const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        d.setDate(d.getDate() - diffToMonday);
        startDateStr = this.formatDate(d);
        label = "This Week";
        break;
      }
      case "last7days": {
        const d = new Date(today);
        d.setDate(d.getDate() - 6);
        startDateStr = this.formatDate(d);
        label = "Last 7 Days";
        break;
      }
      case "last30days": {
        const d = new Date(today);
        d.setDate(d.getDate() - 29);
        startDateStr = this.formatDate(d);
        label = "Last 30 Days";
        break;
      }
      case "thisMonth": {
        const d = new Date(today.getFullYear(), today.getMonth(), 1);
        startDateStr = this.formatDate(d);
        label = "This Month";
        break;
      }
      case "custom": {
        if (customStart && customEnd) {
          startDateStr = customStart;
          endDateStr = customEnd;
          label = `${customStart} to ${customEnd}`;
        } else {
          const d = new Date(today);
          d.setDate(d.getDate() - 6);
          startDateStr = this.formatDate(d);
          label = "Custom Range";
        }
        break;
      }
      default: {
        const d = new Date(today);
        d.setDate(d.getDate() - 6);
        startDateStr = this.formatDate(d);
        label = "Last 7 Days";
        break;
      }
    }

    const startObj = this.parseDate(startDateStr);
    const endObj = this.parseDate(endDateStr);
    const diffTime = Math.abs(endObj.getTime() - startObj.getTime());
    const daysCount = Math.max(1, Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1);

    return {
      startDate: startDateStr,
      endDate: endDateStr,
      label,
      preset,
      daysCount,
    };
  }

  /**
   * Generates a continuous array of dates between start and end (inclusive)
   */
  static generateDateSequence(startDate: string, endDate: string): string[] {
    const dates: string[] = [];
    const current = this.parseDate(startDate);
    const end = this.parseDate(endDate);

    while (current <= end) {
      dates.push(this.formatDate(current));
      current.setDate(current.getDate() + 1);
    }
    return dates;
  }

  /**
   * Generates equivalent previous period date sequence
   */
  static getPreviousPeriodDates(startDate: string, daysCount: number): string[] {
    const dates: string[] = [];
    const current = this.parseDate(startDate);
    current.setDate(current.getDate() - daysCount);

    for (let i = 0; i < daysCount; i++) {
      dates.push(this.formatDate(current));
      current.setDate(current.getDate() + 1);
    }
    return dates;
  }

  /**
   * Calculates safe percentage difference with division-by-zero protection
   */
  static calculatePercentChange(
    current: number,
    previous: number
  ): {
    percentChange: number | null;
    direction: "INCREASE" | "DECREASE" | "NO_CHANGE" | "NEW";
    formattedChange: string;
  } {
    if (previous === 0) {
      if (current === 0) {
        return { percentChange: 0, direction: "NO_CHANGE", formattedChange: "0%" };
      }
      return { percentChange: null, direction: "NEW", formattedChange: "New (No prev data)" };
    }

    const diff = ((current - previous) / previous) * 100;
    const rounded = Math.round(diff);

    if (rounded === 0) {
      return { percentChange: 0, direction: "NO_CHANGE", formattedChange: "0%" };
    } else if (rounded > 0) {
      return { percentChange: rounded, direction: "INCREASE", formattedChange: `↑ ${rounded}%` };
    } else {
      return { percentChange: Math.abs(rounded), direction: "DECREASE", formattedChange: `↓ ${Math.abs(rounded)}%` };
    }
  }

  /**
   * Aggregates full report telemetry for the given user and date range (Read-Only)
   */
  static async getFullReport(
    userId: string,
    preset: ReportRangePreset = "last7days",
    customStart?: string,
    customEnd?: string
  ): Promise<FullReportResponse> {
    const dateRange = this.resolveDateRange(preset, customStart, customEnd);
    const dateList = this.generateDateSequence(dateRange.startDate, dateRange.endDate);
    const prevDateList = this.getPreviousPeriodDates(dateRange.startDate, dateRange.daysCount);

    // 1. Fetch user profile and configured targets
    const [userProfile, userTarget] = await Promise.all([
      prisma.userProfile.findUnique({ where: { userId } }),
      prisma.userNutrientTarget.findUnique({ where: { userId } }),
    ]);

    const targetCalories = userTarget ? Number(userTarget.calories) : 2000;
    const targetProtein = userTarget ? Number(userTarget.protein) : 120;
    const targetHydration = userProfile?.dailyHydrationTargetMl || 2500;
    const targetSteps = (userProfile as any)?.dailyStepsTarget || 10000;

    // 2. Fetch current period records
    const [meals, hydrations, activities, workouts] = await Promise.all([
      prisma.mealLog.findMany({
        where: { userId, date: { in: dateList } },
        include: { entries: { include: { food: true } } },
      }),
      prisma.hydrationLog.findMany({
        where: { userId, date: { in: dateList } },
      }),
      prisma.activityLog.findMany({
        where: { userId, date: { in: dateList } },
      }),
      prisma.workoutSession.findMany({
        where: { userId, date: { in: dateList } },
        include: { exercises: { include: { sets: true } } },
      }),
    ]);

    // 3. Fetch previous period records for comparisons
    const [prevMeals, prevHydrations, prevActivities, prevWorkouts] = await Promise.all([
      prisma.mealLog.findMany({
        where: { userId, date: { in: prevDateList } },
        include: { entries: true },
      }),
      prisma.hydrationLog.findMany({
        where: { userId, date: { in: prevDateList } },
      }),
      prisma.activityLog.findMany({
        where: { userId, date: { in: prevDateList } },
      }),
      prisma.workoutSession.findMany({
        where: { userId, date: { in: prevDateList } },
        include: { exercises: { include: { sets: true } } },
      }),
    ]);

    // -----------------------------------------------------------------------
    // NUTRITION AGGREGATIONS
    // -----------------------------------------------------------------------
    const dailyNutritionMap = new Map<
      string,
      {
        cals: number;
        p: number;
        c: number;
        f: number;
        fiber: number;
        sugar: number;
        vitamins: Record<string, number>;
        minerals: Record<string, number>;
      }
    >();

    dateList.forEach((dt) => {
      dailyNutritionMap.set(dt, {
        cals: 0,
        p: 0,
        c: 0,
        f: 0,
        fiber: 0,
        sugar: 0,
        vitamins: {},
        minerals: {},
      });
    });

    // Helper to extract food nutrients
    const getFoodVal = (food: any, key: string) => {
      const v = food[key];
      return v !== null && v !== undefined ? Number(v) : 0;
    };

    meals.forEach((m) => {
      const cur = dailyNutritionMap.get(m.date) || {
        cals: 0,
        p: 0,
        c: 0,
        f: 0,
        fiber: 0,
        sugar: 0,
        vitamins: {},
        minerals: {},
      };

      m.entries.forEach((e) => {
        const qty = Number(e.quantity || 0);
        const sSize = e.food ? Number(e.food.servingSize || 100) : 100;
        const scale = sSize > 0 ? qty / sSize : 1;

        cur.cals += Number(e.calculatedCalories || 0);
        cur.p += Number(e.calculatedProtein || 0);
        cur.c += Number(e.calculatedCarbs || 0);
        cur.f += Number(e.calculatedFat || 0);

        if (e.food) {
          cur.fiber += getFoodVal(e.food, "fiber") * scale;
          cur.sugar += getFoodVal(e.food, "sugar") * scale;

          // Vitamins
          const vitKeys = [
            "vitaminA", "vitaminB1", "vitaminB2", "vitaminB3", "vitaminB5",
            "vitaminB6", "vitaminB7", "vitaminB9", "vitaminB12", "vitaminC",
            "vitaminD", "vitaminE", "vitaminK",
          ];
          vitKeys.forEach((vk) => {
            cur.vitamins[vk] = (cur.vitamins[vk] || 0) + getFoodVal(e.food, vk) * scale;
          });

          // Minerals
          const minKeys = [
            "calcium", "iron", "magnesium", "phosphorus", "potassium",
            "sodium", "zinc", "copper", "manganese", "selenium",
            "chromium", "molybdenum", "iodine",
          ];
          minKeys.forEach((mk) => {
            cur.minerals[mk] = (cur.minerals[mk] || 0) + getFoodVal(e.food, mk) * scale;
          });
        }
      });

      dailyNutritionMap.set(m.date, cur);
    });

    let totalCals = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;
    let totalFiber = 0;
    let totalSugar = 0;
    let loggedMealDays = 0;

    dailyNutritionMap.forEach((v) => {
      if (v.cals > 0) loggedMealDays++;
      totalCals += v.cals;
      totalProtein += v.p;
      totalCarbs += v.c;
      totalFat += v.f;
      totalFiber += v.fiber;
      totalSugar += v.sugar;
    });

    const activeNutritionDays = Math.max(1, loggedMealDays);
    const avgCalories = Math.round(totalCals / activeNutritionDays);
    const avgProteinG = Math.round((totalProtein / activeNutritionDays) * 10) / 10;
    const avgCarbsG = Math.round((totalCarbs / activeNutritionDays) * 10) / 10;
    const avgFatG = Math.round((totalFat / activeNutritionDays) * 10) / 10;
    const avgFiberG = Math.round((totalFiber / activeNutritionDays) * 10) / 10;
    const avgSugarG = Math.round((totalSugar / activeNutritionDays) * 10) / 10;
    const goalAdherencePct =
      targetCalories > 0 ? Math.min(100, Math.round((avgCalories / targetCalories) * 100)) : 0;

    const nutritionOverview: NutritionOverviewMetrics = {
      avgCalories: loggedMealDays > 0 ? avgCalories : 0,
      targetCalories,
      avgProteinG: loggedMealDays > 0 ? avgProteinG : 0,
      avgCarbsG: loggedMealDays > 0 ? avgCarbsG : 0,
      avgFatG: loggedMealDays > 0 ? avgFatG : 0,
      avgFiberG: loggedMealDays > 0 ? avgFiberG : 0,
      avgSugarG: loggedMealDays > 0 ? avgSugarG : 0,
      goalAdherencePct: loggedMealDays > 0 ? goalAdherencePct : 0,
      totalDaysInPeriod: dateRange.daysCount,
      loggedDaysCount: loggedMealDays,
    };

    // -----------------------------------------------------------------------
    // MICRONUTRIENT AGGREGATIONS (13 Vitamins + 13 Minerals)
    // -----------------------------------------------------------------------
    const micronutrients: MicronutrientReportItem[] = [];

    const vitDefinitions = [
      { key: "vitaminA", label: "Vitamin A", unit: "µg RAE" },
      { key: "vitaminB1", label: "Vitamin B1 (Thiamine)", unit: "mg" },
      { key: "vitaminB2", label: "Vitamin B2 (Riboflavin)", unit: "mg" },
      { key: "vitaminB3", label: "Vitamin B3 (Niacin)", unit: "mg" },
      { key: "vitaminB5", label: "Vitamin B5 (Pantothenic)", unit: "mg" },
      { key: "vitaminB6", label: "Vitamin B6", unit: "mg" },
      { key: "vitaminB7", label: "Vitamin B7 (Biotin)", unit: "µg" },
      { key: "vitaminB9", label: "Vitamin B9 (Folate)", unit: "µg DFE" },
      { key: "vitaminB12", label: "Vitamin B12", unit: "µg" },
      { key: "vitaminC", label: "Vitamin C", unit: "mg" },
      { key: "vitaminD", label: "Vitamin D", unit: "µg" },
      { key: "vitaminE", label: "Vitamin E", unit: "mg" },
      { key: "vitaminK", label: "Vitamin K", unit: "µg" },
    ];

    const minDefinitions = [
      { key: "calcium", label: "Calcium", unit: "mg" },
      { key: "iron", label: "Iron", unit: "mg" },
      { key: "magnesium", label: "Magnesium", unit: "mg" },
      { key: "phosphorus", label: "Phosphorus", unit: "mg" },
      { key: "potassium", label: "Potassium", unit: "mg" },
      { key: "sodium", label: "Sodium", unit: "mg" },
      { key: "zinc", label: "Zinc", unit: "mg" },
      { key: "copper", label: "Copper", unit: "mg" },
      { key: "manganese", label: "Manganese", unit: "mg" },
      { key: "selenium", label: "Selenium", unit: "µg" },
      { key: "chromium", label: "Chromium", unit: "µg" },
      { key: "molybdenum", label: "Molybdenum", unit: "µg" },
      { key: "iodine", label: "Iodine", unit: "µg" },
    ];

    // Compute average for vitamins
    vitDefinitions.forEach((def) => {
      let sum = 0;
      dailyNutritionMap.forEach((v) => {
        sum += v.vitamins[def.key] || 0;
      });
      const avg = loggedMealDays > 0 ? Math.round((sum / activeNutritionDays) * 10) / 10 : 0;
      const targetVal = userTarget ? Number((userTarget as any)[def.key] || 0) : null;
      const hasTarget = targetVal !== null && targetVal > 0;
      const percentage = hasTarget ? Math.min(200, Math.round((avg / targetVal) * 100)) : null;

      let statusLabel = "No target configured";
      let statusColor = "text-slate-400";
      if (hasTarget && percentage !== null) {
        if (percentage >= 100) {
          statusLabel = "Optimal (≥100%)";
          statusColor = "text-emerald-400";
        } else if (percentage >= 70) {
          statusLabel = "Good (70-99%)";
          statusColor = "text-blue-400";
        } else {
          statusLabel = "Low (<70%)";
          statusColor = "text-amber-400";
        }
      }

      micronutrients.push({
        key: def.key,
        label: def.label,
        category: "VITAMIN",
        unit: def.unit,
        avgIntake: avg,
        target: hasTarget ? targetVal : null,
        percentage,
        hasTarget,
        statusLabel,
        statusColor,
      });
    });

    // Compute average for minerals
    minDefinitions.forEach((def) => {
      let sum = 0;
      dailyNutritionMap.forEach((v) => {
        sum += v.minerals[def.key] || 0;
      });
      const avg = loggedMealDays > 0 ? Math.round((sum / activeNutritionDays) * 10) / 10 : 0;
      const targetVal = userTarget ? Number((userTarget as any)[def.key] || 0) : null;
      const hasTarget = targetVal !== null && targetVal > 0;
      const percentage = hasTarget ? Math.min(200, Math.round((avg / targetVal) * 100)) : null;

      let statusLabel = "No target configured";
      let statusColor = "text-slate-400";
      if (hasTarget && percentage !== null) {
        if (percentage >= 100) {
          statusLabel = "Optimal (≥100%)";
          statusColor = "text-emerald-400";
        } else if (percentage >= 70) {
          statusLabel = "Good (70-99%)";
          statusColor = "text-blue-400";
        } else {
          statusLabel = "Low (<70%)";
          statusColor = "text-amber-400";
        }
      }

      micronutrients.push({
        key: def.key,
        label: def.label,
        category: "MINERAL",
        unit: def.unit,
        avgIntake: avg,
        target: hasTarget ? targetVal : null,
        percentage,
        hasTarget,
        statusLabel,
        statusColor,
      });
    });

    // -----------------------------------------------------------------------
    // HYDRATION AGGREGATIONS & STREAK
    // -----------------------------------------------------------------------
    const dailyHydrationMap = new Map<string, number>();
    dateList.forEach((dt) => dailyHydrationMap.set(dt, 0));

    hydrations.forEach((h) => {
      const cur = dailyHydrationMap.get(h.date) || 0;
      dailyHydrationMap.set(h.date, cur + h.amountMl);
    });

    let totalWaterMl = 0;
    let loggedHydrationDays = 0;
    let achievedHydrationDays = 0;

    dailyHydrationMap.forEach((amt) => {
      if (amt > 0) loggedHydrationDays++;
      if (amt >= targetHydration) achievedHydrationDays++;
      totalWaterMl += amt;
    });

    const activeHydrationDays = Math.max(1, loggedHydrationDays);
    const avgIntakeMl = Math.round(totalWaterMl / activeHydrationDays);
    const hydrationGoalPct =
      dateList.length > 0 ? Math.round((achievedHydrationDays / dateList.length) * 100) : 0;

    // Calculate historical hydration streak
    const allHydrations = await prisma.hydrationLog.findMany({
      where: { userId },
      orderBy: { date: "desc" },
    });

    const allHydrationDates = new Set(allHydrations.map((h) => h.date));
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    const checkDate = new Date();
    // Check backwards from today for current streak
    for (let i = 0; i < 365; i++) {
      const dStr = ReportService.formatDate(checkDate);
      checkDate.setDate(checkDate.getDate() - 1);

      const dayTotal = allHydrations
        .filter((h) => h.date === dStr)
        .reduce((sum, h) => sum + h.amountMl, 0);

      if (dayTotal >= targetHydration) {
        currentStreak++;
      } else if (i === 0 && dayTotal < targetHydration) {
        // Today might still be in progress
        continue;
      } else {
        break;
      }
    }

    const hydrationOverview: HydrationOverviewMetrics = {
      avgIntakeMl: loggedHydrationDays > 0 ? avgIntakeMl : 0,
      dailyTargetMl: targetHydration,
      goalAchievementPct: hydrationGoalPct,
      currentStreakDays: currentStreak,
      longestStreakDays: Math.max(currentStreak, achievedHydrationDays),
      loggedDaysCount: loggedHydrationDays,
    };

    // -----------------------------------------------------------------------
    // ACTIVITY & RUNNING AGGREGATIONS
    // -----------------------------------------------------------------------
    let totalDistanceKm = 0;
    let totalDurationMinutes = 0;
    let totalCaloriesBurned = 0;
    let totalSteps = 0;
    let runningSessionsCount = 0;
    let otherSessionsCount = 0;
    let totalRunPaceSeconds = 0;
    let totalElevationGainMeters = 0;
    let highestElevationMeters = 0;

    activities.forEach((act) => {
      const dist = Number(act.distanceKm || 0);
      totalDistanceKm += dist;
      totalDurationMinutes += Math.round((act.movingDurationSeconds || 0) / 60);
      totalCaloriesBurned += act.caloriesBurned || 0;
      totalSteps += act.steps || 0;

      const elev = act.elevationGainMeters || 0;
      totalElevationGainMeters += elev;
      if (elev > highestElevationMeters) highestElevationMeters = elev;

      if (act.activityType === "RUN") {
        runningSessionsCount++;
        if (act.averagePaceSecondsPerKm) {
          totalRunPaceSeconds += act.averagePaceSecondsPerKm;
        }
      } else {
        otherSessionsCount++;
      }
    });

    let avgPaceFormatted: string | null = null;
    if (runningSessionsCount > 0 && totalRunPaceSeconds > 0) {
      const avgPaceSec = Math.round(totalRunPaceSeconds / runningSessionsCount);
      const mins = Math.floor(avgPaceSec / 60);
      const secs = avgPaceSec % 60;
      avgPaceFormatted = `${mins}:${secs < 10 ? "0" : ""}${secs} / km`;
    }

    const activityOverview: ActivityOverviewMetrics = {
      totalSessions: activities.length,
      totalDistanceKm: Math.round(totalDistanceKm * 100) / 100,
      totalDurationMinutes,
      totalCaloriesBurned,
      totalSteps,
      runningSessionsCount,
      otherSessionsCount,
      avgPaceFormatted,
      totalElevationGainMeters,
      highestElevationMeters,
    };

    // Activity distribution donut data
    const activityDistMap = new Map<string, { sessions: number; duration: number; calories: number }>();
    activities.forEach((a) => {
      const key = a.activityType === "RUN" ? "Running" : (a.runningType ? a.runningType.toLowerCase() : "Other Activity");
      const cur = activityDistMap.get(key) || { sessions: 0, duration: 0, calories: 0 };
      cur.sessions++;
      cur.duration += Math.round((a.movingDurationSeconds || 0) / 60);
      cur.calories += a.caloriesBurned || 0;
      activityDistMap.set(key, cur);
    });

    const activityDistribution: ActivityDistributionItem[] = [];
    const colors = ["#10B981", "#3B82F6", "#F59E0B", "#8B5CF6", "#EC4899"];
    let colorIdx = 0;
    activityDistMap.forEach((val, key) => {
      activityDistribution.push({
        type: key,
        name: key.charAt(0).toUpperCase() + key.slice(1),
        sessionsCount: val.sessions,
        durationMinutes: val.duration,
        caloriesBurned: val.calories,
        percentage: activities.length > 0 ? Math.round((val.sessions / activities.length) * 100) : 0,
        color: colors[colorIdx % colors.length],
      });
      colorIdx++;
    });

    // -----------------------------------------------------------------------
    // WORKOUT AGGREGATIONS
    // -----------------------------------------------------------------------
    let totalExercises = 0;
    let totalSets = 0;
    let totalReps = 0;
    let totalVolumeKg = 0;
    let gymSessionsCount = 0;
    let homeSessionsCount = 0;
    let totalWorkoutDuration = 0;

    const exerciseMap = new Map<string, { sessions: number; sets: number; reps: number; volume: number; category: string }>();

    workouts.forEach((w) => {
      totalWorkoutDuration += Math.round((w.durationSeconds || 0) / 60);
      if (w.workoutType === "GYM_WORKOUT" || (w.workoutType as string) === "GYM") gymSessionsCount++;
      else homeSessionsCount++;

      w.exercises.forEach((ex) => {
        totalExercises++;
        const exName = ex.name;
        const curEx = exerciseMap.get(exName) || { sessions: 0, sets: 0, reps: 0, volume: 0, category: ex.category || "General" };
        curEx.sessions++;

        ex.sets.forEach((st) => {
          totalSets++;
          const reps = st.reps || 0;
          totalReps += reps;
          curEx.sets++;
          curEx.reps += reps;

          if (st.weightKg && reps > 0) {
            const vol = Number(st.weightKg) * reps;
            totalVolumeKg += vol;
            curEx.volume += vol;
          }
        });
        exerciseMap.set(exName, curEx);
      });
    });

    const exerciseDistribution: ExerciseDistributionItem[] = [];
    exerciseMap.forEach((val, key) => {
      exerciseDistribution.push({
        exerciseName: key,
        category: val.category,
        sessionsCount: val.sessions,
        totalSets: val.sets,
        totalReps: val.reps,
        totalVolumeKg: Math.round(val.volume),
      });
    });
    exerciseDistribution.sort((a, b) => b.totalSets - a.totalSets);

    const workoutOverview: WorkoutOverviewMetrics = {
      totalSessions: workouts.length,
      totalExercises,
      totalSets,
      totalReps,
      totalVolumeKg: Math.round(totalVolumeKg),
      gymSessionsCount,
      homeSessionsCount,
      avgDurationMinutes: workouts.length > 0 ? Math.round(totalWorkoutDuration / workouts.length) : 0,
    };

    // -----------------------------------------------------------------------
    // DEEP NUTRITION OVERVIEW
    // -----------------------------------------------------------------------
    const deepAnalysis = await DeepNutritionService.getDeepNutritionAnalysis(userId, dateRange.endDate);
    const deepNutritionOverview: DeepNutritionOverviewMetrics = {
      avgCoverageScore: deepAnalysis.overview.coverageScore,
      coverageRatingLabel: deepAnalysis.overview.coverageRatingLabel,
      totalNutrientsTracked: deepAnalysis.macros.length + deepAnalysis.vitamins.length + deepAnalysis.minerals.length,
    };

    // -----------------------------------------------------------------------
    // DETERMINISTIC CONSISTENCY SCORE
    // -----------------------------------------------------------------------
    const pillars: ConsistencyScorePillar[] = [];
    let totalChecksMet = 0;
    let totalChecksEvaluated = 0;

    // Pillar 1: Protein Target
    if (targetProtein > 0) {
      let metDays = 0;
      dailyNutritionMap.forEach((v) => {
        if (v.p >= targetProtein * 0.9) metDays++; // 90% threshold
      });
      const pct = Math.round((metDays / dateList.length) * 100);
      pillars.push({
        key: "protein",
        label: "Protein Target",
        metCount: metDays,
        totalCount: dateList.length,
        percentage: pct,
        isConfigured: true,
        detail: `Met on ${metDays}/${dateList.length} days (Target: ${targetProtein}g)`,
      });
      totalChecksMet += metDays;
      totalChecksEvaluated += dateList.length;
    }

    // Pillar 2: Caloric Balance
    if (targetCalories > 0) {
      let metDays = 0;
      dailyNutritionMap.forEach((v) => {
        if (v.cals >= targetCalories * 0.8 && v.cals <= targetCalories * 1.2) metDays++;
      });
      const pct = Math.round((metDays / dateList.length) * 100);
      pillars.push({
        key: "calories",
        label: "Caloric Target",
        metCount: metDays,
        totalCount: dateList.length,
        percentage: pct,
        isConfigured: true,
        detail: `Met on ${metDays}/${dateList.length} days (Target: ${targetCalories} kcal ±20%)`,
      });
      totalChecksMet += metDays;
      totalChecksEvaluated += dateList.length;
    }

    // Pillar 3: Daily Hydration
    if (targetHydration > 0) {
      let metDays = 0;
      dailyHydrationMap.forEach((amt) => {
        if (amt >= targetHydration) metDays++;
      });
      const pct = Math.round((metDays / dateList.length) * 100);
      pillars.push({
        key: "hydration",
        label: "Hydration Goal",
        metCount: metDays,
        totalCount: dateList.length,
        percentage: pct,
        isConfigured: true,
        detail: `Met on ${metDays}/${dateList.length} days (Target: ${targetHydration} ml)`,
      });
      totalChecksMet += metDays;
      totalChecksEvaluated += dateList.length;
    }

    // Pillar 4: Daily Steps (if logged)
    if (targetSteps > 0) {
      let metDays = 0;
      dateList.forEach((dt) => {
        const stepTotal = activities
          .filter((a) => a.date === dt)
          .reduce((sum, a) => sum + (a.steps || 0), 0);
        if (stepTotal >= targetSteps) metDays++;
      });
      const pct = Math.round((metDays / dateList.length) * 100);
      pillars.push({
        key: "steps",
        label: "Step Goal",
        metCount: metDays,
        totalCount: dateList.length,
        percentage: pct,
        isConfigured: true,
        detail: `Met on ${metDays}/${dateList.length} days (Target: ${targetSteps.toLocaleString()} steps)`,
      });
      totalChecksMet += metDays;
      totalChecksEvaluated += dateList.length;
    }

    // Pillar 5: Workout Consistency (Target: at least 3 sessions/week or proportional)
    const expectedWorkouts = Math.max(1, Math.round((dateList.length / 7) * 3));
    const workoutPct = Math.min(100, Math.round((workouts.length / expectedWorkouts) * 100));
    pillars.push({
      key: "workouts",
      label: "Workout Frequency",
      metCount: Math.min(workouts.length, expectedWorkouts),
      totalCount: expectedWorkouts,
      percentage: workoutPct,
      isConfigured: true,
      detail: `Completed ${workouts.length}/${expectedWorkouts} sessions target for period`,
    });
    totalChecksMet += Math.min(workouts.length, expectedWorkouts);
    totalChecksEvaluated += expectedWorkouts;

    const overallScore =
      totalChecksEvaluated > 0 ? Math.round((totalChecksMet / totalChecksEvaluated) * 100) : 0;

    let ratingLabel = "Moderate Consistency";
    let rating: ConsistencyScoreBreakdown["rating"] = "MODERATE";
    if (pillars.length === 0) {
      rating = "NO_TARGETS";
      ratingLabel = "No Targets Configured";
    } else if (overallScore >= 85) {
      rating = "EXCELLENT";
      ratingLabel = "Excellent Consistency";
    } else if (overallScore >= 70) {
      rating = "GOOD";
      ratingLabel = "Good Consistency";
    } else if (overallScore >= 50) {
      rating = "MODERATE";
      ratingLabel = "Moderate Consistency";
    } else {
      rating = "NEEDS_IMPROVEMENT";
      ratingLabel = "Needs Focus";
    }

    const consistencyScore: ConsistencyScoreBreakdown = {
      score: overallScore,
      rating,
      ratingLabel,
      activePillarsCount: pillars.length,
      totalChecksMet,
      totalChecksEvaluated,
      pillars,
    };

    // -----------------------------------------------------------------------
    // PERIOD COMPARISONS (Current vs Previous Equivalent Period)
    // -----------------------------------------------------------------------
    let prevTotalCals = 0;
    let prevTotalProtein = 0;
    prevMeals.forEach((m) => {
      m.entries.forEach((e) => {
        prevTotalCals += Number(e.calculatedCalories || 0);
        prevTotalProtein += Number(e.calculatedProtein || 0);
      });
    });

    let prevWaterMl = 0;
    prevHydrations.forEach((h) => (prevWaterMl += h.amountMl));

    let prevRunDistanceKm = 0;
    let prevTotalSteps = 0;
    let prevActivityCals = 0;
    prevActivities.forEach((a) => {
      if (a.activityType === "RUN") prevRunDistanceKm += Number(a.distanceKm || 0);
      prevTotalSteps += a.steps || 0;
      prevActivityCals += a.caloriesBurned || 0;
    });

    let prevWorkoutSessions = prevWorkouts.length;
    let prevWorkoutVolumeKg = 0;
    prevWorkouts.forEach((w) => {
      w.exercises.forEach((ex) => {
        ex.sets.forEach((st) => {
          if (st.weightKg && st.reps) {
            prevWorkoutVolumeKg += Number(st.weightKg) * st.reps;
          }
        });
      });
    });

    const comparisons: WeeklyComparisonMetric[] = [
      {
        key: "calories",
        label: "Calories",
        category: "NUTRITION",
        unit: "kcal",
        currentPeriodValue: totalCals,
        previousPeriodValue: prevTotalCals,
        ...this.calculatePercentChange(totalCals, prevTotalCals),
      },
      {
        key: "protein",
        label: "Protein",
        category: "NUTRITION",
        unit: "g",
        currentPeriodValue: Math.round(totalProtein),
        previousPeriodValue: Math.round(prevTotalProtein),
        ...this.calculatePercentChange(totalProtein, prevTotalProtein),
      },
      {
        key: "hydration",
        label: "Hydration",
        category: "HYDRATION",
        unit: "ml",
        currentPeriodValue: totalWaterMl,
        previousPeriodValue: prevWaterMl,
        ...this.calculatePercentChange(totalWaterMl, prevWaterMl),
      },
      {
        key: "running_distance",
        label: "Running Distance",
        category: "ACTIVITY",
        unit: "km",
        currentPeriodValue: Math.round(totalDistanceKm * 10) / 10,
        previousPeriodValue: Math.round(prevRunDistanceKm * 10) / 10,
        ...this.calculatePercentChange(totalDistanceKm, prevRunDistanceKm),
      },
      {
        key: "steps",
        label: "Daily Steps",
        category: "ACTIVITY",
        unit: "steps",
        currentPeriodValue: totalSteps,
        previousPeriodValue: prevTotalSteps,
        ...this.calculatePercentChange(totalSteps, prevTotalSteps),
      },
      {
        key: "activity_calories",
        label: "Active Calories",
        category: "ACTIVITY",
        unit: "kcal",
        currentPeriodValue: totalCaloriesBurned,
        previousPeriodValue: prevActivityCals,
        ...this.calculatePercentChange(totalCaloriesBurned, prevActivityCals),
      },
      {
        key: "workout_frequency",
        label: "Workout Frequency",
        category: "WORKOUT",
        unit: "sessions",
        currentPeriodValue: workouts.length,
        previousPeriodValue: prevWorkoutSessions,
        ...this.calculatePercentChange(workouts.length, prevWorkoutSessions),
      },
    ];

    // -----------------------------------------------------------------------
    // PERSONAL RECORDS (All-Time Historical Analysis)
    // -----------------------------------------------------------------------
    const personalRecords: PersonalRecordItem[] = [];

    const [allRuns, allMealsHistorical, allHydrationsHistorical, allWorkoutsHistorical, allActivitiesHistorical] =
      await Promise.all([
        prisma.activityLog.findMany({
          where: { userId, activityType: "RUN" },
        }),
        prisma.mealLog.findMany({
          where: { userId },
          include: { entries: true },
        }),
        prisma.hydrationLog.findMany({
          where: { userId },
        }),
        prisma.workoutSession.findMany({
          where: { userId },
          include: { exercises: { include: { sets: true } } },
        }),
        prisma.activityLog.findMany({
          where: { userId },
        }),
      ]);

    // Running PRs
    if (allRuns.length > 0) {
      // Longest run
      let longestRun = allRuns[0];
      allRuns.forEach((r) => {
        if (Number(r.distanceKm || 0) > Number(longestRun.distanceKm || 0)) longestRun = r;
      });
      if (Number(longestRun.distanceKm || 0) > 0) {
        personalRecords.push({
          key: "longest_run",
          title: "Longest Run",
          category: "RUNNING",
          value: `${Number(longestRun.distanceKm).toFixed(2)}`,
          unit: "km",
          achievedDate: longestRun.date,
          detail: longestRun.notes || "Outdoor Run",
        });
      }

      // Fastest pace (min avg pace with distance >= 1.0 km)
      const validRuns = allRuns.filter(
        (r) => Number(r.distanceKm || 0) >= 1.0 && (r.averagePaceSecondsPerKm || 0) > 0
      );
      if (validRuns.length > 0) {
        let fastestRun = validRuns[0];
        validRuns.forEach((r) => {
          if ((r.averagePaceSecondsPerKm || 9999) < (fastestRun.averagePaceSecondsPerKm || 9999))
            fastestRun = r;
        });
        const paceSec = fastestRun.averagePaceSecondsPerKm || 0;
        const mins = Math.floor(paceSec / 60);
        const secs = paceSec % 60;
        personalRecords.push({
          key: "fastest_pace",
          title: "Fastest Running Pace",
          category: "RUNNING",
          value: `${mins}:${secs < 10 ? "0" : ""}${secs}`,
          unit: "/km",
          achievedDate: fastestRun.date,
          detail: `${Number(fastestRun.distanceKm).toFixed(1)} km`,
        });
      }

      // Highest Elevation Gain
      let maxElevationRun = allRuns[0];
      allRuns.forEach((r) => {
        if ((r.elevationGainMeters || 0) > (maxElevationRun.elevationGainMeters || 0))
          maxElevationRun = r;
      });
      if ((maxElevationRun.elevationGainMeters || 0) > 0) {
        personalRecords.push({
          key: "highest_elevation",
          title: "Highest Elevation Gain",
          category: "RUNNING",
          value: `${maxElevationRun.elevationGainMeters}`,
          unit: "m",
          achievedDate: maxElevationRun.date,
        });
      }
    }

    // Nutrition PRs
    if (allMealsHistorical.length > 0) {
      const dailyMap = new Map<string, { cals: number; protein: number }>();
      allMealsHistorical.forEach((m) => {
        const cur = dailyMap.get(m.date) || { cals: 0, protein: 0 };
        m.entries.forEach((e) => {
          cur.cals += Number(e.calculatedCalories || 0);
          cur.protein += Number(e.calculatedProtein || 0);
        });
        dailyMap.set(m.date, cur);
      });

      let maxProteinDay = { date: "", protein: 0 };
      let maxCalsDay = { date: "", cals: 0 };

      dailyMap.forEach((val, dt) => {
        if (val.protein > maxProteinDay.protein) maxProteinDay = { date: dt, protein: val.protein };
        if (val.cals > maxCalsDay.cals) maxCalsDay = { date: dt, cals: val.cals };
      });

      if (maxProteinDay.protein > 0) {
        personalRecords.push({
          key: "highest_protein_day",
          title: "Highest Protein Day",
          category: "NUTRITION",
          value: `${Math.round(maxProteinDay.protein)}`,
          unit: "g",
          achievedDate: maxProteinDay.date,
        });
      }
      if (maxCalsDay.cals > 0) {
        personalRecords.push({
          key: "highest_calorie_day",
          title: "Highest Calorie Day",
          category: "NUTRITION",
          value: `${Math.round(maxCalsDay.cals)}`,
          unit: "kcal",
          achievedDate: maxCalsDay.date,
        });
      }
    }

    // Hydration PRs
    if (allHydrationsHistorical.length > 0) {
      const hydDaily = new Map<string, number>();
      allHydrationsHistorical.forEach((h) => {
        hydDaily.set(h.date, (hydDaily.get(h.date) || 0) + h.amountMl);
      });

      let maxHydDay = { date: "", amount: 0 };
      hydDaily.forEach((amt, dt) => {
        if (amt > maxHydDay.amount) maxHydDay = { date: dt, amount: amt };
      });

      if (maxHydDay.amount > 0) {
        personalRecords.push({
          key: "highest_hydration_day",
          title: "Highest Hydration Day",
          category: "HYDRATION",
          value: `${maxHydDay.amount}`,
          unit: "ml",
          achievedDate: maxHydDay.date,
        });
      }
    }

    // Activity / Steps PRs
    if (allActivitiesHistorical.length > 0) {
      let maxStepsDay = { date: "", steps: 0 };
      let maxCalBurnDay = { date: "", cals: 0 };

      const actDaily = new Map<string, { steps: number; cals: number }>();
      allActivitiesHistorical.forEach((a) => {
        const cur = actDaily.get(a.date) || { steps: 0, cals: 0 };
        cur.steps += a.steps || 0;
        cur.cals += a.caloriesBurned || 0;
        actDaily.set(a.date, cur);
      });

      actDaily.forEach((val, dt) => {
        if (val.steps > maxStepsDay.steps) maxStepsDay = { date: dt, steps: val.steps };
        if (val.cals > maxCalBurnDay.cals) maxCalBurnDay = { date: dt, cals: val.cals };
      });

      if (maxStepsDay.steps > 0) {
        personalRecords.push({
          key: "highest_steps_day",
          title: "Highest Steps Day",
          category: "ACTIVITY",
          value: `${maxStepsDay.steps.toLocaleString()}`,
          unit: "steps",
          achievedDate: maxStepsDay.date,
        });
      }
      if (maxCalBurnDay.cals > 0) {
        personalRecords.push({
          key: "highest_active_burn_day",
          title: "Most Active Day",
          category: "ACTIVITY",
          value: `${maxCalBurnDay.cals.toLocaleString()}`,
          unit: "kcal burned",
          achievedDate: maxCalBurnDay.date,
        });
      }
    }

    // Workout PRs
    if (allWorkoutsHistorical.length > 0) {
      let maxVolSession = { date: "", vol: 0, name: "" };
      allWorkoutsHistorical.forEach((w) => {
        let sessionVol = 0;
        w.exercises.forEach((ex) => {
          ex.sets.forEach((st) => {
            if (st.weightKg && st.reps) {
              sessionVol += Number(st.weightKg) * st.reps;
            }
          });
        });
        if (sessionVol > maxVolSession.vol) {
          maxVolSession = { date: w.date, vol: sessionVol, name: w.name };
        }
      });

      if (maxVolSession.vol > 0) {
        personalRecords.push({
          key: "highest_workout_volume",
          title: "Highest Training Volume",
          category: "WORKOUT",
          value: `${Math.round(maxVolSession.vol).toLocaleString()}`,
          unit: "kg",
          achievedDate: maxVolSession.date,
          detail: maxVolSession.name,
        });
      }
    }

    // -----------------------------------------------------------------------
    // BUILD VISUALIZATION TIME-SERIES DATA
    // -----------------------------------------------------------------------
    const formatDayLabel = (dateStr: string) => {
      const d = new Date(dateStr + "T00:00:00");
      return d.toLocaleDateString("en-US", { weekday: "short", month: "numeric", day: "numeric" });
    };

    const macroEnergyTotal = Math.round(totalProtein * 4 + totalCarbs * 4 + totalFat * 9);
    const charts: ReportChartData = {
      calorieTrend: dateList.map((dt) => {
        const entry = dailyNutritionMap.get(dt) || { cals: 0 };
        return {
          date: dt,
          label: formatDayLabel(dt),
          calories: Math.round(entry.cals),
          target: targetCalories,
        };
      }),
      macroTrend: dateList.map((dt) => {
        const entry = dailyNutritionMap.get(dt) || { p: 0, c: 0, f: 0 };
        return {
          date: dt,
          label: formatDayLabel(dt),
          protein: Math.round(entry.p),
          carbs: Math.round(entry.c),
          fat: Math.round(entry.f),
        };
      }),
      macroDistribution: [
        {
          name: "Protein",
          key: "protein",
          grams: Math.round(totalProtein * 10) / 10,
          calories: Math.round(totalProtein * 4),
          percentage: macroEnergyTotal > 0 ? Math.round(((totalProtein * 4) / macroEnergyTotal) * 100) : 30,
          color: "#3B82F6",
        },
        {
          name: "Carbohydrates",
          key: "carbohydrates",
          grams: Math.round(totalCarbs * 10) / 10,
          calories: Math.round(totalCarbs * 4),
          percentage: macroEnergyTotal > 0 ? Math.round(((totalCarbs * 4) / macroEnergyTotal) * 100) : 45,
          color: "#10B981",
        },
        {
          name: "Fat",
          key: "fat",
          grams: Math.round(totalFat * 10) / 10,
          calories: Math.round(totalFat * 9),
          percentage: macroEnergyTotal > 0 ? Math.round(((totalFat * 9) / macroEnergyTotal) * 100) : 25,
          color: "#F59E0B",
        },
      ],
      proteinConsistency: dateList.map((dt) => {
        const entry = dailyNutritionMap.get(dt) || { p: 0 };
        const p = Math.round(entry.p);
        let status: ProteinConsistencyPoint["status"] = "BELOW";
        if (p >= targetProtein) status = "MET";
        else if (p >= targetProtein * 0.85) status = "MET";
        return {
          date: dt,
          label: formatDayLabel(dt),
          proteinG: p,
          targetG: targetProtein,
          status,
        };
      }),
      fiberSugarTrend: dateList.map((dt) => {
        const entry = dailyNutritionMap.get(dt) || { fiber: 0, sugar: 0 };
        return {
          date: dt,
          label: formatDayLabel(dt),
          fiberG: Math.round(entry.fiber * 10) / 10,
          sugarG: Math.round(entry.sugar * 10) / 10,
        };
      }),
      hydrationTrend: dateList.map((dt) => {
        const amt = dailyHydrationMap.get(dt) || 0;
        return {
          date: dt,
          label: formatDayLabel(dt),
          intake: amt,
          target: targetHydration,
          achieved: amt >= targetHydration,
        };
      }),
      activityTrend: dateList.map((dt) => {
        const actsOnDay = activities.filter((a) => a.date === dt);
        const dist = actsOnDay.reduce((acc, a) => acc + Number(a.distanceKm || 0), 0);
        const cals = actsOnDay.reduce((acc, a) => acc + (a.caloriesBurned || 0), 0);
        const duration = actsOnDay.reduce((acc, a) => acc + Math.round((a.movingDurationSeconds || 0) / 60), 0);
        return {
          date: dt,
          label: formatDayLabel(dt),
          distanceKm: Math.round(dist * 100) / 100,
          calories: cals,
          durationMinutes: duration,
        };
      }),
      runningPaceTrend: activities
        .filter((a) => a.activityType === "RUN" && (a.averagePaceSecondsPerKm || 0) > 0)
        .slice()
        .sort((a, b) => a.date.localeCompare(b.date))
        .map((a) => {
          const paceSec = a.averagePaceSecondsPerKm || 0;
          const mins = Math.floor(paceSec / 60);
          const secs = paceSec % 60;
          return {
            date: a.date,
            label: formatDayLabel(a.date),
            distanceKm: Number(a.distanceKm || 0),
            paceSecondsPerKm: paceSec,
            formattedPace: `${mins}:${secs < 10 ? "0" : ""}${secs} / km`,
            runningType: a.runningType || "Run",
          };
        }),
      stepsTrend: dateList.map((dt) => {
        const stepTotal = activities
          .filter((a) => a.date === dt)
          .reduce((sum, a) => sum + (a.steps || 0), 0);
        return {
          date: dt,
          label: formatDayLabel(dt),
          steps: stepTotal,
          target: targetSteps,
        };
      }),
      activityDistribution,
      workoutTrend: dateList.map((dt) => {
        const wOnDay = workouts.filter((w) => w.date === dt);
        let sets = 0;
        let vol = 0;
        wOnDay.forEach((w) => {
          w.exercises.forEach((ex) => {
            ex.sets.forEach((st) => {
              sets++;
              if (st.weightKg && st.reps) vol += Number(st.weightKg) * st.reps;
            });
          });
        });
        return {
          date: dt,
          label: formatDayLabel(dt),
          sessions: wOnDay.length,
          sets,
          volumeKg: Math.round(vol),
        };
      }),
      exerciseDistribution,
    };

    return {
      dateRange,
      overview: {
        nutrition: nutritionOverview,
        hydration: hydrationOverview,
        activities: activityOverview,
        workouts: workoutOverview,
        deepNutrition: deepNutritionOverview,
      },
      consistencyScore,
      micronutrients,
      comparisons,
      personalRecords,
      charts,
    };
  }
}
