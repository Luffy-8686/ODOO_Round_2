"use client";

import React, { useState, useEffect } from "react";
import { formatDate } from "@/lib/formatters";
import { useAuth } from "@/lib/auth-context";
import { UserCheck, CheckCircle2, XCircle, Clock, Calendar } from "lucide-react";

export default function ManagerLeavesPage() {
  const { currentUser } = useAuth();
  const [leaves, setLeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLeaves = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/hr?view=leaves");
      const data = await res.json();
      if (data.leaves) setLeaves(data.leaves);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  const handleDecision = async (leaveId: string, status: "APPROVED" | "REJECTED") => {
    try {
      const res = await fetch("/api/hr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "LEAVE_DECISION",
          leaveId,
          status,
          userId: currentUser?.id,
        }),
      });
      const data = await res.json();
      if (data.success) {
        fetchLeaves();
      }
    } catch (e: any) {
      alert("Error: " + e.message);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Staff Leave Approvals & Roster Decisions
            </h1>
            <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold">
              📋 OPERATIONS
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Review staff vacation, sick leave, and casual leave requests.
          </p>
        </div>
      </div>

      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 font-semibold border-b">
              <tr>
                <th className="p-3">Employee</th>
                <th className="p-3">Leave Type</th>
                <th className="p-3">Dates</th>
                <th className="p-3">Reason</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Decision</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {leaves.map((l) => (
                <tr key={l.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="p-3">
                    <div className="font-bold text-slate-900 dark:text-white">{l.employee?.name}</div>
                    <div className="text-slate-400 text-[10px]">{l.employee?.employeeCode} • {l.employee?.role}</div>
                  </td>
                  <td className="p-3">{l.leaveType}</td>
                  <td className="p-3 text-slate-500">
                    {formatDate(l.startDate)} – {formatDate(l.endDate)}
                  </td>
                  <td className="p-3 text-slate-600 dark:text-slate-300">{l.reason}</td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded font-bold uppercase text-[10px] ${
                        l.status === "APPROVED"
                          ? "bg-emerald-50 text-emerald-700"
                          : l.status === "PENDING"
                          ? "bg-amber-50 text-amber-700"
                          : "bg-red-50 text-red-700"
                      }`}
                    >
                      {l.status}
                    </span>
                  </td>
                  <td className="p-3 text-right space-x-1.5">
                    {l.status === "PENDING" ? (
                      <>
                        <button
                          onClick={() => handleDecision(l.id, "APPROVED")}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleDecision(l.id, "REJECTED")}
                          className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs"
                        >
                          Reject
                        </button>
                      </>
                    ) : (
                      <span className="text-slate-400 text-xs font-semibold">Processed</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
