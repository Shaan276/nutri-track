import { prisma } from "../lib/db";

async function inspectLiveTokenAndCallGoogle() {
  console.log("=== INSPECTING LIVE TOKEN IN NEON DB ===");
  const pool = prisma as any;
  const user = await prisma.user.findFirst({
    where: { email: "piyushpilkhwal74@gmail.com" },
  });

  if (!user) {
    console.error("User not found in DB");
    return;
  }

  const conn = await pool.integrationConnection.findFirst({
    where: { userId: user.id },
  });

  if (!conn) {
    console.error("No integration connection found in DB!");
    return;
  }

  console.log("Connection Record:", {
    id: conn.id,
    provider: conn.provider,
    status: conn.status,
    externalUsername: conn.externalUsername,
    scope: conn.scope,
    tokenExpiresAt: conn.tokenExpiresAt,
    accessToken: conn.accessToken ? conn.accessToken.substring(0, 20) + "..." : null,
    refreshToken: conn.refreshToken ? conn.refreshToken.substring(0, 20) + "..." : null,
  });

  const token = conn.accessToken;
  if (!token) {
    console.error("No access token!");
    return;
  }

  // 1. Check Token Info / Scopes
  console.log("\n1. Querying tokeninfo from Google...");
  try {
    const tokenInfoRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?access_token=${token}`);
    const tokenInfo = await tokenInfoRes.json();
    console.log("TokenInfo Status:", tokenInfoRes.status);
    console.log("TokenInfo Body:", JSON.stringify(tokenInfo, null, 2));
  } catch (e: any) {
    console.error("TokenInfo Error:", e.message);
  }

  // 2. Query ALL Data Sources on Google Fit
  console.log("\n2. Querying all dataSources for user...");
  try {
    const dsRes = await fetch("https://www.googleapis.com/fitness/v1/users/me/dataSources", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const dsData = await dsRes.json();
    console.log("DataSources Status:", dsRes.status);
    console.log("DataSources Count:", dsData.dataSource?.length || 0);
    if (dsData.dataSource && dsData.dataSource.length > 0) {
      for (const ds of dsData.dataSource) {
        console.log(` - Stream ID: ${ds.dataStreamId}`);
        console.log(`   Type: ${ds.dataType?.name}`);
        console.log(`   App: ${ds.application?.name || ds.application?.packageName}`);
      }
    } else {
      console.log("Raw DataSources:", JSON.stringify(dsData, null, 2));
    }
  } catch (e: any) {
    console.error("DataSources Error:", e.message);
  }

  // 3. Query All Datasets / Sessions
  console.log("\n3. Querying sessions for user...");
  try {
    const sessRes = await fetch("https://www.googleapis.com/fitness/v1/users/me/sessions", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const sessData = await sessRes.json();
    console.log("Sessions Status:", sessRes.status);
    console.log("Sessions:", JSON.stringify(sessData, null, 2));
  } catch (e: any) {
    console.error("Sessions Error:", e.message);
  }
}

inspectLiveTokenAndCallGoogle();
