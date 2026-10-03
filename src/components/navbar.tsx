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
    <header className="sticky top-0 z-50 border-b border-[#E5DFD5] dark:border-[#1F293D] bg-[#FAF8F5]/95 dark:bg-[#0B1320]/95 backdrop-blur-md transition-colors">
      {/* Top Banner for Demo Rush Notification */}
      {rushMessage && (
        <div className="bg-[#921111] text-[#FAF8F5] text-xs py-2 px-4 text-center font-medium flex items-center justify-center gap-2 border-b border-[#C5A059]/40 animate-pulse">
          <Zap className="w-3.5 h-3.5 text-[#C5A059]" />
          <span className="tracking-wide">{rushMessage}</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4 py-2">
        {/* Logo & Navigation */}
        <div className="flex items-center gap-7">
          <Link href="/" className="flex items-center gap-3 group">
            {/* NYAC Inspired Athletic Club Crest */}
            <div className="w-11 h-11 rounded-lg bg-[#921111] text-[#C5A059] border border-[#C5A059]/40 flex items-center justify-center shadow-sm group-hover:border-[#C5A059] group-hover:scale-105 transition-all">
              <Trophy className="w-5 h-5 text-[#C5A059]" />
            </div>
            <div>
              <span className="font-serif font-bold text-lg sm:text-xl text-[#0B1320] dark:text-[#FAF8F5] tracking-tight block leading-tight">
                The Champions Club
              </span>
              <span className="text-[9px] uppercase tracking-[0.24em] font-bold text-[#8C6D23] dark:text-[#DFCA9B] block">
                Est. 1868 • Bangalore Quarters
              </span>
            </div>
          </Link>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-1.5 text-xs font-semibold tracking-wider uppercase">
            <Link
              href="/"
              className={`px-3 py-2 rounded-md transition-all ${
                pathname === "/"
                  ? "bg-[#921111]/10 text-[#921111] dark:text-[#DFCA9B] dark:bg-[#C5A059]/15 font-bold"
                  : "text-[#4B5563] dark:text-[#9CA3AF] hover:text-[#921111] dark:hover:text-[#FAF8F5]"
              }`}
            >
              Public Club
            </Link>

            {isAuthenticated && roleMeta && (
              <Link
                href={roleMeta.portalPath}
                className={`px-3 py-2 rounded-md transition-all flex items-center gap-1.5 ${
                  pathname.startsWith(roleMeta.portalPath)
                    ? "bg-[#921111] text-white shadow-sm font-bold"
                    : "text-[#4B5563] dark:text-[#9CA3AF] hover:text-[#921111] dark:hover:text-[#FAF8F5]"
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>{roleMeta.label} Portal</span>
              </Link>
            )}

            {!isAuthenticated && (
              <Link
                href="/login"
                className="px-3 py-2 rounded-md text-[#4B5563] dark:text-[#9CA3AF] hover:text-[#921111] dark:hover:text-[#FAF8F5] transition-all"
              >
                Member / Staff Login
              </Link>
            )}
          </nav>
        </div>

        {/* Demo Controls & Real User Badge */}
        <div className="flex items-center gap-2.5">
          {/* ⚡ 6 PM Rush Demo Trigger - Styled in Brass Gold */}
          <button
            onClick={triggerRush}
            disabled={isRushLoading}
            title="Simulate busy 6 PM evening rush across courts, shop, bar & leads"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#C5A059] hover:bg-[#B38E46] text-[#0B1320] hover:text-black font-bold text-xs tracking-wider uppercase border border-[#DFCA9B] shadow-sm transition-all active:scale-95 disabled:opacity-50"
          >
            <Zap className={`w-3.5 h-3.5 ${isRushLoading ? "animate-spin" : "fill-current"}`} />
            <span className="hidden sm:inline">6 PM Rush</span>
          </button>

          {/* Cron Worker Trigger */}
          <button
            onClick={triggerCron}
            title="Run background maintenance worker (check expiries, auto-release unpaid slots, 24h lead alerts)"
            className="p-2 text-[#6B7280] hover:text-[#921111] dark:text-[#9CA3AF] dark:hover:text-[#C5A059] rounded-md hover:bg-[#E5DFD5]/40 dark:hover:bg-[#1E293B] transition-colors border border-transparent hover:border-[#E5DFD5] dark:hover:border-[#334155]"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-[#4B5563] dark:text-[#9CA3AF] hover:text-[#921111] dark:hover:text-[#FAF8F5] hover:bg-[#E5DFD5]/40 dark:hover:bg-[#1E293B] rounded-md transition-colors border border-transparent hover:border-[#E5DFD5] dark:hover:border-[#334155]"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#921111] text-white text-[9px] font-bold flex items-center justify-center">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-[#0E1522] border border-[#E5DFD5] dark:border-[#222D3E] rounded-lg shadow-xl p-3 z-50">
                <div className="flex items-center justify-between pb-2 border-b border-[#E5DFD5] dark:border-[#222D3E]">
                  <h4 className="font-serif font-bold text-xs text-[#0B1320] dark:text-white uppercase tracking-wider">
                    Club Dispatches & Alerts
                  </h4>
                  <span className="text-[10px] font-bold tracking-wider text-[#C5A059]">
                    {notifications.length} EVENTS
                  </span>
                </div>
                <div className="max-h-64 overflow-y-auto divide-y divide-[#F0EAE1] dark:divide-[#1F293D] mt-2">
                  {notifications.length === 0 ? (
                    <p className="text-xs text-[#6B7280] py-4 text-center">No notifications yet</p>
                  ) : (
                    notifications.slice(0, 10).map((n) => (
                      <div key={n.id} className="py-2.5 text-xs">
                        <div className="font-semibold text-[#111827] dark:text-[#E5E7EB] flex items-center justify-between">
                          <span>{n.title}</span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#FAF8F5] dark:bg-[#162032] border border-[#E5DFD5] dark:border-[#263244] text-[#8C6D23] font-mono">
                            {n.channel}
                          </span>
                        </div>
                        <p className="text-[#4B5563] dark:text-[#9CA3AF] text-[11px] mt-0.5 leading-relaxed">{n.message}</p>
                        <span className="text-[9px] text-[#9CA3AF] mt-1 block">
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
            className="p-2 text-[#4B5563] dark:text-[#9CA3AF] hover:text-[#921111] dark:hover:text-[#FAF8F5] hover:bg-[#E5DFD5]/40 dark:hover:bg-[#1E293B] rounded-md transition-colors border border-transparent hover:border-[#E5DFD5] dark:hover:border-[#334155]"
          >
            {isDark ? <Sun className="w-4 h-4 text-[#C5A059]" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Authenticated User Menu / Sign In */}
          {isAuthenticated && currentUser ? (
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-[#E5DFD5] dark:border-[#222D3E] bg-[#FAF8F5] dark:bg-[#121A28] hover:border-[#C5A059] transition-all text-xs font-semibold"
              >
                <div className="w-6 h-6 rounded bg-[#921111] text-[#FAF8F5] flex items-center justify-center font-bold text-xs">
                  {currentUser.name.charAt(0)}
                </div>
                <div className="text-left hidden sm:block">
                  <span className="truncate max-w-[110px] block leading-tight text-[#0B1320] dark:text-white font-serif">
                    {currentUser.name}
                  </span>
                  <span className="text-[9px] text-[#8C6D23] dark:text-[#DFCA9B] uppercase tracking-wider block font-bold">
                    {roleMeta?.label || role}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-[#9CA3AF]" />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-[#0E1522] border border-[#E5DFD5] dark:border-[#222D3E] rounded-lg shadow-xl p-2 z-50">
                  <div className="px-3 py-2.5 border-b border-[#E5DFD5] dark:border-[#222D3E] mb-1">
                    <p className="font-serif font-bold text-sm text-[#0B1320] dark:text-white">{currentUser.name}</p>
                    <p className="text-[11px] text-[#6B7280] dark:text-[#9CA3AF] truncate">{currentUser.email}</p>
                    <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-[#921111] dark:text-[#E3CEA4] font-bold uppercase tracking-wider">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#C5A059]" />
                      <span>Server-Verified {role}</span>
                    </div>
                  </div>

                  {roleMeta && (
                    <Link
                      href={roleMeta.portalPath}
                      onClick={() => setShowUserMenu(false)}
                      className="w-full text-left px-3 py-2 rounded-md text-xs flex items-center gap-2 text-[#374151] dark:text-[#D1D5DB] hover:bg-[#FAF8F5] dark:hover:bg-[#162032] hover:text-[#921111] transition-colors font-medium tracking-wide uppercase"
                    >
                      <LayoutDashboard className="w-4 h-4 text-[#921111] dark:text-[#C5A059]" />
                      <span>Enter {roleMeta.label}</span>
                    </Link>
                  )}

                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      logout();
                    }}
                    className="w-full text-left px-3 py-2 rounded-md text-xs flex items-center gap-2 text-[#921111] dark:text-[#F87171] hover:bg-[#FDF4F4] dark:hover:bg-[#1E0E10] transition-colors font-semibold mt-1 tracking-wide uppercase"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Relinquish Session (Sign Out)</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-1.5 px-4 py-2 rounded-md bg-[#921111] hover:bg-[#720C0C] text-white text-xs font-bold tracking-widest uppercase shadow-sm transition-all"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
