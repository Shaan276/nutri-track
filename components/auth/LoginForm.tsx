"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Lock, User, Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/app";

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isLoading) return;

    if (!identifier.trim() || !password) {
      setError("Please enter both your email/username and password.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await signIn("credentials", {
        redirect: false,
        identifier: identifier.trim(),
        password,
      });

      if (!res || res.error) {
        setError("Invalid email/username or password. Please try again.");
        setIsLoading(false);
        return;
      }

      // Successful login
      router.push(callbackUrl);
      router.refresh();
    } catch (err) {
      console.error("Login unexpected error:", err);
      setError("An unexpected error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-background-surface border border-border-default rounded-2xl p-6 sm:p-8 shadow-surface-card">
        <div className="mb-6 text-left">
          <h1 className="text-2xl font-bold text-foreground-primary tracking-tight">
            Sign in to Nutri-Track
          </h1>
          <p className="text-sm text-foreground-secondary mt-1 font-medium">
            Enter your credentials to access your account.
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3.5 rounded-xl bg-system-error/10 border border-system-error/30 flex items-start gap-3 text-left">
            <AlertCircle className="h-5 w-5 text-system-error shrink-0 mt-0.5" />
            <p className="text-sm font-medium text-red-200">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          {/* Email or Username */}
          <div className="space-y-1.5">
            <label
              htmlFor="identifier"
              className="block text-xs font-semibold uppercase tracking-wider text-foreground-secondary"
            >
              Email or Username
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-foreground-muted">
                <User className="h-4 w-4" />
              </div>
              <input
                id="identifier"
                name="identifier"
                type="text"
                autoComplete="username"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="you@example.com or username"
                disabled={isLoading}
                className="w-full pl-10 pr-4 py-2.5 bg-background-elevated/70 border border-border-subtle rounded-xl text-foreground-primary placeholder:text-foreground-muted/60 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors disabled:opacity-50"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
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
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={isLoading}
                className="w-full pl-10 pr-11 py-2.5 bg-background-elevated/70 border border-border-subtle rounded-xl text-foreground-primary placeholder:text-foreground-muted/60 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-foreground-muted hover:text-foreground-secondary transition-colors"
              >
                {showPassword ? (
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
                <span>Signing in...</span>
              </>
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </form>

        {/* Create Account Link */}
        <div className="mt-6 pt-5 border-t border-border-subtle text-center">
          <p className="text-sm text-foreground-secondary font-medium">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="text-brand-400 hover:text-brand-300 font-bold underline transition-colors"
            >
              Create Account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoginForm;
