"use client";

import React from "react";
import { SessionProvider } from "next-auth/react";

interface AuthProviderProps {
  children: React.ReactNode;
}

/**
 * NextAuth Session Provider Client Component Wrapper
 */
export function AuthProvider({ children }: AuthProviderProps) {
  return <SessionProvider>{children}</SessionProvider>;
}

export default AuthProvider;
