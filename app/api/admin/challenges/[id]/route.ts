import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ChallengeService } from "@/lib/services/challenge.service";

export const dynamic = "force-dynamic";

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized. Admin privileges required." }, { status: 403 });
    }

    await ChallengeService.deleteChallenge(params.id);
    return NextResponse.json({ success: true, message: "Challenge deleted successfully" });
  } catch (error: any) {
    console.error("DELETE /api/admin/challenges/[id] error:", error);
    return NextResponse.json({ error: error.message || "Failed to delete challenge" }, { status: 500 });
  }
}
