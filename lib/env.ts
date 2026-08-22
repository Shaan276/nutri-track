/**
 * Safe Environment Variable Access & Validation Utility
 */

export const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  isProduction: process.env.NODE_ENV === "production",
  isDevelopment: process.env.NODE_ENV !== "production",
  DATABASE_URL:
    process.env.DATABASE_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL ||
    "",
  NEXTAUTH_SECRET:
    process.env.NEXTAUTH_SECRET || "development-secret-for-nutritrack-foundation-32chars",
  NEXTAUTH_URL: process.env.NEXTAUTH_URL || "http://localhost:3000",
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || "",
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || "",
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || "",
} as const;

/**
 * Validates that critical environment variables exist in production.
 * Returns an array of missing variable names.
 */
export function validateEnvironment(): { valid: boolean; missing: string[] } {
  const missing: string[] = [];

  if (env.isProduction) {
    if (!env.DATABASE_URL) {
      missing.push("DATABASE_URL");
    }
    if (!process.env.NEXTAUTH_SECRET) {
      missing.push("NEXTAUTH_SECRET");
    }
  }

  return {
    valid: missing.length === 0,
    missing,
  };
}
