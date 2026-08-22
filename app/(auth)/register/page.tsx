import React from "react";
import { Metadata } from "next";
import { NutriTrackLogo } from "@/components/branding/NutriTrackLogo";
import { RegisterForm } from "@/components/auth/RegisterForm";

export const metadata: Metadata = {
  title: "Create Account — Nutri-Track",
  description: "Register a new Nutri-Track account",
};

export default function RegisterPage() {
  return (
    <main className="min-h-screen bg-background-midnight flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] bg-brand-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="w-full max-w-md flex flex-col items-center space-y-6">
        {/* Branding */}
        <div className="flex flex-col items-center">
          <NutriTrackLogo size="lg" subtitle="GET STARTED" />
        </div>

        {/* Form Card */}
        <RegisterForm />
      </div>
    </main>
  );
}
