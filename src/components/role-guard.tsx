"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { ShieldAlert, ArrowLeft, Lock, LogOut } from "lucide-react";
import Link from "next/link";
import { ROLE_METADATA, Role } from "@/lib/roles";

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles?: Role[];
}

export function RoleGuard({ children, allowedRoles }: RoleGuardProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, role, isAuthenticated, isLoading, logout } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || !currentUser || !role) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="max-w-md w-full p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl text-center space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center mx-auto shadow-inner">
            <Lock className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">Authentication Required</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              Please sign in to access this portal area.
            </p>
          </div>
          <Link
            href={`/login?callbackUrl=${encodeURIComponent(pathname)}`}
            className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    const userMeta = ROLE_METADATA[role];
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="max-w-md w-full p-8 rounded-3xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/50 shadow-2xl text-center space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center mx-auto shadow-inner">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <div>
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950 px-2.5 py-1 rounded-full">
              403 • Unauthorized Role
            </span>
            <h2 className="text-xl font-black text-slate-900 dark:text-white mt-3">
              Module Access Restricted
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
              Your server-verified role is <strong className="text-slate-900 dark:text-white">{role}</strong>. This module requires:{" "}
              <strong className="text-slate-900 dark:text-white">{allowedRoles.join(" or ")}</strong>.
            </p>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <Link
              href={userMeta?.portalPath || "/"}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return to {userMeta?.label || "My"} Portal</span>
            </Link>

            <button
              onClick={() => logout()}
              className="w-full py-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center justify-center gap-1.5"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign In with Different Account</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
