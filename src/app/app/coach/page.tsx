"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { formatTime, formatDate } from "@/lib/formatters";
import { useAuth } from "@/lib/auth-context";
import { Calendar, Users, Award, Clock, CheckCircle2, UserCheck, ArrowRight, Sparkles } from "lucide-react";

export default function CoachDashboardPage() {
  const { currentUser } = useAuth();
  const [sessions, setSessions] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch members to display student roster
    fetch("/api/members")
      .then((res) => res.json())
      .then((data) => {
        if (data.members) {
          setStudents(data.members.slice(0, 10));
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const todaySessions = [
    {
      id: "sess-1",
      time: "07:00 AM – 08:30 AM",
      studentName: "Arjun Reddy",
      tier: "GOLD",
      focus: "Serve Placement & Forehand Topspin Drills",
      court: "Center Court (Clay)",
      status: "COMPLETED",
    },
    {
      id: "sess-2",
      time: "05:00 PM – 06:30 PM",
      studentName: "Rohan Kapoor (Junior)",
      tier: "JUNIOR",
      focus: "Junior Academy Backhand Volley & Footwork",
      court: "Center Court (Clay)",
      status: "UPCOMING",
    },
    {
      id: "sess-3",
      time: "07:00 PM – 08:00 PM",
      studentName: "Priya Nair",
      tier: "SILVER",
      focus: "Padel Match Strategy & Wall Defense",
      court: "Padel Court 1 (Panoramic)",
      status: "UPCOMING",
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-[#E5DFD5] dark:border-[#222D3E]">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="text-[10px] uppercase tracking-[0.25em] font-bold text-[#8C6D23] dark:text-[#DFCA9B]">
              Athletic Coaching & Development
            </span>
            <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-[#C5A059]/15 text-[#8C6D23] dark:text-[#DFCA9B] border border-[#C5A059]/30 font-bold uppercase tracking-wider">
              Faculty Dossier
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-[#0B1320] dark:text-white tracking-tight mt-1">
            Academy Drills & Training Command
          </h1>
          <p className="text-xs text-[#5A6578] dark:text-[#8E9CAE] mt-1">
            Personal coaching timetable, student player roster, skill progression tracking, and court assignments.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/app/coach/courts"
            className="flex items-center gap-2 px-4 py-2 rounded bg-[#921111] hover:bg-[#720C0C] text-white text-xs font-bold uppercase tracking-wider shadow-sm transition-all"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Court Timetable</span>
          </Link>
        </div>
      </div>

      {/* KPI TILES */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-xl bg-white dark:bg-[#0E1726] border border-[#E5DFD5] dark:border-[#222D3E] shadow-sm">
          <div className="flex items-center justify-between text-[#5A6578] dark:text-[#8E9CAE]">
            <span className="text-[10px] font-bold uppercase tracking-[0.15em]">Today&apos;s Training Sessions</span>
            <Clock className="w-4 h-4 text-[#8C6D23] dark:text-[#DFCA9B]" />
          </div>
          <div className="text-3xl font-serif font-bold text-[#0B1320] dark:text-white mt-2">3 Sessions</div>
          <p className="text-xs text-[#8C6D23] dark:text-[#DFCA9B] font-medium mt-1">Center Court (Clay) & Padel 1</p>
        </div>

        <div className="p-5 rounded-xl bg-white dark:bg-[#0E1726] border border-[#E5DFD5] dark:border-[#222D3E] shadow-sm">
          <div className="flex items-center justify-between text-[#5A6578] dark:text-[#8E9CAE]">
            <span className="text-[10px] font-bold uppercase tracking-[0.15em]">Enrolled Trainees</span>
            <Users className="w-4 h-4 text-[#8C6D23] dark:text-[#DFCA9B]" />
          </div>
          <div className="text-3xl font-serif font-bold text-[#0B1320] dark:text-white mt-2">{students.length} Athletes</div>
          <p className="text-xs text-[#5A6578] dark:text-[#8E9CAE] mt-1">Junior Development & Gold Elite</p>
        </div>

        <div className="p-5 rounded-xl bg-white dark:bg-[#0E1726] border border-[#E5DFD5] dark:border-[#222D3E] shadow-sm">
          <div className="flex items-center justify-between text-[#5A6578] dark:text-[#8E9CAE]">
            <span className="text-[10px] font-bold uppercase tracking-[0.15em]">Next Upcoming Slot</span>
            <Sparkles className="w-4 h-4 text-[#C5A059]" />
          </div>
          <div className="text-xl font-serif font-bold text-[#0B1320] dark:text-white mt-2">05:00 PM (Junior)</div>
          <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium mt-1">Rohan Kapoor • Clay Court</p>
        </div>
      </div>

      {/* TODAY'S SESSIONS LIST */}
      <div className="p-6 rounded-xl bg-white dark:bg-[#0E1726] border border-[#E5DFD5] dark:border-[#222D3E] shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[9px] uppercase tracking-[0.2em] font-bold text-[#8C6D23] dark:text-[#DFCA9B] block">
              Daily Schedule
            </span>
            <h3 className="text-base font-serif font-bold text-[#0B1320] dark:text-white">
              Scheduled Coaching Sessions Today
            </h3>
          </div>
          <span className="text-xs text-[#8E9CAE] font-mono">3 Registered Slots</span>
        </div>

        <div className="space-y-3">
          {todaySessions.map((sess) => (
            <div
              key={sess.id}
              className="p-4 rounded-lg border border-[#E5DFD5] dark:border-[#222D3E] bg-[#FAF8F5] dark:bg-[#131C2E] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:border-[#C5A059]/60 transition-all"
            >
              <div>
                <div className="flex items-center gap-2.5">
                  <span className="font-mono font-bold text-[#921111] dark:text-[#DFCA9B]">{sess.time}</span>
                  <span className="font-serif font-bold text-base text-[#0B1320] dark:text-white">{sess.studentName}</span>
                  <span className="px-2 py-0.5 rounded font-mono font-bold uppercase text-[9px] bg-[#C5A059]/15 text-[#8C6D23] dark:text-[#DFCA9B] border border-[#C5A059]/30">
                    {sess.tier}
                  </span>
                </div>
                <p className="text-[#0B1320] dark:text-[#DFCA9B] mt-1 font-medium">🎯 {sess.focus}</p>
                <p className="text-[11px] text-[#5A6578] dark:text-[#8E9CAE] mt-0.5">📍 {sess.court}</p>
              </div>

              <span
                className={`self-start sm:self-center px-3 py-1 rounded font-bold uppercase text-[10px] tracking-wider border ${
                  sess.status === "COMPLETED"
                    ? "bg-[#E5DFD5]/50 text-[#5A6578] border-[#E5DFD5] dark:bg-[#222D3E] dark:text-[#8E9CAE] dark:border-[#222D3E]"
                    : "bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800"
                }`}
              >
                {sess.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* STUDENT ROSTER PREVIEW */}
      <div className="p-6 rounded-xl bg-white dark:bg-[#0E1726] border border-[#E5DFD5] dark:border-[#222D3E] shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[9px] uppercase tracking-[0.2em] font-bold text-[#8C6D23] dark:text-[#DFCA9B] block">
              Trainee Directory
            </span>
            <h3 className="text-base font-serif font-bold text-[#0B1320] dark:text-white">
              Active Student Athlete Roster
            </h3>
          </div>
          <Link
            href="/app/coach/students"
            className="text-xs font-bold uppercase tracking-wider text-[#921111] dark:text-[#DFCA9B] hover:underline"
          >
            View Full Directory →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {students.slice(0, 6).map((student) => (
            <div
              key={student.id}
              className="p-4 rounded-lg border border-[#E5DFD5] dark:border-[#222D3E] bg-[#FAF8F5] dark:bg-[#131C2E] space-y-1 text-xs hover:border-[#C5A059]/60 transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="font-serif font-bold text-sm text-[#0B1320] dark:text-white">{student.name}</span>
                <span className="font-mono font-bold text-[10px] text-[#8C6D23] dark:text-[#DFCA9B]">{student.memberId}</span>
              </div>
              <p className="text-[11px] text-[#5A6578] dark:text-[#8E9CAE]">{student.phone}</p>
              <span className="inline-block mt-1 text-[9px] font-bold px-2 py-0.5 rounded bg-[#C5A059]/15 text-[#8C6D23] dark:text-[#DFCA9B] border border-[#C5A059]/30 uppercase tracking-wider">
                Academy Trainee
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
