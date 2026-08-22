import React from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SystemSettingsService } from "@/lib/services/admin/system-settings.service";
import { AdminSystemSettingsClient } from "@/components/admin/AdminSystemSettingsClient";

export const metadata = {
  title: "System Settings & API Keys | Nutri-Track Admin",
  description: "Manage dynamic API keys, AI models, and platform integrations directly from the admin center.",
};

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "ADMIN") {
    redirect("/app");
  }

  const initialSettings = await SystemSettingsService.getAllSettingsForAdmin();

  return (
    <div className="space-y-6">
      <AdminSystemSettingsClient initialSettings={initialSettings} />
    </div>
  );
}
