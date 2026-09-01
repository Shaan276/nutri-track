import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AIClient } from "@/lib/ai/ai-client";

export const dynamic = "force-dynamic";

/**
 * POST /api/ai/quick-log/parse
 * Fast, reliable parsing of natural language logging inputs (meals, hydration, workouts, weight, targets).
 * Returns structured items with estimated macros & micronutrients for user preview before saving.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { input } = await req.json();
    if (!input || typeof input !== "string" || !input.trim()) {
      return NextResponse.json({ error: "Please enter a meal, water intake, run, or workout to log." }, { status: 400 });
    }

    const promptText = input.trim();

    const systemPrompt = `You are Nutri-Track's Fast AI Integrator parser.
Analyze the user's natural language logging input (e.g. "I ate 4 rotis, 100g paneer bhurji, and drank 500ml water" or "Ran 5km in 28 mins" or "My weight is 56kg").

Deconstruct and calculate nutritional estimates, hydration, activity, workouts, or targets accurately.

Return ONLY a valid JSON object matching this exact schema (no markdown wrap):
{
  "logType": "MEAL" | "HYDRATION" | "ACTIVITY" | "WORKOUT" | "WEIGHT" | "TARGETS" | "MULTI",
  "summary": "Brief 1-line description of what was detected",
  "meal": {
    "detected": boolean,
    "name": "string (e.g. 4 Rotis with Paneer Bhurji)",
    "mealType": "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK",
    "items": [
      {
        "name": "string",
        "quantity": number,
        "unit": "string (e.g. pcs, g, cup, bowl, slice)",
        "calories": number,
        "protein": number,
        "carbohydrates": number,
        "fat": number,
        "fiber": number
      }
    ],
    "totals": {
      "calories": number,
      "protein": number,
      "carbohydrates": number,
      "fat": number,
      "fiber": number
    },
    "micronutrients": {
      "iron": number (in mg, or 0),
      "calcium": number (in mg, or 0),
      "potassium": number (in mg, or 0),
      "magnesium": number (in mg, or 0),
      "zinc": number (in mg, or 0),
      "vitaminC": number (in mg, or 0),
      "vitaminA": number (in mcg, or 0),
      "vitaminB12": number (in mcg, or 0)
    }
  },
  "hydration": {
    "detected": boolean,
    "operation": "ADD" | "SUBTRACT" | "SET",
    "amountMl": number,
    "beverageType": "WATER" | "TEA" | "COFFEE" | "JUICE" | "ELECTROLYTE" | "OTHER"
  },
  "weight": {
    "detected": boolean,
    "weightKg": number
  },
  "activity": {
    "detected": boolean,
    "type": "RUNNING" | "WALKING" | "CYCLING" | "SWIMMING" | "OTHER",
    "durationMinutes": number,
    "distanceKm": number,
    "caloriesBurned": number
  },
  "workout": {
    "detected": boolean,
    "name": "string",
    "durationMinutes": number,
    "exercises": [
      {
        "name": "string",
        "sets": number,
        "reps": number,
        "weightKg": number
      }
    ]
  },
  "targets": {
    "detected": boolean,
    "caloriesKcal": number,
    "proteinG": number,
    "carbsG": number,
    "fatG": number,
    "hydrationMl": number
  }
}`;

    let parsedResult: any = null;

    try {
      const aiResponse = await (AIClient as any).executeWithFallback(
        [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Parse and estimate this logging input: "${promptText}"` },
        ],
        "gpt-4o-mini",
        false
      );

      const rawContent = aiResponse.content || "";
      const cleaned = rawContent.replace(/```json/gi, "").replace(/```/g, "").trim();
      parsedResult = JSON.parse(cleaned);
    } catch (aiErr) {
      console.warn("AI quick-log parser fallback to heuristic parser:", aiErr);
    }

    // Heuristic Fallback if AI fails or returns empty
    if (!parsedResult) {
      parsedResult = heuristicParse(promptText);
    }

    return NextResponse.json({
      success: true,
      data: parsedResult,
      rawInput: promptText,
    });
  } catch (error: any) {
    console.error("POST /api/ai/quick-log/parse error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to parse logging input." },
      { status: 500 }
    );
  }
}

/**
 * Heuristic fallback parser for offline / instantaneous parsing
 */
function heuristicParse(text: string) {
  const lower = text.toLowerCase();
  const result: any = {
    logType: "MEAL",
    summary: text,
    meal: { detected: false, items: [], totals: { calories: 0, protein: 0, carbohydrates: 0, fat: 0, fiber: 0 }, micronutrients: {} },
    hydration: { detected: false, amountMl: 0, beverageType: "WATER" },
    weight: { detected: false, weightKg: 0 },
    activity: { detected: false, type: "RUNNING", durationMinutes: 0, distanceKm: 0, caloriesBurned: 0 },
    workout: { detected: false, name: "Workout", durationMinutes: 0, exercises: [] },
    targets: { detected: false },
  };

  // Enhanced Multi-entry water parsing
  // Matches single or multiple entries like: "500 ml morning water(0540hrs), 1L water more(1100 hrs) and then 200ml more(1300hrs)"
  const waterRegex = /(\d+(?:\.\d+)?)\s*(ml|litres?|l)\s*([^,;()]+)?(?:\((?:at\s*)?([^\)]+)\))?/gi;
  const entries: Array<{
    amountMl: number;
    beverageType: string;
    notes: string;
    time?: string;
    operation: "ADD" | "SUBTRACT" | "SET";
  }> = [];

  let totalMl = 0;
  let match: RegExpExecArray | null = null;
  while ((match = waterRegex.exec(text)) !== null) {
    let num = parseFloat(match[1]);
    const unit = (match[2] || "").toLowerCase();
    if (unit.startsWith("l")) num = num * 1000;

    const rawNote = (match[3] || "").trim();
    const rawTimeOrTag = (match[4] || "").trim();

    let note = rawNote || "Water";
    if (rawTimeOrTag) {
      note = `${note} (${rawTimeOrTag})`.trim();
    }

    let time = "";
    if (rawTimeOrTag) {
      const tMatch = rawTimeOrTag.match(/(\d{1,4})\s*(?:hrs?|am|pm)?/i);
      if (tMatch) {
        const rawNum = tMatch[1];
        if (rawNum.length === 4) {
          time = `${rawNum.substring(0, 2)}:${rawNum.substring(2, 4)}`;
        } else if (rawNum.length === 3) {
          time = `0${rawNum.substring(0, 1)}:${rawNum.substring(1, 3)}`;
        } else if (rawNum.length <= 2) {
          time = `${rawNum.padStart(2, "0")}:00`;
        }
      }
    }

    let op: "ADD" | "SUBTRACT" | "SET" = "ADD";
    if (/\b(remove|subtract|decrease|minus|deduct|cut)\b/i.test(match[0]) || /\b(remove|subtract|decrease|minus|deduct)\b/i.test(text)) {
      op = "SUBTRACT";
    } else if (/\b(set|replace|change|correct)\b/i.test(match[0]) || /\b(set|replace|change|correct)\b/i.test(text)) {
      op = "SET";
    }

    entries.push({
      amountMl: Math.round(num),
      beverageType: "WATER",
      notes: note,
      time: time || undefined,
      operation: op,
    });
    totalMl += Math.round(num);
  }

    if (entries.length > 1) {
      result.hydration = {
        detected: true,
        operation: "ADD",
        isMultiEntry: true,
        amountMl: totalMl,
        entries: entries,
        beverageType: "WATER",
      };
      result.logType = "HYDRATION";
    } else if (entries.length === 1) {
      result.hydration = {
        detected: true,
        operation: entries[0].operation,
        amountMl: entries[0].amountMl,
        beverageType: "WATER",
        entries: entries,
        notes: entries[0].notes,
        time: entries[0].time,
      };
      result.logType = "HYDRATION";
    }

  // Weight check
  const weightMatch = lower.match(/(\d+(?:\.\d+)?)\s*(?:kg|kilos|lbs?)/i);
  if (weightMatch && (lower.includes("weight") || lower.includes("weigh"))) {
    result.weight = { detected: true, weightKg: parseFloat(weightMatch[1]) };
    result.logType = "WEIGHT";
  }

  // Running / Activity check
  const runMatch = lower.match(/(\d+(?:\.\d+)?)\s*(?:km|miles?|k)\s*(?:run|jog|walk)?/i);
  if (runMatch || lower.includes("ran") || lower.includes("run")) {
    const km = runMatch ? parseFloat(runMatch[1]) : 5;
    const timeMatch = lower.match(/(\d+)\s*(?:min|mins|minutes)/i);
    const mins = timeMatch ? parseInt(timeMatch[1], 10) : 30;
    result.activity = {
      detected: true,
      type: lower.includes("walk") ? "WALKING" : "RUNNING",
      durationMinutes: mins,
      distanceKm: km,
      caloriesBurned: Math.round(km * 65),
    };
    result.logType = "ACTIVITY";
  }

  // Food / Meal check: ONLY detect a meal if there are genuine food indicators or explicit eating action verbs
  const foodKeywordsRegex = /\b(roti|rotis|rice|paneer|chicken|dal|curd|dahi|egg|eggs|toast|bread|apple|banana|oats|oatmeal|chilla|cheela|salad|pasta|fish|meat|milk|whey|shake|snack|breakfast|lunch|dinner|meal|pizza|burger|sandwich|chana|sattu|bhurji|sabzi|paratha|soya|tofu|nuts|almonds|fruit|soup|biryani|poha|idli|dosa|upma|khichdi|protein\s+bar|yogurt|curry)\b/i;
  const foodLogActionRegex = /\b(i\s+)?(ate|had|consumed|eaten|log meal|logged meal|log breakfast|log lunch|log dinner|log snack)\b/i;
  const isQuestionOrGreeting = /^(hello|hi|hey|good\s+(morning|afternoon|evening)|how\s+are\s+you|what|why|how|does|is|can)\b/i.test(lower);

  if (!isQuestionOrGreeting && (foodKeywordsRegex.test(lower) || foodLogActionRegex.test(lower))) {
    // Estimate reasonable macros based on food keywords or defaults
    let calories = 350;
    let protein = 15;
    let carbs = 45;
    let fat = 10;
    let fiber = 4;

    if (lower.includes("roti") && lower.includes("paneer")) {
      calories = 620;
      protein = 28;
      carbs = 72;
      fat = 24;
      fiber = 8;
    } else if (lower.includes("egg")) {
      calories = 280;
      protein = 18;
      carbs = 20;
      fat = 12;
      fiber = 3;
    } else if (lower.includes("chicken")) {
      calories = 450;
      protein = 42;
      carbs = 35;
      fat = 14;
      fiber = 5;
    }

    result.meal = {
      detected: true,
      name: text,
      mealType: lower.includes("breakfast") ? "BREAKFAST" : lower.includes("lunch") ? "LUNCH" : lower.includes("dinner") ? "DINNER" : "SNACK",
      items: [
        {
          name: text,
          quantity: 1,
          unit: "serving",
          calories,
          protein,
          carbohydrates: carbs,
          fat,
          fiber,
        },
      ],
      totals: { calories, protein, carbohydrates: carbs, fat, fiber },
      micronutrients: { iron: 2.1, calcium: 80, potassium: 250, magnesium: 45, zinc: 1.2, vitaminC: 10, vitaminA: 50, vitaminB12: 0.2 },
    };
    result.logType = "MEAL";
  }

  return result;
}
