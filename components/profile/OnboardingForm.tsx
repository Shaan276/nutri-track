"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, User, Activity, Ruler, Weight, Loader2, AlertCircle, ArrowRight } from "lucide-react";
import { ActivityLevel, BiologicalSex } from "@/lib/validations/profile";

const activityDescriptions: Record<ActivityLevel, string> = {
  SEDENTARY: "Little to no exercise, desk job",
  LIGHTLY_ACTIVE: "Light exercise or sports 1-3 days/week",
  MODERATELY_ACTIVE: "Moderate exercise or sports 3-5 days/week",
  VERY_ACTIVE: "Hard exercise or sports 6-7 days/week",
  EXTREMELY_ACTIVE: "Very hard exercise, physical job or 2x training",
};

export function OnboardingForm() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    dateOfBirth: "",
    biologicalSex: "MALE" as BiologicalSex,
    heightCm: "",
    weightKg: "",
    activityLevel: "MODERATELY_ACTIVE" as ActivityLevel,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        setError(data.error || "Failed to save profile. Please try again.");
        setIsLoading(false);
        return;
      }

      // Successful onboarding -> redirect to /app
      router.push("/app");
      router.refresh();
    } catch (err) {
      console.error("Onboarding error:", err);
      setError("An unexpected network error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto">
      <div className="bg-background-surface border border-border-default rounded-3xl p-6 sm:p-8 shadow-surface-card text-left">
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/30 text-brand-400 text-xs font-semibold uppercase tracking-wider mb-2">
            Step 2 of 2 &bull; Profile Setup
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground-primary tracking-tight">
            Personalize Your Profile
          </h1>
          <p className="text-sm text-foreground-secondary mt-1 font-medium">
            These metrics allow Nutri-Track to calculate accurate health targets for you.
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3.5 rounded-xl bg-system-error/10 border border-system-error/30 flex items-start gap-3 text-left">
            <AlertCircle className="h-5 w-5 text-system-error shrink-0 mt-0.5" />
            <p className="text-sm font-medium text-red-200">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
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

          {/* Height and Weight Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
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
                  placeholder="e.g. 175"
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
                  placeholder="e.g. 70"
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

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-4 py-3 px-4 bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-black font-bold text-sm rounded-xl transition-all duration-200 shadow-brand-glow hover:shadow-brand-glow-lg flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Saving Profile...</span>
              </>
            ) : (
              <>
                <span>Complete Setup &bull; Continue to App</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default OnboardingForm;
