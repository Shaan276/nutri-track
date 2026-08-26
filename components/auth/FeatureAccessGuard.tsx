"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Sparkles, ShieldCheck, ChevronLeft, Lock, Ban, Clock, Loader2 } from "lucide-react";
import { FeatureAccessStatus } from "@/lib/services/admin/feature-access.service";

interface FeatureAccessGuardProps {
  featureKey: string;
  featureName: string;
  children: React.ReactNode;
  fallbackToComingSoon?: boolean;
}

export function FeatureAccessGuard({
  featureKey,
  featureName,
  children,
  fallbackToComingSoon = true,
}: FeatureAccessGuardProps) {
  const { data: session, status: authStatus } = useSession();
  const isAdmin = (session?.user as any)?.role === "ADMIN";

  const [featureStatus, setFeatureStatus] = useState<FeatureAccessStatus | null>(null);
  const [isAllowed, setIsAllowed] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function checkAccess() {
      try {
        const res = await fetch("/api/features/status");
        const data = await res.json();
        if (data.success && data.features && data.features[featureKey]) {
          const feat = data.features[featureKey];
          setFeatureStatus(feat.status as FeatureAccessStatus);
          setIsAllowed(isAdmin || feat.allowed);
        } else {
          // Default allowed if not found
          setIsAllowed(true);
        }
      } catch {
        setIsAllowed(true);
      } finally {
        setIsLoading(false);
      }
    }

    if (authStatus !== "loading") {
      if (isAdmin) {
        setIsAllowed(true);
        setIsLoading(false);
      } else {
        checkAccess();
      }
    }
  }, [featureKey, isAdmin, authStatus]);

  if (isLoading || authStatus === "loading") {
    return (
      <div className="flex h-[60vh] items-center justify-center text-neutral-500 gap-3">
        <Loader2 className="w-5 h-5 animate-spin text-emerald-400" />
        <span className="text-xs">Verifying page availability...</span>
      </div>
    );
  }

  // Admins always have access
  if (isAdmin || isAllowed) {
    return <>{children}</>;
  }

  // Handle COMING_SOON
  if (featureStatus === "COMING_SOON" || fallbackToComingSoon) {
    return (
      <div className="w-full max-w-3xl mx-auto px-4 py-12 sm:py-16 space-y-6 text-center animate-fade-in">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-black uppercase tracking-wider shadow-sm">
          <Clock className="h-4 w-4 text-amber-400" />
          <span>Under Active Development &bull; Coming Soon</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-black text-foreground-primary tracking-tight">
          {featureName} is Coming Soon!
        </h1>

        <p className="text-sm sm:text-base text-foreground-secondary max-w-lg mx-auto leading-relaxed">
          We&apos;re crafting something awesome for {featureName}. This feature is currently in private development and will be available to all members soon.
        </p>

        <div className="pt-4 flex items-center justify-center gap-3">
          <Link
            href="/app"
            className="px-6 py-3 rounded-2xl bg-brand-500 hover:bg-brand-400 text-neutral-950 font-extrabold text-xs transition-all shadow-brand-glow flex items-center gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // Handle ADMIN_ONLY or DISABLED
  return (
    <div className="w-full max-w-md mx-auto px-4 py-16 space-y-6 text-center animate-fade-in">
      <div className="h-16 w-16 rounded-3xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto">
        <Lock className="h-8 w-8" />
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl font-black text-foreground-primary">Access Restricted</h1>
        <p className="text-xs text-foreground-secondary leading-relaxed">
          {featureStatus === "ADMIN_ONLY"
            ? "This page is strictly restricted to platform administrators."
            : "This page is currently disabled by administrator policy."}
        </p>
      </div>

      <div className="pt-2">
        <Link
          href="/app"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-background-elevated hover:bg-background-surface border border-border-subtle text-foreground-primary text-xs font-bold transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
}

export default FeatureAccessGuard;
