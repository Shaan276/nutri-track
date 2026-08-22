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
 * Nutri-Track Smart Sync Webhook Handler (Google Apps Script)
 * Paste this into Extensions -> Apps Script in your copied Google Sheet.
 * Then click Deploy -> New deployment -> Web app (Access: Anyone).
 */
function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetName = data.sheetName || "Daily Summary";
    var sheet = ss.getSheetByName(sheetName);

    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      if (data.headerRow && data.headerRow.length > 0) {
        sheet.appendRow(data.headerRow);
      }
    }

    var rows = data.dataRows || [];
    var keyIndex = data.keyColumnIndex !== undefined ? data.keyColumnIndex : 0;

    // Read existing keys to update in place and prevent duplicate rows
    var lastRow = sheet.getLastRow();
    var existingKeys = {};
    if (lastRow > 1) {
      var keyValues = sheet.getRange(2, keyIndex + 1, lastRow - 1, 1).getValues();
      for (var i = 0; i < keyValues.length; i++) {
        var k = String(keyValues[i][0]);
        if (k) existingKeys[k] = i + 2; // 1-indexed row number
      }
    }

    for (var r = 0; r < rows.length; r++) {
      var row = rows[r];
      var rowKey = String(row[keyIndex] || "");
      if (rowKey && existingKeys[rowKey]) {
        sheet.getRange(existingKeys[rowKey], 1, 1, row.length).setValues([row]);
      } else {
        sheet.appendRow(row);
      }
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      sheetName: sheetName,
      rowsProcessed: rows.length
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
