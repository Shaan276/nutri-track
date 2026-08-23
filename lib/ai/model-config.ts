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

4. MANDATORY RECIPE & FOOD INGREDIENTS REQUIREMENT (NEVER GUESS MACROS):
   - When the user asks to "add/save <dish> to the database" or "log <dish>" (e.g. "add besan chilla to the database", "save paneer wrap to database", "log my lunch"):
     • **CHECK [SAVED FOOD DATABASE ITEMS & RECIPES] FIRST**:
       - IF the exact dish is already listed in [SAVED FOOD DATABASE ITEMS & RECIPES], use its exact database macros and log it.
     • **IF THE DISH IS NOT IN [SAVED FOOD DATABASE ITEMS & RECIPES] AND NO INGREDIENTS/QUANTITIES WERE PROVIDED**:
       - **DO NOT CALL \`create_recipe_in_database\` or \`log_meal\`!**
       - **DO NOT GUESS, ASSUME, OR INVENT GENERIC NUMBERS (e.g., NEVER guess 6.3g protein or 154 kcal for a chilla)!**
       - **YOU MUST REPLY IN TEXT asking the user for their raw ingredients and quantities**:
         "I'd love to add 'Besan Chilla' to your Food Database! 🥞✨ To calculate the exact calories, protein, and vitamins for your recipe, could you share the raw ingredients? For example:
         - How much besan (gram flour) in grams or tbsp?
         - Any paneer, veggies, seeds, or oil/ghee?
         - How many servings/chillas does it make?"
     • **ONLY WHEN THE USER SHARES THE INGREDIENTS & QUANTITIES**:
       - Calculate the exact calories, protein, carbs, fat, fiber, and vitamins from their ingredients.
       - THEN call \`create_recipe_in_database\` or \`log_meal\`!

5. CLEAN MICRONUTRIENT & NUTRITION REPORTING (NO NULLS RULE):
   - Whenever you summarize or log a meal, present a clear, mouth-watering summary:
     • **Macros**: **Calories** | **Protein** | **Carbohydrates** | **Fat** | **Fiber**
     • **Vitamins & Minerals Available**: Only list the micronutrients that are genuinely present in the meal along with their approx quantity (e.g. **Iron: 3.8 mg** | **Calcium: 240 mg** | **Potassium: 620 mg** | **Vitamin C: 18 mg** | **Zinc: 2.1 mg** | **Folate / B9: 110 mcg**).
     • **NEVER output raw database keys or null strings like "vitaminE: null" or list unpresent vitamins as null/0**. Only showcase the actual nourishing vitamins and minerals in the dish!

6. FULL READ, WRITE, EDIT & DELETE CAPABILITY ACROSS THE ENTIRE APP:
   - You have complete tools to create, edit, update, or delete ANY data in the user's account:
     • \`log_meal\`: Logs food/recipe to any meal section.
     • \`update_meal_entry\`: Edits quantities or portions of already-logged foods in their meals (e.g. changing 100g curd to 200g).
     • \`delete_meal_entry\`: Deletes a specific food or dish from today's meals (e.g. "remove chilla from breakfast", "delete today's log").
     • \`clear_day_logs\`: Resets all food logs or hydration for today.
     • \`create_recipe_in_database\`: Saves custom recipes into their Food Database (after user shares ingredients).
     • \`delete_recipe_from_database\`: Permanently removes or deletes a custom recipe from their Food Database (e.g. "delete it from the database", "remove the meal from database", "delete besan chilla from database").
     • \`update_recipe_in_database\`: Modifies macros, name, or ingredients of an existing saved recipe.
     • \`log_hydration\` & \`delete_hydration_log\`: Logs or deletes water/beverage entries.
     • \`log_activity\` & \`delete_activity_log\`: Logs or deletes workouts and runs.
     • \`update_user_goals\`: Adjusts target calories, protein, hydration, daily steps, or body weight.
     • \`toggle_dynamic_nutrition\`: Enables/disables Dynamic Nutrition intelligence.
     • \`get_yesterdays_data_and_dynamic_targets\`: Explains how yesterday's workouts/nutrition optimized today's targets.
   - When the user asks you to delete, edit, or adjust anything (e.g. "delete it from database", "remove this meal", "delete today's log"), execute the appropriate tool immediately and confirm warmly!
   - NEVER tell the user that you cannot delete items, do not have access, or lack tools. You have full deletion and modification tools for both daily logs and the permanent food database!
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
      description: "Logs a food or meal into daily logs. ONLY call this if the food is in [SAVED FOOD DATABASE ITEMS & RECIPES] or if the user provided the ingredients/macros in the conversation. DO NOT invent arbitrary low numbers for unknown homemade dishes without asking for ingredients.",
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
          iron: {
            type: "number",
            description: "Iron in mg (e.g. 3.5).",
          },
          calcium: {
            type: "number",
            description: "Calcium in mg (e.g. 180).",
          },
          potassium: {
            type: "number",
            description: "Potassium in mg (e.g. 450).",
          },
          magnesium: {
            type: "number",
            description: "Magnesium in mg (e.g. 75).",
          },
          zinc: {
            type: "number",
            description: "Zinc in mg (e.g. 2.0).",
          },
          vitaminC: {
            type: "number",
            description: "Vitamin C in mg (e.g. 15).",
          },
          vitaminA: {
            type: "number",
            description: "Vitamin A in mcg (e.g. 120).",
          },
          vitaminB12: {
            type: "number",
            description: "Vitamin B12 in mcg (e.g. 1.2).",
          },
          vitaminD: {
            type: "number",
            description: "Vitamin D in IU/mcg (e.g. 5).",
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
      name: "update_meal_entry",
      description: "Updates the quantity, serving size, or portions of an existing logged food or recipe in the user's daily meal logs.",
      parameters: {
        type: "object",
        properties: {
          foodName: {
            type: "string",
            description: "Name of the logged food item to adjust (e.g. 'Oats', 'Paneer Chilla', 'Curd', 'Banana').",
          },
          newQuantity: {
            type: "number",
            description: "New quantity amount (e.g. 150, 200, 2).",
          },
          newQuantityUnit: {
            type: "string",
            description: "Unit of measurement (e.g. 'g', 'bowl', 'serving', 'piece', 'cup').",
          },
          mealType: {
            type: "string",
            enum: ["BREAKFAST", "LUNCH", "DINNER", "SNACK"],
            description: "Optional meal section to narrow down search.",
          },
          date: {
            type: "string",
            description: "Optional ISO date (YYYY-MM-DD). Defaults to today.",
          },
        },
        required: ["foodName", "newQuantity"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "delete_meal_entry",
      description: "Deletes or removes a specific food item or meal from the user's food logs (e.g. 'remove the eggs I logged for breakfast', 'delete daal from lunch').",
      parameters: {
        type: "object",
        properties: {
          foodName: {
            type: "string",
            description: "Name of the logged food or dish to remove (e.g. 'Eggs', 'Mixed Daal', 'Rice').",
          },
          mealType: {
            type: "string",
            enum: ["BREAKFAST", "LUNCH", "DINNER", "SNACK"],
            description: "Optional meal section to delete from.",
          },
          date: {
            type: "string",
            description: "Optional ISO date (YYYY-MM-DD). Defaults to today.",
          },
        },
        required: ["foodName"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "clear_day_logs",
      description: "Clears or resets all food logs, hydration logs, or activities for a specific date or for today (e.g. 'clear today's logs', 'reset today's meal journal', 'remove all food logged today').",
      parameters: {
        type: "object",
        properties: {
          date: {
            type: "string",
            description: "Optional ISO date (YYYY-MM-DD). Defaults to today.",
          },
          section: {
            type: "string",
            enum: ["ALL", "MEALS", "HYDRATION", "ACTIVITIES"],
            description: "Which section to clear: 'ALL' (everything today), 'MEALS' (only food logs), 'HYDRATION' (only water), 'ACTIVITIES' (workouts). Defaults to 'ALL'.",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_recipe_in_database",
      description: "Saves a new custom recipe into the user's permanent Food Database ONLY AFTER the user has provided the raw ingredients and quantities. If the user only gave a recipe name without ingredients/quantities, DO NOT call this tool — ask for the ingredients and quantities first in text!",
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
      name: "delete_recipe_from_database",
      description: "Deletes or removes a custom recipe or food item permanently from the user's Food Database (e.g. 'delete besan chilla from database', 'remove oats bowl from my food database').",
      parameters: {
        type: "object",
        properties: {
          recipeName: {
            type: "string",
            description: "Name of the recipe or food item to delete from the database.",
          },
        },
        required: ["recipeName"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_recipe_in_database",
      description: "Updates or edits the macronutrients, ingredients, serving size, or name of an existing custom recipe in the user's Food Database.",
      parameters: {
        type: "object",
        properties: {
          recipeName: { type: "string", description: "Name of the existing recipe to update." },
          newName: { type: "string", description: "New name for the recipe (optional)." },
          calories: { type: "number", description: "Updated total calories." },
          protein: { type: "number", description: "Updated protein (g)." },
          carbohydrates: { type: "number", description: "Updated carbs (g)." },
          fat: { type: "number", description: "Updated fat (g)." },
          fiber: { type: "number", description: "Updated fiber (g)." },
          servingSize: { type: "number", description: "Updated reference serving quantity." },
          servingUnit: { type: "string", description: "Updated reference serving unit." },
          notes: { type: "string", description: "Updated ingredients list / instructions." },
        },
        required: ["recipeName"],
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
      description: "Directly updates the user's active health targets, weight, height, daily calories, protein, carbs, fat, hydration, or daily steps.",
      parameters: {
        type: "object",
        properties: {
          weightKg: { type: "number", description: "Body weight in kilograms (e.g. 56, 70.5)." },
          heightCm: { type: "number", description: "Height in centimeters (e.g. 175)." },
          calories: { type: "number", description: "Daily calorie target in kcal." },
          protein: { type: "number", description: "Daily protein target in grams." },
          carbohydrates: { type: "number", description: "Daily carbs target in grams." },
          fat: { type: "number", description: "Daily fat target in grams." },
          dailyHydrationTargetMl: { type: "number", description: "Daily hydration goal in ml." },
          dailyStepTarget: { type: "number", description: "Daily step target count." },
          primaryGoal: { type: "string", enum: ["LOSE_WEIGHT", "MAINTAIN", "BUILD_MUSCLE", "ENDURANCE"], description: "Primary wellness objective." },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "delete_hydration_log",
      description: "Deletes the most recent water or hydration log entry for today or a specific date.",
      parameters: {
        type: "object",
        properties: {
          date: { type: "string", description: "Optional ISO date (YYYY-MM-DD)." },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "delete_activity_log",
      description: "Deletes the most recent workout, run, or activity log for today or a specific date.",
      parameters: {
        type: "object",
        properties: {
          date: { type: "string", description: "Optional ISO date (YYYY-MM-DD)." },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "toggle_dynamic_nutrition",
      description: "Enables or disables Dynamic Nutrition auto-optimization (e.g. 'enable dynamic nutrition', 'turn off dynamic nutrition').",
      parameters: {
        type: "object",
        properties: {
          enabled: { type: "boolean", description: "Set true to enable Dynamic Nutrition, false to disable." },
        },
        required: ["enabled"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_yesterdays_data_and_dynamic_targets",
      description: "Retrieves Yesterday's complete data breakdown (calories, protein, runs, workouts) and today's AI-optimized dynamic targets.",
      parameters: {
        type: "object",
        properties: {
          date: { type: "string", description: "Optional reference date (defaults to today)." },
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
