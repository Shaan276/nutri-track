import { DefaultSession, DefaultUser } from "next-auth";
import { JWT as DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface User extends DefaultUser {
    id: string;
    username: string;
    role: "USER" | "ADMIN";
    accountStatus: "PENDING_APPROVAL" | "APPROVED" | "REJECTED" | "SUSPENDED";
  }

  interface Session {
    user: {
      id: string;
      username: string;
      role: "USER" | "ADMIN";
      accountStatus: "PENDING_APPROVAL" | "APPROVED" | "REJECTED" | "SUSPENDED";
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id?: string;
    username?: string;
    role?: "USER" | "ADMIN";
    accountStatus?: "PENDING_APPROVAL" | "APPROVED" | "REJECTED" | "SUSPENDED";
  }
}
