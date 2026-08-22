import React, { Suspense } from "react";
import { Metadata } from "next";
import { NutriTrackLogo } from "@/components/branding/NutriTrackLogo";
import { LoginForm } from "@/components/auth/LoginForm";
import { Loader2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Sign In — Nutri-Track",
  description: "Sign in to your Nutri-Track account",
};

function LoginFormFallback() {
  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-background-surface/90 backdrop-blur-md border border-border-default rounded-2xl p-6 sm:p-8 shadow-surface-card flex flex-col items-center justify-center min-h-[300px]">
        <Loader2 className="h-8 w-8 text-brand-400 animate-spin" />
        <p className="text-sm font-medium text-foreground-muted mt-3">Loading login...</p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-background-midnight flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] bg-brand-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="w-full max-w-md flex flex-col items-center space-y-6">
        {/* Branding */}
        <div className="flex flex-col items-center">
          <NutriTrackLogo size="lg" subtitle="AUTHENTICATION" />
        </div>

        {/* Form Card with Suspense for useSearchParams */}
        <Suspense fallback={<LoginFormFallback />}>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
