import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { userProfileSchema } from "@/lib/validations/profile";

export const dynamic = "force-dynamic";

/**
 * GET /api/profile
 * Retrieves the profile of the currently authenticated user.
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }

    const profile = await prisma.userProfile.findUnique({
      where: { userId: session.user.id },
    });

    return NextResponse.json({
      status: "success",
      profile: profile || null,
    });
  } catch (error) {
    console.error("Fetch profile error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve profile." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/profile
 * Creates or updates the UserProfile for the currently authenticated user.
 * Strictly derives userId from the authenticated session to prevent unauthorized tampering.
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }

    const body = await req.json();

    // 1. Validate payload with Zod
    const parseResult = userProfileSchema.safeParse(body);
    if (!parseResult.success) {
      const firstError = parseResult.error.issues[0]?.message || "Invalid profile data";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const { dateOfBirth, biologicalSex, heightCm, weightKg, activityLevel } = parseResult.data;

    // 2. Persist to PostgreSQL (binds strictly to session.user.id)
    const profile = await prisma.userProfile.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        dateOfBirth: new Date(dateOfBirth),
        biologicalSex,
        heightCm,
        weightKg,
        activityLevel,
      },
      update: {
        dateOfBirth: new Date(dateOfBirth),
        biologicalSex,
        heightCm,
        weightKg,
        activityLevel,
      },
    });

    return NextResponse.json({
      status: "success",
      message: "Profile saved successfully.",
      profile,
    });
  } catch (error) {
    console.error("Save profile error:", error);
    return NextResponse.json(
      { error: "Failed to save profile. Please try again." },
      { status: 500 }
    );
  }
}

export { POST as PUT };
