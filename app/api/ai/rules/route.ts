import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AIRulesEngine } from "@/lib/ai/rules-engine";
import { prisma } from "@/lib/db";
import { HealthContextService } from "@/lib/services/health-context.service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const userRecord = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    const snapshot = await HealthContextService.getHealthSnapshot(userId);
    const dynamicAge = AIRulesEngine.calculateDynamicAge(
      userRecord?.profile?.dateOfBirth,
      userRecord?.createdAt
    );
    const generalRules = await AIRulesEngine.getGeneralAIRules();
    const userCustomRules = await AIRulesEngine.getUserCustomRules(userId);
    const goalRules = AIRulesEngine.getPersonalizedGoalRules(snapshot.profile.primaryGoal);

    return NextResponse.json({
      success: true,
      data: {
        dynamicAge,
        generalRules,
        userCustomRules: userCustomRules || "",
        goalRules,
        userEmail: session.user.email,
        primaryGoal: snapshot.profile.primaryGoal,
      },
    });
  } catch (error: any) {
    console.error("GET /api/ai/rules error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch rules" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await req.json();
    const { userCustomRules } = body;

    await AIRulesEngine.saveUserCustomRules(userId, typeof userCustomRules === "string" ? userCustomRules : "");

    return NextResponse.json({
      success: true,
      message: "Personalized AI rule overrides saved successfully for your account!",
    });
  } catch (error: any) {
    console.error("PATCH /api/ai/rules error:", error);
    return NextResponse.json({ error: error.message || "Failed to update rules" }, { status: 500 });
  }
}
