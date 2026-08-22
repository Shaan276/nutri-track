"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Lock, User, Mail, AtSign, Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";

export function RegisterForm() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isLoading) return;

    // Client-side quick validations
    if (!formData.name.trim()) {
      setError("Please enter your full name.");
      return;
    }
    if (formData.username.trim().length < 3) {
      setError("Username must be at least 3 characters long.");
      return;
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(formData.username.trim())) {
      setError("Username can only contain letters, numbers, underscores, and hyphens.");
      return;
    }
    if (!formData.email.trim() || !formData.email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // 1. Call Registration API endpoint
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to create account. Please try again.");
        setIsLoading(false);
        return;
      }

      // 2. Automatically sign in the user after successful registration
      const signInResult = await signIn("credentials", {
        redirect: false,
        identifier: formData.email.trim(),
        password: formData.password,
      });

      if (!signInResult || signInResult.error) {
        // In case automatic login fails, redirect to login page with success hint
        router.push("/login?registered=true");
        return;
      }

      // 3. Redirect to protected app area
      router.push("/app");
      router.refresh();
    } catch (err) {
      console.error("Registration submit error:", err);
      setError("An unexpected error occurred. Please check your network and try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-background-surface border border-border-default rounded-2xl p-6 sm:p-8 shadow-surface-card">
        <div className="mb-6 text-left">
          <h1 className="text-2xl font-bold text-foreground-primary tracking-tight">
            Create your account
          </h1>
          <p className="text-sm text-foreground-secondary mt-1 font-medium">
            Start tracking your health and nutrition with Nutri-Track.
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3.5 rounded-xl bg-system-error/10 border border-system-error/30 flex items-start gap-3 text-left">
            <AlertCircle className="h-5 w-5 text-system-error shrink-0 mt-0.5" />
            <p className="text-sm font-medium text-red-200">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 text-left">
          {/* Full Name */}
          <div className="space-y-1">
            <label
              htmlFor="name"
              className="block text-xs font-semibold uppercase tracking-wider text-foreground-secondary"
            >
              Full Name
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-foreground-muted">
                <User className="h-4 w-4" />
              </div>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                value={formData.name}
                onChange={handleChange}
                placeholder="Piyush Sharma"
                disabled={isLoading}
                className="w-full pl-10 pr-4 py-2 bg-background-elevated/70 border border-border-subtle rounded-xl text-foreground-primary placeholder:text-foreground-muted/60 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors disabled:opacity-50"
              />
            </div>
          </div>

          {/* Username */}
          <div className="space-y-1">
            <label
              htmlFor="username"
              className="block text-xs font-semibold uppercase tracking-wider text-foreground-secondary"
            >
              Username
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-foreground-muted">
                <AtSign className="h-4 w-4" />
              </div>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                value={formData.username}
                onChange={handleChange}
                placeholder="piyush_01"
                disabled={isLoading}
                className="w-full pl-10 pr-4 py-2 bg-background-elevated/70 border border-border-subtle rounded-xl text-foreground-primary placeholder:text-foreground-muted/60 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors disabled:opacity-50"
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-1">
            <label
              htmlFor="email"
              className="block text-xs font-semibold uppercase tracking-wider text-foreground-secondary"
            >
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-foreground-muted">
                <Mail className="h-4 w-4" />
              </div>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="piyush@example.com"
                disabled={isLoading}
                className="w-full pl-10 pr-4 py-2 bg-background-elevated/70 border border-border-subtle rounded-xl text-foreground-primary placeholder:text-foreground-muted/60 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors disabled:opacity-50"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1">
            <label
              htmlFor="password"
              className="block text-xs font-semibold uppercase tracking-wider text-foreground-secondary"
            >
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-foreground-muted">
                <Lock className="h-4 w-4" />
              </div>
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                value={formData.password}
                onChange={handleChange}
                placeholder="Minimum 8 characters"
                disabled={isLoading}
                className="w-full pl-10 pr-11 py-2 bg-background-elevated/70 border border-border-subtle rounded-xl text-foreground-primary placeholder:text-foreground-muted/60 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-foreground-muted hover:text-foreground-secondary transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="space-y-1">
            <label
              htmlFor="confirmPassword"
              className="block text-xs font-semibold uppercase tracking-wider text-foreground-secondary"
            >
              Confirm Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-foreground-muted">
                <Lock className="h-4 w-4" />
              </div>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Repeat your password"
                disabled={isLoading}
                className="w-full pl-10 pr-11 py-2 bg-background-elevated/70 border border-border-subtle rounded-xl text-foreground-primary placeholder:text-foreground-muted/60 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                tabIndex={-1}
                aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-foreground-muted hover:text-foreground-secondary transition-colors"
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-3 px-4 bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-black font-bold text-sm rounded-xl transition-all duration-200 shadow-brand-glow hover:shadow-brand-glow-lg flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Creating Account...</span>
              </>
            ) : (
              <span>Create Account</span>
            )}
          </button>
        </form>

        {/* Existing Account Link */}
        <div className="mt-5 pt-4 border-t border-border-subtle text-center">
          <p className="text-sm text-foreground-secondary font-medium">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-brand-400 hover:text-brand-300 font-bold underline transition-colors"
            >
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default RegisterForm;
