import { prisma } from "@/lib/db";
import { BiologicalSex, ActivityLevel } from "@/lib/validations/profile";
import {
  UserProfileSettings,
  UserNutritionGoals,
  UserSettingsPayload,
  CalculatedMetabolicMetrics,
  calculateMetabolicTargets,
  PrimaryGoal,
} from "@/lib/validations/settings";
import { GoogleSheetsService } from "./google-sheets/google-sheets.service";

export interface UserSettingsResponse {
  user: {
    id: string;
    name: string;
    email: string;
    username: string;
  };
  profile: Partial<UserProfileSettings> & {
    id?: string;
    userId?: string;
    dateOfBirth?: string | null;
    biologicalSex?: BiologicalSex | null;
    heightCm?: number | null;
    weightKg?: number | null;
    activityLevel?: ActivityLevel | null;
    primaryGoal?: PrimaryGoal | null;
    dailyHydrationTargetMl?: number | null;
    dailyStepTarget?: number | null;
    weeklyRunningDistanceKm?: number | null;
    weeklyWorkoutSessions?: number | null;
    isComplete?: boolean;
  };
  nutritionGoals: {
    calories?: number | null;
    protein?: number | null;
    carbohydrates?: number | null;
    fat?: number | null;
    fiber?: number | null;
    sugar?: number | null;
    isConfigured?: boolean;
  };
  metabolic: CalculatedMetabolicMetrics | null;
  googleSheets: {
    isConnected: boolean;
    spreadsheetId: string | null;
    spreadsheetUrl: string | null;
    sheetTitle: string | null;
    lastSyncedAt: string | null;
    status: string;
  };
}

export class UserSettingsService {
  /**
   * Retrieves complete settings and personalized goals for a user without inventing fake defaults.
   */
  static async getUserSettings(userId: string): Promise<UserSettingsResponse> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new Error("User not found");
    }

    const profile = await prisma.userProfile.findUnique({
      where: { userId },
    });

    const targets = await prisma.userNutrientTarget.findUnique({
      where: { userId },
    });

    // Fetch Google Sheets connection status
    const sheetConn = await prisma.googleSheetConnection.findUnique({
      where: { userId },
    });

    const isProfileComplete = Boolean(
      profile &&
      profile.weightKg &&
      profile.heightCm &&
      profile.dateOfBirth &&
      profile.biologicalSex &&
      profile.activityLevel
    );

    let metabolic: CalculatedMetabolicMetrics | null = null;
    if (isProfileComplete && profile) {
      metabolic = calculateMetabolicTargets(
        profile.weightKg!,
        profile.heightCm!,
        profile.biologicalSex as any,
        profile.dateOfBirth!,
        profile.activityLevel as any,
        ((profile as any).primaryGoal as PrimaryGoal) || "MAINTAIN"
      );
    }

    const profileSettings = {
      id: profile?.id || undefined,
      userId,
      dateOfBirth: profile?.dateOfBirth ? (profile.dateOfBirth instanceof Date ? profile.dateOfBirth.toISOString().split("T")[0] : String(profile.dateOfBirth).split("T")[0]) : null,
      biologicalSex: (profile?.biologicalSex as any) || null,
      heightCm: profile?.heightCm !== null && profile?.heightCm !== undefined ? Number(profile.heightCm) : null,
      weightKg: profile?.weightKg !== null && profile?.weightKg !== undefined ? Number(profile.weightKg) : null,
      activityLevel: (profile?.activityLevel as any) || null,
      primaryGoal: ((profile as any)?.primaryGoal as PrimaryGoal) || (isProfileComplete ? "MAINTAIN" : null),
      dailyHydrationTargetMl: profile?.dailyHydrationTargetMl !== null && profile?.dailyHydrationTargetMl !== undefined ? Number(profile.dailyHydrationTargetMl) : (isProfileComplete ? 2500 : null),
      dailyStepTarget: (profile as any)?.dailyStepTarget !== null && (profile as any)?.dailyStepTarget !== undefined ? Number((profile as any).dailyStepTarget) : (isProfileComplete ? 10000 : null),
      weeklyRunningDistanceKm: (profile as any)?.weeklyRunningDistanceKm !== null && (profile as any)?.weeklyRunningDistanceKm !== undefined ? Number((profile as any).weeklyRunningDistanceKm) : (isProfileComplete ? 15.0 : null),
      weeklyWorkoutSessions: (profile as any)?.weeklyWorkoutSessions !== null && (profile as any)?.weeklyWorkoutSessions !== undefined ? Number((profile as any).weeklyWorkoutSessions) : (isProfileComplete ? 3 : null),
      isComplete: isProfileComplete,
    };

    const isTargetsConfigured = Boolean(targets && targets.calories && targets.protein);

    const nutritionGoals = {
      calories: targets?.calories !== null && targets?.calories !== undefined ? Number(targets.calories) : null,
      protein: targets?.protein !== null && targets?.protein !== undefined ? Number(targets.protein) : null,
      carbohydrates: targets?.carbohydrates !== null && targets?.carbohydrates !== undefined ? Number(targets.carbohydrates) : null,
      fat: targets?.fat !== null && targets?.fat !== undefined ? Number(targets.fat) : null,
      fiber: targets?.fiber !== null && targets?.fiber !== undefined ? Number(targets.fiber) : null,
      sugar: targets?.sugar !== null && targets?.sugar !== undefined ? Number(targets.sugar) : null,
      isConfigured: isTargetsConfigured,
    };

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        username: user.username,
      },
      profile: profileSettings as any,
      nutritionGoals: nutritionGoals as any,
      metabolic,
      googleSheets: {
        isConnected: Boolean(sheetConn && sheetConn.status === "CONNECTED"),
        spreadsheetId: sheetConn?.spreadsheetId || null,
        spreadsheetUrl: sheetConn?.spreadsheetUrl || null,
        sheetTitle: sheetConn?.sheetTitle || null,
        lastSyncedAt: sheetConn?.lastSyncedAt?.toISOString() || null,
        status: sheetConn?.status || "DISCONNECTED",
      },
    };
  }

  /**
   * Updates user physical profile and customizable nutrition/activity goals.
   */
  static async updateUserSettings(
    userId: string,
    payload: UserSettingsPayload
  ): Promise<UserSettingsResponse> {
    const { profile: pData, nutritionGoals: nData } = payload;

    // 1. Update or create user profile if provided
    if (pData) {
      const existingProfile = await prisma.userProfile.findUnique({ where: { userId } });
      await (prisma.userProfile.upsert as any)({
        where: { userId },
        create: {
          userId,
          dateOfBirth: pData.dateOfBirth ? new Date(pData.dateOfBirth) : existingProfile?.dateOfBirth || null,
          biologicalSex: pData.biologicalSex || existingProfile?.biologicalSex || null,
          heightCm: pData.heightCm !== undefined ? pData.heightCm : existingProfile?.heightCm || null,
          weightKg: pData.weightKg !== undefined ? pData.weightKg : existingProfile?.weightKg || null,
          activityLevel: pData.activityLevel || existingProfile?.activityLevel || null,
          dailyHydrationTargetMl: pData.dailyHydrationTargetMl !== undefined ? pData.dailyHydrationTargetMl : existingProfile?.dailyHydrationTargetMl || null,
          dailyStepTarget: pData.dailyStepTarget !== undefined ? pData.dailyStepTarget : (existingProfile as any)?.dailyStepTarget || null,
          weeklyRunningDistanceKm: pData.weeklyRunningDistanceKm !== undefined ? pData.weeklyRunningDistanceKm : (existingProfile as any)?.weeklyRunningDistanceKm || null,
          weeklyWorkoutSessions: pData.weeklyWorkoutSessions !== undefined ? pData.weeklyWorkoutSessions : (existingProfile as any)?.weeklyWorkoutSessions || null,
          primaryGoal: pData.primaryGoal || (existingProfile as any)?.primaryGoal || null,
        },
        update: {
          ...(pData.dateOfBirth && { dateOfBirth: new Date(pData.dateOfBirth) }),
          ...(pData.biologicalSex && { biologicalSex: pData.biologicalSex }),
          ...(pData.heightCm !== undefined && { heightCm: pData.heightCm }),
          ...(pData.weightKg !== undefined && { weightKg: pData.weightKg }),
          ...(pData.activityLevel && { activityLevel: pData.activityLevel }),
          ...(pData.dailyHydrationTargetMl !== undefined && { dailyHydrationTargetMl: pData.dailyHydrationTargetMl }),
          ...(pData.dailyStepTarget !== undefined && { dailyStepTarget: pData.dailyStepTarget }),
          ...(pData.weeklyRunningDistanceKm !== undefined && { weeklyRunningDistanceKm: pData.weeklyRunningDistanceKm }),
          ...(pData.weeklyWorkoutSessions !== undefined && { weeklyWorkoutSessions: pData.weeklyWorkoutSessions }),
          ...(pData.primaryGoal && { primaryGoal: pData.primaryGoal }),
        },
      });
    }

    // 2. Update or create user nutrient targets if provided
    if (nData) {
      const existingTargets = await prisma.userNutrientTarget.findUnique({ where: { userId } });
      await prisma.userNutrientTarget.upsert({
        where: { userId },
        create: {
          userId,
          calories: nData.calories !== undefined ? nData.calories : existingTargets?.calories || 0,
          protein: nData.protein !== undefined ? nData.protein : existingTargets?.protein || 0,
          carbohydrates: nData.carbohydrates !== undefined ? nData.carbohydrates : existingTargets?.carbohydrates || 0,
          fat: nData.fat !== undefined ? nData.fat : existingTargets?.fat || 0,
          fiber: nData.fiber !== undefined ? nData.fiber : existingTargets?.fiber || 0,
          sugar: nData.sugar !== undefined ? nData.sugar : existingTargets?.sugar || 0,
        },
        update: {
          ...(nData.calories !== undefined && { calories: nData.calories }),
          ...(nData.protein !== undefined && { protein: nData.protein }),
          ...(nData.carbohydrates !== undefined && { carbohydrates: nData.carbohydrates }),
          ...(nData.fat !== undefined && { fat: nData.fat }),
          ...(nData.fiber !== undefined && { fiber: nData.fiber }),
          ...(nData.sugar !== undefined && { sugar: nData.sugar }),
        },
      });
    }

    // 3. Trigger asynchronous Google Sheets synchronization if connected
    try {
      GoogleSheetsService.triggerAutoSync(userId);
    } catch {}

    return this.getUserSettings(userId);
  }
}
