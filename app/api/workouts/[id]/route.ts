import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { WorkoutService } from "@/lib/services/workout.service";
import { updateWorkoutSchema } from "@/lib/validations/workout";

export const dynamic = "force-dynamic";

/**
 * GET /api/workouts/[id]
 * Retrieves details of a single workout session.
 */
export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const workout = await WorkoutService.getWorkoutById(session.user.id, params.id);
    return NextResponse.json({
      status: "success",
      workout,
    });
  } catch (error: any) {
    if (error.message === "NOT_FOUND") {
      return NextResponse.json({ error: "Workout session not found" }, { status: 404 });
    }
    if (error.message === "UNAUTHORIZED_ACCESS") {
      return NextResponse.json({ error: "You are not authorized to access this workout" }, { status: 403 });
    }
    return NextResponse.json({ error: "Failed to retrieve workout" }, { status: 500 });
  }
}

/**
 * PUT /api/workouts/[id]
 * Updates an existing workout session.
 */
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parseResult = updateWorkoutSchema.safeParse(body);

    if (!parseResult.success) {
      const firstError = parseResult.error.issues[0]?.message || "Invalid update data";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const updated = await WorkoutService.updateWorkoutSession(session.user.id, params.id, parseResult.data);

    return NextResponse.json({
      status: "success",
      message: "Workout updated successfully",
      workout: updated,
    });
  } catch (error: any) {
    if (error.message === "NOT_FOUND") {
      return NextResponse.json({ error: "Workout session not found" }, { status: 404 });
    }
    if (error.message === "UNAUTHORIZED_ACCESS") {
      return NextResponse.json({ error: "You are not authorized to modify this workout" }, { status: 403 });
    }
    return NextResponse.json({ error: "Failed to update workout" }, { status: 500 });
  }
}

/**
 * DELETE /api/workouts/[id]
 * Permanently deletes a workout session and all associated exercises & sets.
 */
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await WorkoutService.deleteWorkoutSession(session.user.id, params.id);

    return NextResponse.json({
      status: "success",
      message: "Workout deleted successfully",
    });
  } catch (error: any) {
    if (error.message === "NOT_FOUND") {
      return NextResponse.json({ error: "Workout session not found" }, { status: 404 });
    }
    if (error.message === "UNAUTHORIZED_ACCESS") {
      return NextResponse.json({ error: "You are not authorized to delete this workout" }, { status: 403 });
    }
    return NextResponse.json({ error: "Failed to delete workout" }, { status: 500 });
  }
}
