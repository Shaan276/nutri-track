import React, { Suspense } from "react";
import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { AICoachClient, AICoachComingSoon } from "@/components/ai-coach/AICoachClient";
import { FeatureAccessService } from "@/lib/services/admin/feature-access.service";
import { Loader2 } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "AI Coach | Nutri-Track",
  description: "Personalized nutrition, fitness, and health intelligence grounded in your Nutri-Track data.",
};

export default async function AICoachPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const userRole = (session.user as any)?.role || "USER";
  const isAdmin = userRole === "ADMIN";
  const userId = session.user?.id;

  const access = await FeatureAccessService.canUserAccess("/ai-coach", userRole, userId);

  return (
    <Suspense
      fallback={
        <div className="flex h-[80vh] items-center justify-center text-neutral-500 gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
          <span className="text-xs">Loading AI Coach & Biometric Data...</span>
        </div>
      }
    >
      {access.allowed || isAdmin ? (
        <AICoachClient isAdmin={isAdmin} />
      ) : (
        <AICoachComingSoon />
      )}
    </Suspense>
  );
}
