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
    <div className="min-h-[85vh] flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-950">
      <div className="max-w-lg w-full bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-rose-200 dark:border-rose-900/50 p-8 text-center">
        <div className="w-16 h-16 bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
          <ShieldAlert className="w-9 h-9" />
        </div>

        <div className="inline-block px-3 py-1 bg-rose-100 dark:bg-rose-900/40 text-rose-800 dark:text-rose-300 text-xs font-bold rounded-full uppercase tracking-wider mb-3">
          403 Access Forbidden
        </div>

        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
          Restricted Portal Area
        </h1>

        <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
          Your current session is authenticated as{" "}
          <strong className="text-slate-900 dark:text-white">
            {currentUser?.name || "User"}
          </strong>{" "}
          ({meta?.label || role || "Unassigned"}), which does not have authorization
          to view this specific staff portal or module.
        </p>

        {meta && (
          <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-4 mb-6 border border-slate-200 dark:border-slate-800 text-left flex items-start gap-3">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 rounded-lg">
              🛡️
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Your Assigned Portal
              </p>
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                {meta.label} Portal
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {meta.description}
              </p>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {meta ? (
            <Link
              href={meta.portalPath}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-md transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Return to My Portal
            </Link>
          ) : (
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-md transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Go to Homepage
            </Link>
          )}

          <button
            onClick={() => logout()}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-medium transition-colors"
          >
            <LogOut className="w-4 h-4" /> Switch Account
          </button>
        </div>
      </div>
    </div>
  );
}
