import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { UserSettingsService } from "@/lib/services/user-settings.service";
import { UserSettingsPayloadSchema } from "@/lib/validations/settings";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const settings = await UserSettingsService.getUserSettings(session.user.id);
    return NextResponse.json(settings);
  } catch (error: any) {
    console.error("GET /api/settings error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to load user settings" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validated = UserSettingsPayloadSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Invalid settings payload", details: validated.error.format() },
        { status: 400 }
      );
    }

    const updated = await UserSettingsService.updateUserSettings(
      session.user.id,
      validated.data
    );

    return NextResponse.json({
      success: true,
      message: "Settings and goals updated successfully",
      settings: updated,
    });
  } catch (error: any) {
    console.error("PUT /api/settings error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update settings" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  return PUT(req);
}
