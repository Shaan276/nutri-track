/**
 * Nutri-Track Intelligent Initial Health Assessment Generator (Layer 1)
 *
 * Generates an intelligent, grouped prompt for the user's ChatGPT Health Coach.
 *
 * Core Rules:
 * 1. Checks existing Nutri-Track data provenance (CONFIRMED vs UNVERIFIED vs MISSING).
 * 2. Skips/acknowledges confirmed data so the coach doesn't ask unnecessary questions.
 * 3. Asks user to confirm unverified / pre-filled estimates.
 * 4. Naturally collects missing information across 7 conversational sections.
 */

export interface AssessmentPromptOptions {
  userName?: string;
  confirmedItems?: {
    heightCm?: number | null;
    weightKg?: number | null;
    biologicalSex?: string | null;
    age?: number | null;
    primaryGoal?: string | null;
  };
  unverifiedItems?: {
    heightCm?: number | null;
    weightKg?: number | null;
    biologicalSex?: string | null;
  };
  missingItems?: string[];
  savedMemories?: Array<{ category: string; content: string }>;
}

export function generateChatGPTAssessmentPrompt(options: AssessmentPromptOptions = {}): string {
  const name = options.userName || "me";

  const confirmedList: string[] = [];
  if (options.confirmedItems?.heightCm) confirmedList.push(`Height: ${options.confirmedItems.heightCm} cm`);
  if (options.confirmedItems?.weightKg) confirmedList.push(`Weight: ${options.confirmedItems.weightKg} kg`);
  if (options.confirmedItems?.biologicalSex) confirmedList.push(`Biological Sex: ${options.confirmedItems.biologicalSex}`);
  if (options.confirmedItems?.age) confirmedList.push(`Age: ${options.confirmedItems.age}`);
  if (options.confirmedItems?.primaryGoal) confirmedList.push(`Primary Goal: ${options.confirmedItems.primaryGoal}`);

  const unverifiedList: string[] = [];
  if (options.unverifiedItems?.heightCm) unverifiedList.push(`Height: ${options.unverifiedItems.heightCm} cm`);
  if (options.unverifiedItems?.weightKg) unverifiedList.push(`Weight: ${options.unverifiedItems.weightKg} kg`);
  if (options.unverifiedItems?.biologicalSex) unverifiedList.push(`Biological Sex: ${options.unverifiedItems.biologicalSex}`);

  const parts: string[] = [];

  parts.push(`Hey Coach! I am ready to start my comprehensive Nutri-Track Initial Health Assessment.`);
  parts.push(`\nPlease guide ${name} through this assessment in a friendly, conversational, and grouped manner.`);

  if (confirmedList.length > 0) {
    parts.push(`\n### CURRENT CONFIRMED DATA (Do NOT re-ask; acknowledge as already known):`);
    confirmedList.forEach((item) => parts.push(`- [CONFIRMED] ${item}`));
  }

  if (unverifiedList.length > 0) {
    parts.push(`\n### UNVERIFIED / ESTIMATED DATA (Please ask ${name} to confirm or correct):`);
    unverifiedList.forEach((item) => parts.push(`- [UNVERIFIED] ${item}`));
  }

  parts.push(`\n### 7-SECTION CONVERSATIONAL INTAKE ROADMAP:`);
  parts.push(`Please guide the conversation through these logical sections (group questions together so it feels like a natural conversation, not an interrogation):

**SECTION 1 — Confirm Your Basics**
- Age, Biological Sex, Height, and Current Weight (Acknowledge confirmed values above, verify any unverified ones, and ask for any that are missing).

**SECTION 2 — Goals & Timeline**
- Primary Goal (Fat loss, Muscle gain, Maintenance, Recomposition, Running endurance, Strength).
- Target weight or performance milestone (e.g., 5k/10k target pace).
- Target timeline and priority ranking.

**SECTION 3 — Daily Lifestyle & Routine**
- Occupation / Daily routine (Desk job, student, active on feet).
- Daily non-exercise movement (Walking, commute, active hours).
- Sleep duration and typical schedule; daily stress level.

**SECTION 4 — Living Situation & Food Reality (Crucial)**
- Living arrangement: Alone, with family, in a hostel / dorm, or other.
- Meal control: Cooking own meals, mess/cafeteria food, family meals.
- Practical constraints: Kitchen/fridge access, food budget, cooking comfort.

**SECTION 5 — Training & Exercise**
- Running experience, weekly distance target (km/miles), and typical pace.
- Resistance training (gym or home), frequency (days/week), and any joint limitations/injuries.

**SECTION 6 — Food Preferences & Nutrition Pattern**
- Dietary pattern: Vegetarian, Non-vegetarian, Vegan, Eggetarian.
- Food allergies, intolerances, or strongly disliked foods.
- Access to primary protein sources (whey, paneer, tofu, eggs, chicken, soya, legumes).
- Typical meal frequency (2 meals, 3 meals, snacks).

**SECTION 7 — Hydration & Recovery Context**
- Daily water intake habits.
- Caffeine intake (coffee/tea) and recovery factors.

---

### AFTER THE CONVERSATION:
1. **Summary of Understanding**: Synthesize ${name}'s lifestyle, strengths, and practical constraints.
2. **Personalized Blueprint Proposal**:
   - Daily Calories (kcal)
   - Protein Target (g)
   - Carbohydrates Target (g)
   - Fat Target (g)
   - Fiber Target (g)
   - Daily Hydration Goal (ml)
   - Daily Step Target
   - Weekly Running Target (km) & Workout Frequency (sessions/week)
3. **Structured NUTRI-TRACK ACTION Block**: Provide a versioned \`UPDATE_GOALS\` JSON block so ${name} can easily apply these targets to Nutri-Track!`);

  return parts.join("\n");
}
