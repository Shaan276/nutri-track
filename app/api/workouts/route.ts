import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { WorkoutService } from "@/lib/services/workout.service";
import { logWorkoutSchema } from "@/lib/validations/workout";

export const dynamic = "force-dynamic";

/**
 * GET /api/workouts?date=YYYY-MM-DD&view=daily|weekly
 * Retrieves daily workout sessions or 7-day weekly training summaries.
 */
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date") || new Date().toISOString().split("T")[0];
    const view = searchParams.get("view") || "daily";

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ error: "Invalid date format. Expected YYYY-MM-DD." }, { status: 400 });
    }

    if (view === "weekly") {
      const weeklyData = await WorkoutService.getWeeklyWorkoutsSummary(session.user.id, date);
      return NextResponse.json({
        status: "success",
        data: weeklyData,
      });
    }

    const dailyData = await WorkoutService.getDailyWorkouts(session.user.id, date);

    return NextResponse.json({
      status: "success",
      data: dailyData,
    });
  } catch (error: any) {
    console.error("GET /api/workouts error:", error);
    return NextResponse.json({ error: "Failed to retrieve workout records" }, { status: 500 });
  }
}

/**
 * POST /api/workouts
 * Creates a new workout session with structured exercises and sets.
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parseResult = logWorkoutSchema.safeParse(body);

    if (!parseResult.success) {
      const firstError = parseResult.error.issues[0]?.message || "Invalid workout data";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const workout = await WorkoutService.createWorkoutSession(session.user.id, parseResult.data);

    return NextResponse.json(
      {
        status: "success",
        message: "Workout logged successfully",
        workout,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("POST /api/workouts error:", error);
    return NextResponse.json({ error: "Failed to log workout" }, { status: 500 });
  }
}
