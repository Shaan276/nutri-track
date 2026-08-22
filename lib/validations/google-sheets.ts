import { z } from "zod";

/**
 * Standard Google Sheets URL regex pattern matching public, shared, or private document paths
 */
export const GOOGLE_SHEETS_URL_REGEX = /https:\/\/docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/;

/**
 * Google Apps Script Webhook URL regex pattern (Option 1 - Zero Cloud Setup)
 */
export const GOOGLE_APPS_SCRIPT_URL_REGEX = /https:\/\/script\.google\.com\/macros\/s\/([a-zA-Z0-9-_]+)\/exec/;

/**
 * Default master nutrition template link (configurable via environment variable)
 */
export const DEFAULT_NUTRITION_TEMPLATE_URL =
  process.env.NEXT_PUBLIC_GOOGLE_SHEETS_TEMPLATE_URL ||
  "https://docs.google.com/spreadsheets/d/19EFB0ufPY8YHNbLp0PTwrJuFJJVz_6lz-ofau3TSxsY/edit?gid=0#gid=0";

/**
 * Standard copy-pasteable Google Apps Script for the user's spreadsheet (Option 1)
 */
export const GOOGLE_APPS_SCRIPT_TEMPLATE = `/**
 * Nutri-Track Smart Multi-Sheet Sync Webhook Handler (Google Apps Script)
 * Paste this into Extensions -> Apps Script in your Google Sheet.
 * Then click Deploy -> New deployment -> Web app (Execute as: Me, Access: Anyone).
 */
function doGet(e) {
  return ContentService.createTextOutput("Nutri-Track Webhook Active")
    .setMimeType(ContentService.MimeType.TEXT);
}

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetsList = data.sheets || [data];
    var totalProcessed = 0;

    for (var s = 0; s < sheetsList.length; s++) {
      var item = sheetsList[s];
      var sheetName = item.sheetName || "Daily Summary";
      var sheet = ss.getSheetByName(sheetName);

      if (!sheet) {
        sheet = ss.insertSheet(sheetName);
        if (item.headerRow && item.headerRow.length > 0) {
          sheet.appendRow(item.headerRow);
        }
      }

      var rows = item.dataRows || [];
      if (rows.length === 0) continue;

      var keyIndex = item.keyColumnIndex !== undefined ? item.keyColumnIndex : 0;
      var lastRow = sheet.getLastRow();
      var existingKeys = {};

      if (lastRow > 1) {
        var keyValues = sheet.getRange(2, keyIndex + 1, lastRow - 1, 1).getValues();
        for (var i = 0; i < keyValues.length; i++) {
          var k = String(keyValues[i][0]);
          if (k) existingKeys[k] = i + 2;
        }
      }

      var appends = [];
      for (var r = 0; r < rows.length; r++) {
        var row = rows[r];
        var rowKey = String(row[keyIndex] || "");
        if (rowKey && existingKeys[rowKey]) {
          sheet.getRange(existingKeys[rowKey], 1, 1, row.length).setValues([row]);
        } else {
          appends.push(row);
        }
        totalProcessed++;
      }

      // Ultra-fast bulk write for new rows
      if (appends.length > 0) {
        var startRow = Math.max(2, sheet.getLastRow() + 1);
        sheet.getRange(startRow, 1, appends.length, appends[0].length).setValues(appends);
      }
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      sheetsProcessed: sheetsList.length,
      rowsProcessed: totalProcessed
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
`;

export type ConnectionMode = "APPS_SCRIPT_WEBHOOK" | "SPREADSHEET_URL";

/**
 * Safely validates and extracts the identifier and connection mode
 */
export function extractSpreadsheetId(url: string): {
  spreadsheetId: string;
  cleanUrl: string;
  mode: ConnectionMode;
} {
  if (!url || typeof url !== "string") {
    throw new Error("INVALID_URL: Spreadsheet or Webhook URL is required");
  }

  const trimmed = url.trim();

  // 1. Check if Apps Script Webhook URL (Option 1)
  const webhookMatch = trimmed.match(GOOGLE_APPS_SCRIPT_URL_REGEX);
  if (webhookMatch && webhookMatch[1]) {
    return {
      spreadsheetId: webhookMatch[1],
      cleanUrl: trimmed,
      mode: "APPS_SCRIPT_WEBHOOK",
    };
  }

  // 2. Check if Google Spreadsheet URL
  const sheetMatch = trimmed.match(GOOGLE_SHEETS_URL_REGEX);
  if (sheetMatch && sheetMatch[1] && sheetMatch[1].length >= 10) {
    return {
      spreadsheetId: sheetMatch[1],
      cleanUrl: trimmed,
      mode: "SPREADSHEET_URL",
    };
  }

  throw new Error(
    "INVALID_URL: Please provide either a valid Google Spreadsheet URL or a Google Apps Script Webhook URL (e.g. https://script.google.com/macros/s/.../exec)"
  );
}

/**
 * Zod validation schema for connecting a Google Spreadsheet or Webhook
 */
export const connectSpreadsheetSchema = z.object({
  spreadsheetUrl: z
    .string()
    .trim()
    .min(10, "Spreadsheet or Webhook URL is required")
    .refine(
      (url) => GOOGLE_SHEETS_URL_REGEX.test(url) || GOOGLE_APPS_SCRIPT_URL_REGEX.test(url),
      {
        message:
          "Must be a valid Google Sheets URL (https://docs.google.com/spreadsheets/d/...) or Apps Script Webhook URL (https://script.google.com/macros/s/.../exec)",
      }
    ),
  sheetTitle: z.string().trim().max(100).optional().nullable(),
});

export type ConnectSpreadsheetInput = z.infer<typeof connectSpreadsheetSchema>;
