"use client";

import React, { useState, useEffect } from "react";
import { formatINR, formatDateTime } from "@/lib/formatters";
import { CreditCard, CheckCircle2, User, RefreshCw, Printer } from "lucide-react";

export default function FrontDeskTabsPage() {
  const [tabs, setTabs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTabs = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/bar/tabs");
      const data = await res.json();
      if (data.tabs) setTabs(data.tabs);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTabs();
  }, []);

  const handleSettle = async (tabId: string) => {
    if (!confirm("Settle and close this member tab via UPI/Card?")) return;

    try {
      const res = await fetch("/api/bar/tabs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "SETTLE_TAB",
          tabId,
          paymentMethod: "UPI",
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert("Tab settled successfully!");
        fetchTabs();
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
              Member Tabs & Invoices
            </h1>
            <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold">
              💳 BILLING DESK
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Active member running tabs across cafe, bar, and pro shop rentals.
          </p>
        </div>

        <button
          onClick={fetchTabs}
          className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 text-slate-500"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 font-semibold border-b">
              <tr>
                <th className="p-3">Tab Name & Member</th>
                <th className="p-3">Opened At</th>
                <th className="p-3">Table / Source</th>
                <th className="p-3">Running Balance (₹)</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {tabs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    No open member tabs currently.
                  </td>
                </tr>
              ) : (
                tabs.map((tab) => (
                  <tr key={tab.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="p-3">
                      <div className="font-bold text-slate-900 dark:text-white">{tab.tabName}</div>
                      <div className="text-[10px] text-slate-400">
                        {tab.member ? `${tab.member.name} (${tab.member.memberId})` : "Guest"}
                      </div>
                    </td>
                    <td className="p-3 text-slate-500">{formatDateTime(tab.openedAt)}</td>
                    <td className="p-3 font-semibold">{tab.table?.tableNumber || "Direct Bar"}</td>
                    <td className="p-3 font-black text-emerald-600 text-sm">{formatINR(tab.totalAmountPaise)}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                          tab.status === "OPEN"
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                            : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                        }`}
                      >
                        {tab.status}
                      </span>
                    </td>
                    <td className="p-3 text-right space-x-2">
                      {tab.status === "OPEN" && (
                        <button
                          onClick={() => handleSettle(tab.id)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                        >
                          Settle Bill
                        </button>
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
