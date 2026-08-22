import { prisma } from "@/lib/db";
import { NotificationService } from "./notification.service";

export type RecommendationType =
  | "WORKOUT"
  | "RUNNING_IDEA"
  | "FOOD_ITEM"
  | "GOAL_SUGGESTION";

export interface SendRecommendationInput {
  receiverId: string;
  itemType: RecommendationType;
  title: string;
  payload: Record<string, any>;
  message?: string;
}

export interface RecommendationDto {
  id: string;
  senderId: string;
  senderName: string;
  senderUsername: string;
  receiverId: string;
  itemType: RecommendationType;
  title: string;
  payload: Record<string, any>;
  message: string | null;
  status: "PENDING" | "ACCEPTED" | "DISMISSED";
  createdAt: string;
}

export class RecommendationService {
  /**
   * Sends a recommendation to an accepted friend
   */
  static async sendRecommendation(
    senderId: string,
    input: SendRecommendationInput
  ): Promise<RecommendationDto> {
    if (senderId === input.receiverId) {
      throw new Error("You cannot send a recommendation to yourself");
    }

    // Verify friendship exists and is ACCEPTED
    const friendship = await (prisma as any).friendship.findFirst({
      where: {
        status: "ACCEPTED",
        OR: [
          { requesterId: senderId, addresseeId: input.receiverId },
          { requesterId: input.receiverId, addresseeId: senderId },
        ],
      },
    });

    if (!friendship) {
      throw new Error("You can only send recommendations to accepted friends");
    }

    const sender = await prisma.user.findUnique({ where: { id: senderId } });
    if (!sender) throw new Error("Sender not found");

    const created = await (prisma as any).friendRecommendation.create({
      data: {
        senderId,
        receiverId: input.receiverId,
        itemType: input.itemType,
        title: input.title.trim(),
        payload: JSON.stringify(input.payload),
        message: input.message ? input.message.trim() : null,
        status: "PENDING",
      },
    });

    // Create notification for receiver
    await NotificationService.createNotification({
      userId: input.receiverId,
      actorId: senderId,
      category: "FRIENDS",
      type: "FRIEND_RECOMMENDATION",
      title: "New Recommendation",
      message: `${sender.name} recommended: "${input.title}"`,
      actionUrl: `/community?tab=recommendations`,
    });

    return {
      id: created.id,
      senderId: created.senderId,
      senderName: sender.name,
      senderUsername: sender.username,
      receiverId: created.receiverId,
      itemType: created.itemType as RecommendationType,
      title: created.title,
      payload: input.payload,
      message: created.message,
      status: created.status as "PENDING" | "ACCEPTED" | "DISMISSED",
      createdAt: created.createdAt.toISOString(),
    };
  }

  /**
   * Retrieves received recommendations for a user
   */
  static async getReceivedRecommendations(userId: string): Promise<RecommendationDto[]> {
    const list = await (prisma as any).friendRecommendation.findMany({
      where: { receiverId: userId },
      orderBy: { createdAt: "desc" },
    });

    return list.map((r: any) => ({
      id: r.id,
      senderId: r.senderId,
      senderName: r.sender?.name || "Friend",
      senderUsername: r.sender?.username || "friend",
      receiverId: r.receiverId,
      itemType: r.itemType as RecommendationType,
      title: r.title,
      payload: typeof r.payload === "string" ? JSON.parse(r.payload) : r.payload,
      message: r.message,
      status: r.status as "PENDING" | "ACCEPTED" | "DISMISSED",
      createdAt: r.createdAt.toISOString(),
    }));
  }

  /**
   * Responds to a recommendation (SAVE / DISMISS) with strict ownership validation
   */
  static async respondToRecommendation(
    userId: string,
    recommendationId: string,
    action: "SAVE" | "DISMISS"
  ): Promise<{ success: boolean; recommendation: RecommendationDto }> {
    const existing = await (prisma as any).friendRecommendation.findUnique({
      where: { id: recommendationId },
    });

    if (!existing) throw new Error("Recommendation not found");
    if (existing.receiverId !== userId) {
      throw new Error("Unauthorized access to recommendation");
    }

    const newStatus = action === "SAVE" ? "ACCEPTED" : "DISMISSED";
    const updated = await (prisma as any).friendRecommendation.update({
      where: { id: recommendationId },
      data: { status: newStatus },
    });

    return {
      success: true,
      recommendation: {
        id: updated.id,
        senderId: updated.senderId,
        senderName: updated.sender?.name || "Friend",
        senderUsername: updated.sender?.username || "friend",
        receiverId: updated.receiverId,
        itemType: updated.itemType as RecommendationType,
        title: updated.title,
        payload: typeof updated.payload === "string" ? JSON.parse(updated.payload) : updated.payload,
        message: updated.message,
        status: updated.status as "PENDING" | "ACCEPTED" | "DISMISSED",
        createdAt: updated.createdAt.toISOString(),
      },
    };
  }
}
