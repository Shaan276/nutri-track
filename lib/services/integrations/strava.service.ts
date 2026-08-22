import { prisma } from "@/lib/db";
import { IntegrationService } from "./integration.service";
import { SystemSettingsService } from "@/lib/services/admin/system-settings.service";

export interface StravaSyncResult {
  totalFound: number;
  importedCount: number;
  updatedCount: number;
  activities: Array<{
    id: string;
    externalId: string;
    name: string;
    activityType: string;
    date: string;
    distanceKm: number;
    durationMinutes: number;
    caloriesBurned: number;
    isNew: boolean;
  }>;
}

export class StravaService {
  private static CLIENT_ID = process.env.STRAVA_CLIENT_ID || "strava_client_id_placeholder";
  private static CLIENT_SECRET = process.env.STRAVA_CLIENT_SECRET || "strava_secret_placeholder";

  static async getClientId(): Promise<string> {
    return SystemSettingsService.getSetting("STRAVA_CLIENT_ID", this.CLIENT_ID);
  }

  static async getClientSecret(): Promise<string> {
    return SystemSettingsService.getSetting("STRAVA_CLIENT_SECRET", this.CLIENT_SECRET);
  }

  /**
   * Generates official Strava OAuth 2.0 authorization URL
   */
  static async getAuthorizationUrlAsync(userId: string, redirectUri?: string): Promise<string> {
    const clientId = await this.getClientId();
    const baseRedirect =
      redirectUri ||
      `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/integrations/strava/callback`;
    const scope = "read,activity:read_all";
    const state = Buffer.from(JSON.stringify({ userId, timestamp: Date.now() })).toString("base64");

    return `https://www.strava.com/oauth/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(
      baseRedirect
    )}&approval_prompt=auto&scope=${scope}&state=${state}`;
  }

  static getAuthorizationUrl(userId: string, redirectUri?: string): string {
    const baseRedirect =
      redirectUri ||
      `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/integrations/strava/callback`;
    const scope = "read,activity:read_all";
    const state = Buffer.from(JSON.stringify({ userId, timestamp: Date.now() })).toString("base64");

    return `https://www.strava.com/oauth/authorize?client_id=${this.CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(
      baseRedirect
    )}&approval_prompt=auto&scope=${scope}&state=${state}`;
  }

  /**
   * Exchanges OAuth authorization code for Access & Refresh tokens
   */
  static async exchangeCodeForTokens(
    userId: string,
    code: string
  ): Promise<{ success: boolean; athleteName?: string }> {
    const pool = (prisma as any);

    // Support local test / sandbox simulations
    if (code.startsWith("test_code") || code.startsWith("mock_")) {
      const expiresAt = new Date(Date.now() + 6 * 3600 * 1000); // 6 hours
      await pool.integrationConnection.upsert({
        where: {
          userId_provider: {
            userId,
            provider: "STRAVA",
          },
        },
        create: {
          userId,
          provider: "STRAVA",
          status: "CONNECTED",
          accessToken: `mock_strava_token_${Date.now()}`,
          refreshToken: `mock_strava_refresh_${Date.now()}`,
          tokenExpiresAt: expiresAt,
          externalUserId: "athlete_123456",
          externalUsername: "Athlete Runner",
          scope: "read,activity:read_all",
          metadata: JSON.stringify({ premium: true, measurement_preference: "meters" }),
          lastSyncAt: new Date(),
        },
        update: {
          status: "CONNECTED",
          accessToken: `mock_strava_token_${Date.now()}`,
          refreshToken: `mock_strava_refresh_${Date.now()}`,
          tokenExpiresAt: expiresAt,
          externalUserId: "athlete_123456",
          externalUsername: "Athlete Runner",
          lastSyncAt: new Date(),
        },
      });

      return { success: true, athleteName: "Athlete Runner" };
    }

    try {
      const clientId = await this.getClientId();
      const clientSecret = await this.getClientSecret();
      const tokenRes = await fetch("https://www.strava.com/oauth/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          code,
          grant_type: "authorization_code",
        }),
      });

      if (!tokenRes.ok) {
        const errText = await tokenRes.text();
        throw new Error(`Strava token exchange failed: ${errText}`);
      }

      const tokenData = await tokenRes.json();
      const expiresAt = new Date(tokenData.expires_at * 1000);

      await pool.integrationConnection.upsert({
        where: {
          userId_provider: {
            userId,
            provider: "STRAVA",
          },
        },
        create: {
          userId,
          provider: "STRAVA",
          status: "CONNECTED",
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token,
          tokenExpiresAt: expiresAt,
          externalUserId: String(tokenData.athlete?.id || ""),
          externalUsername: `${tokenData.athlete?.firstname || ""} ${tokenData.athlete?.lastname || ""}`.trim(),
          scope: "read,activity:read_all",
          metadata: JSON.stringify(tokenData.athlete || {}),
          lastSyncAt: new Date(),
        },
        update: {
          status: "CONNECTED",
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token,
          tokenExpiresAt: expiresAt,
          externalUserId: String(tokenData.athlete?.id || ""),
          externalUsername: `${tokenData.athlete?.firstname || ""} ${tokenData.athlete?.lastname || ""}`.trim(),
          lastSyncAt: new Date(),
        },
      });

      return {
        success: true,
        athleteName: `${tokenData.athlete?.firstname || ""} ${tokenData.athlete?.lastname || ""}`.trim(),
      };
    } catch (err: any) {
      console.error("Strava OAuth exchange error:", err);
      throw err;
    }
  }

  /**
   * Refreshes expired Strava OAuth tokens
   */
  static async refreshTokensIfNeeded(connection: any): Promise<string> {
    if (!connection || !connection.refreshToken) {
      throw new Error("Missing Strava refresh token");
    }

    // If token is still valid for at least 5 minutes, return it
    if (connection.tokenExpiresAt && new Date(connection.tokenExpiresAt).getTime() > Date.now() + 300000) {
      return connection.accessToken;
    }

    if (connection.accessToken?.startsWith("mock_")) {
      return connection.accessToken;
    }

    const clientId = await this.getClientId();
    const clientSecret = await this.getClientSecret();
    const refreshRes = await fetch("https://www.strava.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "refresh_token",
        refresh_token: connection.refreshToken,
      }),
    });

    if (!refreshRes.ok) {
      throw new Error("Failed to refresh Strava access token");
    }

    const data = await refreshRes.json();
    const expiresAt = new Date(data.expires_at * 1000);

    const pool = (prisma as any);
    await pool.integrationConnection.update({
      where: { id: connection.id },
      data: {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        tokenExpiresAt: expiresAt,
      },
    });

    return data.access_token;
  }

  /**
   * Maps raw Strava activity type to Nutri-Track internal activity type
   */
  public static mapActivityType(stravaType: string): {
    activityType: "RUN" | "WALK" | "CYCLING" | "HIIT" | "WORKOUT" | "OTHER";
    runningType?: "EASY_RUN" | "TEMPO_RUN" | "LONG_RUN" | "RECOVERY_RUN";
  } {
    const lower = (stravaType || "").toLowerCase();
    if (lower.includes("run") || lower.includes("trailrun")) {
      return { activityType: "RUN", runningType: "EASY_RUN" };
    }
    if (lower.includes("walk") || lower.includes("hike")) {
      return { activityType: "WALK" };
    }
    if (lower.includes("ride") || lower.includes("cycle") || lower.includes("bike")) {
      return { activityType: "CYCLING" };
    }
    if (lower.includes("hiit") || lower.includes("crossfit")) {
      return { activityType: "HIIT" };
    }
    if (lower.includes("workout") || lower.includes("weight") || lower.includes("training")) {
      return { activityType: "WORKOUT" };
    }
    return { activityType: "OTHER" };
  }

  /**
   * Synchronizes Strava activities into Nutri-Track activity logs with strict deduplication
   */
  static async syncActivities(
    userId: string,
    options?: {
      simulatedActivities?: any[];
      limit?: number;
    }
  ): Promise<StravaSyncResult> {
    const conn = await IntegrationService.getConnection(userId, "STRAVA");
    if (!conn || conn.status !== "CONNECTED") {
      throw new Error("Strava integration is not connected for this user");
    }

    const pool = (prisma as any);
    let rawActivities: any[] = [];

    if (options?.simulatedActivities && options.simulatedActivities.length > 0) {
      rawActivities = options.simulatedActivities;
    } else if (conn.accessToken?.startsWith("mock_")) {
      // Default demo mock activities if running in development / sandbox mode
      const todayStr = new Date().toISOString().split("T")[0];
      rawActivities = [
        {
          id: 9988771101,
          name: "Morning Tempo Run",
          type: "Run",
          distance: 5400, // 5.4 km
          moving_time: 1680, // 28 mins
          elapsed_time: 1720,
          total_elevation_gain: 45,
          calories: 385,
          start_date: `${todayStr}T07:15:00Z`,
        },
        {
          id: 9988771102,
          name: "Evening Recovery Walk",
          type: "Walk",
          distance: 2200, // 2.2 km
          moving_time: 1500, // 25 mins
          elapsed_time: 1550,
          total_elevation_gain: 10,
          calories: 120,
          start_date: `${todayStr}T18:30:00Z`,
        },
      ];
    } else {
      const token = await this.refreshTokensIfNeeded(conn);
      const res = await fetch(
        `https://www.strava.com/api/v3/athlete/activities?per_page=${options?.limit || 30}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) {
        throw new Error(`Failed to fetch Strava activities: ${res.statusText}`);
      }
      rawActivities = await res.json();
    }

    let importedCount = 0;
    let updatedCount = 0;
    const processedActivities: StravaSyncResult["activities"] = [];

    for (const act of rawActivities) {
      const externalId = String(act.id);
      const classification = this.mapActivityType(act.type);
      const distanceKm = Math.round(((Number(act.distance) || 0) / 1000) * 100) / 100;
      const movingDurationSeconds = Number(act.moving_time) || 0;
      const elapsedDurationSeconds = Number(act.elapsed_time) || movingDurationSeconds;
      const durationMinutes = Math.round(movingDurationSeconds / 60);

      let avgPaceSeconds = 0;
      if (distanceKm > 0 && movingDurationSeconds > 0) {
        avgPaceSeconds = Math.round(movingDurationSeconds / distanceKm);
      }

      // Energy calculation: use Strava calories if available, or convert kilojoules
      let caloriesBurned = Number(act.calories) || 0;
      if (!caloriesBurned && act.kilojoules) {
        caloriesBurned = Math.round(Number(act.kilojoules) * 0.239);
      }

      const date = (act.start_date || new Date().toISOString()).split("T")[0];

      // Deduplication: Check if activity already exists with externalId + source=STRAVA
      const existing = await pool.activityLog.findFirst({
        where: {
          userId,
          source: "STRAVA",
          externalId,
        },
      });

      if (existing) {
        // Update existing record to reconcile any changes without duplicating
        await pool.activityLog.update({
          where: { id: existing.id },
          data: {
            activityType: classification.activityType,
            runningType: classification.runningType || null,
            distanceKm,
            movingDurationSeconds,
            elapsedDurationSeconds,
            averagePaceSecondsPerKm: avgPaceSeconds,
            caloriesBurned,
            elevationGainMeters: Number(act.total_elevation_gain) || 0,
            notes: act.name || "Strava Activity",
          },
        });
        updatedCount++;
        processedActivities.push({
          id: existing.id,
          externalId,
          name: act.name || "Strava Activity",
          activityType: classification.activityType,
          date,
          distanceKm,
          durationMinutes,
          caloriesBurned,
          isNew: false,
        });
      } else {
        // Create new record
        const created = await pool.activityLog.create({
          data: {
            userId,
            source: "STRAVA",
            externalId,
            externalProvider: "STRAVA",
            activityType: classification.activityType,
            runningType: classification.runningType || null,
            date,
            distanceKm,
            movingDurationSeconds,
            elapsedDurationSeconds,
            averagePaceSecondsPerKm: avgPaceSeconds,
            steps: classification.activityType === "RUN" ? Math.round(distanceKm * 1300) : 0,
            caloriesBurned,
            elevationGainMeters: Number(act.total_elevation_gain) || 0,
            notes: act.name || "Strava Activity",
          },
        });
        importedCount++;
        processedActivities.push({
          id: created.id,
          externalId,
          name: act.name || "Strava Activity",
          activityType: classification.activityType,
          date,
          distanceKm,
          durationMinutes,
          caloriesBurned,
          isNew: true,
        });
      }
    }

    // Update lastSyncAt timestamp
    await pool.integrationConnection.update({
      where: { id: conn.id },
      data: { lastSyncAt: new Date() },
    });

    return {
      totalFound: rawActivities.length,
      importedCount,
      updatedCount,
      activities: processedActivities,
    };
  }
}
