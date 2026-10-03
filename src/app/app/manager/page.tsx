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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Operations Manager Dashboard
            </h1>
            <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold border border-blue-300 dark:border-blue-800">
              📋 MANAGER PORTAL
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Daily facility execution: court schedules, staff leave approvals, CRM lead pipeline, and stock health.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/app/manager/courts"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition-all"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Master Schedule</span>
          </Link>
        </div>
      </div>

      {/* TOP KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-900/40 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Today&apos;s Bookings</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">{bookings.length}</div>
          <p className="text-[11px] text-emerald-600 font-semibold mt-2">Across 6 indoor & outdoor courts</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-900/40 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Pending Leaves</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">{pendingLeaves.length}</div>
          <Link
            href="/app/manager/leaves"
            className="text-[11px] text-blue-600 hover:underline font-semibold mt-2 inline-flex items-center gap-1"
          >
            <span>Review requests</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-900/40 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Leads</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">{newLeads.length}</div>
          <Link
            href="/app/manager/crm"
            className="text-[11px] text-purple-600 hover:underline font-semibold mt-2 inline-flex items-center gap-1"
          >
            <span>Manage CRM pipeline</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-900/40 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Low Stock Items</span>
            <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-950/60 text-red-600 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">{products.length}</div>
          <Link
            href="/app/manager/inventory"
            className="text-[11px] text-red-600 hover:underline font-semibold mt-2 inline-flex items-center gap-1"
          >
            <span>View restock alerts</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* QUICK WORKFLOW CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Court Status Overview */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Live Court Status & Facilities</h3>
            <Link href="/app/manager/courts" className="text-xs text-blue-600 font-semibold hover:underline">
              Open Grid →
            </Link>
          </div>

          <div className="space-y-2.5">
            {courts.map((court) => (
              <div
                key={court.id}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span>{court.sport?.icon || "🎾"}</span>
                    <span>{court.name}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    {court.surfaceType} • {court.isIndoor ? "Indoor Hall" : "Outdoor"}
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded-full font-mono text-[10px] font-bold uppercase bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                  {court.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Pending Staff Leave Decisions */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Pending Leave Approvals</h3>
            <Link href="/app/manager/leaves" className="text-xs text-blue-600 font-semibold hover:underline">
              View All Leaves →
            </Link>
          </div>

          {pendingLeaves.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
              All staff leave requests are fully reviewed.
            </div>
          ) : (
            <div className="space-y-2.5">
              {pendingLeaves.slice(0, 4).map((l) => (
                <div
                  key={l.id}
                  className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white">{l.employee?.name}</span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                      {l.leaveType} • {l.reason}
                    </span>
                  </div>
                  <Link
                    href="/app/manager/leaves"
                    className="px-2.5 py-1 rounded-lg bg-blue-600 text-white font-bold text-[11px]"
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
