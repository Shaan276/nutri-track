import React from "react";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NutriTrackLogo } from "@/components/branding/NutriTrackLogo";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import {
  CheckCircle2,
  AlertTriangle,
  Database,
  Activity,
  Layers,
  Server,
  LogIn,
  UserPlus,
  ArrowRight,
} from "lucide-react";

export const dynamic = "force-dynamic";

async function checkDatabaseConnection(): Promise<{
  connected: boolean;
  statusText: string;
}> {
  if (!env.DATABASE_URL) {
    return { connected: false, statusText: "Unconfigured" };
  }

  try {
    await Promise.race([
      prisma.$queryRaw`SELECT 1`,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Timeout")), 2000)
      ),
    ]);
    return { connected: true, statusText: "Connected" };
  } catch {
    return { connected: false, statusText: "Disconnected" };
  }
}

export default async function HomePage() {
  const dbInfo = await checkDatabaseConnection();
  const session = await getServerSession(authOptions);

  return (
    <main className="min-h-screen bg-background-midnight flex flex-col items-center justify-center p-6 sm:p-12 relative overflow-hidden">
      {/* Background radial gradient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-brand-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="w-full max-w-2xl mx-auto flex flex-col items-center text-center space-y-10">
        {/* Branding Header */}
        <div className="flex flex-col items-center space-y-4">
          <NutriTrackLogo size="xl" subtitle="HEALTH OS" />

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/30 text-brand-400 text-xs font-semibold uppercase tracking-widest mt-2">
            <span className="h-2 w-2 rounded-full bg-brand-400 animate-pulse" />
            Foundation &amp; Auth Ready
          </div>
        </div>

        {/* Authentication Quick Actions */}
        <div className="w-full flex flex-col sm:flex-row items-center justify-center gap-3">
          {session?.user ? (
            <Link
              href="/app"
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-black font-bold text-sm flex items-center justify-center gap-2 shadow-brand-glow hover:shadow-brand-glow-lg transition-all"
            >
              <span>Go to App ({session.user.name})</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-black font-bold text-sm flex items-center justify-center gap-2 shadow-brand-glow hover:shadow-brand-glow-lg transition-all"
              >
                <LogIn className="h-4 w-4" />
                <span>Sign In</span>
              </Link>
              <Link
                href="/register"
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-background-elevated hover:bg-background-surface border border-border-default text-foreground-primary font-bold text-sm flex items-center justify-center gap-2 transition-all"
              >
                <UserPlus className="h-4 w-4 text-brand-400" />
                <span>Create Account</span>
              </Link>
            </>
          )}
        </div>

        {/* System Status Card */}
        <div className="w-full bg-background-surface/80 backdrop-blur-md border border-border-default rounded-2xl p-6 sm:p-8 shadow-surface-card text-left space-y-6">
          <div className="flex items-center justify-between border-b border-border-subtle pb-4">
            <h2 className="text-lg font-bold text-foreground-primary tracking-tight flex items-center gap-2">
              <Activity className="h-5 w-5 text-brand-400" />
              System Status
            </h2>
            <Link
              href="/api/health"
              className="text-xs font-mono text-brand-400 hover:text-brand-300 underline transition-colors"
              target="_blank"
            >
              /api/health ↗
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Application Status */}
            <div className="bg-background-elevated/60 border border-border-subtle rounded-xl p-4 flex flex-col justify-between space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground-secondary uppercase tracking-wider">
                  Application
                </span>
                <Server className="h-4 w-4 text-foreground-muted" />
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-system-success shrink-0" />
                <span className="text-sm font-bold text-foreground-primary">Running</span>
              </div>
            </div>

            {/* Database Status */}
            <div className="bg-background-elevated/60 border border-border-subtle rounded-xl p-4 flex flex-col justify-between space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground-secondary uppercase tracking-wider">
                  Database
                </span>
                <Database className="h-4 w-4 text-foreground-muted" />
              </div>
              <div className="flex items-center gap-2">
                {dbInfo.connected ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-system-success shrink-0" />
                    <span className="text-sm font-bold text-foreground-primary">
                      Connected
                    </span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-4 w-4 text-system-warning shrink-0" />
                    <span className="text-sm font-bold text-foreground-primary">
                      {dbInfo.statusText}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Environment Status */}
            <div className="bg-background-elevated/60 border border-border-subtle rounded-xl p-4 flex flex-col justify-between space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground-secondary uppercase tracking-wider">
                  Environment
                </span>
                <Layers className="h-4 w-4 text-foreground-muted" />
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-brand-400" />
                <span className="text-sm font-bold text-foreground-primary capitalize font-mono">
                  {env.NODE_ENV}
                </span>
              </div>
            </div>
          </div>

          {/* Architecture Stack Summary */}
          <div className="pt-2 border-t border-border-subtle">
            <p className="text-xs font-medium text-foreground-secondary mb-3">
              Foundation &amp; Auth Core Technologies:
            </p>
            <div className="flex flex-wrap gap-2">
              {[
                "Next.js 14 App Router",
                "NextAuth / Auth.js",
                "Bcrypt Password Hash",
                "TypeScript",
                "Tailwind CSS",
                "Prisma ORM",
                "PostgreSQL",
                "TanStack Query",
                "Vercel Ready",
              ].map((tech) => (
                <span
                  key={tech}
                  className="px-2.5 py-1 text-xs font-semibold rounded-md bg-background-elevated text-foreground-secondary border border-border-subtle"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-xs text-foreground-muted font-medium">
          Nutri-Track Architecture &amp; Foundation Setup &bull; Feature-by-Feature Development
        </p>
      </div>
    </main>
  );
}
