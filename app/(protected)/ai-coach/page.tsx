import React, { Suspense } from "react";
import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { AICoachClient } from "@/components/ai-coach/AICoachClient";
import { Loader2 } from "lucide-react";

export const metadata: Metadata = {
  title: "AI Coach | Nutri-Track",
  description: "Personalized nutrition, fitness, and health intelligence grounded in your Nutri-Track data.",
};

export default async function AICoachPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  return (
    <Suspense
      fallback={
        <div className="flex h-[80vh] items-center justify-center text-neutral-500 gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
          <span className="text-xs">Loading AI Coach & Biometric Data...</span>
        </div>
      }
    >
      <AICoachClient />
    </Suspense>
  );
}
