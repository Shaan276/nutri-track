export type QueryCategory =
  | "GENERAL"
  | "HEALTH_GENERAL"
  | "HEALTH_PERSONALIZED"
  | "NUTRI_TRACK_DATA"
  | "ACTION_COMMAND"
  | "CASUAL_CHAT";

export interface QueryClassificationResult {
  category: QueryCategory;
  confidence: number;
  extractedEntities: {
    targetKey?: string;
    targetValue?: number;
    actionType?: string;
    operation?: string;
    foodName?: string;
    exerciseType?: string;
    timeframe?: string;
    metric?: string;
  };
  reasoning: string;
}

export class AIQueryClassifier {
  /**
   * Classifies a user query into one of the 6 core categories:
   * 1. GENERAL: Non-health questions (geography, jokes, math, trivia, general science, technology)
   * 2. HEALTH_GENERAL: General health, fitness, physiology, training science (black coffee, creatine, running every day, sleep duration)
   * 3. HEALTH_PERSONALIZED: Personal nutrition/training guidance ("Am I eating enough protein?", "Should I increase calories?", "Why am I tired?")
   * 4. NUTRI_TRACK_DATA: Inquiries about actual logged numbers, history, streak, micronutrients ("How much protein did I eat today?", "My hydration yesterday")
   * 5. ACTION_COMMAND: Commands to update targets, log foods, add water, edit profile ("Change protein target to 130g", "Log 500ml water")
   * 6. CASUAL_CHAT: Chit-chat, mood, motivation, feelings ("How are you?", "I feel lazy today", "I failed my workout")
   */
  public static classifyQuery(rawText: string): QueryClassificationResult {
    const text = (rawText || "").trim();
    const lower = text.toLowerCase();

    // 1. ACTION_COMMAND (High Priority: Explicit mutations or imperative instructions)
    const actionMatch = this.detectActionCommand(lower);
    if (actionMatch) {
      return {
        category: "ACTION_COMMAND",
        confidence: 0.95,
        extractedEntities: actionMatch,
        reasoning: "User is issuing a direct imperative command to modify targets, log data, or update profile.",
      };
    }

    // 2. NUTRI_TRACK_DATA (Explicit data retrieval requests for logged history/numbers)
    const dataMatch = this.detectDataQuery(lower);
    if (dataMatch) {
      return {
        category: "NUTRI_TRACK_DATA",
        confidence: 0.92,
        extractedEntities: dataMatch,
        reasoning: "User is requesting explicit quantitative records from their logged database history.",
      };
    }

    // 3. HEALTH_PERSONALIZED (Questions regarding the user's specific progress, body, or diet)
    const personalHealthMatch = this.detectPersonalizedHealth(lower);
    if (personalHealthMatch) {
      return {
        category: "HEALTH_PERSONALIZED",
        confidence: 0.88,
        extractedEntities: personalHealthMatch,
        reasoning: "User is asking for customized health guidance tailored to their current intake, goals, or symptoms.",
      };
    }

    // 4. CASUAL_CHAT (Greetings, mood, emotional state, conversational banter)
    const casualMatch = this.detectCasualChat(lower);
    if (casualMatch) {
      return {
        category: "CASUAL_CHAT",
        confidence: 0.85,
        extractedEntities: {},
        reasoning: "User is engaging in casual conversation, greeting, sharing feelings, or seeking motivation.",
      };
    }

    // 5. HEALTH_GENERAL (Scientific, fitness, dietary, or physiological inquiries without personal data)
    const healthGeneralMatch = this.detectGeneralHealth(lower);
    if (healthGeneralMatch) {
      return {
        category: "HEALTH_GENERAL",
        confidence: 0.85,
        extractedEntities: healthGeneralMatch,
        reasoning: "User is asking an objective health, fitness, or nutritional science question.",
      };
    }

    // 6. GENERAL (Non-health general knowledge, trivia, jokes, coding, everyday questions)
    return {
      category: "GENERAL",
      confidence: 0.8,
      extractedEntities: {},
      reasoning: "User is asking a general knowledge, trivia, joke, or everyday non-health question.",
    };
  }

  private static detectActionCommand(lower: string): Record<string, any> | null {
    // Relative target increase / decrease / reduce patterns (e.g. "Increase my daily water target by 500 ml", "Reduce my protein target by 20g", "Decrease my daily calorie target by 100 kcal")
    const relativeTargetMatch = lower.match(/\b(increase|decrease|reduce|raise|lower|boost|cut)\s+(my\s+)?(daily\s+)?(protein|calorie|calories|carbohydrate|carbohydrates|carb|carbs|fat|fats|fiber|fibers|water|hydration|step|steps|running|workout)\s+(target|goal|limit)?\s+(by\s+)?(\d[\d,]*)\s*(g|kcal|cal|ml|l|steps|km)?\b/i);
    if (relativeTargetMatch) {
      const isInc = ["increase", "raise", "boost"].includes(relativeTargetMatch[1].toLowerCase());
      const metric = relativeTargetMatch[4].toLowerCase();
      let val = parseInt(relativeTargetMatch[7].replace(/,/g, ""), 10);
      const unit = (relativeTargetMatch[8] || "").toLowerCase();
      if (unit.startsWith("l") && !unit.startsWith("lbs")) val = val * 1000;

      let targetKey = "calories";
      if (metric.includes("protein")) targetKey = "protein";
      else if (metric.includes("water") || metric.includes("hydration")) targetKey = "water";
      else if (metric.includes("carb")) targetKey = "carbs";
      else if (metric.includes("fat")) targetKey = "fat";
      else if (metric.includes("fiber")) targetKey = "fiber";
      else if (metric.includes("step")) targetKey = "steps";
      else if (metric.includes("run")) targetKey = "running";
      else if (metric.includes("workout")) targetKey = "workouts";

      return {
        actionType: "UPDATE_TARGET",
        targetKey,
        operation: isInc ? "INCREASE" : "DECREASE",
        targetValue: val,
      };
    }

    // Absolute Target change patterns (e.g. "Set my protein target to 140 g per day", "Change my carbohydrate target to 280 g per day", "Change my fiber target to 30 g per day")
    const targetChangeRegex =
      /\b(change|set|update|modify|switch)\s+(my\s+)?(daily\s+|weekly\s+)?(protein|calorie|calories|carbohydrate|carbohydrates|carb|carbs|fat|fats|fiber|fibers|water|hydration|step|steps|running|workout)\s+(target|goal|limit)?\s*(from\s+\d+\s*(?:sessions?|g|kcal|km|steps)?\s+to|to|=|\:)?\s*(\d[\d,]*)\s*(g|kcal|cal|ml|l|steps|km|sessions?)?\b/i;
    const matchTarget = lower.match(targetChangeRegex);
    if (matchTarget) {
      const metric = matchTarget[4].toLowerCase();
      let val = parseInt(matchTarget[7].replace(/,/g, ""), 10);
      const unit = (matchTarget[8] || "").toLowerCase();
      if (unit.startsWith("l") && !unit.startsWith("lbs")) val = val * 1000;

      let targetKey = "calories";
      if (metric.includes("protein")) targetKey = "protein";
      else if (metric.includes("water") || metric.includes("hydration")) targetKey = "water";
      else if (metric.includes("carb")) targetKey = "carbs";
      else if (metric.includes("fat")) targetKey = "fat";
      else if (metric.includes("fiber")) targetKey = "fiber";
      else if (metric.includes("step")) targetKey = "steps";
      else if (metric.includes("run")) targetKey = "running";
      else if (metric.includes("workout")) targetKey = "workouts";

      return {
        actionType: "UPDATE_TARGET",
        targetKey,
        operation: "SET",
        targetValue: val,
      };
    }

    // Hydration subtraction / removal patterns (e.g. "Remove 750 ml of water", "Subtract 500ml water", "Decrease water by 200ml")
    const hydrationSubMatch = lower.match(/\b(remove|subtract|decrease|minus|deduct|cut)\s+(\d+)\s*(ml|litres?|l)\s*(of\s*)?(water|pani|hydration|fluid)?\b/i) ||
      lower.match(/\b(remove|subtract|decrease|minus|deduct|cut)\s+(\d+)\s*(ml|litres?|l)\s*(from\s+)?(today'?s\s+)?(water|pani|hydration|intake)\b/i) ||
      lower.match(/\b(decrease|reduce)\s+(my\s+)?(water|hydration)\s+(by\s+)?(\d+)\s*(ml|litres?|l)?\b/i);
    if (hydrationSubMatch) {
      let val = parseInt(hydrationSubMatch[2] || hydrationSubMatch[5], 10);
      const unit = (hydrationSubMatch[3] || hydrationSubMatch[6] || "").toLowerCase();
      if (unit.startsWith("l")) val = val * 1000;
      return {
        actionType: "ADJUST_HYDRATION",
        operation: "SUBTRACT",
        targetValue: val,
      };
    }

    // Hydration absolute set / correction patterns (e.g. "Set today's water intake to 2000 ml", "Actually I drank 1800 ml, not 2300 ml", "Correct today's water to 1800ml")
    const setPattern1 = lower.match(/\b(?:set|replace|change|correct)\s+(?:today'?s\s+)?(?:water|hydration|intake)\s+(?:intake\s+)?(?:to|=|\:)?\s*(\d+)\s*(ml|litres?|l)?\b/i);
    const setPattern2 = lower.match(/\bactually\s+(?:i\s+)?(?:drank|had)\s+(\d+)\s*(ml|litres?|l)?(?:\s*,\s*not\s+\d+\s*(?:ml|litres?|l)?)?\b/i);
    const setMatch = setPattern1 || setPattern2;
    if (setMatch) {
      let val = parseInt(setMatch[1], 10);
      const unit = (setMatch[2] || "").toLowerCase();
      if (unit.startsWith("l")) val = val * 1000;
      return {
        actionType: "ADJUST_HYDRATION",
        operation: "SET",
        targetValue: val,
      };
    }

    // Hydration addition logging patterns (e.g. "I drank 500ml water", "Add 750ml water", "drank 1L water")
    const hydrationMatch = lower.match(/\b(drank|drink|had|logged|consumed|add)\s+(\d+)\s*(ml|litres?|l)\s*(of\s*)?(water|pani)?\b/i) ||
      lower.match(/\b(\d+)\s*(ml|litres?|l)\s*(of\s*)?(water|pani)\b/i);
    if (hydrationMatch) {
      let val = parseInt(hydrationMatch[2] || hydrationMatch[1], 10);
      const unit = (hydrationMatch[3] || hydrationMatch[2] || "").toLowerCase();
      if (unit.startsWith("l")) val = val * 1000;
      return {
        actionType: "LOG_HYDRATION",
        operation: "ADD",
        targetValue: val,
      };
    }

    // Nutrition subtraction / correction patterns (e.g. "Remove 10g protein", "Correct today's calories to 1800")
    const nutritionAdjustMatch = lower.match(/\b(remove|subtract|decrease|minus|deduct)\s+(\d+)\s*(g|kcal|cal)?\s*(of\s*)?(protein|calories|carbs|fat|fiber)\b/i) ||
      lower.match(/\b(correct|set)\s+(today'?s\s+)?(calories|protein|carbs|fat|fiber)\s+(to|=|\:)?\s*(\d+)\s*(g|kcal|cal)?\b/i);
    if (nutritionAdjustMatch) {
      const isSub = ["remove", "subtract", "decrease", "minus", "deduct"].includes((nutritionAdjustMatch[1] || "").toLowerCase());
      const metric = (nutritionAdjustMatch[5] || nutritionAdjustMatch[3] || "").toLowerCase();
      const val = parseInt(nutritionAdjustMatch[2] || nutritionAdjustMatch[5], 10);
      return {
        actionType: "ADJUST_NUTRITION",
        operation: isSub ? "SUBTRACT" : "SET",
        targetKey: metric,
        targetValue: val,
      };
    }

    // Running / Activity logging patterns (e.g. "I ran 5km in 28 mins", "walked 3 km")
    const runMatch = lower.match(/\b(i\s+)?(ran|walked|jogged|cycled|swam|run|running)\s+(\d+(\.\d+)?)\s*(km|miles?|k)\b/i);
    if (runMatch) {
      return {
        actionType: "LOG_ACTIVITY",
        targetValue: parseFloat(runMatch[3]),
      };
    }

    // Meal / Food logging statements (e.g. "I ate 4 rotis", "I had 2 boiled eggs and 1 slice toast")
    const isQuestionSentence = /^(why|how|what|is|does|can|am i|are|should|will|do)\b/i.test(lower) || lower.includes("?") || lower.includes("even when") || lower.includes("better to") || lower.includes("why might");
    if (!isQuestionSentence) {
      const mealMatch = lower.match(/\b(i\s+)?(ate|had|consumed|eaten)\s+(.+)\b/i);
      if (mealMatch && !lower.includes("should i") && !lower.includes("can i") && !lower.includes("what if i ate")) {
        return {
          actionType: "LOG_MEAL",
          foodName: mealMatch[3],
        };
      }
    }

    // Explicit command logging patterns
    if (
      (lower.startsWith("log ") ||
        lower.startsWith("add ") ||
        lower.startsWith("record ") ||
        lower.includes("log this for") ||
        lower.includes("log it as") ||
        lower.includes("add to my")) &&
      !lower.includes("how to log") &&
      !lower.includes("should i log")
    ) {
      return {
        actionType: "LOG_ITEM",
      };
    }

    // Weight update patterns (e.g. "update weight to 56kg", "my weight is 56 kg")
    const weightMatch = lower.match(/\b(update|set|change|my)\s+(current\s+)?(weight\s+is|weight)\s+(to|=|\:)?\s*(\d+(\.\d+)?)\s*(kg|lbs)?\b/i) ||
      lower.match(/\b(weigh|weighed)\s+(\d+(\.\d+)?)\s*(kg|lbs)?\b/i);
    if (weightMatch) {
      const val = parseFloat(weightMatch[5] || weightMatch[2]);
      return {
        actionType: "UPDATE_WEIGHT",
        targetValue: val,
      };
    }

    // Height update patterns (e.g. "My height is 175 cm, not 164 cm. Update it.", "I'm 175 cm tall")
    const heightMatch = lower.match(/\b(?:height\s+(?:is|to|=|\:)\s*|i'?m\s+)(\d+(\.\d+)?)\s*(?:cm|cms|meters?|m|feet|ft|inches|in)?/i) ||
      lower.match(/\bheight\s+(\d+(\.\d+)?)\s*(?:cm|cms)?/i);
    if (heightMatch && (lower.includes("height") || lower.includes("tall") || lower.includes("cm"))) {
      const val = parseFloat(heightMatch[1]);
      return {
        actionType: "UPDATE_PROFILE",
        targetKey: "heightCm",
        targetValue: val,
      };
    }

    // Primary Goal update patterns (e.g. "Change my primary goal from maintaining my weight to muscle gain", "my goal is muscle gain")
    const goalMatch = lower.match(/\b(?:primary\s+)?goal\s+(?:from\s+[a-z\s]+\s+to|is|to|=|\:)\s*(muscle\s+gain|hypertrophy|weight\s+loss|fat\s+loss|maintenance|maintain|endurance|running|general\s+fitness)\b/i);
    if (goalMatch) {
      const rawGoal = goalMatch[1].toLowerCase();
      let goalCode = "MAINTENANCE";
      if (rawGoal.includes("muscle") || rawGoal.includes("hypertrophy")) goalCode = "MUSCLE_GAIN";
      else if (rawGoal.includes("loss") || rawGoal.includes("fat")) goalCode = "WEIGHT_LOSS";
      else if (rawGoal.includes("endurance") || rawGoal.includes("running")) goalCode = "ENDURANCE";

      return {
        actionType: "UPDATE_PROFILE",
        targetKey: "primaryGoal",
        targetValue: goalCode,
      };
    }

    return null;
  }

  private static detectDataQuery(lower: string): Record<string, any> | null {
    // Queries asking what they SHOULD eat/target/drink are personalized recommendation queries, not database log retrieval
    if (/\b(should i|do i need|should we|how much (protein|calorie|calories|water|fat|carbs) (should|to|do i need)|ideal for me|recommend for me)\b/i.test(lower)) {
      return null;
    }

    const isDataQueryRegex =
      /\b(how much (did i|have i|was|is logged)|what did i|what was my|show my|show me my|check my|my logged|did i hit|my intake|my progress|did i log|how many (calories|steps|ml|g) (did i|have i|logged)|what did i eat|my nutrition today|my macros today|today's nutrition)\b/i;

    if (!isDataQueryRegex.test(lower)) return null;

    let metric = "general";
    if (/\b(protein)\b/i.test(lower)) metric = "protein";
    else if (/\b(calorie|calories|kcal)\b/i.test(lower)) metric = "calories";
    else if (/\b(water|hydration|fluid|ml)\b/i.test(lower)) metric = "hydration";
    else if (/\b(carb|carbs|carbohydrates)\b/i.test(lower)) metric = "carbs";
    else if (/\b(fat|fats)\b/i.test(lower)) metric = "fat";
    else if (/\b(vitamin|mineral|iron|zinc|magnesium|calcium|b12|micronutrient|deficiency)\b/i.test(lower))
      metric = "micronutrients";
    else if (/\b(step|steps|distance|km|running|pace)\b/i.test(lower)) metric = "movement";
    else if (/\b(workout|workouts|tonnage|sets|volume)\b/i.test(lower)) metric = "workouts";

    let timeframe = "today";
    if (lower.includes("yesterday")) timeframe = "yesterday";
    else if (lower.includes("this week") || lower.includes("weekly")) timeframe = "week";
    else if (lower.includes("last 30 days") || lower.includes("monthly")) timeframe = "month";

    return {
      metric,
      timeframe,
    };
  }

  private static detectPersonalizedHealth(lower: string): Record<string, any> | null {
    const personalQuestionsRegex =
      /\b(am i (eating|getting|having|doing|running|progressing|on track)|should i (increase|decrease|eat|change|do|take)|why am i (feeling|so tired|exhausted|gaining|losing)|what should i eat (today|tomorrow|next)|for my (body|goal|training|diet)|recommend a meal for me|plan my week|analyze my (diet|nutrition|runs|recovery|intake))\b/i;

    if (personalQuestionsRegex.test(lower)) {
      return { isPersonalized: true };
    }

    if (
      (lower.includes("for me") || lower.includes("my diet") || lower.includes("my goals") || lower.includes("my plan")) &&
      (lower.includes("protein") || lower.includes("calorie") || lower.includes("workout") || lower.includes("recovery"))
    ) {
      return { isPersonalized: true };
    }

    return null;
  }

  private static detectCasualChat(lower: string): boolean {
    const casualTriggers = [
      "how are you",
      "how's it going",
      "how do you do",
      "what's up",
      "whats up",
      "good morning",
      "good afternoon",
      "good evening",
      "good night",
      "hello coach",
      "hi coach",
      "hey coach",
      "i'm tired",
      "im tired",
      "i feel lazy",
      "feeling lazy",
      "i feel demotivated",
      "demotivated",
      "i failed my workout",
      "skipped my workout",
      "thank you",
      "thanks coach",
      "who are you",
      "what can you do",
      "im feeling great",
      "i'm feeling great",
      "just checking in",
    ];

    if (lower === "hi" || lower === "hello" || lower === "hey" || lower === "yo") return true;

    return casualTriggers.some((t) => lower.includes(t));
  }

  private static detectGeneralHealth(lower: string): Record<string, any> | null {
    const healthScienceTerms = [
      "post-workout",
      "post workout",
      "pre-workout",
      "pre workout",
      "muscle breakdown",
      "muscle repair",
      "recovery",
      "protein",
      "nutrition",
      "recipe",
      "snack",
      "diet",
      "meal",
      "coffee",
      "caffeine",
      "creatine",
      "whey",
      "protein powder",
      "weight loss",
      "lose weight",
      "fat loss",
      "burn fat",
      "burn calories",
      "build muscle",
      "hypertrophy",
      "sleep",
      "insomnia",
      "hydration",
      "electrolytes",
      "running every day",
      "zone 2",
      "vo2 max",
      "heart rate",
      "intermittent fasting",
      "keto",
      "vegan",
      "vegetarian",
      "soreness",
      "doms",
      "stretching",
      "injury prevention",
      "metabolism",
      "bmr",
      "tdee",
      "glycogen",
      "insulin",
      "cardio vs lifting",
      "chilla",
      "eggs",
      "oatmeal",
      "cottage cheese",
      "paneer",
      "tofu",
      "dal",
    ];

    const hasHealthTerm = healthScienceTerms.some((term) => lower.includes(term));
    if (hasHealthTerm) {
      return { containsHealthTerm: true };
    }

    return null;
  }
}
