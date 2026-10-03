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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#E5DFD5] dark:border-[#223042]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-serif text-2xl font-bold text-[#0B1320] dark:text-[#FAF8F5] tracking-tight">
              Staff Leave Approvals & Roster Governance
            </h1>
            <span className="text-[10px] font-mono tracking-widest uppercase px-2.5 py-1 rounded bg-[#C5A059]/15 text-[#8C6D2D] dark:text-[#C5A059] border border-[#C5A059]/30 font-bold">
              FACILITY ROSTER
            </span>
          </div>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 font-sans">
            Review and rule on staff vacation, athletic coaching leaves, sick leave, and casual leave requests.
          </p>
        </div>
      </div>

      <div className="p-6 rounded-xl bg-white dark:bg-[#0F1923] border border-[#E5DFD5] dark:border-[#223042] shadow-xs space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#FAF8F5] dark:bg-[#162232] text-stone-500 font-mono text-[10px] uppercase tracking-wider border-b border-[#E5DFD5] dark:border-[#223042]">
              <tr>
                <th className="p-3.5">Employee</th>
                <th className="p-3.5">Leave Type</th>
                <th className="p-3.5">Dates</th>
                <th className="p-3.5">Reason</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Decision</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5DFD5] dark:divide-[#223042] font-medium">
              {leaves.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-stone-400 font-mono italic">
                    No leave requests found in the system.
                  </td>
                </tr>
              ) : (
                leaves.map((l) => (
                  <tr key={l.id} className="hover:bg-[#FAF8F5] dark:hover:bg-[#162232]/50 transition-colors">
                    <td className="p-3.5">
                      <div className="font-serif font-bold text-sm text-[#0B1320] dark:text-[#FAF8F5]">{l.employee?.name}</div>
                      <div className="text-stone-400 font-mono text-[10px] mt-0.5">{l.employee?.employeeCode} • {l.employee?.role}</div>
                    </td>
                    <td className="p-3.5 font-semibold text-stone-700 dark:text-stone-300">{l.leaveType}</td>
                    <td className="p-3.5 font-mono text-stone-500 dark:text-stone-400">
                      {formatDate(l.startDate)} – {formatDate(l.endDate)}
                    </td>
                    <td className="p-3.5 text-stone-600 dark:text-stone-300">{l.reason}</td>
                    <td className="p-3.5">
                      <span
                        className={`px-2.5 py-1 rounded font-mono font-bold uppercase text-[10px] tracking-wider border ${
                          l.status === "APPROVED"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800"
                            : l.status === "PENDING"
                            ? "bg-[#C5A059]/15 text-[#8C6D2D] border-[#C5A059]/30 dark:text-[#C5A059]"
                            : "bg-[#921111]/15 text-[#921111] border-[#921111]/30 dark:text-[#e05252]"
                        }`}
                      >
                        {l.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-right space-x-2">
                      {l.status === "PENDING" ? (
                        <>
                          <button
                            onClick={() => handleDecision(l.id, "APPROVED")}
                            className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-serif uppercase tracking-wider font-bold text-xs shadow-xs transition-colors"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleDecision(l.id, "REJECTED")}
                            className="px-3 py-1.5 rounded-lg bg-[#921111] hover:bg-[#7A0E0E] text-white font-serif uppercase tracking-wider font-bold text-xs shadow-xs transition-colors"
                          >
                            Reject
                          </button>
                        </>
                      ) : (
                        <span className="text-stone-400 font-mono text-xs font-semibold">Processed</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
