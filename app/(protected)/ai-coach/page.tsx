import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { AICoachClient } from "@/components/ai-coach/AICoachClient";

export const metadata: Metadata = {
  title: "AI Coach | Nutri-Track",
  description: "Personalized nutrition, fitness, and health intelligence grounded in your Nutri-Track data.",
};

export default async function AICoachPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  return <AICoachClient />;
}
