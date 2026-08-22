import { prisma } from "../lib/db";

async function inspectGoogleError() {
  const pool = prisma as any;
  const user = await prisma.user.findFirst({
    where: { email: "piyushpilkhwal74@gmail.com" },
  });

  if (!user) {
    console.error("User not found");
    return;
  }

  const conn = await pool.integrationConnection.findUnique({
    where: {
      userId_provider: {
        userId: user.id,
        provider: "GOOGLE_FIT",
      },
    },
  });

  if (!conn) {
    console.error("No Google connection in DB for user!");
    return;
  }

  console.log("Found connection in DB:");
  console.log({
    id: conn.id,
    provider: conn.provider,
    status: conn.status,
    accessToken: conn.accessToken ? conn.accessToken.substring(0, 20) + "..." : null,
    hasRefreshToken: Boolean(conn.refreshToken),
    tokenExpiresAt: conn.tokenExpiresAt,
  });

  // 1. Query tokeninfo
  console.log("\n1. Querying Google OAuth tokeninfo...");
  try {
    const tokenInfoRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?access_token=${conn.accessToken}`);
    const tokenInfo = await tokenInfoRes.json();
    console.log("TokenInfo Status:", tokenInfoRes.status);
    console.log("TokenInfo:", JSON.stringify(tokenInfo, null, 2));
  } catch (e: any) {
    console.error("TokenInfo error:", e.message);
  }

  // 2. Query Fitness Aggregate Endpoint and print exact response
  console.log("\n2. Querying Google Fitness dataset:aggregate...");
  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const fitRes = await fetch("https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${conn.accessToken}`,
      },
      body: JSON.stringify({
        aggregateBy: [
          { dataTypeName: "com.google.step_count.delta" },
        ],
        bucketByTime: { durationMillis: 86400000 },
        startTimeMillis: startOfToday.getTime(),
        endTimeMillis: now.getTime(),
      }),
    });

    console.log(`Fitness Status: ${fitRes.status} ${fitRes.statusText}`);
    const fitBody = await fitRes.text();
    console.log("Fitness Body:", fitBody);
  } catch (e: any) {
    console.error("Fitness error:", e.message);
  }
}

inspectGoogleError();
