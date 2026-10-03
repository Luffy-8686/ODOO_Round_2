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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#E5DFD5] dark:border-[#222D3E]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-serif text-2xl font-bold text-[#0B1320] dark:text-white tracking-tight">
              Front Desk & Concierge Command Center
            </h1>
            <span className="text-[10px] font-mono px-2.5 py-0.5 rounded font-bold uppercase tracking-wider bg-[#C5A059]/15 text-[#8C6D23] dark:text-[#DFCA9B] border border-[#C5A059]/40">
              🎟️ RECEPTION CONCIERGE
            </span>
          </div>
          <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF] mt-0.5">
            Member credential verification, championship court allocations, guest inductions, and physical pass scanning.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/app/desk/courts"
            className="flex items-center gap-1.5 px-4 py-2 rounded-md bg-[#921111] hover:bg-[#720C0C] text-white text-xs font-bold uppercase tracking-wider shadow-sm transition-all"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Book Court Grid</span>
          </Link>
          <Link
            href="/app/desk/members"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-md border border-[#C5A059] text-[#0B1320] dark:text-[#DFCA9B] hover:bg-[#C5A059]/10 text-xs font-bold uppercase tracking-wider transition-all"
          >
            <UserPlus className="w-3.5 h-3.5 text-[#8C6D23]" />
            <span>New Member</span>
          </Link>
        </div>
      </div>

      {/* KPI TILES */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-lg bg-white dark:bg-[#0E1522] border border-[#E5DFD5] dark:border-[#222D3E] shadow-sm">
          <div className="flex items-center justify-between text-[#6B7280] dark:text-[#9CA3AF]">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C6D23] dark:text-[#DFCA9B]">Today&apos;s Reservations</span>
            <div className="w-8 h-8 rounded-md bg-[#FAF8F5] dark:bg-[#121A28] border border-[#E5DFD5] dark:border-[#222D3E] text-[#921111] flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-serif font-bold text-[#0B1320] dark:text-white mt-2">{bookings.length}</div>
          <Link
            href="/app/desk/courts"
            className="text-[11px] text-[#8C6D23] dark:text-[#DFCA9B] hover:underline font-bold uppercase tracking-wider mt-2 inline-flex items-center gap-1"
          >
            <span>View booking timetable</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="p-5 rounded-lg bg-white dark:bg-[#0E1522] border border-[#E5DFD5] dark:border-[#222D3E] shadow-sm">
          <div className="flex items-center justify-between text-[#6B7280] dark:text-[#9CA3AF]">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C6D23] dark:text-[#DFCA9B]">Active Members</span>
            <div className="w-8 h-8 rounded-md bg-[#FAF8F5] dark:bg-[#121A28] border border-[#E5DFD5] dark:border-[#222D3E] text-[#C5A059] flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-serif font-bold text-[#0B1320] dark:text-white mt-2">{members.length}</div>
          <Link
            href="/app/desk/members"
            className="text-[11px] text-[#8C6D23] dark:text-[#DFCA9B] hover:underline font-bold uppercase tracking-wider mt-2 inline-flex items-center gap-1"
          >
            <span>Lookup credential / QR</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="p-5 rounded-lg bg-white dark:bg-[#0E1522] border border-[#E5DFD5] dark:border-[#222D3E] shadow-sm">
          <div className="flex items-center justify-between text-[#6B7280] dark:text-[#9CA3AF]">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C6D23] dark:text-[#DFCA9B]">Roster Bulk Ingestion</span>
            <div className="w-8 h-8 rounded-md bg-[#FAF8F5] dark:bg-[#121A28] border border-[#E5DFD5] dark:border-[#222D3E] text-[#0B1320] dark:text-white flex items-center justify-center">
              <UploadCloud className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-serif font-bold text-[#0B1320] dark:text-white mt-2">Bulk Onboard</div>
          <Link
            href="/app/desk/import"
            className="text-[11px] text-[#8C6D23] dark:text-[#DFCA9B] hover:underline font-bold uppercase tracking-wider mt-2 inline-flex items-center gap-1"
          >
            <span>Open CSV migration wizard</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* LIVE COURTS QUICK STATUS */}
      <div className="p-6 rounded-lg bg-white dark:bg-[#0E1522] border border-[#E5DFD5] dark:border-[#222D3E] shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#E5DFD5] dark:border-[#222D3E]">
          <div>
            <h3 className="font-serif text-base font-bold text-[#0B1320] dark:text-white">Live Athletic Facility Status</h3>
            <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">Real-time occupancy across all club courts</p>
          </div>
          <Link href="/app/desk/courts" className="text-xs font-bold text-[#8C6D23] dark:text-[#DFCA9B] hover:underline uppercase tracking-wider">
            Launch Reservation Grid →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {courts.map((court) => (
            <div
              key={court.id}
              className="p-4 rounded-lg border border-[#E5DFD5] dark:border-[#222D3E] bg-[#FAF8F5]/60 dark:bg-[#121A28]/60 space-y-2 hover:border-[#C5A059] transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="text-xl">{court.sport?.icon || "🎾"}</span>
                <span className="px-2 py-0.5 rounded font-mono text-[9px] font-bold uppercase tracking-wider bg-[#C5A059]/15 text-[#8C6D23] dark:text-[#DFCA9B] border border-[#C5A059]/30">
                  {court.status}
                </span>
              </div>
              <h4 className="font-serif font-bold text-[#0B1320] dark:text-white text-sm">{court.name}</h4>
              <p className="text-[11px] text-[#6B7280] dark:text-[#9CA3AF]">
                {court.surfaceType} Surface • {formatINR(court.hourlyRatePaise)} / hr
              </p>
              <Link
                href="/app/desk/courts"
                className="block text-center w-full py-1.5 mt-2 rounded-md bg-[#921111] hover:bg-[#720C0C] text-white font-bold text-xs uppercase tracking-wider shadow-xs transition-colors"
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
