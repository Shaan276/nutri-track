import React from "react";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { SmartInsightsService } from "@/lib/services/insights/smart-insights.service";
import { InsightsDashboardClient } from "@/components/insights/InsightsDashboardClient";

export const dynamic = "force-dynamic";

export default async function InsightsPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.id) {
    redirect("/login?callbackUrl=/insights");
  }

  const profile = await prisma.userProfile.findUnique({
    where: { userId: session.user.id },
  });

  if (!profile) {
    redirect("/onboarding");
  }

  // Pre-fetch initial 7-day smart insights server-side
  const initialInsights = await SmartInsightsService.getSmartInsights(
    session.user.id,
    "last7days"
  );

  return (
    <div className="w-full space-y-6 text-left animate-fade-in pb-12">
      <InsightsDashboardClient initialData={initialInsights} userId={session.user.id} />
    </div>
  );
}
