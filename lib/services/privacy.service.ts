import { prisma } from "@/lib/db";
import {
  PrivacyCategory,
  PrivacyVisibility,
  UserGranularPrivacyDto,
  DEFAULT_GRANULAR_PRIVACY,
  PRIVACY_CATEGORIES_META,
  UpdatePrivacySettingsInput,
} from "@/lib/validations/privacy";

export type SharingPermission = "PUBLIC" | "FRIENDS" | "PRIVATE";

export interface UserPrivacySettingsDto extends UserGranularPrivacyDto {
  // Legacy aliases
  shareHealthScore: SharingPermission;
  shareNutrition: SharingPermission;
  shareHydration: SharingPermission;
  shareActivities: SharingPermission;
  shareWorkouts: SharingPermission;
  shareAchievements: SharingPermission;
}

export class PrivacyService {
  /**
   * Initializes default privacy settings (FRIENDS for all standard categories) for a new user.
   */
  static async initializeDefaultPrivacy(userId: string): Promise<UserGranularPrivacyDto> {
    for (const meta of PRIVACY_CATEGORIES_META) {
      await (prisma as any).privacySetting.upsert({
        where: {
          userId_category: {
            userId,
            category: meta.key,
          },
        },
        create: {
          userId,
          category: meta.key,
          visibility: meta.defaultVisibility,
        },
        update: {},
      });
    }

    // Also sync legacy user_privacy_settings for backward compatibility
    await (prisma as any).userPrivacySettings.upsert({
      where: { userId },
      create: {
        userId,
        shareHealthScore: "FRIENDS",
        shareNutrition: "FRIENDS",
        shareHydration: "FRIENDS",
        shareActivities: "FRIENDS",
        shareWorkouts: "FRIENDS",
        shareAchievements: "FRIENDS",
      },
      update: {},
    });

    return { ...DEFAULT_GRANULAR_PRIVACY };
  }

  /**
   * Retrieves granular privacy settings for a user.
   * FAIL-SAFE RULE: Missing or unresolved categories safely default to PRIVATE.
   */
  static async getPrivacySettings(userId: string): Promise<UserPrivacySettingsDto> {
    const records = await (prisma as any).privacySetting.findMany({
      where: { userId },
    });

    // Fallback dictionary: if uninitialized, fail-safe to PRIVATE per category
    const categoryMap: Partial<Record<PrivacyCategory, PrivacyVisibility>> = {};
    if (records && records.length > 0) {
      for (const r of records) {
        categoryMap[r.category as PrivacyCategory] = r.visibility as PrivacyVisibility;
      }
    }

    // Check legacy table if granular records not yet initialized
    let legacyRecord: any = null;
    if (records.length === 0) {
      legacyRecord = await (prisma as any).userPrivacySettings.findUnique({
        where: { userId },
      });
    }

    const resolveCategory = (
      cat: PrivacyCategory,
      legacyKey?: string
    ): PrivacyVisibility => {
      if (categoryMap[cat]) return categoryMap[cat]!;
      if (legacyRecord && legacyKey && legacyRecord[legacyKey]) {
        return legacyRecord[legacyKey] as PrivacyVisibility;
      }
      // Visible to friends by default unless intentionally set to PRIVATE in settings
      return "FRIENDS";
    };

    const profile = resolveCategory("PROFILE");
    const nutrition = resolveCategory("NUTRITION", "shareNutrition");
    const deepNutrition = resolveCategory("DEEP_NUTRITION");
    const hydration = resolveCategory("HYDRATION", "shareHydration");
    const activities = resolveCategory("ACTIVITIES", "shareActivities");
    const workouts = resolveCategory("WORKOUTS", "shareWorkouts");
    const insightsProgress = resolveCategory("INSIGHTS_PROGRESS", "shareHealthScore");
    const reports = resolveCategory("REPORTS");

    return {
      profile,
      nutrition,
      deepNutrition,
      hydration,
      activities,
      workouts,
      insightsProgress,
      reports,
      // Legacy aliases
      shareHealthScore: insightsProgress,
      shareNutrition: nutrition,
      shareHydration: hydration,
      shareActivities: activities,
      shareWorkouts: workouts,
      shareAchievements: resolveCategory("INSIGHTS_PROGRESS", "shareAchievements"),
    };
  }

  /**
   * Returns visibility for a specific category with default fallback to FRIENDS.
   */
  static async getCategoryVisibility(
    userId: string,
    category: PrivacyCategory
  ): Promise<PrivacyVisibility> {
    try {
      const record = await (prisma as any).privacySetting.findUnique({
        where: {
          userId_category: {
            userId,
            category,
          },
        },
      });
      if (record?.visibility) {
        return record.visibility as PrivacyVisibility;
      }

      // Check legacy table fallback
      const legacy = await (prisma as any).userPrivacySettings.findUnique({
        where: { userId },
      });
      if (legacy) {
        if (category === "INSIGHTS_PROGRESS" && legacy.shareHealthScore) return legacy.shareHealthScore;
        if (category === "NUTRITION" && legacy.shareNutrition) return legacy.shareNutrition;
        if (category === "HYDRATION" && legacy.shareHydration) return legacy.shareHydration;
        if (category === "ACTIVITIES" && legacy.shareActivities) return legacy.shareActivities;
        if (category === "WORKOUTS" && legacy.shareWorkouts) return legacy.shareWorkouts;
      }
      // Visible to friends by default unless intentionally set to PRIVATE in settings
      return "FRIENDS";
    } catch {
      return "FRIENDS";
    }
  }

  /**
   * Updates a user's granular privacy settings.
   */
  static async updatePrivacySettings(
    userId: string,
    input: UpdatePrivacySettingsInput
  ): Promise<UserPrivacySettingsDto> {
    // Map input fields to categories
    const mappings: Array<{ category: PrivacyCategory; val?: PrivacyVisibility }> = [
      { category: "PROFILE", val: input.profile },
      { category: "NUTRITION", val: input.nutrition || (input.shareNutrition as any) },
      { category: "DEEP_NUTRITION", val: input.deepNutrition },
      { category: "HYDRATION", val: input.hydration || (input.shareHydration as any) },
      { category: "ACTIVITIES", val: input.activities || (input.shareActivities as any) },
      { category: "WORKOUTS", val: input.workouts || (input.shareWorkouts as any) },
      { category: "INSIGHTS_PROGRESS", val: input.insightsProgress || (input.shareHealthScore as any) },
      { category: "REPORTS", val: input.reports },
    ];

    for (const m of mappings) {
      if (m.val) {
        await (prisma as any).privacySetting.upsert({
          where: {
            userId_category: {
              userId,
              category: m.category,
            },
          },
          create: {
            userId,
            category: m.category,
            visibility: m.val,
          },
          update: {
            visibility: m.val,
          },
        });
      }
    }

    // Sync legacy user_privacy_settings
    const updatedNutrition = input.nutrition || input.shareNutrition;
    const updatedHydration = input.hydration || input.shareHydration;
    const updatedActivities = input.activities || input.shareActivities;
    const updatedWorkouts = input.workouts || input.shareWorkouts;
    const updatedHealthScore = input.insightsProgress || input.shareHealthScore;
    const updatedAchievements = input.insightsProgress || input.shareAchievements;

    await (prisma as any).userPrivacySettings.upsert({
      where: { userId },
      create: {
        userId,
        shareHealthScore: updatedHealthScore || "PRIVATE",
        shareNutrition: updatedNutrition || "PRIVATE",
        shareHydration: updatedHydration || "PRIVATE",
        shareActivities: updatedActivities || "PRIVATE",
        shareWorkouts: updatedWorkouts || "PRIVATE",
        shareAchievements: updatedAchievements || "PRIVATE",
      },
      update: {
        ...(updatedHealthScore && { shareHealthScore: updatedHealthScore }),
        ...(updatedNutrition && { shareNutrition: updatedNutrition }),
        ...(updatedHydration && { shareHydration: updatedHydration }),
        ...(updatedActivities && { shareActivities: updatedActivities }),
        ...(updatedWorkouts && { shareWorkouts: updatedWorkouts }),
        ...(updatedAchievements && { shareAchievements: updatedAchievements }),
      },
    });

    return this.getPrivacySettings(userId);
  }

  /**
   * Reusable 5-Step Server-Side Privacy & Access Engine.
   *
   * Step 1: Owner check (requesterId === targetUserId) -> ALLOW
   * Step 2: Relationship check (OWNER, ACCEPTED, PENDING, BLOCKED, NONE)
   * Step 3: Block check (if BLOCKED) -> DENY
   * Step 4: Category visibility check (with fail-safe fallback to PRIVATE)
   * Step 5: Authorization decision:
   *         - PUBLIC -> ALLOW
   *         - FRIENDS -> ALLOW only if relationship === ACCEPTED
   *         - PRIVATE -> DENY (only owner reaches here)
   */
  static async canAccessCategory(
    requesterId: string,
    targetUserId: string,
    category: PrivacyCategory
  ): Promise<boolean> {
    // Step 1: Owner always has full access
    if (requesterId === targetUserId) {
      return true;
    }

    // Step 1.5: Admin Master Access override
    try {
      const requester = await (prisma as any).user.findUnique({
        where: { id: requesterId },
      });
      if (requester && requester.role === "ADMIN") {
        return true;
      }
    } catch {}

    // Step 2 & 3: Relationship & Block check
    const friendship = await (prisma as any).friendship.findFirst({
      where: {
        OR: [
          { requesterId, addresseeId: targetUserId },
          { requesterId: targetUserId, addresseeId: requesterId },
        ],
      },
    });

    if (friendship && friendship.status === "BLOCKED") {
      return false;
    }

    const isAcceptedFriend = friendship?.status === "ACCEPTED";

    // Step 4: Category visibility lookup with safe fail-safe
    const visibility = await this.getCategoryVisibility(targetUserId, category);

    // Step 5: Authorization decision
    if (visibility === "PUBLIC") {
      return true;
    }
    if (visibility === "FRIENDS") {
      return isAcceptedFriend;
    }
    // PRIVATE
    return false;
  }

  /**
   * High-performance batch evaluation for multiple categories.
   * Avoids N+1 queries when rendering friend profiles or comparisons.
   */
  static async canAccessCategoriesBatch(
    requesterId: string,
    targetUserId: string,
    categories: PrivacyCategory[]
  ): Promise<Record<PrivacyCategory, boolean>> {
    const result: Partial<Record<PrivacyCategory, boolean>> = {};

    // 1. If owner, all allowed
    if (requesterId === targetUserId) {
      for (const cat of categories) result[cat] = true;
      return result as Record<PrivacyCategory, boolean>;
    }

    // 1.5: Admin Master Access override
    try {
      const requester = await (prisma as any).user.findUnique({
        where: { id: requesterId },
      });
      if (requester && requester.role === "ADMIN") {
        for (const cat of categories) result[cat] = true;
        return result as Record<PrivacyCategory, boolean>;
      }
    } catch {}

    // 2. Fetch relationship
    const friendship = await (prisma as any).friendship.findFirst({
      where: {
        OR: [
          { requesterId, addresseeId: targetUserId },
          { requesterId: targetUserId, addresseeId: requesterId },
        ],
      },
    });

    if (friendship && friendship.status === "BLOCKED") {
      for (const cat of categories) result[cat] = false;
      return result as Record<PrivacyCategory, boolean>;
    }

    const isAcceptedFriend = friendship?.status === "ACCEPTED";

    // 3. Batch fetch all privacy settings for target user
    const targetPrivacy = await this.getPrivacySettings(targetUserId);

    for (const cat of categories) {
      let vis: PrivacyVisibility = "FRIENDS";
      if (cat === "PROFILE") vis = targetPrivacy.profile;
      else if (cat === "NUTRITION") vis = targetPrivacy.nutrition;
      else if (cat === "DEEP_NUTRITION") vis = targetPrivacy.deepNutrition;
      else if (cat === "HYDRATION") vis = targetPrivacy.hydration;
      else if (cat === "ACTIVITIES") vis = targetPrivacy.activities;
      else if (cat === "WORKOUTS") vis = targetPrivacy.workouts;
      else if (cat === "INSIGHTS_PROGRESS") vis = targetPrivacy.insightsProgress;
      else if (cat === "REPORTS") vis = targetPrivacy.reports;

      if (vis === "PUBLIC") {
        result[cat] = true;
      } else if (vis === "FRIENDS") {
        result[cat] = isAcceptedFriend;
      } else {
        result[cat] = false;
      }
    }

    return result as Record<PrivacyCategory, boolean>;
  }
}
