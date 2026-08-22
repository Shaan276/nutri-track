import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { WorkoutTemplateService } from "@/lib/services/workout-template.service";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const duplicated = await WorkoutTemplateService.duplicateTemplate(
      session.user.id,
      params.id
    );
    return NextResponse.json({ success: true, data: duplicated }, { status: 201 });
  } catch (err: any) {
    if (err.message === "NOT_FOUND") {
      return NextResponse.json({ error: "Workout template not found" }, { status: 404 });
    }
    if (err.message === "UNAUTHORIZED_ACCESS") {
      return NextResponse.json({ error: "Forbidden: Not your template" }, { status: 403 });
    }
    return NextResponse.json(
      { error: err.message || "Failed to duplicate workout template" },
      { status: 500 }
    );
  }
}
