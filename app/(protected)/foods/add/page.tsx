import React from "react";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { FoodForm } from "@/components/foods/FoodForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Add Food — Nutri-Track",
  description: "Add a new food item with normalized nutritional values to your personal library",
};

export default async function AddFoodPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.id) {
    redirect("/login?callbackUrl=/foods/add");
  }

  const profile = await prisma.userProfile.findUnique({
    where: { userId: session.user.id },
  });

  if (!profile) {
    redirect("/onboarding");
  }

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6 text-left animate-fade-in">
      <FoodForm mode="create" />
    </div>
  );
}
