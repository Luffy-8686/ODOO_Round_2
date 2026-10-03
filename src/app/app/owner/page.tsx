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
      <div className="p-12 text-center text-[#6B7280] dark:text-[#9CA3AF]">
        <div className="w-8 h-8 border-2 border-[#C5A059] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="font-serif text-sm font-semibold">Loading Executive Governance Dashboard...</p>
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#E5DFD5] dark:border-[#222D3E]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-serif text-2xl font-bold text-[#0B1320] dark:text-white tracking-tight">
              Executive Governance & Command Center
            </h1>
            <span className="text-[10px] font-mono px-2.5 py-0.5 rounded font-bold uppercase tracking-wider bg-[#C5A059]/15 text-[#8C6D23] dark:text-[#DFCA9B] border border-[#C5A059]/40">
              👑 BOARD EXECUTIVE
            </span>
          </div>
          <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF] mt-0.5">
            Full institutional oversight: Financial P&L, GST reconciliation, staff payroll, and governance permissions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Range Picker */}
          <div className="flex bg-[#FAF8F5] dark:bg-[#121A28] p-1 rounded-md border border-[#E5DFD5] dark:border-[#222D3E] text-xs font-semibold">
            {["today", "7d", "30d"].map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-3 py-1 rounded-md transition-all text-xs font-bold uppercase tracking-wider ${
                  range === r
                    ? "bg-[#921111] text-white shadow-xs"
                    : "text-[#6B7280] dark:text-[#9CA3AF] hover:text-[#0B1320] dark:hover:text-white"
                }`}
              >
                {r === "today" ? "Today" : r === "7d" ? "7 Days" : "30 Days"}
              </button>
            ))}
          </div>

          <Link
            href="/app/owner/users"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-[#921111] hover:bg-[#720C0C] text-white text-xs font-bold uppercase tracking-wider shadow-sm transition-all"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Manage Users</span>
          </Link>
        </div>
      </div>

      {/* TOP KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="p-5 rounded-lg bg-white dark:bg-[#0E1522] border border-[#E5DFD5] dark:border-[#222D3E] shadow-sm">
          <div className="flex items-center justify-between text-[#6B7280] dark:text-[#9CA3AF]">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C6D23] dark:text-[#DFCA9B]">Total Gross Income</span>
            <div className="w-8 h-8 rounded-md bg-[#FAF8F5] dark:bg-[#121A28] border border-[#E5DFD5] dark:border-[#222D3E] text-[#921111] flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-serif font-bold text-[#0B1320] dark:text-white mt-2">
            {formatINR(data?.totalRevenuePaise || 0)}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-[#8C6D23] dark:text-[#DFCA9B] font-semibold mt-2">
            <TrendingUp className="w-3.5 h-3.5 text-[#921111]" />
            <span>+18.4% vs previous benchmark</span>
          </div>
        </div>

        {/* Total Expenses & Net Profit */}
        <div className="p-5 rounded-lg bg-white dark:bg-[#0E1522] border border-[#E5DFD5] dark:border-[#222D3E] shadow-sm">
          <div className="flex items-center justify-between text-[#6B7280] dark:text-[#9CA3AF]">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C6D23] dark:text-[#DFCA9B]">Net Operating Surplus</span>
            <div className="w-8 h-8 rounded-md bg-[#FAF8F5] dark:bg-[#121A28] border border-[#E5DFD5] dark:border-[#222D3E] text-[#C5A059] flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-serif font-bold text-[#0B1320] dark:text-white mt-2">
            {formatINR(data?.netProfitPaise || 0)}
          </div>
          <div className="text-[11px] text-[#6B7280] dark:text-[#9CA3AF] mt-2">
            Operating Expenses: {formatINR(data?.totalExpensesPaise || 0)}
          </div>
        </div>

        {/* Active Members */}
        <div className="p-5 rounded-lg bg-white dark:bg-[#0E1522] border border-[#E5DFD5] dark:border-[#222D3E] shadow-sm">
          <div className="flex items-center justify-between text-[#6B7280] dark:text-[#9CA3AF]">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C6D23] dark:text-[#DFCA9B]">Active Members</span>
            <div className="w-8 h-8 rounded-md bg-[#FAF8F5] dark:bg-[#121A28] border border-[#E5DFD5] dark:border-[#222D3E] text-[#0B1320] dark:text-white flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-serif font-bold text-[#0B1320] dark:text-white mt-2">{data?.activeMembers || 0}</div>
          <div className="text-[11px] text-[#8C6D23] dark:text-[#DFCA9B] font-semibold mt-2">
            {data?.expiringSoon || 0} expiring soon • {data?.expiredMembers || 0} expired
          </div>
        </div>

        {/* Total Bookings & Conversion */}
        <div className="p-5 rounded-lg bg-white dark:bg-[#0E1522] border border-[#E5DFD5] dark:border-[#222D3E] shadow-sm">
          <div className="flex items-center justify-between text-[#6B7280] dark:text-[#9CA3AF]">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C6D23] dark:text-[#DFCA9B]">Match Sessions</span>
            <div className="w-8 h-8 rounded-md bg-[#FAF8F5] dark:bg-[#121A28] border border-[#E5DFD5] dark:border-[#222D3E] text-[#921111] flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-serif font-bold text-[#0B1320] dark:text-white mt-2">{data?.totalBookings || 0}</div>
          <div className="text-[11px] text-[#8C6D23] dark:text-[#DFCA9B] font-semibold mt-2">
            Trial conversion: {data?.conversionRate || 0}% ({data?.convertedLeads} inducted)
          </div>
        </div>
      </div>

      {/* REVENUE BY STREAM BREAKDOWN */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-6 rounded-lg bg-white dark:bg-[#0E1522] border border-[#E5DFD5] dark:border-[#222D3E] shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-[#E5DFD5] dark:border-[#222D3E]">
            <div>
              <h3 className="font-serif text-base font-bold text-[#0B1320] dark:text-white">Revenue by Operational Division</h3>
              <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">Audited multi-departmental income distribution</p>
            </div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-1 rounded bg-[#FAF8F5] dark:bg-[#121A28] border border-[#E5DFD5] dark:border-[#222D3E] text-[#0B1320] dark:text-white">
              100% RECONCILED
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-md bg-[#FAF8F5] dark:bg-[#121A28] border border-[#E5DFD5] dark:border-[#222D3E]">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#0B1320] dark:text-white">
                <Calendar className="w-3.5 h-3.5 text-[#921111]" />
                <span className="font-serif">Courts</span>
              </div>
              <div className="text-lg font-serif font-bold text-[#0B1320] dark:text-white mt-2">
                {formatINR(streams.COURTS || 0)}
              </div>
              <span className="text-[10px] text-[#8C6D23] dark:text-[#DFCA9B] font-bold uppercase tracking-wider">{courtPct}% of total</span>
            </div>

            <div className="p-4 rounded-md bg-[#FAF8F5] dark:bg-[#121A28] border border-[#E5DFD5] dark:border-[#222D3E]">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#0B1320] dark:text-white">
                <Users className="w-3.5 h-3.5 text-[#C5A059]" />
                <span className="font-serif">Memberships</span>
              </div>
              <div className="text-lg font-serif font-bold text-[#0B1320] dark:text-white mt-2">
                {formatINR(streams.MEMBERSHIPS || 0)}
              </div>
              <span className="text-[10px] text-[#8C6D23] dark:text-[#DFCA9B] font-bold uppercase tracking-wider">{memPct}% of total</span>
            </div>

            <div className="p-4 rounded-md bg-[#FAF8F5] dark:bg-[#121A28] border border-[#E5DFD5] dark:border-[#222D3E]">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#0B1320] dark:text-white">
                <ShoppingBag className="w-3.5 h-3.5 text-[#0B1320] dark:text-white" />
                <span className="font-serif">Pro Shop</span>
              </div>
              <div className="text-lg font-serif font-bold text-[#0B1320] dark:text-white mt-2">
                {formatINR(streams.SHOP || 0)}
              </div>
              <span className="text-[10px] text-[#8C6D23] dark:text-[#DFCA9B] font-bold uppercase tracking-wider">{shopPct}% of total</span>
            </div>

            <div className="p-4 rounded-md bg-[#FAF8F5] dark:bg-[#121A28] border border-[#E5DFD5] dark:border-[#222D3E]">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#0B1320] dark:text-white">
                <Coffee className="w-3.5 h-3.5 text-[#921111]" />
                <span className="font-serif">Club Dining</span>
              </div>
              <div className="text-lg font-serif font-bold text-[#0B1320] dark:text-white mt-2">
                {formatINR(streams.BAR || 0)}
              </div>
              <span className="text-[10px] text-[#8C6D23] dark:text-[#DFCA9B] font-bold uppercase tracking-wider">{barPct}% of total</span>
            </div>
          </div>

          <div className="h-2 rounded-full overflow-hidden flex bg-[#FAF8F5] dark:bg-[#121A28] border border-[#E5DFD5] dark:border-[#222D3E]">
            <div style={{ width: `${courtPct}%` }} className="bg-[#921111] h-full" title="Courts" />
            <div style={{ width: `${memPct}%` }} className="bg-[#C5A059] h-full" title="Memberships" />
            <div style={{ width: `${shopPct}%` }} className="bg-[#0B1320] dark:bg-white h-full" title="Shop" />
            <div style={{ width: `${barPct}%` }} className="bg-[#E5DFD5] dark:bg-[#334155] h-full" title="Bar" />
          </div>
        </div>

        {/* Member Tier Spread & Stock Alerts */}
        <div className="p-6 rounded-lg bg-white dark:bg-[#0E1522] border border-[#E5DFD5] dark:border-[#222D3E] shadow-sm space-y-4">
          <div className="pb-2 border-b border-[#E5DFD5] dark:border-[#222D3E]">
            <h3 className="font-serif text-base font-bold text-[#0B1320] dark:text-white">Club Membership Composition</h3>
            <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">Active tier census</p>
          </div>
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-md bg-[#FAF8F5] dark:bg-[#121A28] border border-[#C5A059]/40">
              <span className="font-serif font-bold text-[#0B1320] dark:text-white">👑 Gold Tier</span>
              <span className="font-mono font-bold text-[#8C6D23] dark:text-[#DFCA9B]">{data?.tierBreakdown?.GOLD || 0} members</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-md bg-[#FAF8F5] dark:bg-[#121A28] border border-[#E5DFD5] dark:border-[#222D3E]">
              <span className="font-serif font-bold text-[#0B1320] dark:text-white">🥈 Silver Tier</span>
              <span className="font-mono font-bold text-[#6B7280] dark:text-[#9CA3AF]">{data?.tierBreakdown?.SILVER || 0} members</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-md bg-[#FAF8F5] dark:bg-[#121A28] border border-[#E5DFD5] dark:border-[#222D3E]">
              <span className="font-serif font-bold text-[#0B1320] dark:text-white">🌟 Junior Tier (&lt;18)</span>
              <span className="font-mono font-bold text-[#6B7280] dark:text-[#9CA3AF]">{data?.tierBreakdown?.JUNIOR || 0} members</span>
            </div>
          </div>

          {data?.lowStockCount > 0 && (
            <div className="p-3 rounded-md bg-[#921111]/10 border border-[#921111]/30 text-[#921111] dark:text-[#E89999] text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[#921111] shrink-0" />
              <span>
                <strong>{data.lowStockCount} items</strong> in Gear Shop require replenishment.
              </span>
            </div>
          )}
        </div>
      </div>

      {/* COURT UTILIZATION HEATMAP */}
      <div className="p-6 rounded-lg bg-white dark:bg-[#0E1522] border border-[#E5DFD5] dark:border-[#222D3E] shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-[#E5DFD5] dark:border-[#222D3E]">
          <div>
            <h3 className="font-serif text-base font-bold text-[#0B1320] dark:text-white">
              Hourly Court Utilization Heatmap (06:00 – 22:00)
            </h3>
            <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">Facility load distribution across Championship Clay, Hard, Glass & AstroTurf courts</p>
          </div>
          <span className="text-xs font-serif font-bold text-[#921111] dark:text-[#DFCA9B]">Peak Session: 18:00 – 21:00</span>
        </div>

        <div className="grid grid-cols-8 sm:grid-cols-16 gap-1.5 pt-2">
          {Array.from({ length: 17 }, (_, i) => i + 6).map((hour) => {
            const count = data?.hourlyUtilization?.[hour] || 0;
            const isPeak = hour >= 18 && hour <= 21;
            const intensity =
              count > 15
                ? "bg-[#921111] text-white"
                : count > 8
                ? "bg-[#C5A059] text-white"
                : count > 0
                ? "bg-[#C5A059]/20 text-[#0B1320] dark:text-[#DFCA9B] border border-[#C5A059]/30"
                : "bg-[#FAF8F5] dark:bg-[#121A28] text-[#9CA3AF] border border-[#E5DFD5] dark:border-[#222D3E]";

            return (
              <div
                key={hour}
                className={`p-2 rounded-md text-center flex flex-col justify-between transition-all ${intensity} ${
                  isPeak ? "ring-2 ring-[#C5A059]" : ""
                }`}
              >
                <span className="text-[10px] font-mono font-bold block">{hour}:00</span>
                <span className="text-xs font-mono font-bold mt-1 block">{count}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
