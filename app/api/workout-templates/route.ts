import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { WorkoutTemplateService } from "@/lib/services/workout-template.service";
import { createWorkoutTemplateSchema } from "@/lib/validations/workout-template";

export const dynamic = "force-dynamic";

/**
 * GET /api/workout-templates?search=&type=&favorite=&archived=
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || undefined;
    const workoutType = (searchParams.get("type") as any) || undefined;
    const isFavoriteParam = searchParams.get("favorite");
    const isArchivedParam = searchParams.get("archived");

    const templates = await WorkoutTemplateService.getTemplates(session.user.id, {
      search,
      workoutType,
      isFavorite: isFavoriteParam !== null ? isFavoriteParam === "true" : undefined,
      isArchived: isArchivedParam !== null ? isArchivedParam === "true" : undefined,
    });

    return NextResponse.json({ success: true, data: templates });
  } catch (err: any) {
    console.error("GET /api/workout-templates error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to fetch workout templates" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/workout-templates
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parseResult = createWorkoutTemplateSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Validation Error", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const created = await WorkoutTemplateService.createTemplate(session.user.id, parseResult.data);
    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (err: any) {
    console.error("POST /api/workout-templates error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to create workout template" },
      { status: 500 }
    );
  }
}
