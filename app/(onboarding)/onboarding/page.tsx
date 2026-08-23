import React from "react";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NutriTrackLogo } from "@/components/branding/NutriTrackLogo";
import { OnboardingForm } from "@/components/profile/OnboardingForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Profile Onboarding — Nutri-Track",
  description: "Complete your Nutri-Track profile setup",
};

export default async function OnboardingPage() {
  const session = await getServerSession(authOptions);

  // If unauthenticated, redirect to login
  if (!session || !session.user?.id) {
    redirect("/login?callbackUrl=/onboarding");
  }

  // Check if user already completed onboarding with genuine biometrics
  const existingProfile = await prisma.userProfile.findUnique({
    where: { userId: session.user.id },
  });

  const isProfileComplete = Boolean(
    existingProfile &&
    existingProfile.heightCm &&
    existingProfile.weightKg &&
    existingProfile.dateOfBirth
  );

  if (isProfileComplete) {
    redirect("/app");
  }

  return (
    <main className="min-h-screen bg-background-midnight flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-brand-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="w-full max-w-lg flex flex-col items-center space-y-6">
        <NutriTrackLogo size="lg" subtitle="PROFILE ONBOARDING" />
        <OnboardingForm />
      </div>
    </main>
  );
}
