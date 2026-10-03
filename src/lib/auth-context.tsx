"use client";

import React, { createContext, useContext } from "react";
import { SessionProvider, useSession, signIn, signOut } from "next-auth/react";
import { Role } from "./roles";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  memberId?: string;
  memberCode?: string;
}

interface AuthContextType {
  currentUser: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  role: Role | null;
  logout: () => Promise<void>;
  login: (callbackUrl?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  isLoading: true,
  isAuthenticated: false,
  role: null,
  logout: async () => {},
  login: async () => {},
});

function AuthConsumer({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();

  const currentUser: AuthUser | null = session?.user
    ? {
        id: session.user.id,
        name: session.user.name || "Club User",
        email: session.user.email || "",
        role: session.user.role || "MEMBER",
        memberId: session.user.memberId,
        memberCode: session.user.memberCode,
      }
    : null;

  const isLoading = status === "loading";
  const isAuthenticated = status === "authenticated";
  const role = currentUser?.role || null;

  const logout = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  const login = async (callbackUrl = "/login") => {
    await signIn(undefined, { callbackUrl });
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isLoading,
        isAuthenticated,
        role,
        logout,
        login,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AuthConsumer>{children}</AuthConsumer>
    </SessionProvider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
