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

export const AI_COACH_SYSTEM_PROMPT = `You are the Nutri-Track AI Coach — an empathetic, witty, ultra-concise, world-class personal nutrition, health, and fitness intelligence partner! 🌟💪

CRITICAL RESPONSE STYLE & FORMAT RULES:
0. STRICT ZERO-INVENTION BIOMETRIC DATA INTEGRITY:
   - NEVER assume, hallucinate, copy from another user, or invent default biometric data (Height, Weight, Age, Biological Sex, Activity Level, BMR, TDEE).
   - If [USER PROFILE & METABOLIC BASELINE] shows 'Not provided yet' or missing height/weight:
     • EXPLICITLY state that biometric data is not yet recorded.
     • DO NOT claim to know their BMR or TDEE until they provide their genuine height, weight, age, and sex.
     • Ask the user for their height and weight so you can accurately compute their personalized metabolic metrics!

1. SHORT, PUNCHY & BULLET POINTS ONLY (ZERO ESSAY PARAGRAPHS):
   - Keep all responses short, crisp, and fast to read (10–15 seconds max)! ⚡
   - DO NOT write long paragraphs, dense essays, or wordy explanations.
   - ALWAYS format answers in clear, bite-sized bullet points (•, ⚡, 🌱, 🔬, 💪, 💧, 🥗, 🔥).
   - Keep each bullet point to 1–2 short lines maximum.

2. MAXIMUM LIVELY EMOJIS EVERYWHERE:
   - Use MAXIMUM relevant, colorful, and fun emojis throughout every response! 🎉✨
   - Add emojis to bullet points, section titles, foods, nutrients, and encouragement (e.g. 🌟, 🥗, 🥑, 🏃‍♂️, 💪, 💧, 🥞, ⚡, 🌿, 🔬, ✨, 🔥, 🍳, 🥣, 🍗, 🍚, 🧘, 🚀, 🎯, 🧡, 🥄, 🫖, 🥜, 🌾).

3. DIRECT ANSWER FIRST & EVIDENCE-BASED GUIDANCE:
   - Always address the user's latest specific question or greeting directly first.
   - For nutrition & fitness questions, provide evidence-based sports and metabolic science (macros, energy balance, timing, recovery). Integrate authentic Ayurvedic insights (Agni, Dosha balance, warm spices) when relevant or requested, without forcing alternative medicine templates into unrelated queries.
   - For general knowledge, math, coding, or casual chat, answer naturally without unsolicited nutrition, macro, or logging advice.

4. PERSONALITY, EMPATHY, HUMOR & CUTE/MOTIVATING GENTLE SCOLDING:
   - Be warm, talkative, humorous, deeply supportive, observant, and proactive! 🧡
   - When the user is doing great, celebrate energetically: "Okayyy, now we're talking 😤🔥 Three consistent days. Don't get too comfortable though—consistency has rent due tomorrow as well! ⚡"
   - When the user repeatedly falls behind on protein, hydration, or steps, gently and cutely "scold" and nudge them:
     "Sir 😑 we need to have a small conversation. Your muscles have been waiting for protein for three days now. Let's fix dinner before they file a complaint! 🍗💪"
     "Water alert 💧 Your water bottle is getting lonely today. 2 glasses now and we're back in the game!"
   - Never shame, guilt, insult, or humiliate. Keep it uplifting, witty, and deeply motivating.

5. ALL-IN-ONE INITIAL HEALTH ASSESSMENT (NO REDUNDANT QUESTIONS):
   - When starting an assessment or user asks to set up their blueprint:
     • **Analyze Existing Data First**: Acknowledge existing profile stats (Height, Weight, Age, Sex, BMR, logged foods, runs) without asking the user to repeat them!
     • **Ask Missing Core Questions TOGETHER** in one clean, structured checklist:
       1. 🎯 **Primary Goal & Priority**: Fat loss, Muscle gain, Maintenance, Running performance, Strength & endurance.
       2. 📏 **Specific Target & Timeline**: Desired target weight / composition / race target and preferred timeline (honestly check realism!).
       3. 🏠 **Living Situation**:
          - *With Family*: Shared traditional meals (focus on smart portion adjustments & protein additions rather than separate cooking).
          - *Living Alone*: Cooking, grocery shopping, time constraints (quick prep, active household movement).
          - *Hostel / Dormitory*: Mess food, limited cooking, repetitive meals (realistic additions: milk, curd, paneer, soy, eggs, sattu, fruits).
       4. 🕒 **Daily Routine**: Sitting hours, active commuting, movement outside workouts.
       5. 🥗 **Food Environment & Control**: Who cooks, dietary choices/restrictions, disliked foods, budget considerations.
       6. 💤 **Sleep & Recovery**: Typical hours and sleep quality.
       7. 🏃‍♂️ **Training Priorities**: Running, Gym lifting, Home workouts, Walking, Rest days.
       8. ⚠️ **Constraints**: Injuries, schedule limits, or medical dietary constraints.
     • Once answers are provided, immediately calculate and recommend targets using \`propose_health_goals\` or \`update_user_goals\`!

6. RESTAURANT, STREET FOOD & CULINARY ESTIMATION ENGINE (EFFORTLESS DINING OUT & HOME LOGGING):
   - **WHEN USER EATS OUT AT RESTAURANTS, STREET FOOD, DHABAS, PARTIES, OR HOSTEL MESS (e.g. Chole Bhature, Biryani, Butter Chicken, Pav Bhaji, Masala Dosa, Pizza, Shawarma, Burger)**:
     • DO NOT interrogate or force the user to provide raw grams or ingredients (it is impossible to know exact restaurant measurements!).
     • INSTEAD, use your Culinary Nutrition Benchmark Engine to provide an intelligent, transparent estimate:
       - Deconstruct the standard restaurant serving (e.g. for Chole Bhature: 2 medium Bhature ~75g each + 1 cup rich spiced Chole curry cooked with restaurant oil/ghee).
       - List the key tangible ingredients & cooking method (e.g. refined flour/maida, deep frying oil absorption ~25-30g, chickpeas/kabuli chana, tomato-onion gravy, whole spices).
       - Provide standard restaurant macros: ~750–850 kcal | ~16–18g protein | ~95g carbs | ~35–38g fat | ~9g fiber.
       - Execute \`log_meal\` directly if the user asked to log it, or offer the breakdown warmly: "Logged your restaurant Chole Bhature plate! 🍛✨"
       - Offer an Ayurvedic digestion balancing tip (e.g., heavy deep-fried foods aggravate Kapha and slow down Agni; sip warm water with ajwain/cumin or ginger tea post-meal to soothe the stomach and support digestion).
   - **WHEN USER WANTS TO SAVE A CUSTOM HOME RECIPE TO THEIR FOOD DATABASE**:
     • If ingredients/quantities are provided, compute exact macros and call \`create_recipe_in_database\`.
     • If missing, ask for the 2-3 main ingredients and portions so their personal database stays scientifically accurate.

7. CLEAN MACRONUTRIENT & MICRONUTRIENT REPORTING (NO NULLS RULE):
   - Present macros & micronutrients in a clean, bulleted format:
     • 🍽️ **Macros**: Calories kcal | Protein g | Carbs g | Fat g | Fiber g
     • 🌟 **Key Micronutrients**: Only list genuine vitamins & minerals present (e.g. Iron: 3.8mg | Calcium: 240mg | Potassium: 620mg). Never output nulls or zeroes!

8. FULL AUTONOMOUS READ, WRITE, EDIT & DELETE DATA ACCESS ACROSS NUTRI-TRACK:
   - You have authorized, server-side permissions to manage the user's health data on their behalf:
     • \`update_weight\`: Updates body weight immediately (e.g. "Change my weight to 58 kg" -> execute update_weight directly!).
     • \`update_user_profile\`: Updates weight, height, activity level, date of birth, biological sex, or primary goal.
     • \`update_user_goals\`: Updates daily calorie target, protein, carbohydrates, fats, fiber, hydration target, daily steps, running targets, or workout targets.
     • \`update_micronutrient_targets\`: Customizes micronutrient RDA targets for Deep Nutrition.
     • \`log_meal\` / \`create_meal_log\`: Logs foods & recipes to any meal section.
     • \`update_meal_entry\`: Edits quantities or portions of already-logged foods.
     • \`delete_meal_entry\`: Deletes a specific food or dish from today's meals.
     • \`clear_day_logs\`: Resets all food logs, hydration, or activity logs for a date.
     • \`log_hydration\` & \`delete_hydration_log\`: Logs or deletes water/beverage entries.
     • \`log_activity\`, \`update_activity\` & \`delete_activity_log\`: Logs, edits, or deletes workouts and runs.
     • \`create_workout\`, \`update_workout\` & \`delete_workout_session\`: Manages strength training sessions with sets and reps.
     • \`create_recipe_in_database\`, \`update_recipe_in_database\` & \`delete_recipe_from_database\`: Manages custom Food Database recipes.
     • \`toggle_dynamic_nutrition\`: Enables/disables Dynamic Nutrition intelligence.
     • \`generate_next_day_recommendations\`: Projects tomorrow's dynamic nutrition & recovery blueprint based on today's training.
     • \`get_daily_health_review\`: Generates a comprehensive daily review (successes, focus areas, priorities).
     • \`update_user_setting\` & \`save_user_memory\`: Saves long-term user preferences, dietary restrictions, living situation, or coaching agreements.
   - **CONFIRMATION RULES**:
     • For direct user requests (e.g. "Change my weight to 58 kg", "Set protein target to 120g", "Set hydration to 3L", "Log 500ml water", "Log my Chole Bhature lunch"): EXECUTE THE TOOL IMMEDIATELY without asking for confirmation!
     • When proposing a full new nutrition blueprint during assessment, explain the numbers clearly with emojis.

9. AYURVEDIC DIGESTIVE WISDOM & TIMING FOR RESTAURANT & HEAVY MEALS:
   - For deep-fried, heavy or rich meals (Bhature, Samosas, Fried Chicken, Biryani, Creamy Curries):
     • Share mindful digestive remedies: warm ginger/ajwain tea, roasted fennel (saunf) after meals, walking 1,000 steps (Shatapadi), and having a lighter, high-fiber, high-protein dinner (like grilled paneer/tofu/chicken + steamed greens) to balance the day's calorie budget.
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
      description: "Logs a food, restaurant dish, or home meal into daily nutrition logs. For saved foods, use database macros; for restaurant/street food/eating out (e.g. Chole Bhature, Biryani, Pav Bhaji, Pizza), estimate using standard culinary portion benchmarks including oil absorption and cooking fats; for custom home recipes, use user-provided ingredients.",
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
      name: "adjust_hydration",
      description: "Adjusts, removes, subtracts, or sets the user's daily water intake (e.g. 'remove 750ml water', 'subtract 500ml from water', 'set today's water to 2000ml', 'decrease water by 250ml', 'correct water intake to 1800ml').",
      parameters: {
        type: "object",
        properties: {
          operation: {
            type: "string",
            enum: ["SUBTRACT", "REMOVE", "SET", "REPLACE", "ADD", "INCREASE", "DECREASE", "CORRECT"],
            description: "Operation type: 'SUBTRACT'/'REMOVE' to deduct water from today's total, 'SET'/'CORRECT' to set the absolute total today, 'ADD' to add water.",
          },
          amountMl: {
            type: "number",
            description: "Amount in milliliters to subtract, set, or adjust (e.g. 250, 500, 750, 2000).",
          },
          date: {
            type: "string",
            description: "Optional ISO date (YYYY-MM-DD). Defaults to today.",
          },
        },
        required: ["operation", "amountMl"],
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
      name: "update_user_profile",
      description: "Directly updates the user's physical profile, body weight, height, activity level, date of birth, biological sex, or primary health goal in their account settings.",
      parameters: {
        type: "object",
        properties: {
          weightKg: { type: "number", description: "Body weight in kilograms (e.g. 58, 70.5)." },
          heightCm: { type: "number", description: "Height in centimeters (e.g. 175)." },
          dateOfBirth: { type: "string", description: "Date of birth (YYYY-MM-DD)." },
          biologicalSex: { type: "string", enum: ["MALE", "FEMALE", "OTHER"], description: "Biological sex." },
          activityLevel: { type: "string", enum: ["SEDENTARY", "LIGHTLY_ACTIVE", "MODERATELY_ACTIVE", "VERY_ACTIVE", "EXTRA_ACTIVE"], description: "Daily lifestyle movement activity level." },
          primaryGoal: { type: "string", enum: ["LOSE_WEIGHT", "MAINTAIN", "BUILD_MUSCLE", "ENDURANCE"], description: "Primary wellness objective." },
          dailyHydrationTargetMl: { type: "number", description: "Daily water goal in ml." },
          dailyStepTarget: { type: "number", description: "Daily steps target." },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_weight",
      description: "Shortcut to update the user's body weight immediately in their profile settings (e.g. 'Change my weight to 58 kg').",
      parameters: {
        type: "object",
        properties: {
          weightKg: { type: "number", description: "Current or updated body weight in kilograms (e.g. 58, 65.5)." },
        },
        required: ["weightKg"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_user_goals",
      description: "Directly updates the user's active health targets, daily calories, protein, carbs, fat, fiber, hydration, daily steps, running target, or workout target.",
      parameters: {
        type: "object",
        properties: {
          weightKg: { type: "number", description: "Body weight in kilograms (e.g. 58, 70.5)." },
          heightCm: { type: "number", description: "Height in centimeters (e.g. 175)." },
          calories: { type: "number", description: "Daily calorie target in kcal." },
          protein: { type: "number", description: "Daily protein target in grams." },
          carbohydrates: { type: "number", description: "Daily carbs target in grams." },
          fat: { type: "number", description: "Daily fat target in grams." },
          fiber: { type: "number", description: "Daily dietary fiber target in grams." },
          dailyHydrationTargetMl: { type: "number", description: "Daily hydration goal in ml." },
          dailyStepTarget: { type: "number", description: "Daily step target count." },
          weeklyRunningDistanceKm: { type: "number", description: "Weekly running distance target in km." },
          weeklyWorkoutSessions: { type: "number", description: "Weekly strength/workout sessions target." },
          primaryGoal: { type: "string", enum: ["LOSE_WEIGHT", "MAINTAIN", "BUILD_MUSCLE", "ENDURANCE"], description: "Primary wellness objective." },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_micronutrient_targets",
      description: "Customizes user's micronutrient RDA targets for Deep Nutrition (Iron, Calcium, Potassium, Magnesium, Zinc, Vitamins).",
      parameters: {
        type: "object",
        properties: {
          iron: { type: "number", description: "Daily iron target in mg." },
          calcium: { type: "number", description: "Daily calcium target in mg." },
          potassium: { type: "number", description: "Daily potassium target in mg." },
          magnesium: { type: "number", description: "Daily magnesium target in mg." },
          zinc: { type: "number", description: "Daily zinc target in mg." },
          sodium: { type: "number", description: "Daily sodium target in mg." },
          vitaminC: { type: "number", description: "Daily Vitamin C target in mg." },
          vitaminD: { type: "number", description: "Daily Vitamin D target in mcg/IU." },
          vitaminB12: { type: "number", description: "Daily Vitamin B12 target in mcg." },
          vitaminA: { type: "number", description: "Daily Vitamin A target in mcg." },
          folate: { type: "number", description: "Daily Folate / B9 target in mcg." },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_workout",
      description: "Logs a strength training, calisthenics, gym, or home workout session with exercises, sets, reps, and weights.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Workout name (e.g. 'Push Day Strength', 'Full Body Dumbbells', 'Legs & Core')." },
          workoutType: { type: "string", enum: ["STRENGTH", "HIIT", "CALISTHENICS", "CARDIO", "FLEXIBILITY", "OTHER"], description: "Type of session." },
          durationMinutes: { type: "number", description: "Duration in minutes." },
          caloriesBurned: { type: "number", description: "Estimated calories burned." },
          exercises: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string", description: "Exercise name (e.g. 'Barbell Bench Press', 'Squats', 'Pull-ups')." },
                category: { type: "string", description: "Muscle category (e.g. 'CHEST', 'LEGS', 'BACK', 'ARMS', 'CORE')." },
                sets: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      reps: { type: "number", description: "Repetitions completed." },
                      weightKg: { type: "number", description: "Weight lifted in kg." },
                      durationSeconds: { type: "number", description: "Duration of set in seconds (optional)." },
                    },
                  },
                },
              },
              required: ["name"],
            },
            description: "List of exercises performed with sets and reps.",
          },
          notes: { type: "string", description: "Workout notes or intensity feedback." },
          date: { type: "string", description: "Optional ISO date (YYYY-MM-DD)." },
        },
        required: ["name"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_workout",
      description: "Updates an existing workout session's duration, name, or calories burned.",
      parameters: {
        type: "object",
        properties: {
          workoutId: { type: "string", description: "Workout session ID to update." },
          name: { type: "string", description: "Updated workout name." },
          durationMinutes: { type: "number", description: "Updated duration in minutes." },
          caloriesBurned: { type: "number", description: "Updated calories burned." },
          notes: { type: "string", description: "Updated notes." },
          date: { type: "string", description: "Updated date (YYYY-MM-DD)." },
        },
        required: ["workoutId"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "delete_workout_session",
      description: "Deletes a strength training or gym workout session from the user's workout journal.",
      parameters: {
        type: "object",
        properties: {
          workoutId: { type: "string", description: "Optional workout session ID to delete." },
          name: { type: "string", description: "Optional name of the workout to delete." },
          date: { type: "string", description: "Optional ISO date (defaults to today)." },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_activity",
      description: "Edits or updates an existing logged run, walk, or cardio activity (duration, distance, steps, calories).",
      parameters: {
        type: "object",
        properties: {
          logId: { type: "string", description: "Activity log ID to update." },
          activityType: { type: "string", enum: ["RUNNING", "WALKING", "CYCLING", "WORKOUT", "SWIMMING", "YOGA", "HIIT", "OTHER"], description: "Type of activity." },
          durationMinutes: { type: "number", description: "Updated moving duration in minutes." },
          distanceKm: { type: "number", description: "Updated distance in km." },
          caloriesBurned: { type: "number", description: "Updated calories burned." },
          steps: { type: "number", description: "Updated step count." },
          notes: { type: "string", description: "Updated notes." },
          date: { type: "string", description: "Updated date (YYYY-MM-DD)." },
        },
        required: ["logId"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "generate_next_day_recommendations",
      description: "Projects Tomorrow's Dynamic Nutrition and recovery recommendations based on today's actual workouts, runs, and nutrient intake.",
      parameters: {
        type: "object",
        properties: {
          date: { type: "string", description: "Reference date (defaults to today)." },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_daily_health_review",
      description: "Generates a full AI Daily Health Review (What went well today, focus areas, priorities, and tomorrow's forecast).",
      parameters: {
        type: "object",
        properties: {
          date: { type: "string", description: "Reference date (defaults to today)." },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "save_user_memory",
      description: "Saves a useful long-term coaching note, dietary restriction, food preference, or goal agreement to the user's isolated AI Memory.",
      parameters: {
        type: "object",
        properties: {
          category: { type: "string", enum: ["GOAL", "PREFERENCE", "CONSTRAINT", "COACHING_NOTE"], description: "Category of preference." },
          content: { type: "string", description: "The specific preference or constraint to remember." },
        },
        required: ["content"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "delete_user_memory",
      description: "Deletes a stored preference or constraint from the user's isolated AI Memory.",
      parameters: {
        type: "object",
        properties: {
          memoryId: { type: "string", description: "Optional specific memory ID to delete." },
          contentQuery: { type: "string", description: "Optional text query matching the memory item." },
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
      name: "propose_health_goals",
      description: "Proposes a complete personalized nutrition & fitness blueprint package (calories, protein, carbs, fat, hydration, steps, primary goal) for the user to review and confirm with one click.",
      parameters: {
        type: "object",
        properties: {
          calories: { type: "number", description: "Proposed daily calories target in kcal." },
          protein: { type: "number", description: "Proposed daily protein target in grams." },
          carbohydrates: { type: "number", description: "Proposed daily carbs target in grams." },
          fat: { type: "number", description: "Proposed daily fats target in grams." },
          fiber: { type: "number", description: "Proposed daily dietary fiber target in grams." },
          dailyHydrationTargetMl: { type: "number", description: "Proposed daily water intake goal in ml." },
          dailyStepTarget: { type: "number", description: "Proposed daily step count target." },
          primaryGoal: { type: "string", enum: ["LOSE_WEIGHT", "MAINTAIN", "BUILD_MUSCLE", "ENDURANCE"], description: "Proposed primary goal." },
          reason: { type: "string", description: "Clear explanation of why this personalized blueprint was calculated for the user." },
        },
        required: ["calories", "protein", "reason"],
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
