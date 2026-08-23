export interface ModelConfig {
  defaultModel: string;
  reasoningModel: string;
  baseUrl: string;
  maxOutputTokens: number;
  temperature: number;
  contextMessageLimit: number;
}

export const AI_MODEL_CONFIG: ModelConfig = {
  defaultModel: process.env.AI_MODEL || "gpt-5-preview",
  reasoningModel: process.env.AI_REASONING_MODEL || "gpt-5-preview",
  baseUrl: process.env.AI_BASE_URL || "https://api.openai.com/v1",
  maxOutputTokens: 1500,
  temperature: 0.7,
  contextMessageLimit: 12,
};

export const AI_COACH_SYSTEM_PROMPT = `You are the Nutri-Track AI Coach — an empathetic, warm, world-class personal nutrition, health, and fitness intelligence partner! 🌟

HOW TO TALK AND INTERACT:
1. WARM, HUMAN, & EMPATHETIC:
   - Talk like an enthusiastic, caring personal coach and master nutritionist who genuinely cares about the user's wellness and athletic journey! 🤗✨
   - Always use lively, relevant emojis naturally in every conversation (e.g., 🥗, 🥑, 🏃‍♂️, 💪, 💧, 🌟, 👏, 🎯, ✨, 🔥, 🍳, 🥣, 🍗, 🍚).
   - Celebrate achievements, validate daily efforts, and show supportive encouragement. Never be cold, clinical, or robotic.

2. AYURVEDA FIRST, THEN MODERN SCIENCE (CRITICAL PRINCIPLE):
   - Whenever you provide meal recommendations, recipe ideas, digestion advice, recovery strategies, or wellness tips:
     • **🌿 Step 1: Ayurvedic Wisdom First**:
       - Explain the recommendation through Ayurvedic bio-energetics:
         - **Agni (Digestive Fire)**: How the food strengthens or protects digestive fire, using warming/cooling properties (*Virya*) and digestive spices (ginger, cumin, turmeric, coriander, fennel, black pepper, cardamom).
         - **Dosha & Vitality (Prana & Ojas)**: How it balances *Vata* (nervous system, movement, running fatigue), *Pitta* (heat, metabolism, inflammation), and *Kapha* (structure, stamina).
         - **Sattvic & Prana-Rich Nutrition**: Emphasize fresh, whole, life-giving foods, warm cooked meals, and proper food combining (*Ahara Niyama* / avoiding *Viruddha Ahara* like sour fruits with milk).
     • **🔬 Step 2: Modern Science & Sports Biochemistry Bridge**:
       - Seamlessly connect and validate the Ayurvedic wisdom with modern sports science:
         - Exact **Macronutrients** (Protein, Carbs, Fat, Fiber) & **Leucine/MPS** triggers for muscle repair.
         - **Micronutrients & % RDA** (Iron, Calcium, Potassium, Magnesium, Zinc, B-vitamins).
         - **Glycogen Kinetics & Bioavailability** (e.g., Vitamin C boosting non-heme iron absorption by 3x).

3. HIGH-LEVEL NUTRITIONAL & PHYSIOLOGICAL INTELLIGENCE:
   - Always connect recommendations to the user's current live progress (e.g. calories remaining, protein deficit/surplus, hydration status).
   - Tailor workout fueling and recovery specifically to their running volume and lifting schedule.

4. AUTOMATIC RECIPE & INGREDIENT NUTRITION CALCULATION:
   - When the user gives you raw ingredients without specifying calories or macros, **YOU MUST CALCULATE THE EXACT NUTRITIONAL TOTALS YOURSELF using your extensive nutritional biochemistry and food composition knowledge!**
   - **NEVER ask the user to provide calories, protein, carbs, or fat** for their food or ingredients. You are the AI nutritionist!
   - Calculate:
     • Total Calories (kcal)
     • Protein (g), Carbohydrates (g), Fat (g), Dietary Fiber (g)
     • Key Micronutrients & Minerals (Iron, Calcium, Potassium, Magnesium, Zinc, Sodium, Vitamin A, Vitamin C, Vitamin D, Vitamin B12, etc.)
   - Immediately execute the appropriate tool:
     • \`create_recipe_in_database\` to save it permanently into their Recipe Database!
     • \`log_meal\` to log it to Breakfast/Lunch/Dinner/Snack if they ate it!

5. CLEAN MICRONUTRIENT & NUTRITION REPORTING (NO NULLS RULE):
   - Whenever you summarize or log a meal, present a clear, mouth-watering summary:
     • **Macros**: **Calories** | **Protein** | **Carbohydrates** | **Fat** | **Fiber**
     • **Vitamins & Minerals Available**: Only list the micronutrients that are genuinely present in the meal along with their approx quantity (e.g. **Iron: 3.8 mg** | **Calcium: 240 mg** | **Potassium: 620 mg** | **Vitamin C: 18 mg** | **Zinc: 2.1 mg** | **Folate / B9: 110 mcg**).
     • **NEVER output raw database keys or null strings like "vitaminE: null" or list unpresent vitamins as null/0**. Only showcase the actual nourishing vitamins and minerals in the dish!
     • These automatically fill the user's **Deep Nutrition** tracker in the app! 🥗✨

6. FULL READ & WRITE CAPABILITY ACROSS THE ENTIRE APP:
   - You have direct tools to access and edit data in the user's Nutri-Track account:
     • \`log_meal\`: Logs food/recipe to any meal section.
     • \`create_recipe_in_database\`: Saves custom recipes into their Food Database with full macros & micronutrients.
     • \`log_hydration\`: Logs water and beverages.
     • \`log_activity\`: Logs workouts and runs.
     • \`update_user_goals\`: Adjusts target calories, protein, hydration, or steps.
   - When the user asks you to log, save, or update anything, execute the tool immediately and confirm happily!
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
      name: "log_meal",
      description: "Logs a food item, meal, or custom recipe directly into the user's Nutri-Track food journal for Breakfast, Lunch, Dinner, or Snack. Calculate the calories and macros from ingredients if not provided.",
      parameters: {
        type: "object",
        properties: {
          foodName: {
            type: "string",
            description: "Name of the food or recipe (e.g. 'Paneer Besan Chilla with Mint Chutney', 'Daal Bhaat').",
          },
          mealType: {
            type: "string",
            enum: ["BREAKFAST", "LUNCH", "DINNER", "SNACK"],
            description: "Which meal section to log this under.",
          },
          calories: {
            type: "number",
            description: "Estimated or exact total calories (kcal) for this meal calculated from ingredients.",
          },
          protein: {
            type: "number",
            description: "Protein in grams calculated from ingredients.",
          },
          carbohydrates: {
            type: "number",
            description: "Carbohydrates in grams (optional, default: 0).",
          },
          fat: {
            type: "number",
            description: "Fat in grams (optional, default: 0).",
          },
          fiber: {
            type: "number",
            description: "Dietary fiber in grams (optional, default: 0).",
          },
          quantity: {
            type: "number",
            description: "Serving quantity (default: 1).",
          },
          quantityUnit: {
            type: "string",
            description: "Unit of measurement (e.g. 'serving', 'piece', 'bowl', 'plate', 'g').",
          },
          date: {
            type: "string",
            description: "Optional ISO date (YYYY-MM-DD). Defaults to today.",
          },
        },
        required: ["foodName", "mealType", "calories", "protein"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_recipe_in_database",
      description: "Saves a new custom recipe or food item into the user's permanent Food Database with calculated macros and micronutrients from raw ingredients.",
      parameters: {
        type: "object",
        properties: {
          name: {
            type: "string",
            description: "Name of the recipe or food item (e.g. 'High-Protein Paneer Besan Chilla', 'Daal Bhaat').",
          },
          servingSize: {
            type: "number",
            description: "Reference serving size quantity (default: 1).",
          },
          servingUnit: {
            type: "string",
            description: "Serving unit (e.g. 'chilla', 'serving', 'bowl', 'portion', 'g').",
          },
          calories: {
            type: "number",
            description: "Total calories per serving calculated from raw ingredients.",
          },
          protein: {
            type: "number",
            description: "Protein (g) per serving calculated from raw ingredients.",
          },
          carbohydrates: {
            type: "number",
            description: "Carbohydrates (g) per serving calculated from raw ingredients.",
          },
          fat: {
            type: "number",
            description: "Fat (g) per serving calculated from raw ingredients.",
          },
          fiber: {
            type: "number",
            description: "Fiber (g) per serving calculated from raw ingredients.",
          },
          iron: {
            type: "number",
            description: "Iron in mg (optional).",
          },
          calcium: {
            type: "number",
            description: "Calcium in mg (optional).",
          },
          potassium: {
            type: "number",
            description: "Potassium in mg (optional).",
          },
          magnesium: {
            type: "number",
            description: "Magnesium in mg (optional).",
          },
          sodium: {
            type: "number",
            description: "Sodium in mg (optional).",
          },
          zinc: {
            type: "number",
            description: "Zinc in mg (optional).",
          },
          vitaminA: {
            type: "number",
            description: "Vitamin A in mcg (optional).",
          },
          vitaminC: {
            type: "number",
            description: "Vitamin C in mg (optional).",
          },
          vitaminD: {
            type: "number",
            description: "Vitamin D in mcg (optional).",
          },
          vitaminB12: {
            type: "number",
            description: "Vitamin B12 in mcg (optional).",
          },
          category: {
            type: "string",
            description: "Category (e.g. 'PULSES_LEGUMES', 'GRAINS_CEREALS', 'DAIRY', 'VEGETABLES', 'SNACKS', 'OTHER').",
          },
          notes: {
            type: "string",
            description: "Ingredients list and cooking instructions summary.",
          },
        },
        required: ["name", "calories", "protein"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "log_hydration",
      description: "Logs a water or beverage intake entry directly into the user's daily hydration tracker.",
      parameters: {
        type: "object",
        properties: {
          amountMl: {
            type: "number",
            description: "Amount in milliliters (e.g. 250, 500, 750, 1000).",
          },
          beverageType: {
            type: "string",
            enum: ["WATER", "COFFEE", "TEA", "JUICE", "ELECTROLYTE", "SMOOTHIE", "MILK", "OTHER"],
            description: "Type of beverage (default: 'WATER').",
          },
          date: {
            type: "string",
            description: "Optional ISO date (YYYY-MM-DD). Defaults to today.",
          },
          notes: {
            type: "string",
            description: "Optional notes about the drink.",
          },
        },
        required: ["amountMl"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "log_activity",
      description: "Logs a run, walk, workout, cycling, or fitness activity into the user's activity tracker.",
      parameters: {
        type: "object",
        properties: {
          activityType: {
            type: "string",
            enum: ["RUNNING", "WALKING", "CYCLING", "WORKOUT", "SWIMMING", "YOGA", "HIIT", "OTHER"],
            description: "Type of activity.",
          },
          durationMinutes: {
            type: "number",
            description: "Duration of the session in minutes.",
          },
          caloriesBurned: {
            type: "number",
            description: "Estimated or measured calories burned.",
          },
          distanceKm: {
            type: "number",
            description: "Distance in kilometers (for running, walking, cycling).",
          },
          steps: {
            type: "number",
            description: "Step count (optional).",
          },
          notes: {
            type: "string",
            description: "Notes or description of the workout.",
          },
          date: {
            type: "string",
            description: "Optional ISO date (YYYY-MM-DD). Defaults to today.",
          },
        },
        required: ["activityType", "durationMinutes"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_user_goals",
      description: "Directly updates the user's active health targets (daily calories, protein, carbs, fat, hydration, daily steps).",
      parameters: {
        type: "object",
        properties: {
          calories: { type: "number", description: "Daily calorie target in kcal." },
          protein: { type: "number", description: "Daily protein target in grams." },
          carbohydrates: { type: "number", description: "Daily carbs target in grams." },
          fat: { type: "number", description: "Daily fat target in grams." },
          dailyHydrationTargetMl: { type: "number", description: "Daily hydration goal in ml." },
          dailyStepTarget: { type: "number", description: "Daily step target count." },
        },
      },
    },
  },
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
