import React from "react";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { FoodService } from "@/lib/services/food.service";
import { prisma } from "@/lib/db";
import { FoodForm } from "@/components/foods/FoodForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Edit Food — Nutri-Track",
  description: "Update food details and reference metrics",
};

interface EditFoodPageProps {
  params: { id: string };
}

export default async function EditFoodPage({ params }: EditFoodPageProps) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.id) {
    redirect(`/login?callbackUrl=/foods/${params.id}/edit`);
  }

  const profile = await prisma.userProfile.findUnique({
    where: { userId: session.user.id },
  });

  if (!profile) {
    redirect("/onboarding");
  }

  let food: any = null;
  try {
    food = await FoodService.getFoodById(params.id, session.user.id);
  } catch {
    redirect("/foods");
  }

  if (!food) {
    redirect("/foods");
  }

  // Prevent editing global system foods
  if (food.isSystemFood || food.userId !== session.user.id) {
    redirect("/foods");
  }

  const serializedFood = {
    ...food,
    servingSize: Number(food.servingSize),
    calories: Number(food.calories),
    protein: Number(food.protein),
    carbohydrates: Number(food.carbohydrates),
    fat: Number(food.fat),
    fiber: Number(food.fiber),
    sugar: Number(food.sugar),
    sodium: Number(food.sodium),
    calcium: Number(food.calcium),
    iron: Number(food.iron),
    potassium: Number(food.potassium),
    magnesium: Number(food.magnesium),
    zinc: Number(food.zinc),
    vitaminA: Number(food.vitaminA),
    vitaminC: Number(food.vitaminC),
    vitaminD: Number(food.vitaminD),
    vitaminB12: Number(food.vitaminB12),
    water: Number(food.water),
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6 text-left animate-fade-in">
      <FoodForm initialData={serializedFood} mode="edit" />
    </div>
  );
}
