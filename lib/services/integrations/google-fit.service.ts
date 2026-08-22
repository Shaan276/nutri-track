import { prisma } from "@/lib/db";
import { SystemSettingsService } from "@/lib/services/admin/system-settings.service";

export class GoogleFitService {
  /**
   * Generates Google OAuth 2.0 Authorization URL with Google Fit / Health Connect & Google Sheets scopes
   */
  static async getAuthorizationUrl(userId: string, redirectUri?: string): Promise<string> {
    const defaultClientId = process.env.GOOGLE_CLIENT_ID || "google_client_id_placeholder";
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
   * Refreshes an expired Google OAuth access token using the stored refresh token
   */
  static async refreshAccessToken(conn: any): Promise<string> {
    if (!conn.refreshToken || conn.refreshToken.startsWith("mock_")) {
      return conn.accessToken;
    }

    try {
      const defaultClientId = process.env.GOOGLE_CLIENT_ID || "";
      const defaultClientSecret = process.env.GOOGLE_CLIENT_SECRET || "";
      const clientId = await SystemSettingsService.getSetting("GOOGLE_CLIENT_ID", defaultClientId);
      const clientSecret = await SystemSettingsService.getSetting("GOOGLE_CLIENT_SECRET", defaultClientSecret);

      const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          refresh_token: conn.refreshToken,
          client_id: clientId,
          client_secret: clientSecret,
          grant_type: "refresh_token",
        }),
        signal: AbortSignal.timeout(6000),
      });

      if (tokenRes.ok) {
        const data = await tokenRes.json();
        const newAccessToken = data.access_token;
        const expiresAt = new Date(Date.now() + (data.expires_in || 3600) * 1000);

        const pool = prisma as any;
        await pool.integrationConnection.update({
          where: { id: conn.id },
          data: {
            accessToken: newAccessToken,
            tokenExpiresAt: expiresAt,
          },
        });

        return newAccessToken;
      }
    } catch (err: any) {
      console.warn("Failed to refresh Google access token:", err.message);
    }

    return conn.accessToken;
  }

  /**
   * Handles OAuth callback and exchanges auth code for access token
   */
  static async handleCallback(userId: string, code: string): Promise<any> {
    const defaultClientId = process.env.GOOGLE_CLIENT_ID || "";
    const defaultClientSecret = process.env.GOOGLE_CLIENT_SECRET || "";
    const clientId = await SystemSettingsService.getSetting("GOOGLE_CLIENT_ID", defaultClientId);
    const clientSecret = await SystemSettingsService.getSetting("GOOGLE_CLIENT_SECRET", defaultClientSecret);
    const appUrl = process.env.NEXTAUTH_URL || "https://nutri-track-henna.vercel.app";
    const redirectUri = `${appUrl}/api/integrations/google-fit/callback`;

    let accessToken = "";
    let refreshToken = "";
    let externalUsername = "Google User";
    let externalUserId = `gfit_${userId.slice(0, 8)}`;

    if (clientId && clientSecret && !code.startsWith("mock_")) {
      try {
        const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            code,
            client_id: clientId,
            client_secret: clientSecret,
            redirect_uri: redirectUri,
            grant_type: "authorization_code",
          }),
          signal: AbortSignal.timeout(10000),
        });

        const tokenData = await tokenRes.json();
        if (tokenRes.ok && tokenData.access_token) {
          accessToken = tokenData.access_token;
          refreshToken = tokenData.refresh_token || "";

          // Fetch user info from Google
          const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
            headers: { Authorization: `Bearer ${accessToken}` },
            signal: AbortSignal.timeout(6000),
          });
          if (userRes.ok) {
            const userInfo = await userRes.json();
            externalUsername = userInfo.name || userInfo.email || externalUsername;
            externalUserId = userInfo.id || externalUserId;
          }
        } else {
          console.error("Google OAuth token exchange failed:", JSON.stringify(tokenData));
          throw new Error(tokenData.error_description || tokenData.error || "Google token exchange failed");
        }
      } catch (err: any) {
        console.error("Failed to exchange Google OAuth code:", err.message);
        throw err;
      }
    } else {
      accessToken = "mock_google_fit_token";
      refreshToken = "mock_google_fit_refresh_token";
    }

    // Save integration in Neon DB
    const pool = prisma as any;
    const expiresAt = new Date(Date.now() + 3600 * 1000);

    const saved = await pool.integrationConnection.upsert({
      where: {
        userId_provider: {
          userId,
          provider: "GOOGLE_FIT",
        },
      },
      create: {
        userId,
        provider: "GOOGLE_FIT",
        accessToken,
        refreshToken,
        tokenExpiresAt: expiresAt,
        externalUserId,
        externalUsername,
        scope: "spreadsheets,fitness.activity.read,fitness.body.read",
        status: "CONNECTED",
        lastSyncAt: new Date(),
      },
      update: {
        accessToken,
        refreshToken,
        tokenExpiresAt: expiresAt,
        externalUserId,
        externalUsername,
        scope: "spreadsheets,fitness.activity.read,fitness.body.read",
        status: "CONNECTED",
        lastSyncAt: new Date(),
      },
    });

    return saved;
  }

  /**
   * Syncs daily fitness data (Steps, calories, distance) from Google Fit and persists into ActivityLog
   */
  static async syncGoogleFit(userId: string): Promise<{
    success: boolean;
    importedSteps: number;
    importedCalories: number;
    message: string;
  }> {
    const pool = prisma as any;
    const conn = await pool.integrationConnection.findUnique({
      where: {
        userId_provider: {
          userId,
          provider: "GOOGLE_FIT",
        },
      },
    });

    if (!conn || conn.status !== "CONNECTED") {
      return {
        success: false,
        importedSteps: 0,
        importedCalories: 0,
        message: "Google Fit is not connected.",
      };
    }

    let token = conn.accessToken;
    if (conn.tokenExpiresAt && new Date(conn.tokenExpiresAt) < new Date(Date.now() + 60000) && conn.refreshToken) {
      token = await this.refreshAccessToken(conn);
    }

    let finalSteps = 0;
    let finalCalories = 0;
    let finalDistanceKm = 0;

    // 1. If connected with real Google OAuth Access Token, query Google Fitness REST API
    if (token && !token.startsWith("mock_")) {
      try {
        // Calculate exact start of today in local time (00:00:00.000) to capture WHOLE DAY's total steps
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        const startTimeMillis = startOfToday.getTime();
        const endTimeMillis = now.getTime();

        // 1A. Standard Aggregate Query for full day
        const fitRes = await fetch("https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
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

        // 1B. Direct Raw Dataset Query Fallback (captures estimated steps directly from Android phone)
        if (finalSteps === 0) {
          const startNano = BigInt(startTimeMillis) * BigInt(1000000);
          const endNano = BigInt(endTimeMillis) * BigInt(1000000);
          const rawUrl = `https://www.googleapis.com/fitness/v1/users/me/dataSources/derived:com.google.step_count.delta:com.google.android.gms:estimated_steps/datasets/${startNano}-${endNano}`;

          const rawRes = await fetch(rawUrl, {
            headers: { Authorization: `Bearer ${token}` },
            signal: AbortSignal.timeout(6000),
          });

          if (rawRes.ok) {
            const rawData = await rawRes.json();
            if (rawData.point && rawData.point.length > 0) {
              for (const pt of rawData.point) {
                if (pt.value && pt.value.length > 0) {
                  finalSteps += Number(pt.value[0].intVal) || 0;
                }
              }
            }
          }
        }
      } catch (err: any) {
        console.warn("Google Fit API query notice:", err.message);
      }
    }

    const todayStr = new Date().toISOString().split("T")[0];

    // 2. Persist into ActivityLog so steps appear in Activities tab and Dashboard
    try {
      const existingLog = await pool.activityLog.findFirst({
        where: {
          userId,
          source: "GOOGLE_FIT",
          date: todayStr,
        },
      });

      if (existingLog) {
        await pool.activityLog.update({
          where: { id: existingLog.id },
          data: {
            steps: finalSteps,
            caloriesBurned: finalCalories,
            distanceKm: finalDistanceKm,
            movingDurationSeconds: Math.max(600, Math.round((finalSteps / 100) * 60)),
            averagePaceSecondsPerKm: finalDistanceKm > 0 ? Math.round(3600 / finalDistanceKm) : 0,
            notes: "Google Fit Daily Steps & Activity",
          },
        });
      } else {
        await pool.activityLog.create({
          data: {
            userId,
            activityType: "WALK",
            source: "GOOGLE_FIT",
            externalProvider: "GOOGLE_FIT",
            date: todayStr,
            steps: finalSteps,
            caloriesBurned: finalCalories,
            distanceKm: finalDistanceKm,
            movingDurationSeconds: Math.max(600, Math.round((finalSteps / 100) * 60)),
            averagePaceSecondsPerKm: finalDistanceKm > 0 ? Math.round(3600 / finalDistanceKm) : 0,
            notes: "Google Fit Daily Steps & Activity",
          },
        });
      }
    } catch (dbErr: any) {
      console.warn("Failed to persist Google Fit activity log:", dbErr.message);
    }

    const now = new Date();
    await pool.integrationConnection.update({
      where: {
        userId_provider: {
          userId,
          provider: "GOOGLE_FIT",
        },
      },
      data: {
        lastSyncAt: now,
      },
    });

    return {
      success: true,
      importedSteps: finalSteps,
      importedCalories: finalCalories,
      message: `Successfully synchronized ${finalSteps} steps and ${finalCalories} active calories to your Activities log.`,
    };
  }
}
