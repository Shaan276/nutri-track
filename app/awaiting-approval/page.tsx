"use client";

import React, { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { NutriTrackLogo } from "@/components/branding/NutriTrackLogo";
import { Clock, ShieldAlert, AlertOctagon, RefreshCw, LogOut, CheckCircle2 } from "lucide-react";

export default function AwaitingApprovalPage() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshMessage, setRefreshMessage] = useState<string | null>(null);

  const status = (session?.user as any)?.accountStatus || "PENDING_APPROVAL";

  // Automatically check for approval in the background
  React.useEffect(() => {
    const checkApproval = async () => {
      try {
        const updated = await update();
        const newStatus = (updated?.user as any)?.accountStatus;
        if (newStatus === "APPROVED" || (updated?.user as any)?.role === "ADMIN") {
          router.push("/app");
        }
      } catch (e) {
        console.error("Auto approval check error:", e);
      }
    };

    // Check immediately and every 3 seconds
    checkApproval();
    const interval = setInterval(checkApproval, 3000);
    return () => clearInterval(interval);
  }, [update, router]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setRefreshMessage(null);
    try {
      // Trigger session refresh
      const updated = await update();
      const newStatus = (updated?.user as any)?.accountStatus;
      if (newStatus === "APPROVED" || (updated?.user as any)?.role === "ADMIN") {
        router.push("/app");
      } else {
        setRefreshMessage("Your status is currently: " + (newStatus || status));
      }
    } catch {
      setRefreshMessage("Unable to refresh status. Please try again.");
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background-base flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md space-y-8 relative z-10">
        {/* Brand Logo */}
        <div className="flex flex-col items-center justify-center text-center space-y-2">
          <NutriTrackLogo />
        </div>

        {/* Status Card */}
        <div className="p-7 sm:p-8 rounded-3xl bg-background-surface border border-border-default shadow-surface-card space-y-6 text-center">
          {status === "PENDING_APPROVAL" && (
            <>
              <div className="mx-auto w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-sm">
                <Clock className="h-8 w-8 animate-pulse" />
              </div>

              <div className="space-y-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-[11px] font-bold uppercase tracking-wider">
                  Approval Pending
                </span>
                <h1 className="text-xl sm:text-2xl font-extrabold text-foreground-primary tracking-tight">
                  Awaiting Administrator Review
                </h1>
                <p className="text-xs sm:text-sm text-foreground-secondary leading-relaxed font-medium">
                  Welcome to Nutri-Track, <span className="text-foreground-primary font-bold">{session?.user?.name || "User"}</span>! To protect privacy and ensure platform integrity, new accounts require review by a Nutri-Track administrator before granting access.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-background-elevated border border-border-subtle text-left space-y-2 text-xs text-foreground-secondary">
                <div className="flex items-center gap-2 text-brand-400 font-bold">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>What happens next?</span>
                </div>
                <p className="leading-relaxed">
                  Once an administrator approves your account, you will immediately gain full access to all tracking modules, AI Coach, workout planner, and community features.
                </p>
              </div>
            </>
          )}

          {status === "REJECTED" && (
            <>
              <div className="mx-auto w-16 h-16 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 shadow-sm">
                <ShieldAlert className="h-8 w-8" />
              </div>

              <div className="space-y-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-400 text-[11px] font-bold uppercase tracking-wider">
                  Registration Declined
                </span>
                <h1 className="text-xl sm:text-2xl font-extrabold text-foreground-primary tracking-tight">
                  Access Not Granted
                </h1>
                <p className="text-xs sm:text-sm text-foreground-secondary leading-relaxed font-medium">
                  Your registration request was reviewed and could not be approved at this time. If you believe this is an error, please contact your platform administrator.
                </p>
              </div>
            </>
          )}

          {status === "SUSPENDED" && (
            <>
              <div className="mx-auto w-16 h-16 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 shadow-sm">
                <AlertOctagon className="h-8 w-8" />
              </div>

              <div className="space-y-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-400 text-[11px] font-bold uppercase tracking-wider">
                  Account Suspended
                </span>
                <h1 className="text-xl sm:text-2xl font-extrabold text-foreground-primary tracking-tight">
                  Account Access Suspended
                </h1>
                <p className="text-xs sm:text-sm text-foreground-secondary leading-relaxed font-medium">
                  Your account has been temporarily suspended by an administrator. Please reach out to platform support for further details.
                </p>
              </div>
            </>
          )}

          {refreshMessage && (
            <div className="p-3 rounded-xl bg-background-elevated border border-border-subtle text-xs text-brand-400 font-semibold">
              {refreshMessage}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex-1 inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-black font-extrabold text-xs shadow-brand-glow transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
              <span>{isRefreshing ? "Checking..." : "Check Status"}</span>
            </button>

            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-background-elevated hover:bg-rose-500/20 text-foreground-secondary hover:text-rose-400 border border-border-subtle hover:border-rose-500/40 font-bold text-xs transition-all cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Footer info */}
        <p className="text-center text-xs text-foreground-muted">
          Signed in as <span className="font-mono text-foreground-secondary">{session?.user?.email}</span>
        </p>
      </div>
    </div>
  );
}
