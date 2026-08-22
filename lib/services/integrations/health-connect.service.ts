import { prisma } from "@/lib/db";
import { SystemSettingsService } from "@/lib/services/admin/system-settings.service";

export interface HealthConnectSyncPayload {
  userId: string;
  date?: string; // YYYY-MM-DD
  steps: number;
  caloriesBurned?: number;
  distanceKm?: number;
  activeDurationMinutes?: number;
  heartRateAvg?: number;
  sourceApp?: string; // e.g. "Samsung Health", "Google Health Connect", "Health Sync", "Android Pedometer"
}

export class HealthConnectService {
  /**
   * Generates Authorization URL for Health Connect / Google OAuth companion sync
   */
  static async getAuthorizationUrl(userId: string, redirectUri?: string): Promise<string> {
    const defaultClientId = process.env.GOOGLE_CLIENT_ID || "";
    const clientId = await SystemSettingsService.getSetting("GOOGLE_CLIENT_ID", defaultClientId);
    const appUrl = process.env.NEXTAUTH_URL || "https://nutri-track-henna.vercel.app";
    const callback = redirectUri || `${appUrl}/api/integrations/google-fit/callback`;

    const scopes = [
      "https://www.googleapis.com/auth/spreadsheets",
      "https://www.googleapis.com/auth/fitness.activity.read",
      "https://www.googleapis.com/auth/fitness.body.read",
      "https://www.googleapis.com/auth/fitness.location.read",
      "https://www.googleapis.com/auth/fitness.nutrition.read",
      "https://www.googleapis.com/auth/fitness.sleep.read",
      "https://www.googleapis.com/auth/fitness.heart_rate.read",
      "https://www.googleapis.com/auth/userinfo.profile",
      "https://www.googleapis.com/auth/userinfo.email",
    ].join(" ");

    const state = Buffer.from(JSON.stringify({ userId, timestamp: Date.now() })).toString("base64url");

    return (
      `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${encodeURIComponent(clientId)}&` +
      `redirect_uri=${encodeURIComponent(callback)}&` +
      `response_type=code&` +
      `scope=${encodeURIComponent(scopes)}&` +
      `access_type=offline&` +
      `prompt=consent&` +
      `state=${state}`
    );
  }

  /**
   * Directly records and upserts daily telemetry synced from Android Health Connect
   */
  static async recordHealthConnectSync(payload: HealthConnectSyncPayload): Promise<{
    success: boolean;
    steps: number;
    caloriesBurned: number;
    distanceKm: number;
    message: string;
  }> {
    const { userId, steps, caloriesBurned = 0, distanceKm = 0, activeDurationMinutes, sourceApp } = payload;
    const pool = prisma as any;
    const targetDate = payload.date || new Date().toISOString().split("T")[0];

    const finalDistance = distanceKm > 0 ? distanceKm : Math.round(((steps * 0.75) / 1000) * 100) / 100;
    const finalCalories = caloriesBurned > 0 ? caloriesBurned : Math.round(steps * 0.04);
    const finalDuration = activeDurationMinutes ? activeDurationMinutes * 60 : Math.max(600, Math.round((steps / 100) * 60));

    // Upsert into ActivityLog
    const existingLog = await pool.activityLog.findFirst({
      where: {
        userId,
        source: "HEALTH_CONNECT",
        date: targetDate,
      },
    });

    if (existingLog) {
      await pool.activityLog.update({
        where: { id: existingLog.id },
        data: {
          steps: Math.max(existingLog.steps || 0, steps),
          caloriesBurned: Math.max(existingLog.caloriesBurned || 0, finalCalories),
          distanceKm: Math.max(existingLog.distanceKm || 0, finalDistance),
          movingDurationSeconds: Math.max(existingLog.movingDurationSeconds || 0, finalDuration),
          notes: `Android Health Connect (${sourceApp || "System Sensor"})`,
        },
      });
    } else {
      await pool.activityLog.create({
        data: {
          userId,
          activityType: "WALK",
          source: "HEALTH_CONNECT",
          externalProvider: "HEALTH_CONNECT",
          date: targetDate,
          steps,
          caloriesBurned: finalCalories,
          distanceKm: finalDistance,
          movingDurationSeconds: finalDuration,
          averagePaceSecondsPerKm: finalDistance > 0 ? Math.round(finalDuration / finalDistance) : 0,
          notes: `Android Health Connect (${sourceApp || "System Sensor"})`,
        },
      });
    }

    // Update connection metadata
    await pool.integrationConnection.upsert({
      where: {
        userId_provider: {
          userId,
          provider: "HEALTH_CONNECT",
        },
      },
      create: {
        userId,
        provider: "HEALTH_CONNECT",
        status: "CONNECTED",
        externalUsername: sourceApp || "Android Health Connect",
        lastSyncAt: new Date(),
      },
      update: {
        status: "CONNECTED",
        externalUsername: sourceApp || "Android Health Connect",
        lastSyncAt: new Date(),
      },
    });

    return {
      success: true,
      steps,
      caloriesBurned: finalCalories,
      distanceKm: finalDistance,
      message: `Successfully synchronized ${steps} steps and ${finalCalories} active calories from Android Health Connect.`,
    };
  }

  /**
   * Queries full-day steps from Health Connect / Connected Android Google bridge
   */
  static async syncHealthConnect(userId: string): Promise<{
    success: boolean;
    importedSteps: number;
    importedCalories: number;
    message: string;
  }> {
    const pool = prisma as any;

    // Check for either HEALTH_CONNECT or GOOGLE_FIT connection
    let conn = await pool.integrationConnection.findUnique({
      where: {
        userId_provider: {
          userId,
          provider: "HEALTH_CONNECT",
        },
      },
    });

    if (!conn) {
      conn = await pool.integrationConnection.findUnique({
        where: {
          userId_provider: {
            userId,
            provider: "GOOGLE_FIT",
          },
        },
      });
    }

    let finalSteps = 0;
    let finalCalories = 0;
    let finalDistanceKm = 0;

    if (conn && conn.accessToken && !conn.accessToken.startsWith("mock_")) {
      try {
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        const startTimeMillis = startOfToday.getTime();
        const endTimeMillis = now.getTime();

        const fitRes = await fetch("https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${conn.accessToken}`,
          },
          body: JSON.stringify({
            aggregateBy: [
              { dataTypeName: "com.google.step_count.delta" },
              { dataTypeName: "com.google.calories.expended" },
              { dataTypeName: "com.google.distance.delta" },
            ],
            bucketByTime: { durationMillis: 86400000 },
            startTimeMillis,
            endTimeMillis,
          }),
          signal: AbortSignal.timeout(6000),
        });

        if (fitRes.ok) {
          const fitData = await fitRes.json();
          const buckets = fitData.bucket || [];
          for (const bucket of buckets) {
            if (bucket.dataset) {
              for (const ds of bucket.dataset) {
                if (ds.point && ds.point.length > 0) {
                  for (const pt of ds.point) {
                    if (pt.value && pt.value.length > 0) {
                      const val = pt.value[0];
                      const intV = Number(val.intVal) || 0;
                      const fpV = Number(val.fpVal) || 0;
                      const num = intV || Math.round(fpV);

                      if (ds.dataSourceId?.includes("step_count") || ds.dataTypeName?.includes("step_count")) {
                        finalSteps += num;
                      } else if (ds.dataSourceId?.includes("calories") || ds.dataTypeName?.includes("calories")) {
                        finalCalories += num;
                      } else if (ds.dataSourceId?.includes("distance") || ds.dataTypeName?.includes("distance")) {
                        finalDistanceKm += Math.round((fpV / 1000) * 100) / 100;
                      }
                    }
                  }
                }
              }
            }
          }
        }
      } catch (err: any) {
        console.warn("Health Connect query notice:", err.message);
      }
    }

    const todayStr = new Date().toISOString().split("T")[0];

    // Check existing ActivityLog for today
    const existingLog = await pool.activityLog.findFirst({
      where: {
        userId,
        date: todayStr,
      },
    });

    if (existingLog && existingLog.steps > finalSteps) {
      finalSteps = existingLog.steps;
      finalCalories = existingLog.caloriesBurned || finalCalories;
      finalDistanceKm = existingLog.distanceKm || finalDistanceKm;
    }

    if (finalSteps > 0) {
      await this.recordHealthConnectSync({
        userId,
        date: todayStr,
        steps: finalSteps,
        caloriesBurned: finalCalories,
        distanceKm: finalDistanceKm,
        sourceApp: "Android Health Connect",
      });
    }

    return {
      success: true,
      importedSteps: finalSteps,
      importedCalories: finalCalories,
      message: `Successfully synchronized ${finalSteps} steps and ${finalCalories} active calories from Android Health Connect.`,
    };
  }
}
