import React from "react";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { CommunityService } from "@/lib/services/community.service";
import { NotificationService } from "@/lib/services/notification.service";
import { CommunityHubClient } from "@/components/community/CommunityHubClient";
import { FeatureAccessGuard } from "@/components/auth/FeatureAccessGuard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Community & Friends — Nutri-Track",
  description: "Connect with friends, share milestone progress, and build mutual consistency.",
};

export default async function CommunityPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.id) {
    redirect("/login?callbackUrl=/community");
  }

  const friends = await CommunityService.getFriends(session.user.id);
  const requests = await CommunityService.getPendingRequests(session.user.id);
  const notifData = await NotificationService.getNotifications(session.user.id, { limit: 10 });

  return (
    <FeatureAccessGuard featureKey="community" featureName="Community & Social Feed">
      <CommunityHubClient
        initialFriends={friends}
        initialIncoming={requests.incoming}
        initialOutgoing={requests.outgoing}
        initialNotifications={notifData.notifications}
        initialUnreadCount={notifData.unreadCount}
      />
    </FeatureAccessGuard>
  );
}
