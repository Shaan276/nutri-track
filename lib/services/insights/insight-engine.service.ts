import { FullReportResponse, MicronutrientReportItem } from "@/lib/validations/report";
import {
  SmartInsight,
  TrendChangeItem,
  GroupedNutrientItem,
} from "./insight-types";

export class InsightEngineService {
  /**
   * Generates all explainable domain insights, grouped micronutrient audits,
   * running pace analysis, workout statistics, and weekly trend changes.
   */
  static evaluateInsights(report: FullReportResponse): {
    insights: SmartInsight[];
    trends: TrendChangeItem[];
  } {
    const insights: SmartInsight[] = [];
    const trends: TrendChangeItem[] = [];

    const daysCount = report.dateRange?.daysCount || 1;
    const avgCalories = Math.round(report.overview?.nutrition?.avgCalories || 0);
    const hasMeals = (report.overview?.nutrition?.loggedDaysCount || 0) > 0 && avgCalories > 0;
    const targetCalories = report.overview?.nutrition?.targetCalories || 0;
    const avgProtein = Math.round(report.overview?.nutrition?.avgProteinG || 0);
    const targetProtein = report.charts?.proteinConsistency?.[0]?.targetG || 0;
    const avgCarbs = Math.round(report.overview?.nutrition?.avgCarbsG || 0);
    const avgFat = Math.round(report.overview?.nutrition?.avgFatG || 0);

    // =========================================================================
    // 1. NUTRITION & MACRONUTRIENT RULES
    // =========================================================================
    if (hasMeals) {
      // Rule N1: Protein Below Target
      if (targetProtein && targetProtein > 0) {
        const proteinRatio = avgProtein / targetProtein;
        if (proteinRatio < 0.85) {
          if (daysCount === 1) {
            // Time-aware today in-progress
            insights.push({
              id: "ins_nut_protein_today_progress",
              category: "NUTRITION",
              priority: "INFORMATIONAL",
              severity: "INFO",
              title: "Protein In Progress Today",
              summary: `Logged ${avgProtein}g protein so far today (${Math.round(proteinRatio * 100)}% of your ${targetProtein}g goal).`,
              whatHappened: `You have recorded ${avgProtein}g of protein today towards your ${targetProtein}g target.`,
              whyItMatters: "Protein provides amino acids for recovery and muscular adaptation.",
              suggestedAction: "Continue including protein-rich foods in your remaining meals today.",
              relatedModule: "Nutrition",
              actionUrl: "/nutrition",
              actionLabel: "Log Food",
              icon: "🥩",
              metric: {
                current: `${avgProtein}g`,
                target: `${targetProtein}g`,
                unit: "g",
                formattedText: `${Math.round(proteinRatio * 100)}% logged`,
              },
            });
          } else {
            insights.push({
              id: "ins_nut_protein_low",
              category: "NUTRITION",
              priority: "HIGH",
              severity: "WARNING",
              title: "Protein Intake Below Configured Target",
              summary: `Daily protein averaged ${avgProtein}g vs your ${targetProtein}g target.`,
              whatHappened: `Over this ${daysCount}-day period, your average daily protein was ${avgProtein}g (${Math.round(proteinRatio * 100)}% of your ${targetProtein}g goal).`,
              whyItMatters: "Protein provides essential amino acids for muscle protein synthesis, immune function, and recovery.",
              suggestedAction: "Incorporate high-protein foods like chicken breast, salmon, eggs, tofu, or protein supplements.",
              relatedModule: "Nutrition",
              actionUrl: "/nutrition",
              actionLabel: "Log Protein Meal",
              icon: "🥩",
              metric: {
                current: `${avgProtein}g`,
                target: `${targetProtein}g`,
                unit: "g",
                formattedText: `${Math.round(proteinRatio * 100)}% of target`,
              },
            });
          }
        } else {
          // Rule N2: Protein Target Met (Positive)
          insights.push({
            id: "ins_nut_protein_met",
            category: "NUTRITION",
            priority: "POSITIVE",
            severity: "SUCCESS",
            title: "Optimal Protein Consistency",
            summary: `Averaged ${avgProtein}g/day, successfully meeting your ${targetProtein}g target.`,
            whatHappened: `You consistently achieved your protein goal, averaging ${avgProtein}g across logged days.`,
            whyItMatters: "Adequate protein intake supports muscular adaptation, lean mass retention, and metabolic stability.",
            suggestedAction: "Maintain this solid nutritional cadence in your upcoming meals.",
            relatedModule: "Nutrition",
            actionUrl: "/nutrition",
            actionLabel: "View Nutrition",
            icon: "✅",
            metric: {
              current: `${avgProtein}g`,
              target: `${targetProtein}g`,
              unit: "g",
              formattedText: `${Math.round(proteinRatio * 100)}% achieved`,
            },
          });
        }
      }

      // Rule N3: Caloric Adherence
      if (targetCalories && targetCalories > 0) {
        const calRatio = avgCalories / targetCalories;
        if (calRatio < 0.75) {
          if (daysCount === 1) {
            insights.push({
              id: "ins_nut_cal_today_progress",
              category: "NUTRITION",
              priority: "INFORMATIONAL",
              severity: "INFO",
              title: "Calorie Intake In Progress",
              summary: `Logged ${avgCalories} kcal so far today (${Math.round(calRatio * 100)}% of your ${targetCalories} kcal goal).`,
              whatHappened: `You have logged ${avgCalories} kcal so far today.`,
              whyItMatters: "Energy intake accumulates with each meal and snack throughout the day.",
              suggestedAction: "Log your next meal to keep your daily journal accurate.",
              relatedModule: "Nutrition",
              actionUrl: "/nutrition",
              actionLabel: "Log Food",
              icon: "🍽️",
              metric: {
                current: `${avgCalories} kcal`,
                target: `${targetCalories} kcal`,
                unit: "kcal",
              },
            });
          } else {
            insights.push({
              id: "ins_nut_cal_low",
              category: "NUTRITION",
              priority: "HIGH",
              severity: "WARNING",
              title: "Calorie Intake Significantly Below Target",
              summary: `Daily intake averaged ${avgCalories} kcal, notably under your ${targetCalories} kcal goal.`,
              whatHappened: `You logged an average of ${avgCalories} kcal per day (${Math.round(calRatio * 100)}% of your target).`,
              whyItMatters: "Sustained large caloric deficits can impair energy levels, athletic performance, and recovery.",
              suggestedAction: "Ensure all meals and snacks are fully recorded and consider adding nutrient-dense whole foods.",
              relatedModule: "Nutrition",
              actionUrl: "/nutrition",
              actionLabel: "Log Food",
              icon: "⚠️",
              metric: {
                current: `${avgCalories} kcal`,
                target: `${targetCalories} kcal`,
                unit: "kcal",
              },
            });
          }
        } else if (calRatio > 1.25) {
          insights.push({
            id: "ins_nut_cal_high",
            category: "NUTRITION",
            priority: "MEDIUM",
            severity: "WARNING",
            title: "Caloric Intake Above Target",
            summary: `Daily intake averaged ${avgCalories} kcal vs your ${targetCalories} kcal target.`,
            whatHappened: `Your average daily energy intake was ${avgCalories} kcal (${Math.round(calRatio * 100)}% of target).`,
            whyItMatters: "Caloric surpluses above target may influence weight goals depending on your active training phase.",
            suggestedAction: "Review your meal portions and snack calorie density in your nutrition journal.",
            relatedModule: "Nutrition",
            actionUrl: "/nutrition",
            actionLabel: "Review Meals",
            icon: "⚡",
            metric: {
              current: `${avgCalories} kcal`,
              target: `${targetCalories} kcal`,
              unit: "kcal",
            },
          });
        } else if (calRatio >= 0.90 && calRatio <= 1.10) {
          insights.push({
            id: "ins_nut_cal_optimal",
            category: "NUTRITION",
            priority: "POSITIVE",
            severity: "SUCCESS",
            title: "Caloric Intake on Target",
            summary: `Daily energy intake averaged ${avgCalories} kcal (within 10% of your ${targetCalories} kcal target).`,
            whatHappened: `Your daily calories closely matched your configured nutrition plan.`,
            whyItMatters: "Consistent energy balance maintains metabolic predictability and matches your lifestyle goals.",
            suggestedAction: "Keep up the balanced dietary discipline.",
            relatedModule: "Nutrition",
            actionUrl: "/nutrition",
            actionLabel: "View Journal",
            icon: "🎯",
            metric: {
              current: `${avgCalories} kcal`,
              target: `${targetCalories} kcal`,
              unit: "kcal",
            },
          });
        }
      }

      // Rule N4: Macro Distribution Balance
      const totalMacroCals = avgProtein * 4 + avgCarbs * 4 + avgFat * 9;
      if (totalMacroCals > 0) {
        const proteinPct = Math.round(((avgProtein * 4) / totalMacroCals) * 100);
        const carbsPct = Math.round(((avgCarbs * 4) / totalMacroCals) * 100);
        const fatPct = Math.round(((avgFat * 9) / totalMacroCals) * 100);

        if (proteinPct >= 20 && carbsPct >= 35 && fatPct <= 35) {
          insights.push({
            id: "ins_nut_macro_balanced",
            category: "MACRONUTRIENTS",
            priority: "INFORMATIONAL",
            severity: "INFO",
            title: "Balanced Macronutrient Distribution",
            summary: `Macros contributed ${proteinPct}% protein, ${carbsPct}% carbs, and ${fatPct}% fat.`,
            whatHappened: `Your energy intake is distributed well across carbohydrates for fuel, protein for muscle support, and healthy fats.`,
            whyItMatters: "Balanced macronutrient splits provide sustained energy throughout training and recovery.",
            suggestedAction: "Continue eating diverse whole foods.",
            relatedModule: "Nutrition",
            actionUrl: "/nutrition",
            actionLabel: "Explore Macros",
            icon: "⚖️",
          });
        }
      }
    }

    // =========================================================================
    // 2. DEEP MICRONUTRIENT INSIGHTS & GROUPING (Only when meals exist)
    // =========================================================================
    if (hasMeals && report.micronutrients && report.micronutrients.length > 0) {
      const configuredMicros = report.micronutrients.filter((m) => m.hasTarget && m.target !== null && m.target > 0);
      const lowMicros = configuredMicros.filter(
        (m) => m.percentage !== null && m.percentage < 70
      );
      const optimalMicros = configuredMicros.filter(
        (m) => m.percentage !== null && m.percentage >= 85
      );

      // Rule M1: Grouped Micronutrients (if 3 or more low)
      if (lowMicros.length >= 3) {
        const groupedItems: GroupedNutrientItem[] = lowMicros.map((m) => ({
          key: m.key,
          name: m.label,
          category: m.category,
          current: m.avgIntake,
          target: m.target!,
          unit: m.unit,
          percentage: m.percentage || 0,
          statusLabel: m.statusLabel,
        }));

        insights.push({
          id: "ins_micro_grouped_low",
          category: "MICRONUTRIENTS",
          priority: "HIGH",
          severity: "WARNING",
          title: `${lowMicros.length} Micronutrients Below Target`,
          summary: `${lowMicros.length} essential vitamins/minerals are below 70% daily coverage.`,
          whatHappened: `The following nutrients averaged below target: ${lowMicros.map((m) => m.label).join(", ")}.`,
          whyItMatters: "Micronutrients regulate cellular metabolism, immune health, bone density, and oxidative defense.",
          suggestedAction: "Incorporate nutrient-dense whole foods such as leafy greens, legumes, nuts, and citrus fruits.",
          relatedModule: "Deep Nutrition",
          actionUrl: "/deep-nutrition",
          actionLabel: "Review Micronutrients",
          icon: "🔬",
          groupedItems,
        });
      } else if (lowMicros.length > 0 && lowMicros.length < 3) {
        // Individual nutrient insights for 1-2 low nutrients
        lowMicros.forEach((m) => {
          insights.push({
            id: `ins_micro_${m.key}_low`,
            category: "MICRONUTRIENTS",
            priority: "MEDIUM",
            severity: "WARNING",
            title: `${m.label} Below Recommended Target`,
            summary: `Daily intake averaged ${m.avgIntake} ${m.unit} (${m.percentage}% of ${m.target} ${m.unit} goal).`,
            whatHappened: `Your average intake of ${m.label} was ${m.avgIntake} ${m.unit}, below the ${m.target} ${m.unit} target.`,
            whyItMatters: `${m.label} is an essential ${m.category.toLowerCase()} that supports physiological health and energy production.`,
            suggestedAction: `Check food sources rich in ${m.label} in your Deep Nutrition analysis.`,
            relatedModule: "Deep Nutrition",
            actionUrl: "/deep-nutrition",
            actionLabel: "View Deep Nutrition",
            icon: "🧪",
            metric: {
              current: `${m.avgIntake} ${m.unit}`,
              target: `${m.target} ${m.unit}`,
              unit: m.unit,
              formattedText: `${m.percentage}% met`,
            },
          });
        });
      }

      // Rule M2: Key Micronutrients Achieved
      if (optimalMicros.length >= 3) {
        insights.push({
          id: "ins_micro_optimal_coverage",
          category: "MICRONUTRIENTS",
          priority: "POSITIVE",
          severity: "SUCCESS",
          title: "Strong Micronutrient Coverage",
          summary: `${optimalMicros.length} configured vitamins & minerals met or exceeded 85% daily coverage.`,
          whatHappened: `Key nutrients including ${optimalMicros.slice(0, 3).map((m) => m.label).join(", ")} achieved target thresholds.`,
          whyItMatters: "Broad micronutrient sufficiency optimizes metabolic rate and physiological longevity.",
          suggestedAction: "Keep your whole food dietary variety broad.",
          relatedModule: "Deep Nutrition",
          actionUrl: "/deep-nutrition",
          actionLabel: "View Coverage",
          icon: "🌟",
        });
      }
    }

    // =========================================================================
    // 3. HYDRATION INSIGHTS (TIME-AWARE)
    // =========================================================================
    const hydOverview = report.overview?.hydration;
    const avgHydration = hydOverview?.avgIntakeMl || 0;
    const targetHydration = hydOverview?.dailyTargetMl || 2500;
    const streakDays = hydOverview?.currentStreakDays || 0;

    if (avgHydration > 0 || streakDays > 0) {
      const hydRatio = avgHydration / targetHydration;

      // Rule H1: Daily Goal Met
      if (hydRatio >= 0.90) {
        insights.push({
          id: "ins_hyd_goal_met",
          category: "HYDRATION",
          priority: "POSITIVE",
          severity: "SUCCESS",
          title: "Optimal Hydration Intake",
          summary: `Averaged ${Math.round(avgHydration)} ml/day (${Math.round(hydRatio * 100)}% of your ${targetHydration} ml goal).`,
          whatHappened: `You consistently maintained fluid intake near or above your daily hydration target.`,
          whyItMatters: "Proper hydration maintains plasma volume, cognitive performance, and joint lubrication.",
          suggestedAction: "Maintain this excellent fluid intake routine.",
          relatedModule: "Hydration",
          actionUrl: "/hydration",
          actionLabel: "Open Hydration",
          icon: "💧",
          metric: {
            current: `${Math.round(avgHydration)} ml`,
            target: `${targetHydration} ml`,
            unit: "ml",
            formattedText: `${Math.round(hydRatio * 100)}% met`,
          },
        });
      } else if (daysCount === 1) {
        // Rule H2: Time-Aware In-Progress Daily Hydration (No false midday penalties!)
        insights.push({
          id: "ins_hyd_inprogress",
          category: "HYDRATION",
          priority: "INFORMATIONAL",
          severity: "INFO",
          title: "Hydration In Progress Today",
          summary: `Currently at ${Math.round(avgHydration)} ml (${Math.round(hydRatio * 100)}% of your ${targetHydration} ml goal).`,
          whatHappened: `You have logged ${Math.round(avgHydration)} ml of fluid today.`,
          whyItMatters: "Hydration is built incrementally throughout the day.",
          suggestedAction: "Keep drinking water or herbal fluids steadily as the day progresses.",
          relatedModule: "Hydration",
          actionUrl: "/hydration",
          actionLabel: "Log Drink",
          icon: "🥤",
          metric: {
            current: `${Math.round(avgHydration)} ml`,
            target: `${targetHydration} ml`,
            unit: "ml",
          },
        });
      } else if (hydRatio < 0.70) {
        // Multi-day average low
        insights.push({
          id: "ins_hyd_below_target",
          category: "HYDRATION",
          priority: "MEDIUM",
          severity: "WARNING",
          title: "Hydration Below Target Over Period",
          summary: `Daily fluid intake averaged ${Math.round(avgHydration)} ml vs ${targetHydration} ml target.`,
          whatHappened: `Across this period, your fluid intake reached ${Math.round(hydRatio * 100)}% of daily target.`,
          whyItMatters: "Mild chronic dehydration can lead to sluggish energy and decreased workout stamina.",
          suggestedAction: "Keep a water bottle nearby and log drinks after each meal.",
          relatedModule: "Hydration",
          actionUrl: "/hydration",
          actionLabel: "Log Water",
          icon: "🚰",
          metric: {
            current: `${Math.round(avgHydration)} ml`,
            target: `${targetHydration} ml`,
            unit: "ml",
          },
        });
      }

      // Rule H3: Hydration Streak Praise
      if (streakDays >= 3) {
        insights.push({
          id: "ins_hyd_streak_praise",
          category: "HYDRATION",
          priority: "POSITIVE",
          severity: "SUCCESS",
          title: `${streakDays}-Day Hydration Streak Active!`,
          summary: `You have met your daily fluid target for ${streakDays} consecutive days.`,
          whatHappened: `Your hydration habits are building continuous momentum.`,
          whyItMatters: "Consistent streaks reinforce automatic positive wellness habits.",
          suggestedAction: "Log your drinks today to extend the streak!",
          relatedModule: "Hydration",
          actionUrl: "/hydration",
          actionLabel: "Extend Streak",
          icon: "🌊",
        });
      }
    }

    // =========================================================================
    // 4. RUNNING & ACTIVITY INSIGHTS (PACE STRICTLY SCOPED TO RUNS)
    // =========================================================================
    const actOverview = report.overview?.activities;
    const totalRuns = actOverview?.runningSessionsCount || 0;
    const totalDistance = actOverview?.totalDistanceKm || 0;
    const totalSteps = actOverview?.totalSteps || 0;
    const avgPace = actOverview?.avgPaceFormatted || "—";

    if (totalRuns > 0 || totalDistance > 0) {
      // Rule R1: Running Mileage & Volume
      insights.push({
        id: "ins_run_volume",
        category: "RUNNING",
        priority: "INFORMATIONAL",
        severity: "INFO",
        title: `${totalDistance.toFixed(1)} km Logged This Period`,
        summary: `Completed ${totalRuns} run${totalRuns === 1 ? "" : "s"} totaling ${totalDistance.toFixed(1)} km.`,
        whatHappened: `You recorded ${totalRuns} running sessions with an average pace of ${avgPace}.`,
        whyItMatters: "Consistent aerobic base building improves mitochondrial density and cardiovascular output.",
        suggestedAction: "Balance hard running efforts with recovery days.",
        relatedModule: "Activities",
        actionUrl: "/activities",
        actionLabel: "View Running Log",
        icon: "🏃",
        metric: {
          current: `${totalDistance.toFixed(1)} km`,
          unit: "km",
          formattedText: `Pace: ${avgPace}`,
        },
      });

      // Rule R2: Running Pace Scoped Analysis
      const paceTrend = report.charts?.runningPaceTrend;
      if (paceTrend && paceTrend.length >= 2) {
        const firstRunPace = paceTrend[0].paceSecondsPerKm || (paceTrend[0] as any).paceSeconds || 0;
        const lastRunPace = paceTrend[paceTrend.length - 1].paceSecondsPerKm || (paceTrend[paceTrend.length - 1] as any).paceSeconds || 0;
        const paceDiff = firstRunPace - lastRunPace; // Positive diff = last run is faster (lower seconds)

        if (paceDiff >= 10) {
          insights.push({
            id: "ins_run_pace_improvement",
            category: "RUNNING",
            priority: "POSITIVE",
            severity: "SUCCESS",
            title: "Running Pace Progression",
            summary: `Pace improved by ${Math.round(paceDiff)}s/km across your recorded runs!`,
            whatHappened: `Your running pace progressed from ${paceTrend[0].formattedPace} down to ${paceTrend[paceTrend.length - 1].formattedPace}.`,
            whyItMatters: "Faster running at comparable effort reflects increased aerobic threshold and running economy.",
            suggestedAction: "Great pacing execution. Keep logging your splits.",
            relatedModule: "Activities",
            actionUrl: "/activities",
            actionLabel: "View Pace Trend",
            icon: "⚡",
          });
        }
      }
    }

    // Rule A1: Daily Steps Milestone
    if (totalSteps > 0) {
      const avgSteps = Math.round(totalSteps / daysCount);
      if (avgSteps >= 6000 || totalSteps >= 15000) {
        insights.push({
          id: "ins_act_steps_milestone",
          category: "ACTIVITY",
          priority: "POSITIVE",
          severity: "SUCCESS",
          title: "High Daily Step Cadence",
          summary: `Accumulated ${totalSteps.toLocaleString()} total steps across this timeframe.`,
          whatHappened: `You accumulated ${totalSteps.toLocaleString()} total steps over ${daysCount} days.`,
          whyItMatters: "Daily non-exercise physical activity (NEAT) maintains metabolic expenditure and joint mobility.",
          suggestedAction: "Keep moving throughout your daily routine.",
          relatedModule: "Activities",
          actionUrl: "/activities",
          actionLabel: "View Steps",
          icon: "👟",
        });
      }
    }

    // =========================================================================
    // 5. WORKOUT & STRENGTH INSIGHTS
    // =========================================================================
    const wkOverview = report.overview?.workouts;
    const totalSessions = wkOverview?.totalSessions || 0;
    const gymSessions = wkOverview?.gymSessionsCount || 0;
    const homeSessions = wkOverview?.homeSessionsCount || 0;
    const totalSets = wkOverview?.totalSets || 0;
    const totalVolumeKg = wkOverview?.totalVolumeKg || 0;

    if (totalSessions > 0) {
      // Rule W1: Workout Frequency
      insights.push({
        id: "ins_wk_frequency",
        category: "WORKOUT",
        priority: "INFORMATIONAL",
        severity: "INFO",
        title: `${totalSessions} Workouts Completed`,
        summary: `Logged ${gymSessions} gym and ${homeSessions} home sessions (${totalSets} total sets).`,
        whatHappened: `You executed ${totalSessions} resistance training sessions totaling ${totalSets} sets and ${Math.round(totalVolumeKg).toLocaleString()} kg volume.`,
        whyItMatters: "Progressive resistance training builds functional strength, bone mineral density, and muscle tissue.",
        suggestedAction: "Track your load progression in upcoming workouts.",
        relatedModule: "Workouts",
        actionUrl: "/workouts",
        actionLabel: "Open Workouts",
        icon: "🏋️",
        metric: {
          current: `${totalSessions} sessions`,
          unit: "sessions",
          formattedText: `${totalSets} sets`,
        },
      });

      // Rule W2: High Tonnage Training Volume
      if (totalVolumeKg >= 1500) {
        insights.push({
          id: "ins_wk_tonnage_titan",
          category: "WORKOUT",
          priority: "POSITIVE",
          severity: "SUCCESS",
          title: "High Training Volume Achieved",
          summary: `Total calculated volume reached ${Math.round(totalVolumeKg).toLocaleString()} kg.`,
          whatHappened: `Your cumulative tonnage (Weight × Reps × Sets) was ${Math.round(totalVolumeKg).toLocaleString()} kg this period.`,
          whyItMatters: "Training volume is a primary mechanical driver of muscular hypertrophy and strength adaptations.",
          suggestedAction: "Ensure post-workout nutrition and sleep match your training intensity.",
          relatedModule: "Workouts",
          actionUrl: "/workouts",
          actionLabel: "View Volume",
          icon: "💪",
          metric: {
            current: `${Math.round(totalVolumeKg).toLocaleString()} kg`,
            unit: "kg",
          },
        });
      }
    }

    // =========================================================================
    // 6. PERIOD-OVER-PERIOD TREND & CHANGE DETECTION
    // =========================================================================
    const CHANGE_THRESHOLD_PERCENT = 5;

    if (report.comparisons && report.comparisons.length > 0) {
      report.comparisons.forEach((comp) => {
        const change = comp.percentChange;
        let direction: TrendChangeItem["direction"] = "STABLE";
        let isPositiveChange = true;

        if (change !== null && Math.abs(change) >= CHANGE_THRESHOLD_PERCENT) {
          if (change > 0) {
            direction = "IMPROVING";
            isPositiveChange = true;
          } else {
            direction = "DECLINING";
            isPositiveChange = false;
          }
        } else {
          direction = "STABLE";
        }

        const formattedText =
          change !== null
            ? `${change > 0 ? "+" : ""}${change.toFixed(1)}% vs previous period`
            : "New period (No prior baseline)";

        trends.push({
          key: comp.key,
          label: comp.label,
          category: comp.category,
          direction,
          currentValue: comp.currentPeriodValue,
          previousValue: comp.previousPeriodValue,
          unit: comp.unit,
          percentChange: comp.percentChange,
          formattedText,
          threshold: CHANGE_THRESHOLD_PERCENT,
          isPositiveChange,
        });
      });
    }

    return { insights, trends };
  }
}
