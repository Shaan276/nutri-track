/**
 * Nutri-Track Grouped Initial Health Assessment Generator (Layer 1)
 * Generates an intelligent, grouped prompt for ChatGPT to conduct the 7-part health intake.
 */

export interface AssessmentPromptOptions {
  userName?: string;
  hasExistingProfile?: boolean;
}

export function generateChatGPTAssessmentPrompt(options: AssessmentPromptOptions = {}): string {
  const name = options.userName || "me";

  return `Hey Coach! I am ready to start my comprehensive Nutri-Track Initial Health Assessment.

Please guide ${name} through this assessment in a friendly, conversational, and grouped manner. Group your questions into logical sections rather than asking dozens of tiny one-off questions:

### SECTION 1: BASIC PROFILE & PHYSICAL ATTRIBUTES
- Age
- Biological Sex (for metabolic BMR calculations)
- Height (cm or ft/in)
- Current Weight (kg or lbs)

### SECTION 2: PRIMARY GOALS & TIMELINE
- Primary Goal(s): Fat loss, Muscle gain, Body recomposition, Running performance, General fitness, Strength, or Weight maintenance.
- Target weight or performance pace (e.g. 5k/10k running target), if applicable.
- Desired timeline / horizon and priority ranking if multiple goals exist.

### SECTION 3: LIFESTYLE & DAILY MOVEMENT
- Occupation / Daily Routine (Student / Desk job / Active work / Other)
- Daily non-exercise movement (Walking, commute, stairs, active hours)
- Typical sleep duration and schedule
- Current stress level

### SECTION 4: LIVING ARRANGEMENT & MEAL PREDICTABILITY (Important!)
- Living situation: Living alone, with family, in a hostel / college dorm, or other.
- Meal control: Do you cook your own meals, eat at a mess/cafeteria, or eat family-cooked meals?
- Practical constraints: Household cleaning/chores activity, grocery budget, food storage (fridge/kitchen access).

### SECTION 5: TRAINING & EXERCISE
- Running experience, weekly distance target (km/miles), and usual pace.
- Gym resistance training, home workouts, or other sports.
- Training frequency (days per week) and any existing joint or muscle limitations/injuries.

### SECTION 6: FOOD PREFERENCES & PRACTICAL NUTRITION
- Dietary pattern: Vegetarian, Non-vegetarian, Vegan, Eggetarian, etc.
- Allergies, intolerances, or strongly disliked foods.
- Access to primary protein sources (whey, paneer, tofu, eggs, chicken, soya, legumes).
- Cooking comfort and typical daily meal frequency (2 meals, 3 meals, snacks).

### SECTION 7: HEALTH & RECOVERY CONTEXT
- Hydration habits (approximate daily water intake).
- Recovery factors or caffeine intake (coffee/tea).
- Relevant health context necessary for safe fitness planning.

---

### AFTER GATHERING THIS INFORMATION:
Please provide:
1. **Summary of Understanding**: Key strengths and practical lifestyle challenges.
2. **Personalized Blueprint Proposal**:
   - Daily Calories (kcal)
   - Protein Target (g)
   - Carbohydrates Target (g)
   - Fat Target (g)
   - Fiber Target (g)
   - Daily Hydration Goal (ml)
   - Daily Step Target
   - Weekly Running Target (km) & Workout Frequency (sessions/week)
3. **Structured NUTRI-TRACK ACTION Block**: Provide a versioned \`UPDATE_GOALS\` JSON block so ${name} can easily paste and apply these personalized targets into Nutri-Track!`;
}
