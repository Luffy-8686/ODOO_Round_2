import { NextAuthOptions, getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { Role, isValidRole } from "./roles";
import { logAudit } from "./audit";

export async function getServerAuthSession() {
  return await getServerSession(authOptions);
}

// In-memory rate limiter for login attempts (5 failures / 60 seconds per email)
const loginAttempts = new Map<string, { count: number; firstAttempt: number }>();

function checkRateLimit(email: string): boolean {
  const now = Date.now();
  const windowMs = 60 * 1000;
  const maxAttempts = 5;

  const record = loginAttempts.get(email);
  if (!record) {
    loginAttempts.set(email, { count: 1, firstAttempt: now });
    return true;
  }

  if (now - record.firstAttempt > windowMs) {
    loginAttempts.set(email, { count: 1, firstAttempt: now });
    return true;
  }

  if (record.count >= maxAttempts) {
    return false;
  }

  record.count += 1;
  return true;
}

function resetRateLimit(email: string): void {
  loginAttempts.delete(email);
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET || "champions-club-jwt-secret-key-prod-2026",
  providers: [
    CredentialsProvider({
      name: "Club Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        isOtpLogin: { label: "OTP Login", type: "text" },
        otpCode: { label: "OTP Code", type: "text" },
      },
      async authorize(credentials, req) {
        if (!credentials?.email) {
          throw new Error("Email is required.");
        }

        const email = credentials.email.toLowerCase().trim();

        // Rate limiting check
        if (!checkRateLimit(email)) {
          throw new Error("Too many failed login attempts. Please try again in 1 minute.");
        }

        const user = await prisma.user.findUnique({
          where: { email },
          include: {
            member: true,
            employee: true,
          },
        });

        if (!user) {
          throw new Error("Invalid email or password.");
        }

        if (!user.isActive) {
          throw new Error("This account has been deactivated. Please contact club administration.");
        }

        // Handle Member OTP Mock Login
        if (credentials.isOtpLogin === "true") {
          if (user.role !== "MEMBER") {
            throw new Error("OTP login is reserved for Club Members.");
          }
          if (credentials.otpCode !== "123456" && credentials.otpCode !== "000000") {
            throw new Error("Invalid OTP code. Enter 123456 for demo verification.");
          }
        } else {
          // Normal Password Check
          if (!credentials.password) {
            throw new Error("Password is required.");
          }

          if (!user.passwordHash) {
            throw new Error("No password set for this account. Please use member OTP or contact support.");
          }

          const isValid = await bcrypt.compare(credentials.password, user.passwordHash);
          if (!isValid) {
            throw new Error("Invalid email or password.");
          }
        }

        // Success - clear rate limit
        resetRateLimit(email);

        // Asynchronously log audit
        try {
          await logAudit({
            userId: user.id,
            action: "LOGIN",
            entityType: "User",
            entityId: user.id,
            after: { role: user.role, email: user.email, timestamp: new Date().toISOString() },
          });
        } catch {
          // Suppress audit log error in login flow
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: (isValidRole(user.role) ? user.role : "MEMBER") as Role,
          memberId: user.member?.id,
          memberCode: user.member?.memberId,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.memberId = user.memberId;
        token.memberCode = user.memberCode;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
        session.user.memberId = token.memberId as string | undefined;
        session.user.memberCode = token.memberCode as string | undefined;
      }
      return session;
    },
  },
};
