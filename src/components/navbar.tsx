"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { ROLE_METADATA } from "@/lib/roles";
import {
  Trophy,
  Bell,
  Zap,
  Moon,
  Sun,
  ShieldCheck,
  User,
  LayoutDashboard,
  LogOut,
  ChevronDown,
  RefreshCw,
  LogIn,
  Sparkles,
} from "lucide-react";

export function Navbar() {
  const { currentUser, role, isAuthenticated, isLoading, logout } = useAuth();
  const pathname = usePathname();
  const [isDark, setIsDark] = useState(false);
  const [isRushLoading, setIsRushLoading] = useState(false);
  const [rushMessage, setRushMessage] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const roleMeta = role ? ROLE_METADATA[role] : null;

  useEffect(() => {
    // Check dark mode
    if (
      localStorage.theme === "dark" ||
      (!("theme" in localStorage) && window.matchMedia("(prefers-color-scheme: dark)").matches)
    ) {
      document.documentElement.classList.add("dark");
      setIsDark(true);
    } else {
      document.documentElement.classList.remove("dark");
      setIsDark(false);
    }

    fetchNotifications();
  }, []);

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove("dark");
      localStorage.theme = "light";
      setIsDark(false);
    } else {
      document.documentElement.classList.add("dark");
      localStorage.theme = "dark";
      setIsDark(true);
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      const data = await res.json();
      if (data.notifications) {
        setNotifications(data.notifications);
      }
    } catch {
      // ignore
    }
  };

  const triggerRush = async () => {
    setIsRushLoading(true);
    setRushMessage(null);
    try {
      const res = await fetch("/api/demo/rush", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setRushMessage("⚡ 6 PM Rush Simulated! Bookings, Shop Sales, KDS Orders & Leads generated live!");
        setTimeout(() => setRushMessage(null), 6000);
        fetchNotifications();
        window.dispatchEvent(new Event("refresh-data"));
      }
    } catch (e: any) {
      alert("Rush error: " + e.message);
    } finally {
      setIsRushLoading(false);
    }
  };

  const triggerCron = async () => {
    try {
      const res = await fetch("/api/cron", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        alert(
          `Background Worker Completed:\n- Released Bookings: ${data.result.releasedBookings}\n- Expiry Alerts Sent: ${data.result.expiryAlertsSent}\n- Memberships Expired: ${data.result.membershipsExpired}\n- Stale Leads Alerted: ${data.result.staleLeadsAlerted}`
        );
        fetchNotifications();
      }
    } catch (e: any) {
      alert("Cron worker error: " + e.message);
    }
  };

  const unreadCount = notifications.filter((n) => n.status === "SENT").length;

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md">
      {/* Top Banner for Demo Rush Notification */}
      {rushMessage && (
        <div className="bg-emerald-600 text-white text-xs py-1.5 px-4 text-center font-medium flex items-center justify-center gap-2 animate-pulse">
          <Zap className="w-3.5 h-3.5" />
          <span>{rushMessage}</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Logo & Navigation */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20 group-hover:scale-105 transition-transform">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-lg text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5">
                The Champions Club
              </span>
              <span className="text-[10px] uppercase font-semibold text-emerald-600 dark:text-emerald-400 tracking-wider block -mt-1">
                Bangalore • Sports & Lounge
              </span>
            </div>
          </Link>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
            <Link
              href="/"
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                pathname === "/"
                  ? "bg-slate-100 dark:bg-slate-800 text-emerald-600 dark:text-emerald-400"
                  : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Public Club
            </Link>

            {isAuthenticated && roleMeta && (
              <Link
                href={roleMeta.portalPath}
                className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                  pathname.startsWith(roleMeta.portalPath)
                    ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-semibold"
                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <LayoutDashboard className="w-4 h-4 text-emerald-600" />
                {roleMeta.label} Portal
              </Link>
            )}

            {!isAuthenticated && (
              <Link
                href="/login"
                className="px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                Member / Staff Login
              </Link>
            )}
          </nav>
        </div>

        {/* Demo Controls & Real User Badge */}
        <div className="flex items-center gap-2.5">
          {/* ⚡ 6 PM Rush Demo Trigger */}
          <button
            onClick={triggerRush}
            disabled={isRushLoading}
            title="Simulate busy 6 PM evening rush across courts, shop, bar & leads"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-bold shadow-sm transition-all active:scale-95 disabled:opacity-50"
          >
            <Zap className={`w-3.5 h-3.5 ${isRushLoading ? "animate-spin" : "fill-white"}`} />
            <span className="hidden sm:inline">6 PM Rush</span>
          </button>

          {/* Cron Worker Trigger */}
          <button
            onClick={triggerCron}
            title="Run background maintenance worker (check expiries, auto-release unpaid slots, 24h lead alerts)"
            className="p-1.5 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl p-3 z-50">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <h4 className="font-semibold text-xs text-slate-900 dark:text-white uppercase tracking-wider">
                    Notifications & Activity
                  </h4>
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                    {notifications.length} events
                  </span>
                </div>
                <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 mt-2">
                  {notifications.length === 0 ? (
                    <p className="text-xs text-slate-500 py-4 text-center">No notifications yet</p>
                  ) : (
                    notifications.slice(0, 10).map((n) => (
                      <div key={n.id} className="py-2 text-xs">
                        <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                          <span>{n.title}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                            {n.channel}
                          </span>
                        </div>
                        <p className="text-slate-600 dark:text-slate-400 text-[11px] mt-0.5">{n.message}</p>
                        <span className="text-[9px] text-slate-400 mt-1 block">
                          {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Authenticated User Menu / Sign In */}
          {isAuthenticated && currentUser ? (
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-xs font-semibold"
              >
                <div className="w-6 h-6 rounded-lg bg-emerald-600/20 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold text-xs">
                  {currentUser.name.charAt(0)}
                </div>
                <div className="text-left hidden sm:block">
                  <span className="truncate max-w-[110px] block leading-tight text-slate-900 dark:text-white">
                    {currentUser.name}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">
                    {roleMeta?.label || role}
                  </span>
                </div>
                {roleMeta && (
                  <span className={`text-[9px] px-1.5 py-0.5 rounded border font-mono uppercase ${roleMeta.badgeClass}`}>
                    {role}
                  </span>
                )}
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-60 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-2 z-50">
                  <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 mb-1">
                    <p className="text-xs font-bold text-slate-900 dark:text-white">{currentUser.name}</p>
                    <p className="text-[11px] text-slate-400 truncate">{currentUser.email}</p>
                    <div className="mt-1 flex items-center gap-1.5 text-[10px] text-emerald-600 font-semibold">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Server-Verified {role}</span>
                    </div>
                  </div>

                  {roleMeta && (
                    <Link
                      href={roleMeta.portalPath}
                      onClick={() => setShowUserMenu(false)}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs flex items-center gap-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors font-medium"
                    >
                      <LayoutDashboard className="w-4 h-4 text-emerald-600" />
                      <span>Go to {roleMeta.label}</span>
                    </Link>
                  )}

                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      logout();
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs flex items-center gap-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors font-semibold mt-1"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login?tab=signin"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </Link>
              <Link
                href="/login?tab=signup"
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Join Free</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
