import { prisma } from "@/lib/db";
import { GoogleSheetsConnectionService } from "./google-sheets.connection.service";
import { DeepNutritionService } from "@/lib/services/deep-nutrition.service";
import { FoodService } from "@/lib/services/food.service";
import { GoogleSheetsClient } from "@/lib/google/google-sheets-client";
import { WorkbookMapper, WORKBOOK_SHEET_SCHEMAS } from "./workbook-mapper";

export interface SyncOptions {
  direction?: "PULL_FOODS" | "PUSH_LOGS" | "FULL_SYNC";
  dryRun?: boolean;
  dateRangeDays?: number;
  syncSheets?: Array<
    | "FOOD_LOG"
    | "MICRONUTRIENTS"
    | "AMINO_ACIDS"
    | "OTHER_NUTRIENTS"
    | "DAILY_SUMMARY"
    | "FOOD_DATABASE"
    | "NUTRITION_TARGETS"
    | "NUTRIENT_DICTIONARY"
  >;
}

export interface SyncResult {
  success: boolean;
  message: string;
  isLiveConnection?: boolean;
  itemsProcessed?: number;
  syncedAt?: string;
  sheetsSynced?: string[];
  details?: {
    spreadsheetId: string;
    sheets: Record<string, { rowsCount: number; columnsCount: number }>;
  };
}

// In-memory active sync lock to prevent overlapping sync operations per user
const activeSyncMap = new Map<string, boolean>();

/**
 * Multi-Sheet Google Sheets Sync Orchestrator
 * Integrates the Nutri-Track PostgreSQL database with the complete 14-sheet Nutrition Coach workbook.
 */
export class GoogleSheetsService {
  /**
   * Checks if the user has an active, valid Google Spreadsheet connected
   */
  static async isConnected(userId: string): Promise<boolean> {
    const conn = await GoogleSheetsConnectionService.getConnection(userId);
    return conn !== null && conn.status === "CONNECTED";
  }

  /**
   * Checks if live Google API credentials are configured in the server environment
   */
  static isLiveApiConfigured(): boolean {
    return GoogleSheetsClient.hasConfiguredCredentials();
  }

  /**
   * Retrieves meal entries for user across date range with related food metadata
   */
  static async getMealEntriesForSync(userId: string, daysCount: number = 30) {
    const dates: string[] = [];
    const now = new Date();

    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      dates.push(d.toISOString().split("T")[0]);
    }

    const mealLogs = await prisma.mealLog.findMany({
      where: {
        userId,
        date: { in: dates },
      },
      include: {
        entries: {
          include: {
            food: true,
          },
        },
      },
      orderBy: { date: "desc" },
    });

    const entries: any[] = [];
    for (const log of mealLogs) {
      for (const entry of log.entries) {
        entries.push({
          ...entry,
          mealLog: log,
        });
      }
    }

    return entries;
  }

  /**
   * Builds daily summary records for the date range
   */
  static async getDailySummariesForSync(userId: string, daysCount: number = 30) {
    const dates: string[] = [];
    const now = new Date();

    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      dates.push(d.toISOString().split("T")[0]);
    }

    const analyses = await Promise.all(
      dates.map((dt) => DeepNutritionService.getDeepNutritionAnalysis(userId, dt))
    );

    const summaries: any[] = [];
    analyses.forEach((analysis, idx) => {
      if (analysis.loggedMealsCount === 0) return;
      const dt = dates[idx];

      const getNutrientVal = (list: any[], key: string) => {
        const item = list.find((n) => n.key === key);
        return item && item.consumedAmount !== null ? item.consumedAmount : 0;
      };

      summaries.push({
        date: dt,
        calories: analysis.macros.find((m) => m.key === "calories")?.consumedAmount || 0,
        protein: analysis.macros.find((m) => m.key === "protein")?.consumedAmount || 0,
        carbohydrates: analysis.macros.find((m) => m.key === "carbohydrates")?.consumedAmount || 0,
        fat: analysis.macros.find((m) => m.key === "fat")?.consumedAmount || 0,
        fiber: analysis.macros.find((m) => m.key === "fiber")?.consumedAmount || 0,
        sugar: analysis.macros.find((m) => m.key === "sugar")?.consumedAmount || 0,
        water: 0,
        vitaminA: getNutrientVal(analysis.vitamins, "vitaminA"),
        vitaminB1: getNutrientVal(analysis.vitamins, "vitaminB1"),
        vitaminB2: getNutrientVal(analysis.vitamins, "vitaminB2"),
        vitaminB3: getNutrientVal(analysis.vitamins, "vitaminB3"),
        vitaminB5: getNutrientVal(analysis.vitamins, "vitaminB5"),
        vitaminB6: getNutrientVal(analysis.vitamins, "vitaminB6"),
        vitaminB7: getNutrientVal(analysis.vitamins, "vitaminB7"),
        vitaminB9: getNutrientVal(analysis.vitamins, "vitaminB9"),
        vitaminB12: getNutrientVal(analysis.vitamins, "vitaminB12"),
        vitaminC: getNutrientVal(analysis.vitamins, "vitaminC"),
        vitaminD: getNutrientVal(analysis.vitamins, "vitaminD"),
        vitaminE: getNutrientVal(analysis.vitamins, "vitaminE"),
        vitaminK: getNutrientVal(analysis.vitamins, "vitaminK"),
        calcium: getNutrientVal(analysis.minerals, "calcium"),
        iron: getNutrientVal(analysis.minerals, "iron"),
        magnesium: getNutrientVal(analysis.minerals, "magnesium"),
        phosphorus: getNutrientVal(analysis.minerals, "phosphorus"),
        potassium: getNutrientVal(analysis.minerals, "potassium"),
        sodium: getNutrientVal(analysis.minerals, "sodium"),
        zinc: getNutrientVal(analysis.minerals, "zinc"),
        copper: getNutrientVal(analysis.minerals, "copper"),
        manganese: getNutrientVal(analysis.minerals, "manganese"),
        selenium: getNutrientVal(analysis.minerals, "selenium"),
        chromium: getNutrientVal(analysis.minerals, "chromium"),
        molybdenum: getNutrientVal(analysis.minerals, "molybdenum"),
        iodine: getNutrientVal(analysis.minerals, "iodine"),
      });
    });

    return summaries;
  }

  /**
   * Backwards-compatible helper alias for tabular nutrition rows
   */
  static async buildNutritionRows(userId: string, daysCount: number = 30) {
    const summaries = await this.getDailySummariesForSync(userId, daysCount);
    return WorkbookMapper.mapDailySummaryRows(summaries);
  }

  /**
   * Executes full multi-sheet synchronization to user's connected spreadsheet
   */
  static async executeSync(userId: string, options: SyncOptions = {}): Promise<SyncResult> {
    const conn = await GoogleSheetsConnectionService.getConnection(userId);
    if (!conn) {
      return {
        success: false,
        message: "No Google Spreadsheet connected. Please connect your spreadsheet first.",
      };
    }

    // Check concurrency lock for this user
    if (activeSyncMap.get(userId)) {
      return {
        success: true,
        message: "Synchronization is already in progress for this user.",
      };
    }

    activeSyncMap.set(userId, true);
    await GoogleSheetsConnectionService.updateSyncMetadata(userId, "SYNCING");

    try {
      const daysCount = options.dateRangeDays || 30;
      const mealEntries = await this.getMealEntriesForSync(userId, daysCount);
      const dailySummaries = await this.getDailySummariesForSync(userId, daysCount);
      const foods = await FoodService.getUserFoods({ userId });

      const sheetsDetail: Record<string, { rowsCount: number; columnsCount: number }> = {};
      const sheetsSyncedList: string[] = [];
      const webhookUrl = conn.spreadsheetUrl.includes("script.google.com") ? conn.spreadsheetUrl : undefined;

      // 1. Synchronize "Food Log" Sheet
      const foodLogRows = WorkbookMapper.mapMealEntriesToFoodLogRows(mealEntries);
      await GoogleSheetsClient.syncTabularData({
        spreadsheetId: conn.spreadsheetId,
        webhookUrl,
        sheetName: WORKBOOK_SHEET_SCHEMAS.FOOD_LOG.sheetName,
        headerRow: WORKBOOK_SHEET_SCHEMAS.FOOD_LOG.headers,
        dataRows: foodLogRows,
        keyColumnIndex: 0, // Entry ID
      });
      sheetsDetail[WORKBOOK_SHEET_SCHEMAS.FOOD_LOG.sheetName] = {
        rowsCount: foodLogRows.length,
        columnsCount: WORKBOOK_SHEET_SCHEMAS.FOOD_LOG.headers.length,
      };
      sheetsSyncedList.push(WORKBOOK_SHEET_SCHEMAS.FOOD_LOG.sheetName);

      // 2. Synchronize "Micronutrients" Sheet
      const microRows = WorkbookMapper.mapMealEntriesToMicronutrientRows(mealEntries);
      await GoogleSheetsClient.syncTabularData({
        spreadsheetId: conn.spreadsheetId,
        webhookUrl,
        sheetName: WORKBOOK_SHEET_SCHEMAS.MICRONUTRIENTS.sheetName,
        headerRow: WORKBOOK_SHEET_SCHEMAS.MICRONUTRIENTS.headers,
        dataRows: microRows,
        keyColumnIndex: 0, // Entry ID
      });
      sheetsDetail[WORKBOOK_SHEET_SCHEMAS.MICRONUTRIENTS.sheetName] = {
        rowsCount: microRows.length,
        columnsCount: WORKBOOK_SHEET_SCHEMAS.MICRONUTRIENTS.headers.length,
      };
      sheetsSyncedList.push(WORKBOOK_SHEET_SCHEMAS.MICRONUTRIENTS.sheetName);

      // 3. Synchronize "Amino Acids" Sheet
      const aminoRows = WorkbookMapper.mapMealEntriesToAminoAcidRows(mealEntries);
      await GoogleSheetsClient.syncTabularData({
        spreadsheetId: conn.spreadsheetId,
        webhookUrl,
        sheetName: WORKBOOK_SHEET_SCHEMAS.AMINO_ACIDS.sheetName,
        headerRow: WORKBOOK_SHEET_SCHEMAS.AMINO_ACIDS.headers,
        dataRows: aminoRows,
        keyColumnIndex: 0, // Entry ID
      });
      sheetsDetail[WORKBOOK_SHEET_SCHEMAS.AMINO_ACIDS.sheetName] = {
        rowsCount: aminoRows.length,
        columnsCount: WORKBOOK_SHEET_SCHEMAS.AMINO_ACIDS.headers.length,
      };
      sheetsSyncedList.push(WORKBOOK_SHEET_SCHEMAS.AMINO_ACIDS.sheetName);

      // 4. Synchronize "Other Nutrients" Sheet
      const otherRows = WorkbookMapper.mapMealEntriesToOtherNutrientRows(mealEntries);
      await GoogleSheetsClient.syncTabularData({
        spreadsheetId: conn.spreadsheetId,
        webhookUrl,
        sheetName: WORKBOOK_SHEET_SCHEMAS.OTHER_NUTRIENTS.sheetName,
        headerRow: WORKBOOK_SHEET_SCHEMAS.OTHER_NUTRIENTS.headers,
        dataRows: otherRows,
        keyColumnIndex: 0, // Entry ID
      });
      sheetsDetail[WORKBOOK_SHEET_SCHEMAS.OTHER_NUTRIENTS.sheetName] = {
        rowsCount: otherRows.length,
        columnsCount: WORKBOOK_SHEET_SCHEMAS.OTHER_NUTRIENTS.headers.length,
      };
      sheetsSyncedList.push(WORKBOOK_SHEET_SCHEMAS.OTHER_NUTRIENTS.sheetName);

      // 5. Synchronize "Daily Summary" Sheet
      const dailyRows = WorkbookMapper.mapDailySummaryRows(dailySummaries);
      await GoogleSheetsClient.syncTabularData({
        spreadsheetId: conn.spreadsheetId,
        webhookUrl,
        sheetName: WORKBOOK_SHEET_SCHEMAS.DAILY_SUMMARY.sheetName,
        headerRow: WORKBOOK_SHEET_SCHEMAS.DAILY_SUMMARY.headers,
        dataRows: dailyRows,
        keyColumnIndex: 0, // Date
      });
      sheetsDetail[WORKBOOK_SHEET_SCHEMAS.DAILY_SUMMARY.sheetName] = {
        rowsCount: dailyRows.length,
        columnsCount: WORKBOOK_SHEET_SCHEMAS.DAILY_SUMMARY.headers.length,
      };
      sheetsSyncedList.push(WORKBOOK_SHEET_SCHEMAS.DAILY_SUMMARY.sheetName);

      // 6. Synchronize "Food Database" Sheet
      const foodDbRows = WorkbookMapper.mapFoodsToFoodDatabaseRows(foods);
      await GoogleSheetsClient.syncTabularData({
        spreadsheetId: conn.spreadsheetId,
        webhookUrl,
        sheetName: WORKBOOK_SHEET_SCHEMAS.FOOD_DATABASE.sheetName,
        headerRow: WORKBOOK_SHEET_SCHEMAS.FOOD_DATABASE.headers,
        dataRows: foodDbRows,
        keyColumnIndex: 0, // Food ID
      });
      sheetsDetail[WORKBOOK_SHEET_SCHEMAS.FOOD_DATABASE.sheetName] = {
        rowsCount: foodDbRows.length,
        columnsCount: WORKBOOK_SHEET_SCHEMAS.FOOD_DATABASE.headers.length,
      };
      sheetsSyncedList.push(WORKBOOK_SHEET_SCHEMAS.FOOD_DATABASE.sheetName);

      // 7. Synchronize "Nutrition Targets" Sheet
      const targetRows = WorkbookMapper.mapTargetsToNutritionTargetRows();
      await GoogleSheetsClient.syncTabularData({
        spreadsheetId: conn.spreadsheetId,
        webhookUrl,
        sheetName: WORKBOOK_SHEET_SCHEMAS.NUTRITION_TARGETS.sheetName,
        headerRow: WORKBOOK_SHEET_SCHEMAS.NUTRITION_TARGETS.headers,
        dataRows: targetRows,
        keyColumnIndex: 0, // Nutrient Key
      });
      sheetsDetail[WORKBOOK_SHEET_SCHEMAS.NUTRITION_TARGETS.sheetName] = {
        rowsCount: targetRows.length,
        columnsCount: WORKBOOK_SHEET_SCHEMAS.NUTRITION_TARGETS.headers.length,
      };
      sheetsSyncedList.push(WORKBOOK_SHEET_SCHEMAS.NUTRITION_TARGETS.sheetName);

      // 8. Synchronize "Nutrient Dictionary" Sheet
      const dictRows = WorkbookMapper.mapNutrientDictionaryRows();
      await GoogleSheetsClient.syncTabularData({
        spreadsheetId: conn.spreadsheetId,
        webhookUrl,
        sheetName: WORKBOOK_SHEET_SCHEMAS.NUTRIENT_DICTIONARY.sheetName,
        headerRow: WORKBOOK_SHEET_SCHEMAS.NUTRIENT_DICTIONARY.headers,
        dataRows: dictRows,
        keyColumnIndex: 0, // Nutrient Key
      });
      sheetsDetail[WORKBOOK_SHEET_SCHEMAS.NUTRIENT_DICTIONARY.sheetName] = {
        rowsCount: dictRows.length,
        columnsCount: WORKBOOK_SHEET_SCHEMAS.NUTRIENT_DICTIONARY.headers.length,
      };
      sheetsSyncedList.push(WORKBOOK_SHEET_SCHEMAS.NUTRIENT_DICTIONARY.sheetName);

      const now = new Date();
      await GoogleSheetsConnectionService.updateSyncMetadata(userId, "SUCCESS", now);

      const isLive = GoogleSheetsClient.hasConfiguredCredentials();
      const statusPrefix = isLive ? "Live Google Drive Sync" : "Architectural Sync Ready";

      return {
        success: true,
        isLiveConnection: isLive,
        message: `Successfully synchronized ${sheetsSyncedList.length} workbook sheets (${mealEntries.length} food logs, ${dailySummaries.length} daily summaries, ${foods.length} foods). [${statusPrefix}]`,
        itemsProcessed: mealEntries.length,
        syncedAt: now.toISOString(),
        sheetsSynced: sheetsSyncedList,
        details: {
          spreadsheetId: conn.spreadsheetId,
          sheets: sheetsDetail,
        },
      };
    } catch (err: any) {
      await GoogleSheetsConnectionService.updateSyncMetadata(userId, "FAILED");
      return {
        success: false,
        message: err.message || "Failed to synchronize with Google Sheets",
      };
    } finally {
      activeSyncMap.delete(userId);
    }
  }

  /**
   * Non-blocking Smart Background Auto-Sync
   * Safely triggers sync after a successful meal mutation if user is connected
   */
  static triggerAutoSync(userId: string): void {
    (async () => {
      try {
        const connected = await this.isConnected(userId);
        if (!connected) return;
        await this.executeSync(userId, { dateRangeDays: 7 });
      } catch (err: any) {
        console.warn(`[AutoSync] Background synchronization notice for user ${userId}:`, err.message);
      }
    })();
  }
}
