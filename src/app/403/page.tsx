"use client";

import React from "react";
import Link from "next/link";
import { ShieldAlert, ArrowLeft, LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { ROLE_METADATA } from "@/lib/roles";

export default function ForbiddenPage() {
  const { currentUser, role, logout } = useAuth();
  const meta = role ? ROLE_METADATA[role] : null;

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-6 bg-[#FAF8F5] dark:bg-[#080D14]">
      <div className="max-w-lg w-full bg-white dark:bg-[#0E1522] rounded-lg shadow-sm border border-[#E5DFD5] dark:border-[#222D3E] p-8 text-center">
        <div className="w-16 h-16 bg-[#FDF4F4] dark:bg-[#1E0E10] text-[#921111] dark:text-[#F87171] border border-[#F8CCCC] dark:border-[#581A1D] rounded-lg flex items-center justify-center mx-auto mb-6 shadow-sm">
          <ShieldAlert className="w-9 h-9" />
        </div>

        <div className="inline-block px-3 py-1 bg-[#FAF7EE] dark:bg-[#1C1608] border border-[#DFCA9B] dark:border-[#4B3C18] text-[#8C6D23] dark:text-[#E3CEA4] text-[10px] font-bold rounded uppercase tracking-[0.2em] mb-3">
          403 Restricted Quarters
        </div>

        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#0B1320] dark:text-white tracking-tight mb-2">
          Restricted Quarters Access
        </h1>
        <div className="w-12 h-0.5 bg-[#C5A059] mx-auto my-3" />

        <p className="text-sm text-[#4B5563] dark:text-[#9CA3AF] mb-6 leading-relaxed">
          Your current session is authenticated as{" "}
          <strong className="text-[#0B1320] dark:text-white font-serif">
            {currentUser?.name || "User"}
          </strong>{" "}
          ({meta?.label || role || "Unassigned"}), which does not have authorization
          to view this designated club quarters.
        </p>

        {meta && (
          <div className="bg-[#FAF8F5] dark:bg-[#121A28] rounded-md p-4 mb-6 border border-[#E5DFD5] dark:border-[#222D3E] text-left flex items-start gap-3">
            <div className="p-2 bg-[#FAF7EE] dark:bg-[#1C1608] border border-[#DFCA9B] text-[#8C6D23] rounded">
              🛡️
            </div>
            <div>
              <p className="text-[10px] font-bold text-[#8C6D23] dark:text-[#DFCA9B] uppercase tracking-[0.2em]">
                Your Authorized Quarters
              </p>
              <p className="font-serif text-sm font-bold text-[#0B1320] dark:text-white">
                {meta.label} Portal
              </p>
              <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF] mt-0.5">
                {meta.description}
              </p>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {meta ? (
            <Link
              href={meta.portalPath}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-md bg-[#921111] hover:bg-[#720C0C] text-white text-xs font-bold tracking-widest uppercase shadow-sm transition-all"
            >
              <ArrowLeft className="w-4 h-4" /> Return to My Quarters
            </Link>
          ) : (
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-md bg-[#921111] hover:bg-[#720C0C] text-white text-xs font-bold tracking-widest uppercase shadow-sm transition-all"
            >
              <ArrowLeft className="w-4 h-4" /> Return to Public Club
            </Link>
          )}

          <button
            onClick={() => logout()}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-md border border-[#E5DFD5] dark:border-[#222D3E] hover:bg-[#FAF8F5] dark:hover:bg-[#162032] text-[#374151] dark:text-[#D1D5DB] text-xs font-semibold tracking-wider uppercase transition-colors"
          >
            <LogOut className="w-4 h-4" /> Switch Credentials
          </button>
        </div>
      </div>
    </div>
  );
}
