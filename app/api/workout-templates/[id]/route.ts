import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { WorkoutTemplateService } from "@/lib/services/workout-template.service";
import { updateWorkoutTemplateSchema } from "@/lib/validations/workout-template";

export const dynamic = "force-dynamic";

/**
 * GET /api/workout-templates/[id]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const template = await WorkoutTemplateService.getTemplateById(
      session.user.id,
      params.id
    );
    return NextResponse.json({ success: true, data: template });
  } catch (err: any) {
    if (err.message === "NOT_FOUND") {
      return NextResponse.json({ error: "Workout template not found" }, { status: 404 });
    }
    if (err.message === "UNAUTHORIZED_ACCESS") {
      return NextResponse.json({ error: "Forbidden: Not your template" }, { status: 403 });
    }
    return NextResponse.json(
      { error: err.message || "Failed to fetch workout template" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/workout-templates/[id]
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parseResult = updateWorkoutTemplateSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Validation Error", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const updated = await WorkoutTemplateService.updateTemplate(
      session.user.id,
      params.id,
      parseResult.data
    );
    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    if (err.message === "NOT_FOUND") {
      return NextResponse.json({ error: "Workout template not found" }, { status: 404 });
    }
    if (err.message === "UNAUTHORIZED_ACCESS") {
      return NextResponse.json({ error: "Forbidden: Not your template" }, { status: 403 });
    }
    return NextResponse.json(
      { error: err.message || "Failed to update workout template" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/workout-templates/[id]
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await WorkoutTemplateService.deleteTemplate(
      session.user.id,
      params.id
    );
    return NextResponse.json({ success: true, data: result });
  } catch (err: any) {
    if (err.message === "NOT_FOUND") {
      return NextResponse.json({ error: "Workout template not found" }, { status: 404 });
    }
    if (err.message === "UNAUTHORIZED_ACCESS") {
      return NextResponse.json({ error: "Forbidden: Not your template" }, { status: 403 });
    }
    return NextResponse.json(
      { error: err.message || "Failed to delete workout template" },
      { status: 500 }
    );
  }
}
