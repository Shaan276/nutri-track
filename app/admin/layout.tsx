import React from "react";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { NutriTrackLogo } from "@/components/branding/NutriTrackLogo";
import {
  ShieldAlert,
  Users,
  UserCheck,
  MessageSquarePlus,
  ArrowLeft,
  LayoutDashboard,
  Sliders,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "ADMIN") {
    redirect("/app");
  }

  return (
    <div className="min-h-screen bg-background-base text-foreground-primary flex flex-col">
      {/* Top Admin Bar */}
      <header className="sticky top-0 z-40 bg-background-surface/90 backdrop-blur-md border-b border-border-default px-4 sm:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link
              href="/app"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-background-elevated hover:bg-brand-500/20 text-foreground-secondary hover:text-brand-400 border border-border-subtle text-xs font-bold transition-all cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to App</span>
            </Link>

            <div className="h-5 w-px bg-border-subtle hidden sm:block" />

            <div className="flex items-center gap-2">
              <NutriTrackLogo />
              <span className="px-2 py-0.5 rounded-md bg-rose-500/20 border border-rose-500/40 text-rose-400 text-[10px] font-black uppercase tracking-wider">
                Admin Center
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex items-center gap-1 sm:gap-2">
            <Link
              href="/admin"
              className="px-3 py-1.5 rounded-xl text-xs font-bold text-foreground-secondary hover:text-foreground-primary hover:bg-background-elevated transition-colors flex items-center gap-1.5"
            >
              <LayoutDashboard className="h-4 w-4" />
              <span className="hidden sm:inline">Overview</span>
            </Link>

            <Link
              href="/admin/users"
              className="px-3 py-1.5 rounded-xl text-xs font-bold text-foreground-secondary hover:text-foreground-primary hover:bg-background-elevated transition-colors flex items-center gap-1.5"
            >
              <Users className="h-4 w-4" />
              <span>Users</span>
            </Link>

            <Link
              href="/admin/pre-approvals"
              className="px-3 py-1.5 rounded-xl text-xs font-bold text-foreground-secondary hover:text-foreground-primary hover:bg-background-elevated transition-colors flex items-center gap-1.5"
            >
              <UserCheck className="h-4 w-4" />
              <span className="hidden md:inline">Pre-Approvals</span>
            </Link>

            <Link
              href="/admin/feature-requests"
              className="px-3 py-1.5 rounded-xl text-xs font-bold text-foreground-secondary hover:text-foreground-primary hover:bg-background-elevated transition-colors flex items-center gap-1.5"
            >
              <MessageSquarePlus className="h-4 w-4" />
              <span className="hidden md:inline">Feature Requests</span>
            </Link>

            <Link
              href="/admin/settings"
              className="px-3 py-1.5 rounded-xl text-xs font-bold text-foreground-secondary hover:text-foreground-primary hover:bg-background-elevated transition-colors flex items-center gap-1.5"
            >
              <Sliders className="h-4 w-4 text-brand-400" />
              <span>System & Keys</span>
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Admin Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {children}
      </main>
    </div>
  );
}
