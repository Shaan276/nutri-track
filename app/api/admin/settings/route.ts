import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { SystemSettingsService } from "@/lib/services/admin/system-settings.service";
import { z } from "zod";

export const dynamic = "force-dynamic";

const updateSettingsSchema = z.object({
  settings: z.array(
    z.object({
      key: z.string().min(1),
      value: z.string(),
    })
  ),
});

/**
 * GET /api/admin/settings
 * Retrieves all categorized system settings & API keys with masked secrets.
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const settings = await SystemSettingsService.getAllSettingsForAdmin();
    return NextResponse.json({ settings }, { status: 200 });
  } catch (error: any) {
    console.error("Failed to fetch system settings:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/settings
 * Bulk updates dynamic system settings and API keys.
 */
export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = updateSettingsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload format", details: parsed.error.issues }, { status: 400 });
    }

    const adminUserId = session.user.id;
    await SystemSettingsService.batchUpdateSettings(parsed.data.settings, adminUserId);

    const updatedSettings = await SystemSettingsService.getAllSettingsForAdmin();
    return NextResponse.json(
      { success: true, message: "System settings and API keys updated successfully", settings: updatedSettings },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Failed to update system settings:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
