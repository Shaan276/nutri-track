"use client";

import React, { useState } from "react";
import { signOut } from "next-auth/react";
import { LogOut, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LogoutButtonProps {
  className?: string;
  variant?: "default" | "minimal";
}

/**
 * Logout Button Component
 * Triggers NextAuth signOut session invalidation and redirects to /login.
 */
export function LogoutButton({ className, variant = "default" }: LogoutButtonProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await signOut({ callbackUrl: "/login" });
  };

  if (variant === "minimal") {
    return (
      <button
        onClick={handleLogout}
        disabled={isLoggingOut}
        className={cn(
          "inline-flex items-center gap-2 text-sm font-medium text-foreground-secondary hover:text-system-error transition-colors disabled:opacity-50 cursor-pointer",
          className
        )}
      >
        {isLoggingOut ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <LogOut className="h-4 w-4" />
        )}
        <span>Sign Out</span>
      </button>
    );
  }

  return (
    <button
      onClick={handleLogout}
      disabled={isLoggingOut}
      className={cn(
        "inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-background-elevated hover:bg-red-500/20 text-foreground-secondary hover:text-red-400 border border-border-subtle hover:border-red-500/40 transition-all duration-200 shadow-sm disabled:opacity-50 cursor-pointer",
        className
      )}
    >
      {isLoggingOut ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Signing out...</span>
        </>
      ) : (
        <>
          <LogOut className="h-4 w-4" />
          <span>Sign Out</span>
        </>
      )}
    </button>
  );
}

export default LogoutButton;
