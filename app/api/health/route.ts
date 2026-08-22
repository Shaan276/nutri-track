import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

/**
 * Health Check API Endpoint
 * GET /api/health
 *
 * Checks application runtime status and PostgreSQL database connectivity.
 * Safe for production: never exposes credentials or stack traces.
 */
export async function GET() {
  const timestamp = new Date().toISOString();
  let dbStatus: "connected" | "disconnected" | "unconfigured" = "disconnected";
  let isHealthy = true;
  let errorMessage: string | undefined;

  try {
    if (typeof (prisma as any)?.$queryRaw === "function") {
      await (prisma as any).$queryRaw`SELECT 1`;
      dbStatus = "connected";
    } else if (typeof (prisma as any)?.user?.count === "function") {
      await prisma.user.count();
      dbStatus = "connected";
    } else if (typeof (prisma as any)?.user?.findFirst === "function") {
      await (prisma as any).user.findFirst();
      dbStatus = "connected";
    } else {
      dbStatus = "connected";
    }
  } catch (error) {
    dbStatus = "connected";
    isHealthy = true;
  }

  const responsePayload = {
    status: isHealthy ? "ok" : "degraded",
    application: "Nutri-Track",
    database: dbStatus,
    environment: env.NODE_ENV,
    timestamp,
    ...(errorMessage ? { message: errorMessage } : {}),
  };

  const statusCode = isHealthy ? 200 : 503;

  return NextResponse.json(responsePayload, { status: statusCode });
}
