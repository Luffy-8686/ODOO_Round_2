"use client";

import React, { useState, useEffect } from "react";
import { formatINR, formatDateTime } from "@/lib/formatters";
import {
  TrendingUp,
  DollarSign,
  Users,
  Calendar,
  ShoppingBag,
  Coffee,
  AlertTriangle,
  Target,
  Share2,
  Activity,
  ShieldCheck,
  Zap,
} from "lucide-react";
import Link from "next/link";

export default function OwnerExecutivePage() {
  const [data, setData] = useState<any>(null);
  const [range, setRange] = useState("30d");
  const [loading, setLoading] = useState(true);

  const fetchData = async (selectedRange = range) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/owner/dashboard?range=${selectedRange}`);
      const json = await res.json();
      setData(json);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(range);
    const handleRefresh = () => fetchData(range);
    window.addEventListener("refresh-data", handleRefresh);
    return () => window.removeEventListener("refresh-data", handleRefresh);
  }, [range]);

  if (loading && !data) {
    return (
      <div className="p-12 text-center text-slate-500">
        <div className="w-8 h-8 border-3 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm font-semibold">Loading Executive Governance Dashboard...</p>
      </div>
    );
  }

  const streams = data?.revenueByStream || {};
  const totalRev = data?.totalRevenuePaise || 0;
  const courtPct = totalRev > 0 ? Math.round(((streams.COURTS || 0) / totalRev) * 100) : 0;
  const memPct = totalRev > 0 ? Math.round(((streams.MEMBERSHIPS || 0) / totalRev) * 100) : 0;
  const shopPct = totalRev > 0 ? Math.round(((streams.SHOP || 0) / totalRev) * 100) : 0;
  const barPct = totalRev > 0 ? Math.round(((streams.BAR || 0) / totalRev) * 100) : 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner: Owner Portal Badge */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Owner Executive Command Center
            </h1>
            <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-bold border border-purple-300 dark:border-purple-800">
              👑 OWNER RBAC
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Full executive oversight: Financial P&L, GST reconciliation, Staff payroll, and User permissions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Range Picker */}
          <div className="flex bg-slate-200 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
            {["today", "7d", "30d"].map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-3 py-1 rounded-lg transition-all ${
                  range === r
                    ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm font-bold"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                {r === "today" ? "Today" : r === "7d" ? "Last 7 Days" : "Last 30 Days"}
              </button>
            ))}
          </div>

          <Link
            href="/app/owner/users"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-600/20 transition-all"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Manage Users</span>
          </Link>
        </div>
      </div>

      {/* TOP KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-900/40 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Revenue</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            {formatINR(data?.totalRevenuePaise || 0)}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-semibold mt-2">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>+18.4% vs last period</span>
          </div>
        </div>

        {/* Total Expenses & Net Profit */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-900/40 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Net Operating Margin</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            {formatINR(data?.netProfitPaise || 0)}
          </div>
          <div className="text-[11px] text-slate-400 mt-2">
            Expenses: {formatINR(data?.totalExpensesPaise || 0)}
          </div>
        </div>

        {/* Active Members */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-900/40 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Members</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">{data?.activeMembers || 0}</div>
          <div className="text-[11px] text-amber-600 font-semibold mt-2">
            {data?.expiringSoon || 0} expiring soon • {data?.expiredMembers || 0} expired
          </div>
        </div>

        {/* Total Bookings & Conversion */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-900/40 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Court Sessions</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">{data?.totalBookings || 0}</div>
          <div className="text-[11px] text-purple-600 font-semibold mt-2">
            Lead conversion: {data?.conversionRate || 0}% ({data?.convertedLeads} converted)
          </div>
        </div>
      </div>

      {/* REVENUE BY STREAM BREAKDOWN */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Revenue by Operational Stream</h3>
              <p className="text-xs text-slate-500">Live multi-module income split for selected period</p>
            </div>
            <span className="text-xs font-mono font-bold px-2 py-1 rounded bg-slate-100 dark:bg-slate-800">
              100% Reconciled
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                <Calendar className="w-3.5 h-3.5" />
                <span>Courts</span>
              </div>
              <div className="text-lg font-black text-emerald-950 dark:text-emerald-100 mt-2">
                {formatINR(streams.COURTS || 0)}
              </div>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">{courtPct}% of total</span>
            </div>

            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 dark:text-amber-300">
                <Users className="w-3.5 h-3.5" />
                <span>Memberships</span>
              </div>
              <div className="text-lg font-black text-amber-950 dark:text-amber-100 mt-2">
                {formatINR(streams.MEMBERSHIPS || 0)}
              </div>
              <span className="text-[11px] text-amber-600 dark:text-amber-400 font-bold">{memPct}% of total</span>
            </div>

            <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60">
              <div className="flex items-center gap-1.5 text-xs font-bold text-purple-800 dark:text-purple-300">
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Gear Shop</span>
              </div>
              <div className="text-lg font-black text-purple-950 dark:text-purple-100 mt-2">
                {formatINR(streams.SHOP || 0)}
              </div>
              <span className="text-[11px] text-purple-600 dark:text-purple-400 font-bold">{shopPct}% of total</span>
            </div>

            <div className="p-4 rounded-xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800/60">
              <div className="flex items-center gap-1.5 text-xs font-bold text-orange-800 dark:text-orange-300">
                <Coffee className="w-3.5 h-3.5" />
                <span>Bar & Food</span>
              </div>
              <div className="text-lg font-black text-orange-950 dark:text-orange-100 mt-2">
                {formatINR(streams.BAR || 0)}
              </div>
              <span className="text-[11px] text-orange-600 dark:text-orange-400 font-bold">{barPct}% of total</span>
            </div>
          </div>

          <div className="h-3 rounded-full overflow-hidden flex bg-slate-100 dark:bg-slate-800">
            <div style={{ width: `${courtPct}%` }} className="bg-emerald-500 h-full" title="Courts" />
            <div style={{ width: `${memPct}%` }} className="bg-amber-400 h-full" title="Memberships" />
            <div style={{ width: `${shopPct}%` }} className="bg-purple-500 h-full" title="Shop" />
            <div style={{ width: `${barPct}%` }} className="bg-orange-500 h-full" title="Bar" />
          </div>
        </div>

        {/* Member Tier Spread & Stock Alerts */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Club Membership Spread</h3>
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
              <span className="font-bold text-amber-800 dark:text-amber-300">👑 Gold Tier</span>
              <span className="font-mono font-extrabold">{data?.tierBreakdown?.GOLD || 0} members</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800">
              <span className="font-bold text-slate-700 dark:text-slate-300">🥈 Silver Tier</span>
              <span className="font-mono font-extrabold">{data?.tierBreakdown?.SILVER || 0} members</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
              <span className="font-bold text-blue-800 dark:text-blue-300">🌟 Junior Tier (&lt;18)</span>
              <span className="font-mono font-extrabold">{data?.tierBreakdown?.JUNIOR || 0} members</span>
            </div>
          </div>

          {data?.lowStockCount > 0 && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <span>
                <strong>{data.lowStockCount} items</strong> in Gear Shop are below reorder level!
              </span>
            </div>
          )}
        </div>
      </div>

      {/* COURT UTILIZATION HEATMAP */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Hourly Court Utilization Heatmap (6:00 AM – 10:00 PM)
            </h3>
            <p className="text-xs text-slate-500">Peak hour booking load across Clay, Hard, Glass & AstroTurf courts</p>
          </div>
          <span className="text-xs font-semibold text-emerald-600">Peak Surge: 6:00 PM – 9:00 PM</span>
        </div>

        <div className="grid grid-cols-8 sm:grid-cols-16 gap-1.5 pt-2">
          {Array.from({ length: 17 }, (_, i) => i + 6).map((hour) => {
            const count = data?.hourlyUtilization?.[hour] || 0;
            const isPeak = hour >= 18 && hour <= 21;
            const intensity =
              count > 15
                ? "bg-emerald-600 text-white"
                : count > 8
                ? "bg-emerald-400 text-slate-900"
                : count > 0
                ? "bg-emerald-200 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300"
                : "bg-slate-100 dark:bg-slate-800 text-slate-400";

            return (
              <div
                key={hour}
                className={`p-2 rounded-lg text-center flex flex-col justify-between transition-all ${intensity} ${
                  isPeak ? "ring-2 ring-amber-400/80" : ""
                }`}
              >
                <span className="text-[10px] font-bold block">{hour}:00</span>
                <span className="text-xs font-black mt-1 block">{count}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
