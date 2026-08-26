import { prisma } from "@/lib/db";

export type FeatureAccessStatus = "LIVE" | "COMING_SOON" | "DISABLED" | "ADMIN_ONLY" | "BETA";

export interface FeatureItem {
  key: string;
  name: string;
  route: string;
  category: "CORE" | "LOGGING" | "ANALYTICS" | "AI" | "SOCIAL";
  status: FeatureAccessStatus;
  description: string;
  defaultStatus: FeatureAccessStatus;
  betaUserIds?: string[];
  updatedByAdminId?: string | null;
  updatedAt?: string;
}

export interface FeatureAuditLogItem {
  id: string;
  featureKey: string;
  featureName: string;
  previousStatus: FeatureAccessStatus;
  newStatus: FeatureAccessStatus;
  adminId: string;
  adminEmail?: string;
  reason?: string;
  timestamp: string;
}

export const REGISTERED_APP_FEATURES: FeatureItem[] = [
  {
    key: "dashboard",
    name: "Dashboard",
    route: "/app",
    category: "CORE",
    status: "LIVE",
    defaultStatus: "LIVE",
    description: "Daily macro summary, calorie ring, and fast overview cards.",
  },
  {
    key: "yesterday",
    name: "Yesterday's Data",
    route: "/yesterday",
    category: "CORE",
    status: "LIVE",
    defaultStatus: "LIVE",
    description: "AI-assisted end-of-day review and logging completion for yesterday.",
  },
  {
    key: "goals",
    name: "Goals & Targets",
    route: "/goals",
    category: "CORE",
    status: "LIVE",
    defaultStatus: "LIVE",
    description: "Customizable daily calorie, protein, hydration, and fitness goals.",
  },
  {
    key: "nutrition",
    name: "Nutrition & Meals",
    route: "/nutrition",
    category: "LOGGING",
    status: "LIVE",
    defaultStatus: "LIVE",
    description: "Meal breakdown logging (Breakfast, Lunch, Dinner, Snack).",
  },
  {
    key: "deep_nutrition",
    name: "Deep Nutrition & Micros",
    route: "/deep-nutrition",
    category: "ANALYTICS",
    status: "LIVE",
    defaultStatus: "LIVE",
    description: "Real-time vitamin and mineral tracking with optimal daily bounds.",
  },
  {
    key: "hydration",
    name: "Hydration Tracker",
    route: "/hydration",
    category: "LOGGING",
    status: "LIVE",
    defaultStatus: "LIVE",
    description: "Water and beverage intake tracking with daily hydration target.",
  },
  {
    key: "activities",
    name: "Activities & Running",
    route: "/activities",
    category: "LOGGING",
    status: "LIVE",
    defaultStatus: "LIVE",
    description: "Pace calculation, running distances, and aerobic activity logging.",
  },
  {
    key: "foods",
    name: "Food Database",
    route: "/foods",
    category: "LOGGING",
    status: "LIVE",
    defaultStatus: "LIVE",
    description: "Personal and verified foods library with macro profiles.",
  },
  {
    key: "workouts",
    name: "Workout Database",
    route: "/workouts",
    category: "LOGGING",
    status: "LIVE",
    defaultStatus: "LIVE",
    description: "Strength training exercises, set logs, and workout templates.",
  },
  {
    key: "insights",
    name: "Biometric Insights",
    route: "/insights",
    category: "ANALYTICS",
    status: "LIVE",
    defaultStatus: "LIVE",
    description: "Weekly trends, macro balance ratings, and recovery indicators.",
  },
  {
    key: "reports",
    name: "Reports & Analytics",
    route: "/reports",
    category: "ANALYTICS",
    status: "LIVE",
    defaultStatus: "LIVE",
    description: "Comprehensive weekly and monthly nutritional analytics.",
  },
  {
    key: "ai_coach",
    name: "AI Health Coach",
    route: "/ai-coach",
    category: "AI",
    status: "ADMIN_ONLY",
    defaultStatus: "ADMIN_ONLY",
    description: "ChatGPT coaching discussions and fast AI Integrator logging.",
  },
  {
    key: "community",
    name: "Community & Feed",
    route: "/community",
    category: "SOCIAL",
    status: "COMING_SOON",
    defaultStatus: "COMING_SOON",
    description: "Social activity feed, friend leaderboards, and shared achievements.",
  },
  {
    key: "settings",
    name: "Settings & Profile",
    route: "/settings",
    category: "CORE",
    status: "LIVE",
    defaultStatus: "LIVE",
    description: "User profile biometrics, privacy toggles, and connected services.",
  },
];

const SETTING_KEY_CONFIG = "FEATURE_PAGE_CONTROL_CONFIG";
const SETTING_KEY_AUDIT = "FEATURE_PAGE_CONTROL_AUDIT";

export class FeatureAccessService {
  /**
   * Retrieves all registered features with their active statuses from the database.
   */
  static async getAllFeatures(): Promise<FeatureItem[]> {
    try {
      const setting = await prisma.systemSetting.findUnique({
        where: { key: SETTING_KEY_CONFIG },
      });

      const overrides: Record<string, { status: FeatureAccessStatus; updatedByAdminId?: string; updatedAt?: string; betaUserIds?: string[] }> =
        setting && setting.value ? JSON.parse(setting.value) : {};

      return REGISTERED_APP_FEATURES.map((feat) => {
        const override = overrides[feat.key];
        if (override) {
          return {
            ...feat,
            status: override.status || feat.defaultStatus,
            updatedByAdminId: override.updatedByAdminId || null,
            updatedAt: override.updatedAt || undefined,
            betaUserIds: override.betaUserIds || [],
          };
        }
        return feat;
      });
    } catch (err) {
      console.warn("FeatureAccessService.getAllFeatures fallback:", err);
      return REGISTERED_APP_FEATURES;
    }
  }

  /**
   * Resolves feature status by exact route or feature key.
   */
  static async getFeatureStatus(routeOrKey: string): Promise<FeatureAccessStatus> {
    const features = await this.getAllFeatures();
    const clean = routeOrKey.toLowerCase().replace(/\/$/, "");

    const matched = features.find(
      (f) =>
        f.key.toLowerCase() === clean ||
        f.route.toLowerCase() === clean ||
        (clean.startsWith(f.route.toLowerCase()) && f.route !== "/app")
    );

    return matched ? matched.status : "LIVE";
  }

  /**
   * Verifies if a user has access to a specific route or feature.
   */
  static async canUserAccess(
    routeOrKey: string,
    userRole: "USER" | "ADMIN" = "USER",
    userId?: string
  ): Promise<{ allowed: boolean; status: FeatureAccessStatus; reason?: string; featureName?: string }> {
    const features = await this.getAllFeatures();
    const clean = routeOrKey.toLowerCase().replace(/\/$/, "");

    const matched = features.find(
      (f) =>
        f.key.toLowerCase() === clean ||
        f.route.toLowerCase() === clean ||
        (clean.startsWith(f.route.toLowerCase()) && f.route !== "/app")
    );

    if (!matched) {
      return { allowed: true, status: "LIVE" };
    }

    const status = matched.status;

    // Admins always have access to test and develop
    if (userRole === "ADMIN") {
      return { allowed: true, status, featureName: matched.name };
    }

    switch (status) {
      case "LIVE":
        return { allowed: true, status, featureName: matched.name };

      case "COMING_SOON":
        return {
          allowed: false,
          status,
          featureName: matched.name,
          reason: "This page is currently under active development. Please check back soon!",
        };

      case "DISABLED":
        return {
          allowed: false,
          status,
          featureName: matched.name,
          reason: "This feature is currently unavailable.",
        };

      case "ADMIN_ONLY":
        return {
          allowed: false,
          status,
          featureName: matched.name,
          reason: "This feature is restricted to platform administrators.",
        };

      case "BETA": {
        const isWhitelisted = userId && matched.betaUserIds?.includes(userId);
        if (isWhitelisted) {
          return { allowed: true, status, featureName: matched.name };
        }
        return {
          allowed: false,
          status,
          featureName: matched.name,
          reason: "This feature is in private beta preview.",
        };
      }

      default:
        return { allowed: true, status: "LIVE", featureName: matched.name };
    }
  }

  /**
   * Updates feature status with audit logging.
   */
  static async updateFeatureStatus(
    key: string,
    newStatus: FeatureAccessStatus,
    adminId: string,
    reason?: string
  ): Promise<{ success: boolean; feature: FeatureItem }> {
    const targetFeat = REGISTERED_APP_FEATURES.find((f) => f.key === key);
    if (!targetFeat) {
      throw new Error(`Invalid feature key: '${key}'`);
    }

    // 1. Get existing overrides
    const setting = await prisma.systemSetting.findUnique({
      where: { key: SETTING_KEY_CONFIG },
    });

    const overrides: Record<string, any> = setting && setting.value ? JSON.parse(setting.value) : {};
    const previousStatus = overrides[key]?.status || targetFeat.defaultStatus;

    const now = new Date().toISOString();
    overrides[key] = {
      ...(overrides[key] || {}),
      status: newStatus,
      updatedByAdminId: adminId,
      updatedAt: now,
    };

    // 2. Persist updated configuration
    await prisma.systemSetting.upsert({
      where: { key: SETTING_KEY_CONFIG },
      create: {
        key: SETTING_KEY_CONFIG,
        value: JSON.stringify(overrides),
        category: "SECURITY",
        description: "Central Page & Feature Access Control Configuration",
        updatedByAdminId: adminId,
      },
      update: {
        value: JSON.stringify(overrides),
        updatedByAdminId: adminId,
      },
    });

    // 3. Record audit log
    try {
      const auditSetting = await prisma.systemSetting.findUnique({
        where: { key: SETTING_KEY_AUDIT },
      });

      const auditLogs: FeatureAuditLogItem[] = auditSetting && auditSetting.value ? JSON.parse(auditSetting.value) : [];

      const adminUser = await prisma.user.findUnique({
        where: { id: adminId },
        select: { email: true, name: true },
      });

      const newAuditItem: FeatureAuditLogItem = {
        id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        featureKey: key,
        featureName: targetFeat.name,
        previousStatus,
        newStatus,
        adminId,
        adminEmail: adminUser?.email || adminId,
        reason: reason || `Changed status to ${newStatus}`,
        timestamp: now,
      };

      auditLogs.unshift(newAuditItem);
      // Retain latest 100 audit entries
      const trimmed = auditLogs.slice(0, 100);

      await prisma.systemSetting.upsert({
        where: { key: SETTING_KEY_AUDIT },
        create: {
          key: SETTING_KEY_AUDIT,
          value: JSON.stringify(trimmed),
          category: "SECURITY",
          description: "Feature Access Control Audit History Log",
          updatedByAdminId: adminId,
        },
        update: {
          value: JSON.stringify(trimmed),
          updatedByAdminId: adminId,
        },
      });
    } catch (auditErr) {
      console.warn("FeatureAccessService audit log failed:", auditErr);
    }

    const updatedFeature: FeatureItem = {
      ...targetFeat,
      status: newStatus,
      updatedByAdminId: adminId,
      updatedAt: now,
    };

    return { success: true, feature: updatedFeature };
  }

  /**
   * Retrieves the audit history logs of all page/feature access changes.
   */
  static async getAuditLogs(): Promise<FeatureAuditLogItem[]> {
    try {
      const auditSetting = await prisma.systemSetting.findUnique({
        where: { key: SETTING_KEY_AUDIT },
      });
      return auditSetting && auditSetting.value ? JSON.parse(auditSetting.value) : [];
    } catch {
      return [];
    }
  }
}
