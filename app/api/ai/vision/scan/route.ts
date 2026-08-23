import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AIClient } from "@/lib/ai/ai-client";
import { SystemSettingsService } from "@/lib/services/admin/system-settings.service";
import { AI_MODEL_CONFIG } from "@/lib/ai/model-config";

export const dynamic = "force-dynamic";

/**
 * POST /api/ai/vision/scan
 * Analyzes a meal photo with multimodal AI vision, returning structured food items,
 * estimated portions, macros, micronutrients, and uncertainty notes for user review before logging.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { imageBase64, mealType = "LUNCH" } = body;

    if (!imageBase64) {
      return NextResponse.json({ error: "Image data is required" }, { status: 400 });
    }

    const cleanBase64 = imageBase64.startsWith("data:")
      ? imageBase64
      : `data:image/jpeg;base64,${imageBase64}`;

    const systemPrompt = `You are a world-class AI Nutritionist and Multimodal Vision Analyst specializing in global and Indian cuisine.
Analyze the provided food photo with high precision.

Return ONLY a valid, raw JSON object (with NO markdown backticks, NO \`\`\`json block) with this exact schema:
{
  "foodName": "Descriptive title of the meal (e.g. 'Grilled Chicken Breast with Quinoa & Steamed Broccoli' or 'Dal Tadka with 2 Rotis & Curd')",
  "mealType": "${mealType}",
  "items": [
    {
      "name": "Food item name",
      "servingSize": 1,
      "servingUnit": "cup / piece / bowl / grams",
      "calories": 150,
      "protein": 10,
      "carbohydrates": 20,
      "fat": 3,
      "fiber": 2
    }
  ],
  "totals": {
    "calories": 450,
    "protein": 32,
    "carbohydrates": 48,
    "fat": 12,
    "fiber": 6
  },
  "micronutrients": {
    "iron": 3.2,
    "calcium": 180,
    "potassium": 550,
    "magnesium": 65,
    "zinc": 2.4,
    "vitaminC": 25,
    "vitaminA": 150,
    "vitaminB12": 0.8
  },
  "confidence": "MEDIUM",
  "uncertaintyNotes": "Estimated oil content as moderate (1 tsp). If hostel or restaurant food, oil may be higher.",
  "ayurvedicNotes": "Balanced Agni, nourishing and Sattvic."
}`;

    const activeModel = await SystemSettingsService.getSetting("AI_MODEL", AI_MODEL_CONFIG.defaultModel);

    // Call AI model with vision image using AIClient fallback
    const responsePayload = await AIClient.executeWithFallback(
      [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            { type: "text", text: "Please identify and calculate the detailed nutritional breakdown for this food image." },
            { type: "image_url", image_url: { url: cleanBase64 } },
          ],
        },
      ],
      activeModel,
      false
    );

    const rawContent = responsePayload.content || "{}";
    const cleaned = rawContent
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```$/i, "")
      .trim();

    let parsedResult = null;
    try {
      parsedResult = JSON.parse(cleaned);
    } catch {
      // Fallback parser if JSON was slightly malformed
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedResult = JSON.parse(jsonMatch[0]);
      }
    }

    if (!parsedResult) {
      throw new Error("Could not parse nutrition breakdown from image");
    }

    return NextResponse.json({
      success: true,
      data: parsedResult,
      modelUsed: activeModel,
    });
  } catch (error: any) {
    console.error("POST /api/ai/vision/scan error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to analyze food image" },
      { status: 500 }
    );
  }
}
