import { prisma } from "../lib/db";
import { GoogleSheetsConnectionService } from "../lib/services/google-sheets/google-sheets.connection.service";
import { GoogleSheetsService } from "../lib/services/google-sheets/google-sheets.service";

async function activateWebhooks() {
  const user = await prisma.user.findFirst({
    where: { email: "piyushpilkhwal74@gmail.com" },
  });

  if (!user) {
    console.log("Admin user not found");
    return;
  }

  // Connect to the active deployed Webhook URL
  const webhookUrl = "https://script.google.com/macros/s/AKfycbxyGRj8IapgCnGxTzsEZgZtLGxBRcBuAYJKaktsi7KqKjLcIqulh7P41pE5vbuY5VHt/exec";
  await GoogleSheetsConnectionService.connectSpreadsheet(
    user.id,
    webhookUrl,
    "Nutrition Track 2026 Live Webhook"
  );

  console.log("✅ Linked active Webhook URL for", user.email);

  // Trigger sync now
  const syncResult = await GoogleSheetsService.executeSync(user.id, { dateRangeDays: 30 });
  console.log("Sync Execution Result:", JSON.stringify(syncResult, null, 2));
}

activateWebhooks();
