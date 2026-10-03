"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { formatINR, formatTime } from "@/lib/formatters";
import {
  Calendar,
  Users,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  ArrowRight,
  CreditCard,
  UploadCloud,
  QrCode,
  UserPlus,
} from "lucide-react";

export default function FrontDeskOverviewPage() {
  const [courts, setCourts] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split("T")[0];
      const [courtRes, memRes] = await Promise.all([
        fetch(`/api/courts?date=${today}`),
        fetch("/api/members"),
      ]);
      const courtData = await courtRes.json();
      const memData = await memRes.json();

      if (courtData.courts) setCourts(courtData.courts);
      if (courtData.bookings) setBookings(courtData.bookings);
      if (memData.members) setMembers(memData.members);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Front Desk Command Center
            </h1>
            <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-300 dark:border-emerald-800">
              🎟️ FRONT DESK
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Walk-in check-in, court reservation management, new member onboarding, and digital pass verification.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/app/desk/courts"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Book Court Grid</span>
          </Link>
          <Link
            href="/app/desk/members"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-all"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>New Member</span>
          </Link>
        </div>
      </div>

      {/* KPI TILES */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-900/40 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Today&apos;s Reservations</span>
            <Calendar className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">{bookings.length}</div>
          <Link
            href="/app/desk/courts"
            className="text-[11px] text-emerald-600 hover:underline font-semibold mt-2 inline-flex items-center gap-1"
          >
            <span>View booking timetable</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-900/40 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Members</span>
            <Users className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">{members.length}</div>
          <Link
            href="/app/desk/members"
            className="text-[11px] text-emerald-600 hover:underline font-semibold mt-2 inline-flex items-center gap-1"
          >
            <span>Lookup digital pass / QR</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-900/40 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">CSV Member Import</span>
            <UploadCloud className="w-5 h-5 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">Bulk Onboard</div>
          <Link
            href="/app/desk/import"
            className="text-[11px] text-purple-600 hover:underline font-semibold mt-2 inline-flex items-center gap-1"
          >
            <span>Open CSV migration wizard</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* LIVE COURTS QUICK STATUS */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Live Court Status</h3>
          <Link href="/app/desk/courts" className="text-xs font-bold text-emerald-600 hover:underline">
            Launch Reservation Grid →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {courts.map((court) => (
            <div
              key={court.id}
              className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-lg">{court.sport?.icon || "🎾"}</span>
                <span className="px-2 py-0.5 rounded-full font-mono text-[9px] font-bold uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  {court.status}
                </span>
              </div>
              <h4 className="font-bold text-slate-900 dark:text-white text-sm">{court.name}</h4>
              <p className="text-[11px] text-slate-400">
                {court.surfaceType} • {formatINR(court.hourlyRatePaise)} / hr
              </p>
              <Link
                href="/app/desk/courts"
                className="block text-center w-full py-1.5 mt-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs"
              >
                Quick Book Slot
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
