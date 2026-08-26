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

  // Water check
  const waterMatch = lower.match(/(\d+)\s*(ml|litres?|l)\s*(?:of\s*)?(?:water|pani)?/i);
  if (waterMatch) {
    let ml = parseInt(waterMatch[1], 10);
    if (waterMatch[2].startsWith("l")) ml = ml * 1000;
    result.hydration = { detected: true, amountMl: ml, beverageType: "WATER" };
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

  // Default meal detection if not exclusively activity or weight
  if (!result.activity.detected && !result.weight.detected) {
    result.meal = {
      detected: true,
      name: text,
      mealType: "SNACK",
      items: [
        {
          name: text,
          quantity: 1,
          unit: "serving",
          calories: 350,
          protein: 15,
          carbohydrates: 45,
          fat: 10,
          fiber: 4,
        },
      ],
      totals: { calories: 350, protein: 15, carbohydrates: 45, fat: 10, fiber: 4 },
      micronutrients: { iron: 2.1, calcium: 80, potassium: 250, magnesium: 45, zinc: 1.2, vitaminC: 10, vitaminA: 50, vitaminB12: 0.2 },
    };
  }

  return result;
}
