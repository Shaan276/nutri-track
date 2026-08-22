import React from "react";
import { Metadata } from "next";
import { GoalsHubClient } from "@/components/goals/GoalsHubClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Goals, Challenges & Achievements | Nutri-Track",
  description:
    "Set personal health goals, join challenges, and track real-data milestones in Nutri-Track.",
};

export default function GoalsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <GoalsHubClient />
    </div>
  );
}
