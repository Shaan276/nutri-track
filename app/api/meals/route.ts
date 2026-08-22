import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NutritionService } from "@/lib/services/nutrition.service";
import { logMealEntrySchema } from "@/lib/validations/meal";

export const dynamic = "force-dynamic";

/**
 * GET /api/meals?date=YYYY-MM-DD
 * Retrieves all meals and daily nutrition aggregation for the specified date.
 */
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date") || new Date().toISOString().split("T")[0];

    // Validate date format YYYY-MM-DD
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ error: "Invalid date format. Expected YYYY-MM-DD." }, { status: 400 });
    }

    const dailyData = await NutritionService.getDailyNutrition(session.user.id, date);

    return NextResponse.json({
      status: "success",
      data: dailyData,
    });
  } catch (error: any) {
    console.error("GET /api/meals error:", error);
    return NextResponse.json({ error: "Failed to retrieve meals" }, { status: 500 });
  }
}

/**
 * POST /api/meals
 * Logs a food item into a specific meal for the authenticated user.
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parseResult = logMealEntrySchema.safeParse(body);

    if (!parseResult.success) {
      const firstError = parseResult.error.issues[0]?.message || "Invalid meal entry data";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const entry = await NutritionService.logFoodToMeal(session.user.id, parseResult.data);

    return NextResponse.json(
      {
        status: "success",
        message: "Food logged to meal successfully",
        entry,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("POST /api/meals error:", error);
    if (error.message === "FOOD_NOT_FOUND") {
      return NextResponse.json({ error: "Food item not found or inaccessible" }, { status: 404 });
    }
    return NextResponse.json({ error: "Failed to log food entry" }, { status: 500 });
  }
}
