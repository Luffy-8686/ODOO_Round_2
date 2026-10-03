"use client";

import React, { useState, useEffect } from "react";
import { formatDateTime } from "@/lib/formatters";
import { Activity, ShieldCheck, RefreshCw } from "lucide-react";

export default function OwnerAuditPage() {
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/audit");
      const data = await res.json();
      if (data.auditLogs) setAuditLogs(data.auditLogs);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#E5DFD5] dark:border-[#223042]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-serif text-2xl font-bold text-[#0B1320] dark:text-[#FAF8F5] tracking-tight">
              Immutable System Mutation Audit Trail
            </h1>
            <span className="text-[10px] font-mono tracking-widest uppercase px-2.5 py-1 rounded bg-[#921111]/10 text-[#921111] dark:text-[#e05252] border border-[#921111]/25 font-bold">
              COMPLIANCE LOG
            </span>
          </div>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 font-sans">
            Full compliance record of who changed what, when, before/after entity states, and security events.
          </p>
        </div>

        <button
          onClick={fetchLogs}
          className="p-2 rounded-xl border border-[#E5DFD5] dark:border-[#223042] bg-[#FAF8F5] dark:bg-[#162232] hover:bg-[#E5DFD5] dark:hover:bg-[#223042] text-stone-600 dark:text-stone-300 transition-colors"
          title="Refresh Log"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="p-6 rounded-xl bg-white dark:bg-[#0F1923] border border-[#E5DFD5] dark:border-[#223042] shadow-xs space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#FAF8F5] dark:bg-[#162232] text-stone-500 font-mono text-[10px] uppercase tracking-wider border-b border-[#E5DFD5] dark:border-[#223042]">
              <tr>
                <th className="p-3.5">Timestamp</th>
                <th className="p-3.5">User & Role</th>
                <th className="p-3.5">Action</th>
                <th className="p-3.5">Entity</th>
                <th className="p-3.5">Target ID</th>
                <th className="p-3.5">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5DFD5] dark:divide-[#223042] font-mono text-[11px]">
              {auditLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-stone-400 italic">
                    No mutation records found.
                  </td>
                </tr>
              ) : (
                auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#FAF8F5] dark:hover:bg-[#162232]/50 transition-colors">
                    <td className="p-3.5 text-stone-500">{formatDateTime(log.createdAt)}</td>
                    <td className="p-3.5 font-sans font-bold text-[#0B1320] dark:text-[#FAF8F5]">
                      {log.userName} <span className="text-stone-400 font-normal">({log.userRole})</span>
                    </td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded font-mono font-bold uppercase text-[9px] bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        {log.action}
                      </span>
                    </td>
                    <td className="p-3.5 font-bold text-stone-800 dark:text-stone-200">{log.entity}</td>
                    <td className="p-3.5 text-stone-400">{log.entityId}</td>
                    <td className="p-3.5 text-stone-500 max-w-xs truncate">{log.detailsJson || "—"}</td>
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
