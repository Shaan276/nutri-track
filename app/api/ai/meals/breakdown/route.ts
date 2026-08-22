import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AIClient } from "@/lib/ai/ai-client";

export const dynamic = "force-dynamic";

// Standard reference nutritional dictionary per 100g (Raw vs Cooked)
const STANDARD_INGREDIENT_DICTIONARY: Record<string, { state: "RAW" | "COOKED"; calories: number; protein: number; carbs: number; fat: number }> = {
  "besan": { state: "RAW", calories: 387, protein: 22.4, carbs: 57.8, fat: 6.7 },
  "gram flour": { state: "RAW", calories: 387, protein: 22.4, carbs: 57.8, fat: 6.7 },
  "aata": { state: "RAW", calories: 340, protein: 13.2, carbs: 72.0, fat: 2.5 },
  "wheat flour": { state: "RAW", calories: 340, protein: 13.2, carbs: 72.0, fat: 2.5 },
  "soya chunks": { state: "RAW", calories: 345, protein: 52.0, carbs: 33.0, fat: 0.5 },
  "soya granules": { state: "RAW", calories: 345, protein: 52.0, carbs: 33.0, fat: 0.5 },
  "oats": { state: "RAW", calories: 389, protein: 16.9, carbs: 66.3, fat: 6.9 },
  "rolled oats": { state: "RAW", calories: 389, protein: 16.9, carbs: 66.3, fat: 6.9 },
  "paneer": { state: "RAW", calories: 265, protein: 18.3, carbs: 3.4, fat: 20.8 },
  "cottage cheese": { state: "RAW", calories: 265, protein: 18.3, carbs: 3.4, fat: 20.8 },
  "chicken breast": { state: "RAW", calories: 120, protein: 22.5, carbs: 0.0, fat: 2.6 },
  "cooked chicken": { state: "COOKED", calories: 165, protein: 31.0, carbs: 0.0, fat: 3.6 },
  "egg": { state: "RAW", calories: 143, protein: 12.6, carbs: 0.8, fat: 9.5 },
  "boiled egg": { state: "COOKED", calories: 155, protein: 13.0, carbs: 1.1, fat: 10.6 },
  "egg white": { state: "RAW", calories: 52, protein: 11.0, carbs: 0.7, fat: 0.2 },
  "rice": { state: "RAW", calories: 358, protein: 6.8, carbs: 79.2, fat: 0.6 },
  "cooked rice": { state: "COOKED", calories: 130, protein: 2.7, carbs: 28.2, fat: 0.3 },
  "moong dal": { state: "RAW", calories: 347, protein: 24.0, carbs: 60.0, fat: 1.2 },
  "toor dal": { state: "RAW", calories: 343, protein: 22.0, carbs: 63.0, fat: 1.5 },
  "ghee": { state: "RAW", calories: 900, protein: 0.0, carbs: 0.0, fat: 100.0 },
  "oil": { state: "RAW", calories: 884, protein: 0.0, carbs: 0.0, fat: 100.0 },
  "mustard oil": { state: "RAW", calories: 884, protein: 0.0, carbs: 0.0, fat: 100.0 },
  "butter": { state: "RAW", calories: 717, protein: 0.9, carbs: 0.1, fat: 81.1 },
  "milk": { state: "RAW", calories: 42, protein: 3.4, carbs: 5.0, fat: 1.0 },
  "curd": { state: "RAW", calories: 61, protein: 3.5, carbs: 4.7, fat: 3.3 },
  "dahi": { state: "RAW", calories: 61, protein: 3.5, carbs: 4.7, fat: 3.3 },
  "whey protein": { state: "RAW", calories: 400, protein: 80.0, carbs: 6.7, fat: 5.0 },
  "almonds": { state: "RAW", calories: 579, protein: 21.2, carbs: 21.6, fat: 49.9 },
  "peanut butter": { state: "RAW", calories: 588, protein: 25.0, carbs: 20.0, fat: 50.0 },
  "onion": { state: "RAW", calories: 40, protein: 1.1, carbs: 9.3, fat: 0.1 },
  "tomato": { state: "RAW", calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2 },
  "potato": { state: "RAW", calories: 77, protein: 2.0, carbs: 17.0, fat: 0.1 },
  "banana": { state: "RAW", calories: 89, protein: 1.1, carbs: 22.8, fat: 0.3 },
};

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { query } = await req.json();
    if (!query || typeof query !== "string" || !query.trim()) {
      return NextResponse.json({ error: "Please enter a dish name or ingredient description" }, { status: 400 });
    }

    const promptText = query.trim();

    // 1. Try AI-powered breakdown using AIClient
    try {
      const systemInstruction = `You are an expert nutrition and culinary AI. The user describes a dish or meal (e.g., "2 Besan Chilla with 1 tsp oil" or "Soya Bhurji with 50g soya chunks and 50g paneer").
Deconstruct the dish into its raw/cooked ingredients with quantities in grams (quantityG).
For each ingredient, specify:
- name: (e.g. "Raw Besan (Gram Flour)", "Mustard Oil", "Raw Paneer", "Raw Soya Chunks")
- quantityG: quantity in grams (e.g., 60, 5, 50)
- state: "RAW" or "COOKED"
- caloriesPer100g: number
- proteinPer100g: number
- carbsPer100g: number
- fatPer100g: number

Return ONLY a valid JSON object matching this exact schema without markdown wrap:
{
  "dishName": "string",
  "ingredients": [
    {
      "name": "string",
      "quantityG": number,
      "state": "RAW" | "COOKED",
      "caloriesPer100g": number,
      "proteinPer100g": number,
      "carbsPer100g": number,
      "fatPer100g": number
    }
  ]
}`;

      const aiResponse = await (AIClient as any).executeWithFallback(
        [
          { role: "system", content: systemInstruction },
          { role: "user", content: `Deconstruct this dish and calculate ingredient quantities: "${promptText}"` },
        ],
        "gpt-4o-mini",
        false
      );

      const rawContent = aiResponse.content || "";
      const cleanedJson = rawContent.replace(/```json/gi, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(cleanedJson);

      if (parsed.ingredients && Array.isArray(parsed.ingredients) && parsed.ingredients.length > 0) {
        let totalCal = 0;
        let totalProt = 0;
        let totalCarb = 0;
        let totalFat = 0;

        const normalizedIngredients = parsed.ingredients.map((ing: any) => {
          const qty = Number(ing.quantityG || 0);
          const factor = qty / 100;
          const cal100 = Number(ing.caloriesPer100g || 0);
          const prot100 = Number(ing.proteinPer100g || 0);
          const carb100 = Number(ing.carbsPer100g || 0);
          const fat100 = Number(ing.fatPer100g || 0);

          totalCal += cal100 * factor;
          totalProt += prot100 * factor;
          totalCarb += carb100 * factor;
          totalFat += fat100 * factor;

          return {
            name: ing.name,
            quantityG: qty,
            state: ing.state === "COOKED" ? "COOKED" : "RAW",
            caloriesPer100g: cal100,
            proteinPer100g: prot100,
            carbsPer100g: carb100,
            fatPer100g: fat100,
            calculatedCalories: Math.round(cal100 * factor * 10) / 10,
            calculatedProtein: Math.round(prot100 * factor * 10) / 10,
            calculatedCarbs: Math.round(carb100 * factor * 10) / 10,
            calculatedFat: Math.round(fat100 * factor * 10) / 10,
          };
        });

        return NextResponse.json({
          success: true,
          dishName: parsed.dishName || promptText,
          ingredients: normalizedIngredients,
          totals: {
            calories: Math.round(totalCal * 10) / 10,
            protein: Math.round(totalProt * 10) / 10,
            carbs: Math.round(totalCarb * 10) / 10,
            fat: Math.round(totalFat * 10) / 10,
          },
        });
      }
    } catch (aiErr) {
      console.warn("AI recipe breakdown fallback to heuristic dictionary:", aiErr);
    }

    // 2. Intelligent Heuristic Rule-Based Fallback for Indian Foods
    const lower = promptText.toLowerCase();
    const matchedIngredients: any[] = [];

    // Check against standard ingredient dictionary
    for (const [key, facts] of Object.entries(STANDARD_INGREDIENT_DICTIONARY)) {
      if (lower.includes(key)) {
        // Extract quantity if specified (e.g., "50g besan", "100g soya")
        const regex = new RegExp(`(\\d+)\\s*(?:g|grams?|gm)?\\s*${key}`, "i");
        const match = lower.match(regex);
        const quantityG = match ? parseInt(match[1], 10) : 50; // default 50g

        const factor = quantityG / 100;
        matchedIngredients.push({
          name: `${facts.state === "RAW" ? "Raw" : "Cooked"} ${key.charAt(0).toUpperCase() + key.slice(1)}`,
          quantityG,
          state: facts.state,
          caloriesPer100g: facts.calories,
          proteinPer100g: facts.protein,
          carbsPer100g: facts.carbs,
          fatPer100g: facts.fat,
          calculatedCalories: Math.round(facts.calories * factor * 10) / 10,
          calculatedProtein: Math.round(facts.protein * factor * 10) / 10,
          calculatedCarbs: Math.round(facts.carbs * factor * 10) / 10,
          calculatedFat: Math.round(facts.fat * factor * 10) / 10,
        });
      }
    }

    // If specific dishes matched
    if (matchedIngredients.length === 0) {
      if (lower.includes("chilla") || lower.includes("cheela")) {
        matchedIngredients.push({
          name: "Raw Besan (Gram Flour)",
          quantityG: 60,
          state: "RAW",
          caloriesPer100g: 387,
          proteinPer100g: 22.4,
          carbsPer100g: 57.8,
          fatPer100g: 6.7,
          calculatedCalories: 232.2,
          calculatedProtein: 13.4,
          calculatedCarbs: 34.7,
          calculatedFat: 4.0,
        });
        matchedIngredients.push({
          name: "Mustard Oil / Ghee",
          quantityG: 5,
          state: "RAW",
          caloriesPer100g: 884,
          proteinPer100g: 0,
          carbsPer100g: 0,
          fatPer100g: 100,
          calculatedCalories: 44.2,
          calculatedProtein: 0,
          calculatedCarbs: 0,
          calculatedFat: 5.0,
        });
      } else if (lower.includes("paratha") || lower.includes("roti")) {
        matchedIngredients.push({
          name: "Raw Aata (Whole Wheat)",
          quantityG: 60,
          state: "RAW",
          caloriesPer100g: 340,
          proteinPer100g: 13.2,
          carbsPer100g: 72.0,
          fatPer100g: 2.5,
          calculatedCalories: 204.0,
          calculatedProtein: 7.9,
          calculatedCarbs: 43.2,
          calculatedFat: 1.5,
        });
        matchedIngredients.push({
          name: "Ghee / Butter",
          quantityG: 5,
          state: "RAW",
          caloriesPer100g: 900,
          proteinPer100g: 0,
          carbsPer100g: 0,
          fatPer100g: 100,
          calculatedCalories: 45.0,
          calculatedProtein: 0,
          calculatedCarbs: 0,
          calculatedFat: 5.0,
        });
      } else if (lower.includes("soya")) {
        matchedIngredients.push({
          name: "Raw Soya Chunks",
          quantityG: 50,
          state: "RAW",
          caloriesPer100g: 345,
          proteinPer100g: 52.0,
          carbsPer100g: 33.0,
          fatPer100g: 0.5,
          calculatedCalories: 172.5,
          calculatedProtein: 26.0,
          calculatedCarbs: 16.5,
          calculatedFat: 0.25,
        });
        matchedIngredients.push({
          name: "Cooking Oil",
          quantityG: 5,
          state: "RAW",
          caloriesPer100g: 884,
          proteinPer100g: 0,
          carbsPer100g: 0,
          fatPer100g: 100,
          calculatedCalories: 44.2,
          calculatedProtein: 0,
          calculatedCarbs: 0,
          calculatedFat: 5.0,
        });
      } else {
        // Generic food fallback: 100g standard portion
        matchedIngredients.push({
          name: promptText,
          quantityG: 100,
          state: "COOKED",
          caloriesPer100g: 150,
          proteinPer100g: 8,
          carbsPer100g: 20,
          fatPer100g: 4,
          calculatedCalories: 150,
          calculatedProtein: 8,
          calculatedCarbs: 20,
          calculatedFat: 4,
        });
      }
    }

    let totCal = 0;
    let totProt = 0;
    let totCarb = 0;
    let totFat = 0;
    for (const ing of matchedIngredients) {
      totCal += ing.calculatedCalories;
      totProt += ing.calculatedProtein;
      totCarb += ing.calculatedCarbs;
      totFat += ing.calculatedFat;
    }

    return NextResponse.json({
      success: true,
      dishName: promptText,
      ingredients: matchedIngredients,
      totals: {
        calories: Math.round(totCal * 10) / 10,
        protein: Math.round(totProt * 10) / 10,
        carbs: Math.round(totCarb * 10) / 10,
        fat: Math.round(totFat * 10) / 10,
      },
    });
  } catch (error: any) {
    console.error("AI meal breakdown error:", error);
    return NextResponse.json({ error: error.message || "Failed to breakdown meal" }, { status: 500 });
  }
}
