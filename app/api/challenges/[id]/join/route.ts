import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ChallengeService } from "@/lib/services/challenge.service";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const updated = await ChallengeService.joinChallenge(session.user.id, params.id);
    return NextResponse.json(updated);
  } catch (error: any) {
    console.error(`POST /api/challenges/${params.id}/join error:`, error);
    return NextResponse.json({ error: error.message || "Failed to join challenge" }, { status: 500 });
  }
}
