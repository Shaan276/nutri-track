import React from "react";
import { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { CommunityService } from "@/lib/services/community.service";
import { FriendProfileClient } from "@/components/community/FriendProfileClient";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: { username: string };
}): Promise<Metadata> {
  return {
    title: `@${params.username} — Nutri-Track Community`,
    description: `View shared progress and community profile for @${params.username}`,
  };
}

export default async function FriendProfilePage({
  params,
}: {
  params: { username: string };
}) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.id) {
    redirect(`/login?callbackUrl=/community/${params.username}`);
  }

  try {
    const profile = await CommunityService.getFriendSharedProfile(
      session.user.id,
      params.username
    );

    return <FriendProfileClient initialProfile={profile} />;
  } catch (err: any) {
    notFound();
  }
}
