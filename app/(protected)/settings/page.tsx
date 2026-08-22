import React from "react";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { UserSettingsService } from "@/lib/services/user-settings.service";
import { SettingsHubClient } from "@/components/settings/SettingsHubClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Settings & Personalized Goals — Nutri-Track",
  description: "Configure your physical metrics, calorie targets, macro splits, and fitness milestones",
};

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.id) {
    redirect("/login?callbackUrl=/settings");
  }

  const initialSettings = await UserSettingsService.getUserSettings(session.user.id);

  return <SettingsHubClient initialSettings={initialSettings} />;
}
