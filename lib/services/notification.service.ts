import { prisma } from "@/lib/db";
import {
  CreateNotificationInput,
  NotificationCategory,
  UpdateNotificationPreferencesInput,
} from "@/lib/validations/notifications";

export interface NotificationDto {
  id: string;
  userId: string;
  actorId?: string | null;
  category: string;
  type: string;
  title: string;
  message: string;
  link?: string | null;
  actionUrl?: string | null;
  metadata?: any;
  isRead: boolean;
  readAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  actor?: {
    id: string;
    name: string;
    username: string;
  } | null;
}

export interface PaginatedNotificationsResponse {
  notifications: any[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  unreadCount: number;
}

export class NotificationService {
  /**
   * Centralized creation of in-app notifications
   */
  static async createNotification(input: CreateNotificationInput) {
    const pool = prisma as any;

    // Check user preferences if exists
    const prefs = await this.getPreferences(input.userId);

    // Filter by category preference (System and Admin are always delivered)
    if (input.category === "HYDRATION" && !prefs.hydrationReminders) return null;
    if (input.category === "NUTRITION" && !prefs.nutritionReminders) return null;
    if (input.category === "WORKOUTS" && !prefs.workoutReminders) return null;
    if (input.category === "ACTIVITIES" && !prefs.activityReminders) return null;
    if (input.category === "FRIENDS" && !prefs.friendNotifications) return null;
    if (input.category === "INSIGHTS" && !prefs.insightNotifications) return null;
    if (input.category === "FEATURE_REQUEST" && !prefs.featureRequestNotifications) return null;

    // Sanitize actionUrl to prevent open redirects (must be internal path starting with /)
    let safeActionUrl = input.actionUrl || input.link || null;
    if (safeActionUrl && !safeActionUrl.startsWith("/")) {
      safeActionUrl = null;
    }

    return pool.notification.create({
      data: {
        userId: input.userId,
        actorId: input.actorId || null,
        category: input.category,
        type: input.type,
        title: input.title,
        message: input.message,
        actionUrl: safeActionUrl,
        metadata: input.metadata ? JSON.stringify(input.metadata) : null,
        isRead: false,
      },
    });
  }

  /**
   * Backward-compatible alias for getUserNotifications
   */
  static async getUserNotifications(userId: string, limit: number = 20) {
    const res = await this.getNotifications(userId, { limit });
    return res;
  }

  /**
   * Retrieves paginated notifications and unread count for a user
   */
  static async getNotifications(
    userId: string,
    options: {
      category?: NotificationCategory;
      isRead?: boolean;
      page?: number;
      limit?: number;
    } = {}
  ): Promise<PaginatedNotificationsResponse> {
    const pool = prisma as any;
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(50, Math.max(1, options.limit || 20));
    const skip = (page - 1) * limit;

    const where: any = { userId };
    if (options.category) where.category = options.category;
    if (options.isRead !== undefined) where.isRead = options.isRead;

    const [items, total, unreadCount] = await Promise.all([
      pool.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip,
      }),
      pool.notification.count({ where }),
      pool.notification.count({ where: { userId, isRead: false } }),
    ]);

    return {
      notifications: items,
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      unreadCount,
    };
  }

  /**
   * Retrieves unread notification count
   */
  static async getUnreadCount(userId: string): Promise<number> {
    const pool = prisma as any;
    return pool.notification.count({
      where: { userId, isRead: false },
    });
  }

  /**
   * Marks a single notification as read (with strict user ownership verification)
   */
  static async markAsRead(userId: string, notificationId: string) {
    const pool = prisma as any;
    const notification = await pool.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new Error("Notification not found");
    }

    if (notification.userId !== userId) {
      throw new Error("Unauthorized to modify this notification");
    }

    return pool.notification.update({
      where: { id: notificationId },
      data: { isRead: true, readAt: new Date() },
    });
  }

  /**
   * Marks all notifications as read for a user
   */
  static async markAllAsRead(userId: string) {
    const pool = prisma as any;
    return pool.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
  }

  /**
   * Deletes / dismisses a single notification (with strict ownership verification)
   */
  static async deleteNotification(userId: string, notificationId: string) {
    const pool = prisma as any;
    const notification = await pool.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new Error("Notification not found");
    }

    if (notification.userId !== userId) {
      throw new Error("Unauthorized to delete this notification");
    }

    return pool.notification.delete({
      where: { id: notificationId },
    });
  }

  /**
   * Retrieves user notification preferences with fallback defaults
   */
  static async getPreferences(userId: string) {
    const pool = prisma as any;
    let prefs = await pool.userNotificationPreference.findUnique({
      where: { userId },
    });

    if (!prefs) {
      prefs = await pool.userNotificationPreference.create({
        data: {
          userId,
          hydrationReminders: true,
          nutritionReminders: true,
          workoutReminders: false,
          activityReminders: true,
          friendNotifications: true,
          insightNotifications: true,
          featureRequestNotifications: true,
          systemNotifications: true,
          quietHoursEnabled: false,
          quietHoursStart: "22:00",
          quietHoursEnd: "08:00",
          reminderFrequency: "MODERATE",
        },
      });
    }

    return prefs;
  }

  /**
   * Updates user notification preferences
   */
  static async updatePreferences(
    userId: string,
    data: UpdateNotificationPreferencesInput
  ) {
    const pool = prisma as any;
    return pool.userNotificationPreference.upsert({
      where: { userId },
      create: {
        userId,
        ...data,
      },
      update: data,
    });
  }
}