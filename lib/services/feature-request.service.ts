import { prisma } from "@/lib/db";

export interface CreateFeatureRequestInput {
  title: string;
  description: string;
  category?: string;
  priority?: string;
}

export class FeatureRequestService {
  /**
   * Submits a new user feature request.
   */
  static async createRequest(userId: string, input: CreateFeatureRequestInput) {
    if (!input.title || input.title.trim().length === 0) {
      throw new Error("Feature title is required.");
    }
    if (!input.description || input.description.trim().length === 0) {
      throw new Error("Feature description is required.");
    }

    const newReq = await (prisma as any).featureRequest.create({
      data: {
        userId,
        title: input.title.trim(),
        description: input.description.trim(),
        category: input.category || "GENERAL",
        priority: input.priority || "MEDIUM",
        status: "OPEN",
      },
    });

    // Notify Admins
    try {
      const { NotificationService } = await import("@/lib/services/notification.service");
      const admins = await (prisma as any).user.findMany({ where: { role: "ADMIN" } });
      const user = await (prisma as any).user.findUnique({ where: { id: userId } });
      for (const admin of admins || []) {
        await NotificationService.createNotification({
          userId: admin.id,
          actorId: userId,
          category: "ADMIN",
          type: "FEATURE_REQUEST_STATUS",
          title: "New Feature Request",
          message: `${user?.name || "A user"} submitted a new feature request: "${newReq.title}"`,
          actionUrl: "/admin/feature-requests",
        });
      }
    } catch (err) {
      console.error("Failed to notify admin on feature request submission:", err);
    }

    return newReq;
  }

  /**
   * Retrieves all feature requests submitted by a specific user.
   * Privacy rule: Normal users only see their own feature requests.
   */
  static async getUserRequests(userId: string) {
    return (prisma as any).featureRequest.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  }
}
