import { prisma } from "@/lib/db";
import { IntegrationProvider } from "@prisma/client";

export interface ConnectedProviderDto {
  provider: IntegrationProvider;
  status: "CONNECTED" | "DISCONNECTED" | "ERROR";
  externalUserId: string | null;
  externalUsername: string | null;
  scope: string | null;
  lastSyncAt: string | null;
  createdAt: string;
}

export class IntegrationService {
  /**
   * Retrieves all connected services for the authenticated user (Tokens stripped for security)
   */
  static async getConnectedIntegrations(userId: string): Promise<ConnectedProviderDto[]> {
    const pool = (prisma as any);
    const records = await pool.integrationConnection.findMany({
      where: { userId },
    });

    const results: ConnectedProviderDto[] = records.map((r: any) => ({
      provider: r.provider as IntegrationProvider,
      status: (r.status || "CONNECTED") as any,
      externalUserId: r.externalUserId || null,
      externalUsername: r.externalUsername || null,
      scope: r.scope || null,
      lastSyncAt: r.lastSyncAt ? new Date(r.lastSyncAt).toISOString() : null,
      createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
    }));

    // Backwards compatibility with Google Sheets connection table
    const googleSheet = await pool.googleSheetConnection.findUnique({
      where: { userId },
    });
    if (googleSheet && !results.some((r) => r.provider === "GOOGLE_SHEETS")) {
      results.push({
        provider: "GOOGLE_SHEETS",
        status: (googleSheet.status || "CONNECTED") as any,
        externalUserId: googleSheet.spreadsheetId || null,
        externalUsername: googleSheet.spreadsheetName || "Nutri-Track Sheet",
        scope: "read,write",
        lastSyncAt: googleSheet.lastSyncAt ? new Date(googleSheet.lastSyncAt).toISOString() : null,
        createdAt: googleSheet.createdAt ? new Date(googleSheet.createdAt).toISOString() : new Date().toISOString(),
      });
    }

    return results;
  }

  /**
   * Gets specific provider connection for the authenticated user
   */
  static async getConnection(userId: string, provider: IntegrationProvider) {
    const pool = (prisma as any);
    return pool.integrationConnection.findUnique({
      where: {
        userId_provider: {
          userId,
          provider,
        },
      },
    });
  }

  /**
   * Disconnects and removes provider credentials
   */
  static async disconnectIntegration(userId: string, provider: IntegrationProvider): Promise<boolean> {
    const pool = (prisma as any);
    try {
      await pool.integrationConnection.delete({
        where: {
          userId_provider: {
            userId,
            provider,
          },
        },
      });
      return true;
    } catch {
      return false;
    }
  }
}
