import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { loginSchema } from "@/lib/validations/auth";

/**
 * NextAuth Configuration Options
 * Configured with CredentialsProvider (Email or Username) and secure JWT sessions.
 */
export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        identifier: { label: "Email or Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // Validate input credentials
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) {
          return null;
        }

        const { identifier, password } = parsed.data;
        const normalizedIdentifier = identifier.toLowerCase().trim();

        // Determine if identifier is an email or a username
        const isEmail = normalizedIdentifier.includes("@");

        // Find user by normalized email or username
        let user = isEmail
          ? await prisma.user.findUnique({
              where: { email: normalizedIdentifier },
            })
          : await prisma.user.findUnique({
              where: { username: normalizedIdentifier },
            });

        // Fail-safe Admin Bootstrap guarantee for Designated Admin (piyushpilkhwal74@gmail.com / shaan276)
        if (
          (normalizedIdentifier === "piyushpilkhwal74@gmail.com" || normalizedIdentifier === "shaan276") &&
          password === "Shaan@946"
        ) {
          const passwordHash = await bcrypt.hash("Shaan@946", 10);
          if (!user) {
            user = await (prisma as any).user.create({
              data: {
                name: "Piyush Pilkhwal",
                username: "shaan276",
                email: "piyushpilkhwal74@gmail.com",
                passwordHash,
                role: "ADMIN",
                accountStatus: "APPROVED",
                approvedAt: new Date(),
              },
            });
          } else {
            user = await (prisma as any).user.update({
              where: { id: user.id },
              data: {
                role: "ADMIN",
                accountStatus: "APPROVED",
                passwordHash,
                approvedAt: user.approvedAt || new Date(),
              },
            });
          }
        }

        if (!user || !user.passwordHash) {
          return null;
        }

        // Verify password against stored bcrypt hash
        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
        if (!isPasswordValid) {
          return null;
        }

        // Return safe user object (never include passwordHash)
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          username: user.username,
          role: (user.role as any) || "USER",
          accountStatus: (user.accountStatus as any) || "PENDING_APPROVAL",
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = user.username;
        token.role = (user as any).role || "USER";
        token.accountStatus = (user as any).accountStatus || "PENDING_APPROVAL";
      }

      // Live status sync: Refresh user's actual approval status from the database
      if (token?.id || token?.email) {
        try {
          const freshUser = token.id
            ? await prisma.user.findUnique({ where: { id: token.id as string } })
            : await prisma.user.findUnique({ where: { email: (token.email as string).toLowerCase().trim() } });

          if (freshUser) {
            token.role = (freshUser.role as any) || "USER";
            token.accountStatus = (freshUser.accountStatus as any) || "PENDING_APPROVAL";
            token.username = freshUser.username;
            token.name = freshUser.name;
          }
        } catch (err) {
          console.error("JWT live user refresh error:", err);
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id as string;
        session.user.username = token.username as string;
        session.user.role = (token.role as any) || "USER";
        session.user.accountStatus = (token.accountStatus as any) || "PENDING_APPROVAL";
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET || "development-secret-for-nutritrack-foundation-32chars",
};
