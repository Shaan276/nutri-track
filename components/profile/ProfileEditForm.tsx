"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Calendar,
  User,
  Activity,
  Ruler,
  Weight,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  Save,
} from "lucide-react";
import { ActivityLevel, BiologicalSex } from "@/lib/validations/profile";

interface ProfileEditFormProps {
  initialData: {
    name: string;
    username: string;
    email: string;
    profile: {
      dateOfBirth?: string;
      biologicalSex?: BiologicalSex;
      heightCm?: number;
      weightKg?: number;
      activityLevel?: ActivityLevel;
    } | null;
  };
}

const activityDescriptions: Record<ActivityLevel, string> = {
  SEDENTARY: "Little to no exercise, desk job",
  LIGHTLY_ACTIVE: "Light exercise or sports 1-3 days/week",
  MODERATELY_ACTIVE: "Moderate exercise or sports 3-5 days/week",
  VERY_ACTIVE: "Hard exercise or sports 6-7 days/week",
  EXTREMELY_ACTIVE: "Very hard exercise, physical job or 2x training",
};

export function ProfileEditForm({ initialData }: ProfileEditFormProps) {
  const [formData, setFormData] = useState({
    dateOfBirth: initialData.profile?.dateOfBirth
      ? new Date(initialData.profile.dateOfBirth).toISOString().split("T")[0]
      : "",
    biologicalSex: (initialData.profile?.biologicalSex || "MALE") as BiologicalSex,
    heightCm: initialData.profile?.heightCm ? String(initialData.profile.heightCm) : "",
    weightKg: initialData.profile?.weightKg ? String(initialData.profile.weightKg) : "",
    activityLevel: (initialData.profile?.activityLevel || "MODERATELY_ACTIVE") as ActivityLevel,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isLoading) return;

    const height = parseFloat(formData.heightCm);
    const weight = parseFloat(formData.weightKg);

    if (!formData.dateOfBirth) {
      setError("Please select your date of birth.");
      return;
    }
    if (isNaN(height) || height < 50 || height > 300) {
      setError("Please enter a valid height between 50 and 300 cm.");
      return;
    }
    if (isNaN(weight) || weight < 20 || weight > 500) {
      setError("Please enter a valid weight between 20 and 500 kg.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dateOfBirth: formData.dateOfBirth,
          biologicalSex: formData.biologicalSex,
          heightCm: height,
          weightKg: weight,
          activityLevel: formData.activityLevel,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to update profile.");
        setIsLoading(false);
        return;
      }

      setSuccess("Profile information updated successfully!");
      setIsLoading(false);
    } catch (err) {
      console.error("Update profile error:", err);
      setError("An unexpected error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Back to App Link */}
      <div className="flex items-center justify-between">
        <Link
          href="/app"
          className="inline-flex items-center gap-2 text-sm font-semibold text-brand-400 hover:text-brand-300 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to App</span>
        </Link>
      </div>

      <div className="bg-background-surface border border-border-default rounded-3xl p-6 sm:p-8 shadow-surface-card text-left space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground-primary tracking-tight">
            User Profile Settings
          </h1>
          <p className="text-sm text-foreground-secondary mt-1 font-medium">
            Manage your personal metrics and physical parameters.
          </p>
        </div>

        {/* Read-Only Account Identity Section */}
        <div className="bg-background-elevated/40 border border-border-subtle rounded-2xl p-4 sm:p-5 space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-widest text-foreground-muted">
            Account Identity (Read-Only)
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <p className="text-xs font-semibold text-foreground-muted uppercase">Full Name</p>
              <p className="text-sm font-bold text-foreground-primary mt-0.5">{initialData.name}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-foreground-muted uppercase">Username</p>
              <p className="text-sm font-bold text-brand-400 font-mono mt-0.5">@{initialData.username}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-foreground-muted uppercase">Email Address</p>
              <p className="text-sm font-bold text-foreground-primary mt-0.5 break-all">{initialData.email}</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-system-error/10 border border-system-error/30 flex items-start gap-3 text-left">
            <AlertCircle className="h-5 w-5 text-system-error shrink-0 mt-0.5" />
            <p className="text-sm font-medium text-red-200">{error}</p>
          </div>
        )}

        {success && (
          <div className="p-3.5 rounded-xl bg-system-success/10 border border-system-success/30 flex items-start gap-3 text-left">
            <CheckCircle2 className="h-5 w-5 text-system-success shrink-0 mt-0.5" />
            <p className="text-sm font-medium text-emerald-200">{success}</p>
          </div>
        )}

        {/* Editable Profile Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-widest text-foreground-muted pt-2 border-t border-border-subtle">
            Physical Attributes &amp; Metrics
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Date of Birth */}
            <div className="space-y-1.5">
              <label
                htmlFor="dateOfBirth"
                className="block text-xs font-semibold uppercase tracking-wider text-foreground-secondary"
              >
                Date of Birth
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-foreground-muted">
                  <Calendar className="h-4 w-4" />
                </div>
                <input
                  id="dateOfBirth"
                  name="dateOfBirth"
                  type="date"
                  required
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  disabled={isLoading}
                  max={new Date().toISOString().split("T")[0]}
                  className="w-full pl-10 pr-4 py-2.5 bg-background-elevated/70 border border-border-subtle rounded-xl text-foreground-primary text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors disabled:opacity-50"
                />
              </div>
            </div>

            {/* Biological Sex */}
            <div className="space-y-1.5">
              <label
                htmlFor="biologicalSex"
                className="block text-xs font-semibold uppercase tracking-wider text-foreground-secondary"
              >
                Biological Sex
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-foreground-muted">
                  <User className="h-4 w-4" />
                </div>
                <select
                  id="biologicalSex"
                  name="biologicalSex"
                  value={formData.biologicalSex}
                  onChange={handleChange}
                  disabled={isLoading}
                  className="w-full pl-10 pr-4 py-2.5 bg-background-elevated/70 border border-border-subtle rounded-xl text-foreground-primary text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <option value="MALE" className="bg-background-surface text-foreground-primary">
                    Male
                  </option>
                  <option value="FEMALE" className="bg-background-surface text-foreground-primary">
                    Female
                  </option>
                  <option value="OTHER" className="bg-background-surface text-foreground-primary">
                    Other / Prefer not to specify
                  </option>
                </select>
              </div>
            </div>

            {/* Height */}
            <div className="space-y-1.5">
              <label
                htmlFor="heightCm"
                className="block text-xs font-semibold uppercase tracking-wider text-foreground-secondary"
              >
                Height (cm)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-foreground-muted">
                  <Ruler className="h-4 w-4" />
                </div>
                <input
                  id="heightCm"
                  name="heightCm"
                  type="number"
                  step="0.1"
                  required
                  placeholder="175"
                  value={formData.heightCm}
                  onChange={handleChange}
                  disabled={isLoading}
                  className="w-full pl-10 pr-4 py-2.5 bg-background-elevated/70 border border-border-subtle rounded-xl text-foreground-primary placeholder:text-foreground-muted/60 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors disabled:opacity-50"
                />
              </div>
            </div>

            {/* Weight */}
            <div className="space-y-1.5">
              <label
                htmlFor="weightKg"
                className="block text-xs font-semibold uppercase tracking-wider text-foreground-secondary"
              >
                Weight (kg)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-foreground-muted">
                  <Weight className="h-4 w-4" />
                </div>
                <input
                  id="weightKg"
                  name="weightKg"
                  type="number"
                  step="0.1"
                  required
                  placeholder="70"
                  value={formData.weightKg}
                  onChange={handleChange}
                  disabled={isLoading}
                  className="w-full pl-10 pr-4 py-2.5 bg-background-elevated/70 border border-border-subtle rounded-xl text-foreground-primary placeholder:text-foreground-muted/60 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors disabled:opacity-50"
                />
              </div>
            </div>
          </div>

          {/* Activity Level */}
          <div className="space-y-1.5">
            <label
              htmlFor="activityLevel"
              className="block text-xs font-semibold uppercase tracking-wider text-foreground-secondary"
            >
              Activity Level
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-foreground-muted">
                <Activity className="h-4 w-4" />
              </div>
              <select
                id="activityLevel"
                name="activityLevel"
                value={formData.activityLevel}
                onChange={handleChange}
                disabled={isLoading}
                className="w-full pl-10 pr-4 py-2.5 bg-background-elevated/70 border border-border-subtle rounded-xl text-foreground-primary text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors disabled:opacity-50 cursor-pointer"
              >
                <option value="SEDENTARY" className="bg-background-surface text-foreground-primary">
                  Sedentary
                </option>
                <option value="LIGHTLY_ACTIVE" className="bg-background-surface text-foreground-primary">
                  Lightly Active
                </option>
                <option value="MODERATELY_ACTIVE" className="bg-background-surface text-foreground-primary">
                  Moderately Active
                </option>
                <option value="VERY_ACTIVE" className="bg-background-surface text-foreground-primary">
                  Very Active
                </option>
                <option value="EXTREMELY_ACTIVE" className="bg-background-surface text-foreground-primary">
                  Extremely Active
                </option>
              </select>
            </div>
            <p className="text-xs text-brand-400/90 font-medium mt-1">
              {activityDescriptions[formData.activityLevel]}
            </p>
          </div>

          {/* Save Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-4 py-3 px-4 bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-black font-bold text-sm rounded-xl transition-all duration-200 shadow-brand-glow hover:shadow-brand-glow-lg flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Saving Changes...</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>Save Profile Changes</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ProfileEditForm;
