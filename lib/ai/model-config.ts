export interface ModelConfig {
  defaultModel: string;
  reasoningModel: string;
  baseUrl: string;
  maxOutputTokens: number;
  temperature: number;
  contextMessageLimit: number;
}

export const AI_MODEL_CONFIG: ModelConfig = {
  defaultModel: process.env.AI_MODEL || "gpt-4o-mini",
  reasoningModel: process.env.AI_REASONING_MODEL || "gpt-4o",
  baseUrl: process.env.AI_BASE_URL || "https://api.openai.com/v1",
  maxOutputTokens: 1500,
  temperature: 0.7,
  contextMessageLimit: 12,
};

export const AI_COACH_SYSTEM_PROMPT = `You are the Nutri-Track AI Coach, an intelligent, evidence-grounded, empathetic personal nutrition and fitness intelligence partner.

CORE PRINCIPLES & BEHAVIOR:
1. GROUNDED IN REAL DATA:
   - Base your nutrition, hydration, and workout analysis strictly on the user's authenticated Nutri-Track data provided in the live context or retrieved via tools.
   - Do NOT invent or hallucinate metrics, meal logs, or personal records.

2. MISSING DATA IS NOT FAILURE (CRITICAL RULE):
   - If the user has not logged meals, hydration, or activities today, treat it as a NEUTRAL state (e.g., "You haven't logged any meals yet today, so your intake is currently at 0g towards your [Target]g protein goal").
   - NEVER make negative judgments like "Your protein intake is poor" or "You failed your calorie target" when data is simply unrecorded.

3. DISTINGUISH FACTS VS CALCULATIONS VS ESTIMATES:
   - Recorded Fact: "You have logged 72g of protein today."
   - Exact Calculation: "You have 48g of protein remaining to reach your 120g target (120g - 72g = 48g)."
   - Estimate: "A 45-minute moderate run for your body weight is estimated to burn approximately 380–440 kcal." Always clearly label calorie expenditures as ESTIMATES.

4. GOAL MODIFICATIONS REQUIRE EXPLICIT CONFIRMATION:
   - When the user asks to change a calorie, macro, hydration, step, running, or workout goal, use the propose_goal_update tool.
   - Explain the physiological rationale and ask the user to confirm before any changes are saved to the database. NEVER silently change targets.

5. HEALTH SAFETY & ETHICAL BOUNDARIES:
   - Provide practical wellness, nutrition, and exercise science guidance.
   - Do not diagnose medical conditions or prescribe medical treatments. Recommend consulting a healthcare professional for clinical or injury concerns.

6. TONE & STYLE:
   - Direct, motivating, actionable, and formatted cleanly with markdown bullet points and bold highlights.
`;

export interface ToolDefinition {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: {
      type: "object";
      properties: Record<string, any>;
      required?: string[];
    };
  };
}

export const AI_COACH_TOOLS: ToolDefinition[] = [
  {
    type: "function",
    function: {
      name: "get_today_nutrition",
      description: "Retrieves today's aggregated calories, macronutrients (protein, carbs, fat, fiber, sugar), targets, and meal breakdown from PostgreSQL.",
      parameters: {
        type: "object",
        properties: {
          date: {
            type: "string",
            description: "Optional ISO date string (YYYY-MM-DD). Defaults to today.",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_hydration_status",
      description: "Retrieves today's total fluid intake, daily hydration target, remaining water, and logging streak.",
      parameters: {
        type: "object",
        properties: {
          date: {
            type: "string",
            description: "Optional ISO date string (YYYY-MM-DD). Defaults to today.",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_running_summary",
      description: "Retrieves the user's running sessions, total distance, average pace, running types (Easy, Tempo, Interval, Long Run), and running personal records.",
      parameters: {
        type: "object",
        properties: {
          daysCount: {
            type: "number",
            description: "Number of past days to analyze (default: 30).",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_workout_summary",
      description: "Retrieves workout sessions, total tonnage/volume (kg), exercise sets, reps, and workout personal records.",
      parameters: {
        type: "object",
        properties: {
          daysCount: {
            type: "number",
            description: "Number of past days to analyze (default: 30).",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_micronutrient_status",
      description: "Retrieves Deep Nutrition RDA status across 13 vitamins and 13 minerals, highlighting optimal coverage and any dietary gaps.",
      parameters: {
        type: "object",
        properties: {
          daysCount: {
            type: "number",
            description: "Number of past days to analyze (default: 7).",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_user_goals",
      description: "Retrieves user's active profile metrics (Height, Weight, BMR, TDEE), macro targets, hydration target, step target, and fitness milestones.",
      parameters: {
        type: "object",
        properties: {},
      },
    },
  },
  {
    type: "function",
    function: {
      name: "propose_goal_update",
      description: "Proposes updating a health target (calories, protein, carbohydrates, fat, hydration, daily steps, running distance, or weekly workouts). Generates a confirmation card for the user to approve. DOES NOT directly modify the database.",
      parameters: {
        type: "object",
        properties: {
          targetKey: {
            type: "string",
            enum: [
              "calories",
              "protein",
              "carbohydrates",
              "fat",
              "fiber",
              "sugar",
              "dailyHydrationTargetMl",
              "dailyStepTarget",
              "weeklyRunningDistanceKm",
              "weeklyWorkoutSessions",
            ],
            description: "The specific target key to update.",
          },
          newValue: {
            type: "number",
            description: "The proposed new numeric target value.",
          },
          reason: {
            type: "string",
            description: "Clear explanation of why this target adjustment is recommended.",
          },
        },
        required: ["targetKey", "newValue", "reason"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "estimate_exercise_calories",
      description: "Calculates an approximate energy expenditure range using MET (Metabolic Equivalent of Task) values based on user's body weight, exercise duration, intensity, and distance. Output is explicitly labelled as an estimate.",
      parameters: {
        type: "object",
        properties: {
          exerciseType: {
            type: "string",
            enum: ["RUNNING", "WALKING", "CYCLING", "STRENGTH_TRAINING", "HIIT", "SWIMMING", "YOGA", "OTHER"],
            description: "Type of exercise performed.",
          },
          durationMinutes: {
            type: "number",
            description: "Duration of exercise in minutes.",
          },
          intensity: {
            type: "string",
            enum: ["LIGHT", "MODERATE", "VIGOROUS", "VERY_VIGOROUS"],
            description: "Intensity level of exercise.",
          },
          distanceKm: {
            type: "number",
            description: "Optional distance in kilometers for running/walking/cycling.",
          },
        },
        required: ["exerciseType", "durationMinutes"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "compare_with_friend",
      description: "Compares progress with an accepted friend for mutually shared health categories (Health Score, Running, Workouts, Hydration). Strictly enforces server-side privacy permissions.",
      parameters: {
        type: "object",
        properties: {
          friendUsername: {
            type: "string",
            description: "Username of the friend to compare with.",
          },
        },
        required: ["friendUsername"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "generate_weekly_plan",
      description: "Generates a structured, evidence-grounded 7-day Health & Fitness plan (running, workouts, nutrition, hydration, active recovery) tailored to user targets.",
      parameters: {
        type: "object",
        properties: {
          startDate: {
            type: "string",
            description: "ISO start date (Monday) for the plan (YYYY-MM-DD).",
          },
          customGoal: {
            type: "string",
            description: "Optional custom goal or emphasis for this week.",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_weekly_plan",
      description: "Retrieves the active weekly plan covering the specified date with daily items and completion status.",
      parameters: {
        type: "object",
        properties: {
          date: {
            type: "string",
            description: "Optional date within the desired week (YYYY-MM-DD).",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_weekly_review",
      description: "Generates a comprehensive weekly retrospective analyzing real nutrition logs, protein adherence, running volume, workout tonnage, and growth areas.",
      parameters: {
        type: "object",
        properties: {
          startDate: {
            type: "string",
            description: "ISO start date (Monday) of the week to review (YYYY-MM-DD).",
          },
        },
      },
    },
  },
];
