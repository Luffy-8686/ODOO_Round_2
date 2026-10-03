"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { formatINR, formatDateTime } from "@/lib/formatters";
import {
  Calendar,
  Users,
  Target,
  ShoppingBag,
  Clock,
  AlertTriangle,
  UserCheck,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
} from "lucide-react";

export default function ManagerDashboardPage() {
  const [courts, setCourts] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchManagerData = async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split("T")[0];
      const [courtRes, leadRes, leaveRes, prodRes] = await Promise.all([
        fetch(`/api/courts?date=${today}`),
        fetch("/api/crm/leads"),
        fetch("/api/hr?view=leaves"),
        fetch("/api/shop/products?lowStock=true"),
      ]);
      const courtData = await courtRes.json();
      const leadData = await leadRes.json();
      const leaveData = await leaveRes.json();
      const prodData = await prodRes.json();

      if (courtData.courts) setCourts(courtData.courts);
      if (courtData.bookings) setBookings(courtData.bookings);
      if (leadData.leads) setLeads(leadData.leads);
      if (leaveData.leaves) setLeaves(leaveData.leaves);
      if (prodData.products) setProducts(prodData.products);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchManagerData();
  }, []);

  const pendingLeaves = leaves.filter((l) => l.status === "PENDING");
  const newLeads = leads.filter((l) => l.status === "NEW" || l.status === "CONTACTED");

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#E5DFD5] dark:border-[#223042]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-serif text-2xl font-bold text-[#0B1320] dark:text-[#FAF8F5] tracking-tight">
              Operations Management Dashboard
            </h1>
            <span className="text-[10px] font-mono tracking-widest uppercase px-2.5 py-1 rounded bg-[#C5A059]/15 text-[#8C6D2D] dark:text-[#C5A059] border border-[#C5A059]/30 font-bold">
              FACILITY DIRECTOR
            </span>
          </div>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 font-sans">
            Daily facility execution: court schedules, staff leave governance, candidate pipeline, and pro shop stock health.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/app/manager/courts"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0B1320] hover:bg-[#162232] text-white text-xs font-serif uppercase tracking-wider font-semibold shadow-xs transition-colors"
          >
            <Calendar className="w-3.5 h-3.5 text-[#C5A059]" />
            <span>Master Timetable</span>
          </Link>
        </div>
      </div>

      {/* TOP KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl bg-white dark:bg-[#0F1923] border border-[#E5DFD5] dark:border-[#223042] shadow-xs hover:border-[#C5A059] transition-all">
          <div className="flex items-center justify-between text-stone-500 dark:text-stone-400">
            <span className="text-[10px] font-mono uppercase tracking-widest font-bold">Today&apos;s Bookings</span>
            <div className="w-8 h-8 rounded-lg bg-[#C5A059]/10 text-[#C5A059] flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-serif font-bold text-[#0B1320] dark:text-[#FAF8F5] mt-2">{bookings.length}</div>
          <p className="text-[11px] font-mono text-[#C5A059] font-medium mt-1">Across 6 championship courts</p>
        </div>

        <div className="p-5 rounded-xl bg-white dark:bg-[#0F1923] border border-[#E5DFD5] dark:border-[#223042] shadow-xs hover:border-[#C5A059] transition-all">
          <div className="flex items-center justify-between text-stone-500 dark:text-stone-400">
            <span className="text-[10px] font-mono uppercase tracking-widest font-bold">Pending Leaves</span>
            <div className="w-8 h-8 rounded-lg bg-[#921111]/10 text-[#921111] flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-serif font-bold text-[#0B1320] dark:text-[#FAF8F5] mt-2">{pendingLeaves.length}</div>
          <Link
            href="/app/manager/leaves"
            className="text-[11px] text-[#921111] dark:text-[#C5A059] hover:underline font-bold mt-1 inline-flex items-center gap-1 font-serif uppercase tracking-wider"
          >
            <span>Review requests</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="p-5 rounded-xl bg-white dark:bg-[#0F1923] border border-[#E5DFD5] dark:border-[#223042] shadow-xs hover:border-[#C5A059] transition-all">
          <div className="flex items-center justify-between text-stone-500 dark:text-stone-400">
            <span className="text-[10px] font-mono uppercase tracking-widest font-bold">Active Inquiries</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-serif font-bold text-[#0B1320] dark:text-[#FAF8F5] mt-2">{newLeads.length}</div>
          <Link
            href="/app/manager/crm"
            className="text-[11px] text-[#0B1320] dark:text-stone-300 hover:text-[#921111] font-bold mt-1 inline-flex items-center gap-1 font-serif uppercase tracking-wider"
          >
            <span>Manage pipeline</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="p-5 rounded-xl bg-white dark:bg-[#0F1923] border border-[#E5DFD5] dark:border-[#223042] shadow-xs hover:border-[#C5A059] transition-all">
          <div className="flex items-center justify-between text-stone-500 dark:text-stone-400">
            <span className="text-[10px] font-mono uppercase tracking-widest font-bold">Restock Warnings</span>
            <div className="w-8 h-8 rounded-lg bg-[#921111]/10 text-[#921111] flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-serif font-bold text-[#0B1320] dark:text-[#FAF8F5] mt-2">{products.length}</div>
          <Link
            href="/app/manager/inventory"
            className="text-[11px] text-[#921111] dark:text-[#C5A059] hover:underline font-bold mt-1 inline-flex items-center gap-1 font-serif uppercase tracking-wider"
          >
            <span>Restock ledger</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* QUICK WORKFLOW CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Court Status Overview */}
        <div className="p-6 rounded-xl bg-white dark:bg-[#0F1923] border border-[#E5DFD5] dark:border-[#223042] shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E5DFD5] dark:border-[#223042]">
            <h3 className="font-serif text-base font-bold text-[#0B1320] dark:text-[#FAF8F5]">
              Live Court Status & Facilities
            </h3>
            <Link
              href="/app/manager/courts"
              className="text-xs font-serif uppercase tracking-wider text-[#921111] dark:text-[#C5A059] font-bold hover:underline"
            >
              Open Timetable →
            </Link>
          </div>

          <div className="space-y-2.5">
            {courts.map((court) => (
              <div
                key={court.id}
                className="p-3 rounded-lg bg-[#FAF8F5] dark:bg-[#162232] border border-[#E5DFD5] dark:border-[#223042] flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-serif font-bold text-sm text-[#0B1320] dark:text-[#FAF8F5] flex items-center gap-2">
                    <span>{court.sport?.icon || "🎾"}</span>
                    <span>{court.name}</span>
                  </div>
                  <span className="text-[11px] text-stone-500 font-mono mt-0.5 block">
                    {court.surfaceType} • {court.isIndoor ? "Indoor Hall" : "Championship Outdoor"}
                  </span>
                </div>
                <span className="px-2.5 py-1 rounded font-mono text-[10px] font-bold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  {court.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Pending Staff Leave Decisions */}
        <div className="p-6 rounded-xl bg-white dark:bg-[#0F1923] border border-[#E5DFD5] dark:border-[#223042] shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E5DFD5] dark:border-[#223042]">
            <h3 className="font-serif text-base font-bold text-[#0B1320] dark:text-[#FAF8F5]">
              Pending Staff Leave Governance
            </h3>
            <Link
              href="/app/manager/leaves"
              className="text-xs font-serif uppercase tracking-wider text-[#921111] dark:text-[#C5A059] font-bold hover:underline"
            >
              All Requests →
            </Link>
          </div>

          {pendingLeaves.length === 0 ? (
            <div className="p-8 text-center text-stone-400 text-xs">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2 opacity-80" />
              <p className="font-serif font-medium text-sm text-[#0B1320] dark:text-[#FAF8F5]">All Staff Leave Reviewed</p>
              <p className="text-[11px] text-stone-400 mt-0.5">No pending absence decisions awaiting action.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {pendingLeaves.slice(0, 4).map((l) => (
                <div
                  key={l.id}
                  className="p-3.5 rounded-lg bg-[#FAF8F5] dark:bg-[#162232] border border-[#E5DFD5] dark:border-[#223042] flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-serif font-bold text-sm text-[#0B1320] dark:text-[#FAF8F5] block">
                      {l.employee?.name}
                    </span>
                    <span className="text-[11px] text-stone-500 dark:text-stone-400 block mt-0.5 font-mono">
                      {l.leaveType} • {l.reason}
                    </span>
                  </div>
                  <Link
                    href="/app/manager/leaves"
                    className="px-3 py-1.5 rounded-lg bg-[#921111] hover:bg-[#7A0E0E] text-white font-serif uppercase tracking-wider font-bold text-[11px] shadow-xs transition-colors"
                  >
                    Decide
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
