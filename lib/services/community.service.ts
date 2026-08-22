import { prisma } from "@/lib/db";
import { PrivacyService, UserPrivacySettingsDto } from "./privacy.service";
import { NotificationService } from "./notification.service";
import { ReportService } from "./report.service";
import { SmartInsightsService } from "./insights/smart-insights.service";
import { HydrationService } from "./hydration.service";
import { NutritionService } from "./nutrition.service";

export type RelationshipStatus =
  | "NONE"
  | "PENDING_SENT"
  | "PENDING_RECEIVED"
  | "ACCEPTED"
  | "BLOCKED";

export interface UserSearchResult {
  id: string;
  name: string;
  username: string;
  relationshipStatus: RelationshipStatus;
  friendshipId?: string;
}

export interface FriendSummaryDto {
  id: string;
  friendshipId: string;
  name: string;
  username: string;
  friendsSince: string;
  sharedHealthScore: number | null;
  sharedGrade: string | null;
  sharedWeeklyWorkouts: number | null;
  sharedWeeklyRunningKm: number | null;
  sharedHydrationStreak: number | null;
  privacy: UserPrivacySettingsDto;
}

export interface SharedProfileSection<T> {
  isPrivate: boolean;
  hasNoData?: boolean;
  data: T | null;
}

export interface FriendSharedProfileDto {
  user: {
    id: string;
    name: string;
    username: string;
  };
  relationshipStatus: RelationshipStatus;
  isSelf: boolean;
  friendsSince?: string;
  healthScore: SharedProfileSection<{
    score: number;
    grade: string;
    gradeLabel: string;
    isPending: boolean;
  }>;
  nutrition: SharedProfileSection<{
    avgCalories: number;
    calorieAdherencePercent: number;
    proteinAdherencePercent: number;
    consistencyScore: number;
  }>;
  hydration: SharedProfileSection<{
    weeklyAverageMl: number;
    streakDays: number;
    goalMetPercent: number;
  }>;
  activities: SharedProfileSection<{
    weeklyRunningKm: number;
    weeklySessions: number;
    avgPaceFormatted: string | null;
    weeklySteps: number;
  }>;
  workouts: SharedProfileSection<{
    weeklySessions: number;
    weeklySets: number;
    totalVolumeKg: number;
  }>;
  achievements: SharedProfileSection<
    Array<{
      key: string;
      title: string;
      value: string;
      unit: string;
      achievedDate: string;
    }>
  >;
}

export interface MutualComparisonMetric {
  key: string;
  label: string;
  unit: string;
  myValue: number | string | null;
  friendValue: number | string | null;
  isSharedByBoth: boolean;
  unavailableReason?: string;
}

export interface ActivityFeedItem {
  id: string;
  friendId: string;
  friendName: string;
  friendUsername: string;
  type: "RUN" | "WORKOUT" | "HYDRATION" | "ACHIEVEMENT";
  title: string;
  description: string;
  timestamp: string;
}

export class CommunityService {
  /**
   * Search for users by username or display name (debounced server search)
   * Strict privacy: Email, passwords, and private IDs are never exposed.
   */
  static async searchUsers(requesterId: string, query: string): Promise<UserSearchResult[]> {
    const cleanQuery = query.trim().toLowerCase();
    if (!cleanQuery) return [];

    const pool = (prisma as any);
    const users = await pool.user.findMany({
      where: {
        AND: [
          { id: { not: requesterId } },
          {
            OR: [
              { username: { contains: cleanQuery } },
              { name: { contains: cleanQuery } },
            ],
          },
        ],
      },
      take: 20,
    });

    const results: UserSearchResult[] = [];

    for (const u of users) {
      const friendship = await (prisma as any).friendship.findFirst({
        where: {
          OR: [
            { requesterId, addresseeId: u.id },
            { requesterId: u.id, addresseeId: requesterId },
          ],
        },
      });

      let relationshipStatus: RelationshipStatus = "NONE";
      if (friendship) {
        if (friendship.status === "ACCEPTED") {
          relationshipStatus = "ACCEPTED";
        } else if (friendship.status === "BLOCKED") {
          relationshipStatus = "BLOCKED";
        } else if (friendship.status === "PENDING") {
          relationshipStatus =
            friendship.requesterId === requesterId ? "PENDING_SENT" : "PENDING_RECEIVED";
        }
      }

      results.push({
        id: u.id,
        name: u.name,
        username: u.username,
        relationshipStatus,
        friendshipId: friendship?.id,
      });
    }

    return results;
  }

  /**
   * Sends a friend request to another user by ID or Username
   */
  static async sendFriendRequest(
    requesterId: string,
    targetIdentifier: string
  ): Promise<{ friendship: any; autoAccepted: boolean }> {
    const targetUser = await prisma.user.findFirst({
      where: {
        OR: [{ id: targetIdentifier }, { username: targetIdentifier.toLowerCase() }],
      },
    });

    if (!targetUser) throw new Error("User not found");
    if (targetUser.id === requesterId) {
      throw new Error("You cannot send a friend request to yourself");
    }

    const requester = await prisma.user.findUnique({ where: { id: requesterId } });
    if (!requester) throw new Error("Requester not found");

    // Check existing friendship in either direction
    const existing = await (prisma as any).friendship.findFirst({
      where: {
        OR: [
          { requesterId, addresseeId: targetUser.id },
          { requesterId: targetUser.id, addresseeId: requesterId },
        ],
      },
    });

    if (existing) {
      if (existing.status === "ACCEPTED") {
        throw new Error("You are already friends with this user");
      }
      if (existing.status === "BLOCKED") {
        throw new Error("Cannot send friend request to this user");
      }
      // If target user already sent a pending request to requester, auto-accept it!
      if (existing.requesterId === targetUser.id && existing.status === "PENDING") {
        const updated = await (prisma as any).friendship.update({
          where: { id: existing.id },
          data: { status: "ACCEPTED" },
        });

        await NotificationService.createNotification({
          userId: targetUser.id,
          actorId: requesterId,
          category: "FRIENDS",
          type: "FRIEND_ACCEPTED",
          title: "Friend Request Accepted",
          message: `${requester.name} accepted your friend request!`,
          actionUrl: `/community/${requester.username}`,
        });

        return { friendship: updated, autoAccepted: true };
      }

      if (existing.requesterId === requesterId && existing.status === "PENDING") {
        return { friendship: existing, autoAccepted: false };
      }
    }

    const created = await (prisma as any).friendship.create({
      data: {
        requesterId,
        addresseeId: targetUser.id,
        status: "PENDING",
      },
    });

    await NotificationService.createNotification({
      userId: targetUser.id,
      actorId: requesterId,
      category: "FRIENDS",
      type: "FRIEND_REQUEST",
      title: "New Friend Request",
      message: `${requester.name} sent you a friend request.`,
      actionUrl: `/community?tab=requests`,
    });

    return { friendship: created, autoAccepted: false };
  }

  /**
   * Responds to a friend request (ACCEPT / DECLINE / BLOCK)
   */
  static async respondToFriendRequest(
    userId: string,
    friendshipId: string,
    action: "ACCEPT" | "DECLINE" | "BLOCK"
  ): Promise<{ success: boolean; status: string }> {
    const friendship = await (prisma as any).friendship.findUnique({
      where: { id: friendshipId },
    });

    if (!friendship) throw new Error("Friend request not found");
    if (friendship.addresseeId !== userId) {
      throw new Error("Unauthorized: You are not the recipient of this friend request");
    }

    if (action === "ACCEPT") {
      await (prisma as any).friendship.update({
        where: { id: friendshipId },
        data: { status: "ACCEPTED" },
      });

      const recipient = await prisma.user.findUnique({ where: { id: userId } });
      await NotificationService.createNotification({
        userId: friendship.requesterId,
        actorId: userId,
        category: "FRIENDS",
        type: "FRIEND_ACCEPTED",
        title: "Friend Request Accepted",
        message: `${recipient?.name || "A user"} accepted your friend request!`,
        actionUrl: `/community/${recipient?.username || ""}`,
      });

      return { success: true, status: "ACCEPTED" };
    }

    if (action === "DECLINE") {
      await (prisma as any).friendship.delete({
        where: { id: friendshipId },
      });
      return { success: true, status: "DECLINED" };
    }

    if (action === "BLOCK") {
      await (prisma as any).friendship.update({
        where: { id: friendshipId },
        data: { status: "BLOCKED" },
      });
      return { success: true, status: "BLOCKED" };
    }

    throw new Error("Invalid response action");
  }

  /**
   * Removes an existing friend
   */
  static async removeFriend(userId: string, targetUserId: string): Promise<boolean> {
    const friendship = await (prisma as any).friendship.findFirst({
      where: {
        status: "ACCEPTED",
        OR: [
          { requesterId: userId, addresseeId: targetUserId },
          { requesterId: targetUserId, addresseeId: userId },
        ],
      },
    });

    if (!friendship) throw new Error("Friendship not found");

    await (prisma as any).friendship.delete({
      where: { id: friendship.id },
    });

    return true;
  }

  /**
   * Retrieves all accepted friends for a user with safe high-level metrics
   */
  static async getFriends(userId: string): Promise<FriendSummaryDto[]> {
    const friendships = await (prisma as any).friendship.findMany({
      where: {
        status: "ACCEPTED",
        OR: [{ requesterId: userId }, { addresseeId: userId }],
      },
    });

    const friendDtos: FriendSummaryDto[] = [];

    for (const f of friendships) {
      const friendId = f.requesterId === userId ? f.addresseeId : f.requesterId;
      const friendUser = await prisma.user.findUnique({ where: { id: friendId } });
      if (!friendUser) continue;

      const privacy = await PrivacyService.getPrivacySettings(friendId);

      let sharedHealthScore: number | null = null;
      let sharedGrade: string | null = null;
      let sharedWeeklyWorkouts: number | null = null;
      let sharedWeeklyRunningKm: number | null = null;
      let sharedHydrationStreak: number | null = null;

      const canSeeHealthScore = await PrivacyService.canAccessCategory(userId, friendId, "INSIGHTS_PROGRESS");
      const canSeeWorkouts = await PrivacyService.canAccessCategory(userId, friendId, "WORKOUTS");
      const canSeeActivities = await PrivacyService.canAccessCategory(userId, friendId, "ACTIVITIES");
      const canSeeHydration = await PrivacyService.canAccessCategory(userId, friendId, "HYDRATION");

      if (canSeeHealthScore) {
        const hs = await SmartInsightsService.getHealthScore(friendId);
        sharedHealthScore = hs.isPending ? null : hs.overallScore;
        sharedGrade = hs.grade;
      }

      if (canSeeWorkouts) {
        const rep = await ReportService.getFullReport(friendId, "thisWeek");
        sharedWeeklyWorkouts = rep.overview?.workouts?.totalSessions || 0;
      }

      if (canSeeActivities) {
        const rep = await ReportService.getFullReport(friendId, "thisWeek");
        sharedWeeklyRunningKm = rep.overview?.activities?.totalDistanceKm || 0;
      }

      if (canSeeHydration) {
        const todayStr = new Date().toISOString().split("T")[0];
        const hyd = await HydrationService.getDailyHydration(friendId, todayStr);
        sharedHydrationStreak = hyd.streakDays;
      }

      friendDtos.push({
        id: friendUser.id,
        friendshipId: f.id,
        name: friendUser.name,
        username: friendUser.username,
        friendsSince: f.createdAt.toISOString(),
        sharedHealthScore,
        sharedGrade,
        sharedWeeklyWorkouts,
        sharedWeeklyRunningKm,
        sharedHydrationStreak,
        privacy,
      });
    }

    return friendDtos;
  }

  /**
   * Retrieves pending incoming and outgoing friend requests
   */
  static async getPendingRequests(userId: string): Promise<{
    incoming: any[];
    outgoing: any[];
  }> {
    const incoming = await (prisma as any).friendship.findMany({
      where: {
        addresseeId: userId,
        status: "PENDING",
      },
    });

    const outgoing = await (prisma as any).friendship.findMany({
      where: {
        requesterId: userId,
        status: "PENDING",
      },
    });

    return {
      incoming: incoming.map((f: any) => ({
        id: f.id,
        requesterId: f.requesterId,
        name: f.requester?.name || "User",
        username: f.requester?.username || "user",
        createdAt: f.createdAt.toISOString(),
      })),
      outgoing: outgoing.map((f: any) => ({
        id: f.id,
        addresseeId: f.addresseeId,
        name: f.addressee?.name || "User",
        username: f.addressee?.username || "user",
        createdAt: f.createdAt.toISOString(),
      })),
    };
  }

  /**
   * Retrieves a friend's shared profile strictly filtered by their privacy settings.
   */
  static async getFriendSharedProfile(
    requesterId: string,
    targetUsername: string
  ): Promise<FriendSharedProfileDto> {
    const targetUser = await prisma.user.findUnique({
      where: { username: targetUsername.toLowerCase() },
    });

    if (!targetUser) throw new Error("User not found");

    const isSelf = requesterId === targetUser.id;
    let relationshipStatus: RelationshipStatus = "NONE";
    let friendsSince: string | undefined;

    if (!isSelf) {
      const friendship = await (prisma as any).friendship.findFirst({
        where: {
          OR: [
            { requesterId, addresseeId: targetUser.id },
            { requesterId: targetUser.id, addresseeId: requesterId },
          ],
        },
      });

      if (friendship) {
        if (friendship.status === "ACCEPTED") {
          relationshipStatus = "ACCEPTED";
          friendsSince = friendship.createdAt.toISOString();
        } else if (friendship.status === "BLOCKED") {
          relationshipStatus = "BLOCKED";
        } else if (friendship.status === "PENDING") {
          relationshipStatus =
            friendship.requesterId === requesterId ? "PENDING_SENT" : "PENDING_RECEIVED";
        }
      }
    } else {
      relationshipStatus = "ACCEPTED";
    }

    const access = await PrivacyService.canAccessCategoriesBatch(requesterId, targetUser.id, [
      "PROFILE",
      "NUTRITION",
      "DEEP_NUTRITION",
      "HYDRATION",
      "ACTIVITIES",
      "WORKOUTS",
      "INSIGHTS_PROGRESS",
      "REPORTS",
    ]);

    // 1. Health Score
    let healthScoreData: any = null;
    let healthScoreHasNoData = false;
    if (access.INSIGHTS_PROGRESS) {
      const hs = await SmartInsightsService.getHealthScore(targetUser.id);
      if (hs.isPending) {
        healthScoreHasNoData = true;
        healthScoreData = {
          score: null,
          grade: "PENDING",
          gradeLabel: hs.gradeLabel || "Getting Started",
          isPending: true,
        };
      } else {
        healthScoreData = {
          score: hs.overallScore,
          grade: hs.grade,
          gradeLabel: hs.gradeLabel,
          isPending: false,
        };
      }
    }

    // 2. Nutrition Summary (Aggregated adherence ONLY, never raw food entries)
    let nutritionData: any = null;
    let nutritionHasNoData = false;
    if (access.NUTRITION) {
      const rep = await ReportService.getFullReport(targetUser.id, "last7days");
      const loggedDays = rep.overview?.nutrition?.loggedDaysCount || 0;
      if (loggedDays === 0) {
        nutritionHasNoData = true;
      }
      nutritionData = {
        avgCalories: rep.overview?.nutrition?.avgCalories || 0,
        calorieAdherencePercent: rep.overview?.nutrition?.goalAdherencePct || 0,
        proteinAdherencePercent: rep.overview?.nutrition?.goalAdherencePct || 0,
        consistencyScore: rep.consistencyScore?.score || 0,
        loggedDaysCount: loggedDays,
      };
    }

    // 3. Hydration Summary
    let hydrationData: any = null;
    let hydrationHasNoData = false;
    if (access.HYDRATION) {
      const rep = await ReportService.getFullReport(targetUser.id, "last7days");
      const todayStr = new Date().toISOString().split("T")[0];
      const hyd = await HydrationService.getDailyHydration(targetUser.id, todayStr);
      const loggedDays = rep.overview?.hydration?.loggedDaysCount || 0;
      if (loggedDays === 0 && hyd.totalMl === 0) {
        hydrationHasNoData = true;
      }
      hydrationData = {
        weeklyAverageMl: rep.overview?.hydration?.avgIntakeMl || 0,
        streakDays: hyd.streakDays,
        goalMetPercent: rep.overview?.hydration?.goalAchievementPct || 0,
      };
    }

    // 4. Activities & Running Summary
    let activitiesData: any = null;
    let activitiesHasNoData = false;
    if (access.ACTIVITIES) {
      const rep = await ReportService.getFullReport(targetUser.id, "thisWeek");
      const totalSessions = rep.overview?.activities?.totalSessions || 0;
      if (totalSessions === 0) {
        activitiesHasNoData = true;
      }
      activitiesData = {
        weeklyRunningKm: rep.overview?.activities?.totalDistanceKm || 0,
        weeklySessions: totalSessions,
        avgPaceFormatted: rep.overview?.activities?.avgPaceFormatted || null,
        weeklySteps: rep.overview?.activities?.totalSteps || 0,
      };
    }

    // 5. Workout Summary
    let workoutsData: any = null;
    let workoutsHasNoData = false;
    if (access.WORKOUTS) {
      const rep = await ReportService.getFullReport(targetUser.id, "thisWeek");
      const totalSessions = rep.overview?.workouts?.totalSessions || 0;
      if (totalSessions === 0) {
        workoutsHasNoData = true;
      }
      workoutsData = {
        weeklySessions: totalSessions,
        weeklySets: rep.overview?.workouts?.totalSets || 0,
        totalVolumeKg: rep.overview?.workouts?.totalVolumeKg || 0,
      };
    }

    // 6. Achievements & Personal Records
    let achievementsData: any = null;
    let achievementsHasNoData = false;
    if (access.INSIGHTS_PROGRESS) {
      const rep = await ReportService.getFullReport(targetUser.id, "last30days");
      achievementsData = (rep.personalRecords || []).map((pr) => ({
        key: pr.key,
        title: pr.title,
        value: pr.value,
        unit: pr.unit,
        achievedDate: pr.achievedDate,
      }));
      if (achievementsData.length === 0) {
        achievementsHasNoData = true;
      }
    }

    return {
      user: {
        id: targetUser.id,
        name: targetUser.name,
        username: targetUser.username,
      },
      relationshipStatus,
      isSelf,
      friendsSince,
      healthScore: {
        isPrivate: !access.INSIGHTS_PROGRESS,
        hasNoData: healthScoreHasNoData,
        data: access.INSIGHTS_PROGRESS ? healthScoreData : null,
      },
      nutrition: {
        isPrivate: !access.NUTRITION,
        hasNoData: nutritionHasNoData,
        data: access.NUTRITION ? nutritionData : null,
      },
      hydration: {
        isPrivate: !access.HYDRATION,
        hasNoData: hydrationHasNoData,
        data: access.HYDRATION ? hydrationData : null,
      },
      activities: {
        isPrivate: !access.ACTIVITIES,
        hasNoData: activitiesHasNoData,
        data: access.ACTIVITIES ? activitiesData : null,
      },
      workouts: {
        isPrivate: !access.WORKOUTS,
        hasNoData: workoutsHasNoData,
        data: access.WORKOUTS ? workoutsData : null,
      },
      achievements: {
        isPrivate: !access.INSIGHTS_PROGRESS,
        hasNoData: achievementsHasNoData,
        data: access.INSIGHTS_PROGRESS ? achievementsData : null,
      },
    };
  }

  /**
   * Retrieves mutual comparison metrics strictly for categories shared by BOTH users.
   */
  static async getFriendComparison(
    requesterId: string,
    targetUsername: string
  ): Promise<{
    friend: { id: string; name: string; username: string };
    metrics: MutualComparisonMetric[];
    supportiveInsight: string;
  }> {
    const targetUser = await prisma.user.findUnique({
      where: { username: targetUsername.toLowerCase() },
    });

    if (!targetUser) throw new Error("Friend not found");
    if (targetUser.id === requesterId) {
      throw new Error("Cannot compare with yourself");
    }

    // Verify friendship
    const friendship = await (prisma as any).friendship.findFirst({
      where: {
        status: "ACCEPTED",
        OR: [
          { requesterId, addresseeId: targetUser.id },
          { requesterId: targetUser.id, addresseeId: requesterId },
        ],
      },
    });

    if (!friendship) {
      throw new Error("You can only compare progress with accepted friends");
    }

    const myPrivacy = await PrivacyService.getPrivacySettings(requesterId);
    const friendPrivacy = await PrivacyService.getPrivacySettings(targetUser.id);

    const metrics: MutualComparisonMetric[] = [];

    // 1. Health Score Comparison
    const canISeeFriendHS = await PrivacyService.canAccessCategory(requesterId, targetUser.id, "INSIGHTS_PROGRESS");
    const canFriendSeeMyHS = await PrivacyService.canAccessCategory(targetUser.id, requesterId, "INSIGHTS_PROGRESS");
    const bothShareHealthScore = canISeeFriendHS && canFriendSeeMyHS;
    if (bothShareHealthScore) {
      const myHS = await SmartInsightsService.getHealthScore(requesterId);
      const friendHS = await SmartInsightsService.getHealthScore(targetUser.id);
      metrics.push({
        key: "health_score",
        label: "Health Score",
        unit: "/100",
        myValue: myHS.isPending ? "Pending" : myHS.overallScore,
        friendValue: friendHS.isPending ? "Pending" : friendHS.overallScore,
        isSharedByBoth: true,
      });
    } else {
      metrics.push({
        key: "health_score",
        label: "Health Score",
        unit: "/100",
        myValue: null,
        friendValue: null,
        isSharedByBoth: false,
        unavailableReason: "Private (requires both users to enable Health Score sharing)",
      });
    }

    // 2. Weekly Running Distance
    const canISeeFriendAct = await PrivacyService.canAccessCategory(requesterId, targetUser.id, "ACTIVITIES");
    const canFriendSeeMyAct = await PrivacyService.canAccessCategory(targetUser.id, requesterId, "ACTIVITIES");
    const bothShareActivities = canISeeFriendAct && canFriendSeeMyAct;
    if (bothShareActivities) {
      const myRep = await ReportService.getFullReport(requesterId, "thisWeek");
      const friendRep = await ReportService.getFullReport(targetUser.id, "thisWeek");
      metrics.push({
        key: "running_distance",
        label: "Weekly Running Distance",
        unit: "km",
        myValue: myRep.overview?.activities?.totalDistanceKm || 0,
        friendValue: friendRep.overview?.activities?.totalDistanceKm || 0,
        isSharedByBoth: true,
      });
    } else {
      metrics.push({
        key: "running_distance",
        label: "Weekly Running Distance",
        unit: "km",
        myValue: null,
        friendValue: null,
        isSharedByBoth: false,
        unavailableReason: "Private (requires both users to enable Activities sharing)",
      });
    }

    // 3. Weekly Workout Sessions
    const canISeeFriendWk = await PrivacyService.canAccessCategory(requesterId, targetUser.id, "WORKOUTS");
    const canFriendSeeMyWk = await PrivacyService.canAccessCategory(targetUser.id, requesterId, "WORKOUTS");
    const bothShareWorkouts = canISeeFriendWk && canFriendSeeMyWk;
    if (bothShareWorkouts) {
      const myRep = await ReportService.getFullReport(requesterId, "thisWeek");
      const friendRep = await ReportService.getFullReport(targetUser.id, "thisWeek");
      metrics.push({
        key: "workout_sessions",
        label: "Weekly Workout Sessions",
        unit: "sessions",
        myValue: myRep.overview?.workouts?.totalSessions || 0,
        friendValue: friendRep.overview?.workouts?.totalSessions || 0,
        isSharedByBoth: true,
      });
    } else {
      metrics.push({
        key: "workout_sessions",
        label: "Weekly Workout Sessions",
        unit: "sessions",
        myValue: null,
        friendValue: null,
        isSharedByBoth: false,
        unavailableReason: "Private (requires both users to enable Workouts sharing)",
      });
    }

    // 4. Hydration Consistency & Streak
    const canISeeFriendHyd = await PrivacyService.canAccessCategory(requesterId, targetUser.id, "HYDRATION");
    const canFriendSeeMyHyd = await PrivacyService.canAccessCategory(targetUser.id, requesterId, "HYDRATION");
    const bothShareHydration = canISeeFriendHyd && canFriendSeeMyHyd;
    if (bothShareHydration) {
      const todayStr = new Date().toISOString().split("T")[0];
      const myHyd = await HydrationService.getDailyHydration(requesterId, todayStr);
      const friendHyd = await HydrationService.getDailyHydration(targetUser.id, todayStr);
      metrics.push({
        key: "hydration_streak",
        label: "Hydration Logging Streak",
        unit: "days",
        myValue: myHyd.streakDays,
        friendValue: friendHyd.streakDays,
        isSharedByBoth: true,
      });
    } else {
      metrics.push({
        key: "hydration_streak",
        label: "Hydration Logging Streak",
        unit: "days",
        myValue: null,
        friendValue: null,
        isSharedByBoth: false,
        unavailableReason: "Private (requires both users to enable Hydration sharing)",
      });
    }

    // Generate supportive, positive insight (no shaming)
    let supportiveInsight = `Connecting with ${targetUser.name} helps build healthy consistency!`;
    if (bothShareWorkouts) {
      const myRep = await ReportService.getFullReport(requesterId, "thisWeek");
      const friendRep = await ReportService.getFullReport(targetUser.id, "thisWeek");
      const fWk = friendRep.overview?.workouts?.totalSessions || 0;
      const myWk = myRep.overview?.workouts?.totalSessions || 0;
      if (fWk > 0 && myWk > 0) {
        supportiveInsight = `Great teamwork! Both of you have logged workout sessions this week.`;
      } else if (fWk > 0) {
        supportiveInsight = `Your friend ${targetUser.name} completed ${fWk} workout session${fWk > 1 ? "s" : ""} this week — great inspiration for your next session!`;
      }
    }

    return {
      friend: {
        id: targetUser.id,
        name: targetUser.name,
        username: targetUser.username,
      },
      metrics,
      supportiveInsight,
    };
  }

  /**
   * Retrieves lightweight community activity feed among accepted friends
   */
  static async getActivityFeed(userId: string): Promise<ActivityFeedItem[]> {
    const friends = await this.getFriends(userId);
    if (friends.length === 0) return [];

    const feed: ActivityFeedItem[] = [];

    for (const f of friends) {
      const canSeeActivities = await PrivacyService.canAccessCategory(userId, f.id, "ACTIVITIES");
      const canSeeWorkouts = await PrivacyService.canAccessCategory(userId, f.id, "WORKOUTS");

      // 1. Recent runs if activities shared
      if (canSeeActivities) {
        const pool = (prisma as any);
        const runs = await pool.activityLog.findMany({
          where: { userId: f.id, activityType: "RUNNING" },
          take: 2,
          orderBy: { createdAt: "desc" },
        });

        for (const r of runs) {
          feed.push({
            id: `feed_run_${r.id}`,
            friendId: f.id,
            friendName: f.name,
            friendUsername: f.username,
            type: "RUN",
            title: `Completed a Run`,
            description: `${f.name} logged a ${r.distanceKm ? `${r.distanceKm} km` : `${r.durationMinutes} min`} run.`,
            timestamp: r.createdAt.toISOString(),
          });
        }
      }

      // 2. Recent workouts if workouts shared
      if (canSeeWorkouts) {
        const pool = (prisma as any);
        const wks = await pool.workoutSession.findMany({
          where: { userId: f.id },
          take: 2,
          orderBy: { createdAt: "desc" },
        });

        for (const w of wks) {
          feed.push({
            id: `feed_wk_${w.id}`,
            friendId: f.id,
            friendName: f.name,
            friendUsername: f.username,
            type: "WORKOUT",
            title: `Completed Workout Session`,
            description: `${f.name} completed "${w.name}".`,
            timestamp: w.createdAt.toISOString(),
          });
        }
      }

      // 3. Hydration streak milestones if hydration shared
      if (f.privacy.shareHydration === "FRIENDS" && (f.sharedHydrationStreak || 0) >= 3) {
        feed.push({
          id: `feed_hyd_${f.id}`,
          friendId: f.id,
          friendName: f.name,
          friendUsername: f.username,
          type: "HYDRATION",
          title: `Hydration Streak Milestone`,
          description: `${f.name} achieved a ${f.sharedHydrationStreak}-day hydration logging streak!`,
          timestamp: new Date().toISOString(),
        });
      }
    }

    // Sort feed by timestamp descending
    return feed.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 20);
  }
}
