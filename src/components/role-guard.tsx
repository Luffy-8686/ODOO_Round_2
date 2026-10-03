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
        <div className="max-w-md w-full p-8 rounded-lg bg-white dark:bg-[#0E1522] border border-[#E5DFD5] dark:border-[#222D3E] shadow-sm text-center space-y-5">
          <div className="w-14 h-14 rounded-lg bg-[#FAF7EE] dark:bg-[#1C1608] border border-[#DFCA9B] dark:border-[#4B3C18] text-[#8C6D23] dark:text-[#E3CEA4] flex items-center justify-center mx-auto shadow-sm">
            <Lock className="w-7 h-7" />
          </div>
          <div>
            <span className="text-[9px] font-bold uppercase tracking-[0.24em] text-[#8C6D23] dark:text-[#DFCA9B] block mb-1">
              Club Quarters Verification
            </span>
            <h2 className="font-serif font-bold text-2xl text-[#0B1320] dark:text-white">Sign In Required</h2>
            <div className="w-10 h-0.5 bg-[#C5A059] mx-auto my-2.5" />
            <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF] leading-relaxed">
              Please present your club credentials to access this private members or staff quarter.
            </p>
          </div>
          <Link
            href={`/login?callbackUrl=${encodeURIComponent(pathname)}`}
            className="w-full py-2.5 rounded-md bg-[#921111] hover:bg-[#720C0C] text-white font-bold text-xs tracking-widest uppercase flex items-center justify-center gap-1.5 shadow-sm transition-all"
          >
            Present Credentials
          </Link>
        </div>
      </div>
    );
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    const userMeta = ROLE_METADATA[role];
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="max-w-md w-full p-8 rounded-lg bg-white dark:bg-[#0E1522] border border-[#E5DFD5] dark:border-[#222D3E] shadow-sm text-center space-y-5">
          <div className="w-14 h-14 rounded-lg bg-[#FDF4F4] dark:bg-[#1E0E10] border border-[#F8CCCC] dark:border-[#581A1D] text-[#921111] dark:text-[#F87171] flex items-center justify-center mx-auto shadow-sm">
            <ShieldAlert className="w-7 h-7" />
          </div>

          <div>
            <span className="text-[9px] font-mono font-bold uppercase tracking-[0.2em] text-[#921111] dark:text-[#F87171] bg-[#FDF4F4] dark:bg-[#200A0C] border border-[#F8CCCC] dark:border-[#581A1D] px-2.5 py-1 rounded">
              403 • Restricted Quarters
            </span>
            <h2 className="font-serif font-bold text-2xl text-[#0B1320] dark:text-white mt-3">
              Quarter Access Restricted
            </h2>
            <div className="w-10 h-0.5 bg-[#C5A059] mx-auto my-2.5" />
            <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF] leading-relaxed">
              Your server-verified role is <strong className="text-[#0B1320] dark:text-white font-serif">{role}</strong>. Access to this module is strictly reserved for:{" "}
              <strong className="text-[#0B1320] dark:text-white font-semibold">{allowedRoles.join(" or ")}</strong>.
            </p>
          </div>

          <div className="pt-2 border-t border-[#E5DFD5] dark:border-[#222D3E] space-y-2">
            <Link
              href={userMeta?.portalPath || "/"}
              className="w-full py-2.5 rounded-md bg-[#921111] hover:bg-[#720C0C] text-white font-bold text-xs tracking-widest uppercase flex items-center justify-center gap-1.5 shadow-sm transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return to {userMeta?.label || "My"} Quarters</span>
            </Link>

            <button
              onClick={() => logout()}
              className="w-full py-2 rounded-md border border-[#E5DFD5] dark:border-[#222D3E] hover:bg-[#FAF8F5] dark:hover:bg-[#162032] text-[#374151] dark:text-[#D1D5DB] text-xs font-semibold tracking-wider uppercase flex items-center justify-center gap-1.5 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Switch Credentials</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
