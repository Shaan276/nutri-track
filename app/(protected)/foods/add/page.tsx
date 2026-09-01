import React from "react";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AddFoodContainer } from "@/components/foods/AddFoodContainer";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Add to Food Database — Nutri-Track",
  description: "Register raw ingredients or compose prepared food recipes in your personal database",
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

  return <AddFoodContainer />;
}
