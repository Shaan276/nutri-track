import { QueryCategory } from "./query-classifier";

export interface ValidationResult {
  isValid: boolean;
  reason?: string;
  correctionPrompt?: string;
}

export class AIResponseValidator {
  /**
   * Validates that the generated AI Coach response is relevant, de-templatized,
   * does not inject unsolicited boilerplate, and answers what the user actually asked.
   */
  public static validateResponseQuality(
    category: QueryCategory,
    userPrompt: string,
    responseContent: string,
    recentAssistantMessages: string[] = []
  ): ValidationResult {
    const promptLower = (userPrompt || "").toLowerCase().trim();
    const replyLower = (responseContent || "").toLowerCase().trim();

    if (!responseContent || responseContent.trim().length < 3) {
      return {
        isValid: false,
        reason: "Generated response was empty or excessively short.",
        correctionPrompt: "Provide a complete, helpful, and direct answer to the user's latest query.",
      };
    }

    // 1. Detect Generic Boilerplate / Static Template Signatures
    const bannedTemplatePhrases = [
      "i've analyzed your question regarding",
      "i've noted your question regarding",
      "evidence-based nutrition & training:\n• maintain balanced daily macronutrient proportions",
      "ayurvedic lifestyle synergy:\n• align your largest meals with your peak digestive fire",
      "would you like me to log a meal for you, adjust your daily macro targets",
    ];

    for (const phrase of bannedTemplatePhrases) {
      if (replyLower.includes(phrase)) {
        return {
          isValid: false,
          reason: `Detected deprecated static template header: "${phrase}"`,
          correctionPrompt:
            "Answer the user's latest question directly and naturally. Do not use generic template headers, and do not append unsolicited meal-logging or lifestyle templates.",
        };
      }
    }

    // 2. GENERAL & CASUAL Question Quality Check: Must NOT dump unsolicited health, calories, protein, or food logs
    if (category === "GENERAL" || category === "CASUAL_CHAT") {
      const containsUnsolicitedHealth =
        /\b(calories|protein|hydration|tdee|bmr|macros|carbohydrates|ayurveda|dosha|meal log)\b/i.test(
          replyLower
        ) &&
        !/\b(calories|protein|nutrition|health|food|diet|workout|exercise|water|macro)\b/i.test(promptLower);

      if (containsUnsolicitedHealth) {
        return {
          isValid: false,
          reason: "General or casual query received an unsolicited health/macro lecture.",
          correctionPrompt:
            category === "CASUAL_CHAT"
              ? "Respond naturally and warmly to the user's message. Do NOT force nutrition numbers or macro targets into casual conversation."
              : "Answer the user's general question directly and concisely. Do NOT mention nutrition, calories, protein, hydration, health scores, or food logging.",
        };
      }
    }

    // 3. HEALTH_GENERAL Question Quality Check: Must answer the specific topic directly first
    if (category === "HEALTH_GENERAL") {
      if (promptLower.includes("coffee") && !replyLower.includes("coffee") && !replyLower.includes("caffeine")) {
        return {
          isValid: false,
          reason: "Question about coffee did not address coffee/caffeine directly.",
          correctionPrompt:
            "Directly explain the physiological effects of black coffee / caffeine on weight loss, energy expenditure, and calorie deficit without boilerplate.",
        };
      }

      if (promptLower.includes("creatine") && !replyLower.includes("creatine")) {
        return {
          isValid: false,
          reason: "Question about creatine did not address creatine directly.",
          correctionPrompt: "Directly answer whether creatine is safe and explain its mechanisms and benefits.",
        };
      }

      if (promptLower.includes("running every day") && !replyLower.includes("run") && !replyLower.includes("recovery")) {
        return {
          isValid: false,
          reason: "Question about running daily did not address running frequency/recovery.",
          correctionPrompt: "Directly address whether running every day is good, covering recovery and training load.",
        };
      }

      if (
        (promptLower.includes("post-workout") || promptLower.includes("muscle breakdown")) &&
        !replyLower.includes("protein") &&
        !replyLower.includes("recovery")
      ) {
        return {
          isValid: false,
          reason: "Question about post-workout nutrition did not address protein and recovery.",
          correctionPrompt: "Directly explain the optimal post-workout protein and carbohydrate intake to prevent muscle breakdown.",
        };
      }
    }

    // 4. Repetition Detection against immediately preceding assistant responses
    for (const pastReply of recentAssistantMessages.slice(-3)) {
      if (pastReply && pastReply.trim().length > 30) {
        const similarity = this.calculateSimilarity(pastReply, responseContent);
        if (similarity > 0.75) {
          return {
            isValid: false,
            reason: `Generated response is ${(similarity * 100).toFixed(0)}% identical to a recent assistant reply.`,
            correctionPrompt:
              "Generate a fresh, unique, and directly tailored answer specifically addressing the user's prompt without reusing past phrasing.",
          };
        }
      }
    }

    return { isValid: true };
  }

  /**
   * Calculates word Jaccard similarity index between two strings
   */
  private static calculateSimilarity(str1: string, str2: string): number {
    const tokenize = (s: string) =>
      new Set(
        s
          .toLowerCase()
          .replace(/[^\w\s]/g, "")
          .split(/\s+/)
          .filter((w) => w.length > 2)
      );

    const set1 = tokenize(str1);
    const set2 = tokenize(str2);

    const list1 = Array.from(set1);
    const list2 = Array.from(set2);

    if (list1.length === 0 || list2.length === 0) return 0;

    let intersectionCount = 0;
    list1.forEach((item) => {
      if (set2.has(item)) intersectionCount++;
    });

    const unionCount = new Set(list1.concat(list2)).size;
    return unionCount === 0 ? 0 : intersectionCount / unionCount;
  }
}
