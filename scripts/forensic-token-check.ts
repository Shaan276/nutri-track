import { prisma } from "../lib/db";

async function forensicTokenCheck() {
  const pool = prisma as any;
  const user = await prisma.user.findFirst({
    where: { email: "piyushpilkhwal74@gmail.com" },
  });

  if (!user) {
    console.log("User not found!");
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

  console.log("=== CONNECTION RECORD IN NEON DB ===");
  console.log({
    id: conn?.id,
    userId: conn?.userId,
    provider: conn?.provider,
    status: conn?.status,
    externalUsername: conn?.externalUsername,
    externalUserId: conn?.externalUserId,
    scope: conn?.scope,
    tokenExpiresAt: conn?.tokenExpiresAt,
    accessTokenPrefix: conn?.accessToken ? conn.accessToken.substring(0, 20) + "..." : null,
    hasAccessToken: Boolean(conn?.accessToken),
    hasRefreshToken: Boolean(conn?.refreshToken),
    refreshTokenPrefix: conn?.refreshToken ? conn.refreshToken.substring(0, 20) + "..." : null,
  });

  if (!conn?.accessToken) {
    console.log("No access token found!");
    return;
  }

  // 1. Check tokeninfo
  console.log("\n1. Calling https://oauth2.googleapis.com/tokeninfo...");
  try {
    const tiRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?access_token=${conn.accessToken}`);
    const tiData = await tiRes.json();
    console.log(`Tokeninfo Status: ${tiRes.status}`);
    console.log("Tokeninfo Body:", JSON.stringify(tiData, null, 2));
  } catch (e: any) {
    console.error("Tokeninfo error:", e.message);
  }

  // 2. Call userinfo
  console.log("\n2. Calling https://www.googleapis.com/oauth2/v2/userinfo...");
  try {
    const uiRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${conn.accessToken}` },
    });
    const uiData = await uiRes.json();
    console.log(`Userinfo Status: ${uiRes.status}`);
    console.log("Userinfo Body:", JSON.stringify(uiData, null, 2));
  } catch (e: any) {
    console.error("Userinfo error:", e.message);
  }

  // 3. Call Google Fitness aggregate
  console.log("\n3. Calling https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate...");
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

forensicTokenCheck();
