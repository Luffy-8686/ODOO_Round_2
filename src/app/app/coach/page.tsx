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
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Coach Coaching & Drills Command
            </h1>
            <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300 font-bold border border-cyan-300 dark:border-cyan-800">
              🎾 COACH PORTAL
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Personal training schedule, student player roster, skill development tracking, and court assignments.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/app/coach/courts"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold shadow-md shadow-cyan-600/20 transition-all"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Court Timetable</span>
          </Link>
        </div>
      </div>

      {/* KPI TILES */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-cyan-200 dark:border-cyan-900/40 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Today&apos;s Training Sessions</span>
            <Clock className="w-5 h-5 text-cyan-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">3 Sessions</div>
          <p className="text-[11px] text-cyan-600 font-semibold mt-2">Center Court (Clay) & Padel 1</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-cyan-200 dark:border-cyan-900/40 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Enrolled Trainees</span>
            <Users className="w-5 h-5 text-cyan-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">{students.length} Students</div>
          <p className="text-[11px] text-slate-400 mt-2">Junior Development & Gold Elite</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-cyan-200 dark:border-cyan-900/40 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Next Session</span>
            <Sparkles className="w-5 h-5 text-amber-500" />
          </div>
          <div className="text-lg font-black text-slate-900 dark:text-white mt-2">05:00 PM (Junior)</div>
          <p className="text-[11px] text-emerald-600 font-semibold mt-2">Rohan Kapoor • Clay Court</p>
        </div>
      </div>

      {/* TODAY'S SESSIONS LIST */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Scheduled Coaching Sessions Today</h3>
          <span className="text-xs text-slate-400 font-mono">3 Registered Slots</span>
        </div>

        <div className="space-y-3">
          {todaySessions.map((sess) => (
            <div
              key={sess.id}
              className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-cyan-700 dark:text-cyan-300">{sess.time}</span>
                  <span className="font-extrabold text-slate-900 dark:text-white text-sm">{sess.studentName}</span>
                  <span className="px-2 py-0.2 rounded font-mono font-bold uppercase text-[9px] bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                    {sess.tier}
                  </span>
                </div>
                <p className="text-slate-600 dark:text-slate-300 mt-1 font-medium">🎯 {sess.focus}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">📍 {sess.court}</p>
              </div>

              <span
                className={`self-start sm:self-center px-3 py-1 rounded-full font-bold uppercase text-[10px] ${
                  sess.status === "COMPLETED"
                    ? "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300"
                    : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                }`}
              >
                {sess.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* STUDENT ROSTER PREVIEW */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Active Student Player Roster</h3>
          <Link href="/app/coach/students" className="text-xs font-bold text-cyan-600 hover:underline">
            View All Students →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {students.slice(0, 6).map((student) => (
            <div
              key={student.id}
              className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 space-y-1 text-xs"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 dark:text-white">{student.name}</span>
                <span className="font-mono font-bold text-[10px] text-emerald-600">{student.memberId}</span>
              </div>
              <p className="text-[11px] text-slate-400">{student.phone}</p>
              <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-50 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300">
                Academy Trainee
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
