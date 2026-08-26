import React from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AdminFeatureControlClient } from "@/components/admin/AdminFeatureControlClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Page & Feature Control Center | Nutri-Track Admin",
  description: "Manage page availability, coming soon placeholders, and feature access permissions.",
};

export default async function AdminFeaturesPage() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "ADMIN") {
    redirect("/app");
  }

  return <AdminFeatureControlClient />;
}
