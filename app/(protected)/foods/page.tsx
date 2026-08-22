import React from "react";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { FoodList } from "@/components/foods/FoodList";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Food Database — Nutri-Track",
  description: "Manage your personal nutrition library and foods database",
};

export default async function FoodsPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.id) {
    redirect("/login?callbackUrl=/foods");
  }

  const profile = await prisma.userProfile.findUnique({
    where: { userId: session.user.id },
  });

  if (!profile) {
    redirect("/onboarding");
  }

  return (
    <div className="w-full space-y-6 text-left animate-fade-in">
      <FoodList currentUserId={session.user.id} />
    </div>
  );
}
