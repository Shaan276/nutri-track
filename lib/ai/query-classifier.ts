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
    // Target change patterns
    const targetChangeRegex =
      /\b(change|set|update|modify|increase|decrease|switch)\s+(my\s+)?(daily\s+)?(protein|calorie|calories|carb|carbs|fat|fats|water|hydration|step|steps|running|workout)\s+(target|goal|limit)?\s*(to|=|\:)?\s*(\d+)\s*(g|kcal|cal|ml|l|steps|km)?\b/i;
    const matchTarget = lower.match(targetChangeRegex);
    if (matchTarget) {
      const metric = matchTarget[4].toLowerCase();
      const val = parseInt(matchTarget[7], 10);
      let targetKey = "calories";
      if (metric.includes("protein")) targetKey = "protein";
      else if (metric.includes("water") || metric.includes("hydration")) targetKey = "water";
      else if (metric.includes("carb")) targetKey = "carbs";
      else if (metric.includes("fat")) targetKey = "fat";
      else if (metric.includes("step")) targetKey = "steps";
      else if (metric.includes("run")) targetKey = "running";
      else if (metric.includes("workout")) targetKey = "workouts";

      return {
        actionType: "UPDATE_TARGET",
        targetKey,
        targetValue: val,
      };
    }

    // Log meal / food patterns
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

    // Weight update patterns
    const weightMatch = lower.match(/\b(update|set|change)\s+(my\s+)?weight\s+(to|=|\:)?\s*(\d+(\.\d+)?)\s*(kg|lbs)?\b/i);
    if (weightMatch) {
      return {
        actionType: "UPDATE_WEIGHT",
        targetValue: parseFloat(weightMatch[4]),
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
