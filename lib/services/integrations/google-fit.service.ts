import { prisma } from "@/lib/db";
import { SystemSettingsService } from "@/lib/services/admin/system-settings.service";

export type GoogleSyncStatus =
  | "SUCCESS"
  | "GENUINE_ZERO"
  | "NO_DATA_AVAILABLE"
  | "NOT_CONNECTED"
  | "AUTH_EXPIRED"
  | "API_ERROR";

export interface GoogleDailyStepRecord {
  date: string; // YYYY-MM-DD
  steps: number;
  caloriesBurned: number;
  distanceKm: number;
  status: GoogleSyncStatus;
  dataSource: string;
  syncedAt: string;
}

export interface GoogleFitSyncResult {
  success: boolean;
  status: GoogleSyncStatus;
  importedSteps: number;
  importedCalories: number;
  importedDistanceKm: number;
  date: string;
  records: GoogleDailyStepRecord[];
  message: string;
  lastSyncedAt: string;
}

export class GoogleFitService {
  /**
   * Generates Google OAuth 2.0 Authorization URL with Google Health & Fitness Scopes
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
      `include_granted_scopes=true&` +
      `state=${state}`
    );
  }

  /**
   * Refreshes an expired Google OAuth access token using the stored refresh token
   */
  static async refreshAccessToken(conn: any): Promise<string | null> {
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
        signal: AbortSignal.timeout(8000),
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
      } else {
        const errData = await tokenRes.json().catch(() => ({}));
        console.warn("Failed to refresh Google token, response:", errData);
        return null;
      }
    } catch (err: any) {
      console.warn("Google token refresh error:", err.message);
      return null;
    }
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
      if (!tokenRes.ok || !tokenData.access_token) {
        console.error("Google OAuth token exchange failed:", JSON.stringify(tokenData));
        throw new Error(tokenData.error_description || tokenData.error || "Google token exchange failed");
      }

      accessToken = tokenData.access_token;
      refreshToken = tokenData.refresh_token || "";

      // Fetch user info from Google
      try {
        const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
          headers: { Authorization: `Bearer ${accessToken}` },
          signal: AbortSignal.timeout(6000),
        });
        if (userRes.ok) {
          const userInfo = await userRes.json();
          externalUsername = userInfo.name || userInfo.email || externalUsername;
          externalUserId = userInfo.id || externalUserId;
        }
      } catch (err: any) {
        console.warn("Could not fetch user profile from Google:", err.message);
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
        refreshToken: refreshToken || undefined,
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
   * Disconnects Google integration and invalidates credentials
   */
  static async disconnect(userId: string): Promise<boolean> {
    const pool = prisma as any;
    const conn = await pool.integrationConnection.findUnique({
      where: {
        userId_provider: {
          userId,
          provider: "GOOGLE_FIT",
        },
      },
    });

    if (!conn) return true;

    // Attempt token revocation with Google (non-blocking)
    if (conn.accessToken && !conn.accessToken.startsWith("mock_")) {
      fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(conn.accessToken)}`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      }).catch(() => {});
    }

    await pool.integrationConnection.delete({
      where: { id: conn.id },
    });

    return true;
  }

  /**
   * Retrieves step telemetry for a specific date range with robust status handling
   */
  static async syncGoogleFit(
    userId: string,
    options: { days?: number; timezoneOffsetMinutes?: number } = {}
  ): Promise<GoogleFitSyncResult> {
    const pool = prisma as any;
    const days = Math.min(Math.max(options.days || 1, 1), 14); // 1 to 14 days
    const tzOffset = options.timezoneOffsetMinutes !== undefined ? options.timezoneOffsetMinutes : 0;

    const conn = await pool.integrationConnection.findUnique({
      where: {
        userId_provider: {
          userId,
          provider: "GOOGLE_FIT",
        },
      },
    });

    const now = new Date();
    const todayStr = new Date(now.getTime() - tzOffset * 60000).toISOString().split("T")[0];

    // CASE B: Google account is not connected
    if (!conn || conn.status !== "CONNECTED") {
      return {
        success: false,
        status: "NOT_CONNECTED",
        importedSteps: 0,
        importedCalories: 0,
        importedDistanceKm: 0,
        date: todayStr,
        records: [],
        message: "Google account is not connected. Connect your Google account to sync steps automatically.",
        lastSyncedAt: "",
      };
    }

    // Refresh token if nearing expiration
    let token = conn.accessToken;
    if (conn.tokenExpiresAt && new Date(conn.tokenExpiresAt) < new Date(Date.now() + 60000)) {
      const refreshed = await this.refreshAccessToken(conn);
      if (!refreshed) {
        return {
          success: false,
          status: "AUTH_EXPIRED",
          importedSteps: 0,
          importedCalories: 0,
          importedDistanceKm: 0,
          date: todayStr,
          records: [],
          message: "Google session has expired. Please reconnect your Google account.",
          lastSyncedAt: conn.lastSyncAt ? new Date(conn.lastSyncAt).toISOString() : "",
        };
      }
      token = refreshed;
    }

    const records: GoogleDailyStepRecord[] = [];
    let hadDataPoints = false;
    let apiErrorOccurred = false;

    // Query Google Fitness REST API if real token is available
    if (token && !token.startsWith("mock_")) {
      try {
        // Calculate timestamp boundaries for requested days
        const startOfTodayLocal = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        const startTimeMillis = startOfTodayLocal.getTime() - (days - 1) * 86400000;
        const endTimeMillis = now.getTime();

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
          signal: AbortSignal.timeout(8000),
        });

        if (fitRes.ok) {
          const fitData = await fitRes.json();
          const buckets = fitData.bucket || [];

          for (let i = 0; i < buckets.length; i++) {
            const b = buckets[i];
            const bucketStart = Number(b.startTimeMillis) || startTimeMillis + i * 86400000;
            const bDate = new Date(bucketStart - tzOffset * 60000).toISOString().split("T")[0];

            let bSteps = 0;
            let bCalories = 0;
            let bDistanceKm = 0;
            let pointCount = 0;

            if (b.dataset) {
              for (const ds of b.dataset) {
                if (ds.point && ds.point.length > 0) {
                  for (const pt of ds.point) {
                    pointCount++;
                    hadDataPoints = true;
                    if (pt.value && pt.value.length > 0) {
                      const val = pt.value[0];
                      const intV = Number(val.intVal) || 0;
                      const fpV = Number(val.fpVal) || 0;
                      const num = intV || Math.round(fpV);

                      if (ds.dataSourceId?.includes("step_count") || ds.dataTypeName?.includes("step_count")) {
                        bSteps += num;
                      } else if (ds.dataSourceId?.includes("calories") || ds.dataTypeName?.includes("calories")) {
                        bCalories += num;
                      } else if (ds.dataSourceId?.includes("distance") || ds.dataTypeName?.includes("distance")) {
                        bDistanceKm += Math.round((fpV / 1000) * 100) / 100;
                      }
                    }
                  }
                }
              }
            }

            let status: GoogleSyncStatus = "NO_DATA_AVAILABLE";
            if (pointCount > 0) {
              status = bSteps > 0 ? "SUCCESS" : "GENUINE_ZERO";
            }

            records.push({
              date: bDate,
              steps: bSteps,
              caloriesBurned: bCalories,
              distanceKm: bDistanceKm,
              status,
              dataSource: "Google Account (Cloud Telemetry)",
              syncedAt: now.toISOString(),
            });
          }
        } else {
          const errStatus = fitRes.status;
          console.warn(`Google Fitness API returned status ${errStatus}`);
          if (errStatus === 401 || errStatus === 403) {
            return {
              success: false,
              status: "AUTH_EXPIRED",
              importedSteps: 0,
              importedCalories: 0,
              importedDistanceKm: 0,
              date: todayStr,
              records: [],
              message: "Google permissions have expired. Please re-authenticate your Google Account.",
              lastSyncedAt: conn.lastSyncAt ? new Date(conn.lastSyncAt).toISOString() : "",
            };
          }
          apiErrorOccurred = true;
        }
      } catch (err: any) {
        console.error("Google Fitness API request error:", err.message);
        apiErrorOccurred = true;
      }
    }

    // Fallback lookup from today's ActivityLog if no fresh network points
    const todayRecord = records.find((r) => r.date === todayStr) || {
      date: todayStr,
      steps: 0,
      caloriesBurned: 0,
      distanceKm: 0,
      status: hadDataPoints ? "SUCCESS" : "NO_DATA_AVAILABLE",
      dataSource: "Google Account",
      syncedAt: now.toISOString(),
    };

    // CASE D: API Request failed
    if (apiErrorOccurred && records.length === 0) {
      return {
        success: false,
        status: "API_ERROR",
        importedSteps: 0,
        importedCalories: 0,
        importedDistanceKm: 0,
        date: todayStr,
        records: [],
        message: "Unable to sync steps right now. Please check your internet connection or try again.",
        lastSyncedAt: conn.lastSyncAt ? new Date(conn.lastSyncAt).toISOString() : "",
      };
    }

    // Persist records into ActivityLog with userId + date + source deduplication
    for (const rec of records) {
      if (rec.steps > 0 || rec.status === "GENUINE_ZERO") {
        try {
          const existing = await pool.activityLog.findFirst({
            where: {
              userId,
              date: rec.date,
              source: "GOOGLE_FIT",
            },
          });

          if (existing) {
            await pool.activityLog.update({
              where: { id: existing.id },
              data: {
                steps: rec.steps,
                caloriesBurned: rec.caloriesBurned,
                distanceKm: rec.distanceKm,
                movingDurationSeconds: Math.max(600, Math.round((rec.steps / 100) * 60)),
                averagePaceSecondsPerKm: rec.distanceKm > 0 ? Math.round(3600 / rec.distanceKm) : 0,
                notes: `Google Account Auto-Sync (${rec.status})`,
              },
            });
          } else {
            await pool.activityLog.create({
              data: {
                userId,
                activityType: "WALK",
                source: "GOOGLE_FIT",
                externalProvider: "GOOGLE_FIT",
                date: rec.date,
                steps: rec.steps,
                caloriesBurned: rec.caloriesBurned,
                distanceKm: rec.distanceKm,
                movingDurationSeconds: Math.max(600, Math.round((rec.steps / 100) * 60)),
                averagePaceSecondsPerKm: rec.distanceKm > 0 ? Math.round(3600 / rec.distanceKm) : 0,
                notes: `Google Account Auto-Sync (${rec.status})`,
              },
            });
          }
        } catch (dbErr: any) {
          console.warn("Failed to persist Google ActivityLog:", dbErr.message);
        }
      }
    }

    // Update connection lastSyncAt
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

    let overallStatus: GoogleSyncStatus = todayRecord.status;
    let message = "";

    if (todayRecord.steps > 0) {
      overallStatus = "SUCCESS";
      message = `Successfully synced ${todayRecord.steps.toLocaleString()} steps and ${todayRecord.caloriesBurned} active calories from your Google account.`;
    } else if (todayRecord.status === "GENUINE_ZERO") {
      overallStatus = "GENUINE_ZERO";
      message = "0 steps recorded for today in your Google account.";
    } else {
      overallStatus = "NO_DATA_AVAILABLE";
      message = "No step data is currently available from your connected Google account for today.";
    }

    return {
      success: overallStatus === "SUCCESS" || overallStatus === "GENUINE_ZERO",
      status: overallStatus,
      importedSteps: todayRecord.steps,
      importedCalories: todayRecord.caloriesBurned,
      importedDistanceKm: todayRecord.distanceKm,
      date: todayStr,
      records,
      message,
      lastSyncedAt: now.toISOString(),
    };
  }
}
