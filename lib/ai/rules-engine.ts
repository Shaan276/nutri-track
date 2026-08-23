import { SystemSettingsService } from "@/lib/services/admin/system-settings.service";
import { prisma } from "@/lib/db";

export interface DynamicAgeInfo {
  years: number;
  days: number;
  formatted: string;
}

export interface PersonalizedGoalRules {
  goalCategory: string;
  primaryRules: string[];
  ayurvedaFocus: string;
  modernScienceFocus: string;
}

export class AIRulesEngine {
  /**
   * Calculates user's exact age in years and days dynamically on every request
   * Automatically advances 1 day older every single day!
   */
  static calculateDynamicAge(
    dobString?: string | Date | null,
    createdAt?: Date | null
  ): DynamicAgeInfo | null {
    if (!dobString) return null;
    const birthDate = new Date(dobString);
    if (isNaN(birthDate.getTime())) return null;

    const now = new Date();

    let years = now.getFullYear() - birthDate.getFullYear();
    let birthThisYear = new Date(now.getFullYear(), birthDate.getMonth(), birthDate.getDate());

    if (now < birthThisYear) {
      years--;
      birthThisYear = new Date(now.getFullYear() - 1, birthDate.getMonth(), birthDate.getDate());
    }

    const diffTime = Math.max(0, now.getTime() - birthThisYear.getTime());
    const days = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    return {
      years: Math.max(0, years),
      days,
      formatted: `${years} years, ${days} days old`,
    };
  }

  static async getGeneralAIRules(): Promise<string> {
    const defaultRules = `1. Short, Point-Wise & Maximum Emojis: Always keep answers concise, short, and structured in punchy bullet points (zero long paragraphs), using maximum lively and fun emojis (🥗, 🍗, 🏃‍♂️, ✨, 💪, 💧, 🌿, 🔬, ⚡, 🥑, 🥞, 🌟).
2. Ayurveda-First Priority: Always prioritize authentic Ayurvedic principles first (Ahara Rasas/6 tastes, Agni/digestive fire, Dosha balance: Vata/Pitta/Kapha, Viruddha Ahara/incompatible foods, and seasonal eating/Ritucharya), followed immediately by modern evidence-based sports & nutritional science.
3. Exact Nutritional Data: Always calculate and output specific calories, protein (g), carbs (g), fats (g), key minerals (Iron, Calcium, Potassium, Magnesium, Zinc), and vitamins in crisp bullet points with every meal recommendation or recipe log.
4. Holistic Recovery & Hydration: Integrate hydration balance, electrolyte replenishment, and active recovery routines.`;

    try {
      return await SystemSettingsService.getSetting("GENERAL_AI_RULES", defaultRules);
    } catch {
      return defaultRules;
    }
  }

  /**
   * Retrieves user's personal rule overrides for their email only
   */
  static async getUserCustomRules(userId: string): Promise<string | null> {
    try {
      const memory = await (prisma as any).aiMemory.findFirst({
        where: {
          userId,
          category: "CONSTRAINT",
          content: { startsWith: "[USER_CUSTOM_RULE_OVERRIDE]:" },
        },
      });

      if (memory) {
        return memory.content.replace("[USER_CUSTOM_RULE_OVERRIDE]:", "").trim();
      }
    } catch {}
    return null;
  }

  /**
   * Saves user's personal rule overrides for their email only
   */
  static async saveUserCustomRules(userId: string, customRules: string): Promise<void> {
    const prefix = "[USER_CUSTOM_RULE_OVERRIDE]:";
    const existing = await (prisma as any).aiMemory.findFirst({
      where: {
        userId,
        category: "CONSTRAINT",
        content: { startsWith: prefix },
      },
    });

    if (customRules.trim().length === 0) {
      if (existing) {
        await (prisma as any).aiMemory.delete({ where: { id: existing.id } });
      }
      return;
    }

    if (existing) {
      await (prisma as any).aiMemory.update({
        where: { id: existing.id },
        data: { content: `${prefix} ${customRules.trim()}` },
      });
    } else {
      await (prisma as any).aiMemory.create({
        data: {
          userId,
          category: "CONSTRAINT",
          content: `${prefix} ${customRules.trim()}`,
          importance: 3,
        },
      });
    }
  }

  /**
   * Generates goal-specific personalized rules for Weight Loss, Muscle Gain, Balanced Weight, etc.
   */
  static getPersonalizedGoalRules(goalType?: string | null): PersonalizedGoalRules {
    const normalized = (goalType || "GENERAL_HEALTH").toUpperCase();

    if (normalized.includes("LOSS") || normalized.includes("CUT") || normalized.includes("DEFICIT")) {
      return {
        goalCategory: "WEIGHT LOSS & FAT LOSS",
        primaryRules: [
          "Caloric Deficit: Maintain an optimal 300-500 kcal deficit while keeping protein high (1.6-2.0g/kg) to protect lean muscle mass.",
          "Satiety & Volume: Prioritize high-fiber complex carbohydrates (oats, brown rice, millets, veggies) and high volume foods.",
          "Circadian Meal Timing: Finish evening dinner by 7:30 PM to optimize overnight lipid oxidation and glycemic control.",
        ],
        ayurvedaFocus:
          "Kapha-Balancing: Favor light, warm, and dry foods with pungent, bitter, and astringent tastes (Ginger, Cumin, Mustard, Moong dal). Avoid heavy cold dairy, oily foods, and late-night snacking.",
        modernScienceFocus:
          "Thermic Effect of Food (TEF): Emphasize lean protein distribution across 3-4 meals to maximize satiety hormones (GLP-1, PYY) and metabolic expenditure.",
      };
    }

    if (normalized.includes("GAIN") || normalized.includes("BUILD") || normalized.includes("MUSCLE") || normalized.includes("HYPERTROPHY")) {
      return {
        goalCategory: "MUSCLE GAIN & HYPERTROPHY",
        primaryRules: [
          "Caloric Surplus: Maintain a modest 250-400 kcal lean surplus with 1.8-2.2g protein/kg to fuel muscle protein synthesis.",
          "Nutrient Timing: Consume 25-40g high-quality protein every 3-4 hours and within 45 minutes post-workout.",
          "Glycogen Fueling: Consume complex carbs pre-workout for training intensity and post-workout for glycogen replenishment.",
        ],
        ayurvedaFocus:
          "Dhatu Building & Pitta/Vata Balancing: Favor nourishing, strengthening foods (Ghee in moderation, Almonds, Paneer, Tofu, Ashwagandha, Moong dal, Bananas). Maintain strong Agni without aggravating Pitta.",
        modernScienceFocus:
          "Hypertrophy Synergy: Maintain positive nitrogen balance with rich leucine-rich amino acid profiles and progressive resistance training volume.",
      };
    }

    if (normalized.includes("RUN") || normalized.includes("ENDURANCE") || normalized.includes("MARATHON")) {
      return {
        goalCategory: "RUNNING & ATHLETIC PERFORMANCE",
        primaryRules: [
          "Carb Periodization: Scale carbohydrate intake (4-7g/kg) based on daily mileage and tempo intensity.",
          "Electrolyte & Hydration: Replenish Sodium, Potassium, and Magnesium before and after high-sweat running sessions.",
          "Post-Run Recovery: 3:1 Carbohydrate-to-Protein recovery window within 30 minutes of distance runs.",
        ],
        ayurvedaFocus:
          "Vata Balancing & Joint Mobility: Favor warm, lubricating, unctuous foods (Warm sesame oil/ghee, Soups, Golden Turmeric Milk) to reduce Vata dryness and joint inflammation from running impact.",
        modernScienceFocus:
          "Mitochondrial Efficiency & Glycogen Replenishment: Optimize endurance VO2 max recovery with antioxidant-rich berries, iron synergy (Vitamin C + plant iron), and hydration tracking.",
      };
    }

    // Default: Balanced Weight / Maintenance / General Health
    return {
      goalCategory: "BALANCED WEIGHT & HOMEOSTASIS",
      primaryRules: [
        "Metabolic Balance: Match caloric intake to Total Daily Energy Expenditure (TDEE) with balanced macronutrient distribution (50% carbs, 25% protein, 25% healthy fats).",
        "Micronutrient Density: Ensure 100% daily RDA coverage for Iron, Calcium, Potassium, Magnesium, Zinc, and Vitamins A, C, D, B12.",
        "Consistent Hydration: 35-40ml water per kg body weight daily.",
      ],
      ayurvedaFocus:
        "Tridoshic Balance & Ritucharya: Incorporate all 6 Ahara Rasas (Sweet, Sour, Salty, Pungent, Bitter, Astringent) in main meals. Eat seasonally according to local climate and natural body rhythms.",
      modernScienceFocus:
        "Cellular Longevity & Gut Microbiome: Consume 30+ diverse plant varieties weekly to support gut diversity, immune resilience, and cardiovascular health.",
    };
  }

  /**
   * Assembles the complete AI Rules System Prompt chunk
   */
  static async buildAIRulesPrompt(
    userId: string,
    goalType?: string | null,
    dobString?: string | Date | null,
    userCreatedAt?: Date | null
  ): Promise<string> {
    const dynamicAge = this.calculateDynamicAge(dobString, userCreatedAt);
    const generalRules = await this.getGeneralAIRules();
    const userCustomRules = await this.getUserCustomRules(userId);
    const goalRules = this.getPersonalizedGoalRules(goalType);

    let prompt = `
[AI GOVERNANCE & COACHING RULES ENGINE]:
• USER DYNAMIC AGE TODAY: ${dynamicAge ? `${dynamicAge.formatted} (Calculated live down to the exact day; naturally increments daily)` : "Not provided yet (Pending user entry)"}
• PRIMARY TARGET FOCUS: ${goalRules.goalCategory}

[GENERAL AI RULES (ADMIN CONFIGURED & SYSTEM-WIDE)]:
${generalRules}
`;

    if (userCustomRules) {
      prompt += `
[USER'S PERSONALIZED RULE OVERRIDES (ACTIVE FOR THIS USER)]:
${userCustomRules}
`;
    }

    prompt += `
[PERSONALIZED GOAL RULES (${goalRules.goalCategory})]:
${goalRules.primaryRules.map((r, i) => `${i + 1}. ${r}`).join("\n")}
• Ayurvedic Focus: ${goalRules.ayurvedaFocus}
• Modern Science Focus: ${goalRules.modernScienceFocus}
`;

    return prompt;
  }
}
