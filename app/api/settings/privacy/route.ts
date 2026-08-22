import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrivacyService } from "@/lib/services/privacy.service";
import { UpdatePrivacySettingsSchema } from "@/lib/validations/privacy";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const settings = await PrivacyService.getPrivacySettings(session.user.id);
    return NextResponse.json(settings);
  } catch (err: any) {
    console.error("GET /api/settings/privacy error:", err);
    return NextResponse.json({ error: err.message || "Failed to fetch privacy settings" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = UpdatePrivacySettingsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid privacy settings payload", details: parsed.error.format() }, { status: 400 });
    }

    const updated = await PrivacyService.updatePrivacySettings(session.user.id, parsed.data);
    return NextResponse.json(updated);
  } catch (err: any) {
    console.error("PUT /api/settings/privacy error:", err);
    return NextResponse.json({ error: err.message || "Failed to update privacy settings" }, { status: 500 });
  }
}
