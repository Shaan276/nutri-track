/**
 * Global TypeScript interfaces and types for Nutri-Track foundation
 */

export type Environment = "development" | "production" | "test";

export interface HealthStatusResponse {
  status: "ok" | "degraded" | "error";
  application: string;
  database: "connected" | "disconnected" | "unconfigured";
  environment: string;
  timestamp: string;
  uptimeSeconds?: number;
  message?: string;
}

export interface SystemStatus {
  applicationStatus: "running" | "starting" | "degraded";
  databaseStatus: "connected" | "disconnected" | "unconfigured";
  environment: Environment;
  version: string;
}
