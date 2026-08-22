import { prisma } from "@/lib/db";
import { extractSpreadsheetId } from "@/lib/validations/google-sheets";

export interface GoogleSheetConnectionDto {
  id: string;
  userId: string;
  spreadsheetId: string;
  spreadsheetUrl: string;
  sheetTitle: string | null;
  status: "CONNECTED" | "DISCONNECTED" | "ERROR";
  syncStatus: "IDLE" | "SYNCING" | "SUCCESS" | "FAILED";
  lastSyncedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export class GoogleSheetsConnectionService {
  /**
   * Retrieves active Google Spreadsheet connection for the user
   */
  static async getConnection(userId: string): Promise<GoogleSheetConnectionDto | null> {
    const conn = await prisma.googleSheetConnection.findUnique({
      where: { userId },
    });

    if (!conn) return null;

    return {
      id: conn.id,
      userId: conn.userId,
      spreadsheetId: conn.spreadsheetId,
      spreadsheetUrl: conn.spreadsheetUrl,
      sheetTitle: conn.sheetTitle,
      status: conn.status as any,
      syncStatus: conn.syncStatus as any,
      lastSyncedAt: conn.lastSyncedAt ? conn.lastSyncedAt.toISOString() : null,
      createdAt: conn.createdAt.toISOString(),
      updatedAt: conn.updatedAt.toISOString(),
    };
  }

  /**
   * Connects or updates a Google Spreadsheet connection for the authenticated user
   */
  static async connectSpreadsheet(
    userId: string,
    rawUrl: string,
    sheetTitle?: string | null
  ): Promise<GoogleSheetConnectionDto> {
    // 1. Validate URL and extract Spreadsheet ID internally
    const { spreadsheetId, cleanUrl } = extractSpreadsheetId(rawUrl);

    // 2. Persist in database (upsert per user)
    const existing = await prisma.googleSheetConnection.findUnique({
      where: { userId },
    });

    let saved;
    if (existing) {
      saved = await prisma.googleSheetConnection.update({
        where: { userId },
        data: {
          spreadsheetId,
          spreadsheetUrl: cleanUrl,
          sheetTitle: sheetTitle || existing.sheetTitle || "My Nutrition Spreadsheet",
          status: "CONNECTED",
          syncStatus: "IDLE",
        },
      });
    } else {
      saved = await prisma.googleSheetConnection.create({
        data: {
          userId,
          spreadsheetId,
          spreadsheetUrl: cleanUrl,
          sheetTitle: sheetTitle || "My Nutrition Spreadsheet",
          status: "CONNECTED",
          syncStatus: "IDLE",
        },
      });
    }

    return {
      id: saved.id,
      userId: saved.userId,
      spreadsheetId: saved.spreadsheetId,
      spreadsheetUrl: saved.spreadsheetUrl,
      sheetTitle: saved.sheetTitle,
      status: saved.status as any,
      syncStatus: saved.syncStatus as any,
      lastSyncedAt: saved.lastSyncedAt ? saved.lastSyncedAt.toISOString() : null,
      createdAt: saved.createdAt.toISOString(),
      updatedAt: saved.updatedAt.toISOString(),
    };
  }

  /**
   * Disconnects / removes the spreadsheet connection
   */
  static async disconnectSpreadsheet(userId: string): Promise<{ success: boolean }> {
    const existing = await prisma.googleSheetConnection.findUnique({
      where: { userId },
    });

    if (!existing) {
      return { success: true };
    }

    await prisma.googleSheetConnection.delete({
      where: { userId },
    });

    return { success: true };
  }

  /**
   * Updates last sync timestamp and status
   */
  static async updateSyncMetadata(
    userId: string,
    syncStatus: "IDLE" | "SYNCING" | "SUCCESS" | "FAILED",
    lastSyncedAt?: Date
  ) {
    return prisma.googleSheetConnection.update({
      where: { userId },
      data: {
        syncStatus,
        lastSyncedAt: lastSyncedAt || new Date(),
      },
    });
  }
}
