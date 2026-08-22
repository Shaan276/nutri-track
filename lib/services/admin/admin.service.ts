import { prisma } from "@/lib/db";
import { HealthContextService } from "@/lib/services/health-context.service";

export interface AdminMetricsDto {
  totalUsers: number;
  pendingApprovals: number;
  approvedUsers: number;
  suspendedUsers: number;
  rejectedUsers: number;
  preApprovedCount: number;
  openFeatureRequests: number;
  recentRegistrations: Array<{
    id: string;
    name: string;
    email: string;
    username: string;
    role: string;
    accountStatus: string;
    createdAt: Date;
  }>;
  recentFeatureRequests: Array<{
    id: string;
    title: string;
    category: string;
    priority: string;
    status: string;
    userName: string;
    userEmail: string;
    createdAt: Date;
  }>;
}

export class AdminService {
  /**
   * Aggregates high-level metrics for the Admin Dashboard overview.
   */
  static async getAdminMetrics(): Promise<AdminMetricsDto> {
    const totalUsers = await (prisma as any).user.count();
    const pendingApprovals = await (prisma as any).user.count({ where: { accountStatus: "PENDING_APPROVAL" } });
    const approvedUsers = await (prisma as any).user.count({ where: { accountStatus: "APPROVED" } });
    const suspendedUsers = await (prisma as any).user.count({ where: { accountStatus: "SUSPENDED" } });
    const rejectedUsers = await (prisma as any).user.count({ where: { accountStatus: "REJECTED" } });

    const preApprovedCount = await (prisma as any).preApprovedUser.count({ where: { consumedAt: null } });
    const openFeatureRequests = await (prisma as any).featureRequest.count({ where: { status: "OPEN" } });

    const recentUsersRaw = await (prisma as any).user.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
    });

    const recentRegistrations = recentUsersRaw.map((u: any) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      username: u.username,
      role: u.role || "USER",
      accountStatus: u.accountStatus || "PENDING_APPROVAL",
      createdAt: u.createdAt,
    }));

    const recentRequestsRaw = await (prisma as any).featureRequest.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
    });

    const recentFeatureRequests = await Promise.all(
      recentRequestsRaw.map(async (fr: any) => {
        const user = await (prisma as any).user.findUnique({ where: { id: fr.userId } });
        return {
          id: fr.id,
          title: fr.title,
          category: fr.category,
          priority: fr.priority,
          status: fr.status,
          userName: user?.name || "Unknown User",
          userEmail: user?.email || "unknown@domain.com",
          createdAt: fr.createdAt,
        };
      })
    );

    return {
      totalUsers,
      pendingApprovals,
      approvedUsers,
      suspendedUsers,
      rejectedUsers,
      preApprovedCount,
      openFeatureRequests,
      recentRegistrations,
      recentFeatureRequests,
    };
  }

  /**
   * Retrieves a paginated and filtered list of users for user management.
   */
  static async getUsers(params: {
    status?: string;
    search?: string;
    role?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.max(1, Math.min(100, params.limit || 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params.status && params.status !== "ALL") {
      where.accountStatus = params.status;
    }
    if (params.role && params.role !== "ALL") {
      where.role = params.role;
    }
    if (params.search && params.search.trim().length > 0) {
      const q = params.search.trim().toLowerCase();
      where.OR = [
        { name: { contains: q } },
        { email: { contains: q } },
        { username: { contains: q } },
      ];
    }

    const [users, total] = await Promise.all([
      (prisma as any).user.findMany({
        where,
        take: limit,
        skip,
        orderBy: { createdAt: "desc" },
      }),
      (prisma as any).user.count({ where }),
    ]);

    const enrichedUsers = await Promise.all(
      users.map(async (u: any) => {
        const profile = await (prisma as any).userProfile.findUnique({ where: { userId: u.id } });
        return {
          id: u.id,
          name: u.name,
          email: u.email,
          username: u.username,
          role: u.role || "USER",
          accountStatus: u.accountStatus || "PENDING_APPROVAL",
          approvedAt: u.approvedAt,
          approvedByAdminId: u.approvedByAdminId,
          createdAt: u.createdAt,
          updatedAt: u.updatedAt,
          profile: profile
            ? {
                biologicalSex: profile.biologicalSex,
                heightCm: profile.heightCm,
                weightKg: profile.weightKg,
                activityLevel: profile.activityLevel,
                primaryGoal: profile.primaryGoal,
              }
            : null,
        };
      })
    );

    return {
      users: enrichedUsers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Retrieves comprehensive user dossier with full privacy master access.
   * Strips password hashes and secrets.
   */
  static async getUserDetail(userId: string) {
    const user = await (prisma as any).user.findUnique({ where: { id: userId } });
    if (!user) return null;

    const profile = await (prisma as any).userProfile.findUnique({ where: { userId } });
    const nutrientTarget = await (prisma as any).userNutrientTarget.findUnique({ where: { userId } });
    const privacySettings = await (prisma as any).privacySetting.findMany({ where: { userId } });

    // Recent activity & nutrition logs
    const [recentMeals, recentHydration, recentActivities, recentWorkouts, featureRequests] = await Promise.all([
      (prisma as any).mealLog.findMany({ where: { userId }, take: 10, orderBy: { date: "desc" } }),
      (prisma as any).hydrationLog.findMany({ where: { userId }, take: 10, orderBy: { date: "desc" } }),
      (prisma as any).activityLog.findMany({ where: { userId }, take: 10, orderBy: { date: "desc" } }),
      (prisma as any).workoutSession.findMany({ where: { userId }, take: 10, orderBy: { startTime: "desc" } }),
      (prisma as any).featureRequest.findMany({ where: { userId }, orderBy: { createdAt: "desc" } }),
    ]);

    // Compute live health snapshot for user
    const healthSnapshot = await HealthContextService.getHealthSnapshot(userId);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        username: user.username,
        role: user.role || "USER",
        accountStatus: user.accountStatus || "PENDING_APPROVAL",
        approvedAt: user.approvedAt,
        approvedByAdminId: user.approvedByAdminId,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      profile,
      nutrientTarget,
      privacySettings,
      healthSnapshot,
      recentActivity: {
        meals: recentMeals,
        hydration: recentHydration,
        activities: recentActivities,
        workouts: recentWorkouts,
      },
      featureRequests,
    };
  }

  /**
   * Updates a user's account approval status.
   */
  static async updateUserStatus(
    adminId: string,
    targetUserId: string,
    newStatus: "PENDING_APPROVAL" | "APPROVED" | "REJECTED" | "SUSPENDED",
    _reason?: string
  ) {
    const isApproved = newStatus === "APPROVED";
    const updated = await (prisma as any).user.update({
      where: { id: targetUserId },
      data: {
        accountStatus: newStatus,
        approvedAt: isApproved ? new Date() : null,
        approvedByAdminId: isApproved ? adminId : null,
      },
    });

    // Send account lifecycle notification
    try {
      const { NotificationService } = await import("@/lib/services/notification.service");
      if (newStatus === "APPROVED") {
        await NotificationService.createNotification({
          userId: targetUserId,
          category: "SYSTEM",
          type: "USER_APPROVED",
          title: "Account Approved!",
          message: "Your Nutri-Track account has been approved by the administrator. Welcome aboard!",
          actionUrl: "/app",
        });
      } else if (newStatus === "SUSPENDED") {
        await NotificationService.createNotification({
          userId: targetUserId,
          category: "SYSTEM",
          type: "USER_SUSPENDED",
          title: "Account Suspended",
          message: "Your account access has been temporarily suspended by an administrator.",
        });
      } else if (newStatus === "REJECTED") {
        await NotificationService.createNotification({
          userId: targetUserId,
          category: "SYSTEM",
          type: "USER_REJECTED",
          title: "Registration Update",
          message: "Your account registration was not approved at this time.",
        });
      }
    } catch (err) {
      console.error("Failed to notify user on status change:", err);
    }

    return updated;
  }

  /**
   * Updates a user's administrative role.
   */
  static async updateUserRole(adminId: string, targetUserId: string, newRole: "USER" | "ADMIN") {
    const updated = await (prisma as any).user.update({
      where: { id: targetUserId },
      data: {
        role: newRole,
      },
    });
    return updated;
  }

  /**
   * Retrieves all pre-approved allowlist entries.
   */
  static async getPreApprovedUsers() {
    return (prisma as any).preApprovedUser.findMany({
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Adds an email to the pre-approved allowlist.
   */
  static async addPreApproval(adminId: string, email: string, notes?: string) {
    const normalizedEmail = email.toLowerCase().trim();
    const existing = await (prisma as any).preApprovedUser.findUnique({
      where: { identifier: normalizedEmail },
    });

    if (existing) {
      if (existing.consumedAt) {
        throw new Error("This email has already been consumed by an existing user.");
      }
      return existing;
    }

    return (prisma as any).preApprovedUser.create({
      data: {
        identifier: normalizedEmail,
        identifierType: "EMAIL",
        notes: notes || null,
        createdByAdminId: adminId,
      },
    });
  }

  /**
   * Removes an entry from the pre-approved allowlist.
   */
  static async removePreApproval(id: string) {
    return (prisma as any).preApprovedUser.delete({
      where: { id },
    });
  }

  /**
   * Retrieves all feature requests with user info.
   */
  static async getFeatureRequests(params: {
    status?: string;
    search?: string;
    userId?: string;
  } = {}) {
    const where: any = {};
    if (params.status && params.status !== "ALL") {
      where.status = params.status;
    }
    if (params.userId) {
      where.userId = params.userId;
    }

    const requests = await (prisma as any).featureRequest.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return Promise.all(
      requests.map(async (fr: any) => {
        const user = await (prisma as any).user.findUnique({ where: { id: fr.userId } });
        return {
          ...fr,
          userName: user?.name || "Unknown User",
          userEmail: user?.email || "unknown@domain.com",
        };
      })
    );
  }

  /**
   * Updates feature request status and admin response.
   */
  static async updateFeatureRequest(
    adminId: string,
    requestId: string,
    status: string,
    adminResponse?: string
  ) {
    const updated = await (prisma as any).featureRequest.update({
      where: { id: requestId },
      data: {
        status,
        adminResponse: adminResponse || null,
        respondedAt: new Date(),
        respondedByAdminId: adminId,
      },
    });

    // Notify user of status update / response
    try {
      const { NotificationService } = await import("@/lib/services/notification.service");
      await NotificationService.createNotification({
        userId: updated.userId,
        actorId: adminId,
        category: "FEATURE_REQUEST",
        type: adminResponse ? "FEATURE_REQUEST_RESPONSE" : "FEATURE_REQUEST_STATUS",
        title: `Feature Request: ${updated.title}`,
        message: adminResponse
          ? `Status: ${status}. Admin response: "${adminResponse}"`
          : `Your feature request status changed to ${status}.`,
        actionUrl: "/app",
      });
    } catch (err) {
      console.error("Failed to notify user on feature request update:", err);
    }

    return updated;
  }

  /**
   * Deletes a user account and associated user data.
   */
  static async deleteUser(targetUserId: string, adminUserId: string) {
    if (targetUserId === adminUserId) {
      throw new Error("You cannot delete your own admin account.");
    }

    const pool = prisma as any;
    const user = await pool.user.findUnique({ where: { id: targetUserId } });
    if (!user) {
      throw new Error("User not found.");
    }

    // Cascade delete user data
    if (typeof pool.mealLog?.deleteMany === "function") await pool.mealLog.deleteMany({ where: { userId: targetUserId } });
    if (typeof pool.hydrationLog?.deleteMany === "function") await pool.hydrationLog.deleteMany({ where: { userId: targetUserId } });
    if (typeof pool.activityLog?.deleteMany === "function") await pool.activityLog.deleteMany({ where: { userId: targetUserId } });
    if (typeof pool.workoutSession?.deleteMany === "function") await pool.workoutSession.deleteMany({ where: { userId: targetUserId } });
    if (typeof pool.weeklyPlan?.deleteMany === "function") await pool.weeklyPlan.deleteMany({ where: { userId: targetUserId } });
    if (typeof pool.food?.deleteMany === "function") await pool.food.deleteMany({ where: { userId: targetUserId } });

    await pool.user.delete({ where: { id: targetUserId } });
    return { success: true, message: `User "${user.name}" (${user.email}) deleted successfully.` };
  }
}
