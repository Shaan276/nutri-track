import { prisma } from "@/lib/db";
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
  profile: UserProfileSettings;
  nutritionGoals: UserNutritionGoals;
  metabolic: CalculatedMetabolicMetrics;
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
   * Retrieves complete settings and personalized goals for a user.
   */
  static async getUserSettings(userId: string): Promise<UserSettingsResponse> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new Error("User not found");
    }

    let profile = await prisma.userProfile.findUnique({
      where: { userId },
    });

    // If profile doesn't exist yet, initialize safe defaults
    if (!profile) {
      profile = await (prisma.userProfile.create as any)({
        data: {
          userId,
          dateOfBirth: new Date("1995-01-01"),
          biologicalSex: "MALE",
          heightCm: 175,
          weightKg: 70,
          activityLevel: "MODERATELY_ACTIVE",
          dailyHydrationTargetMl: 2500,
          dailyStepTarget: 10000,
          weeklyRunningDistanceKm: 15.0,
          weeklyWorkoutSessions: 3,
          primaryGoal: "MAINTAIN",
        },
      });
    }

    if (!profile) {
      throw new Error("Could not initialize user profile");
    }

    // Fetch or create default nutrient targets
    let targets = await prisma.userNutrientTarget.findUnique({
      where: { userId },
    });

    if (!targets) {
      targets = await prisma.userNutrientTarget.create({
        data: {
          userId,
          calories: 2000,
          protein: 120,
          carbohydrates: 250,
          fat: 65,
          fiber: 30,
          sugar: 35,
        },
      });
    }

    if (!targets) {
      throw new Error("Could not initialize nutrient targets");
    }

    // Fetch Google Sheets connection status
    const sheetConn = await prisma.googleSheetConnection.findUnique({
      where: { userId },
    });

    const metabolic = calculateMetabolicTargets(
      profile.weightKg,
      profile.heightCm,
      profile.biologicalSex as any,
      profile.dateOfBirth,
      profile.activityLevel as any,
      ((profile as any).primaryGoal as PrimaryGoal) || "MAINTAIN"
    );

    const profileSettings: UserProfileSettings = {
      dateOfBirth: profile.dateOfBirth.toISOString().split("T")[0],
      biologicalSex: profile.biologicalSex as any,
      heightCm: profile.heightCm,
      weightKg: profile.weightKg,
      activityLevel: profile.activityLevel as any,
      primaryGoal: ((profile as any).primaryGoal as PrimaryGoal) || "MAINTAIN",
      dailyHydrationTargetMl: profile.dailyHydrationTargetMl || 2500,
      dailyStepTarget: (profile as any).dailyStepTarget || 10000,
      weeklyRunningDistanceKm: Number((profile as any).weeklyRunningDistanceKm || 15.0),
      weeklyWorkoutSessions: (profile as any).weeklyWorkoutSessions || 3,
    };

    const nutritionGoals: UserNutritionGoals = {
      calories: Number(targets.calories || 2000),
      protein: Number(targets.protein || 120),
      carbohydrates: Number(targets.carbohydrates || 250),
      fat: Number(targets.fat || 65),
      fiber: Number(targets.fiber || 30),
      sugar: Number(targets.sugar || 35),
    };

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        username: user.username,
      },
      profile: profileSettings,
      nutritionGoals,
      metabolic,
      googleSheets: {
        isConnected: !!sheetConn && sheetConn.status === "CONNECTED",
        spreadsheetId: sheetConn?.spreadsheetId || null,
        spreadsheetUrl: sheetConn?.spreadsheetUrl || null,
        sheetTitle: sheetConn?.sheetTitle || null,
        lastSyncedAt: sheetConn?.lastSyncedAt?.toISOString() || null,
        status: sheetConn?.status || "NOT_CONNECTED",
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
          dateOfBirth: pData.dateOfBirth ? new Date(pData.dateOfBirth) : existingProfile?.dateOfBirth || new Date("1995-01-01"),
          biologicalSex: pData.biologicalSex || existingProfile?.biologicalSex || "MALE",
          heightCm: pData.heightCm || existingProfile?.heightCm || 175,
          weightKg: pData.weightKg || existingProfile?.weightKg || 70,
          activityLevel: pData.activityLevel || existingProfile?.activityLevel || "MODERATELY_ACTIVE",
          dailyHydrationTargetMl: pData.dailyHydrationTargetMl || existingProfile?.dailyHydrationTargetMl || 2500,
          dailyStepTarget: pData.dailyStepTarget || existingProfile?.dailyStepTarget || 10000,
          weeklyRunningDistanceKm: pData.weeklyRunningDistanceKm || existingProfile?.weeklyRunningDistanceKm || 15.0,
          weeklyWorkoutSessions: pData.weeklyWorkoutSessions || existingProfile?.weeklyWorkoutSessions || 3,
          primaryGoal: pData.primaryGoal || existingProfile?.primaryGoal || "MAINTAIN",
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
          calories: nData.calories || existingTargets?.calories || 2000,
          protein: nData.protein || existingTargets?.protein || 120,
          carbohydrates: nData.carbohydrates || existingTargets?.carbohydrates || 250,
          fat: nData.fat || existingTargets?.fat || 65,
          fiber: nData.fiber || existingTargets?.fiber || 30,
          sugar: nData.sugar || existingTargets?.sugar || 35,
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
