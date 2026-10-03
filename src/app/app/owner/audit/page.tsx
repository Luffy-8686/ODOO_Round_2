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
      <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Immutable System Mutation Audit Log
            </h1>
            <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-bold">
              👑 AUDIT LOG
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Full compliance record of who changed what, when, before/after states, and security events.
          </p>
        </div>

        <button
          onClick={fetchLogs}
          className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 font-semibold border-b">
              <tr>
                <th className="p-3">Timestamp</th>
                <th className="p-3">User & Role</th>
                <th className="p-3">Action</th>
                <th className="p-3">Entity</th>
                <th className="p-3">Target ID</th>
                <th className="p-3">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-[11px]">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="p-3 text-slate-500">{formatDateTime(log.createdAt)}</td>
                  <td className="p-3 font-sans font-bold">
                    {log.userName} ({log.userRole})
                  </td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded font-bold uppercase text-[9px] bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                      {log.action}
                    </span>
                  </td>
                  <td className="p-3 font-bold text-slate-800 dark:text-slate-200">{log.entity}</td>
                  <td className="p-3 text-slate-400">{log.entityId}</td>
                  <td className="p-3 text-slate-500 max-w-xs truncate">{log.detailsJson || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
