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
    <div className="space-y-6 max-w-7xl mx-auto font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-[#E5DFD5] dark:border-[#222D3E]">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="text-[10px] uppercase tracking-[0.25em] font-bold text-[#8C6D23] dark:text-[#DFCA9B]">
              Club Billing & Accounts
            </span>
            <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-[#C5A059]/15 text-[#8C6D23] dark:text-[#DFCA9B] border border-[#C5A059]/30 font-bold uppercase tracking-wider">
              Desk Register
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-[#0B1320] dark:text-white tracking-tight mt-1">
            Member Running Tabs & Invoices
          </h1>
          <p className="text-xs text-[#5A6578] dark:text-[#8E9CAE] mt-1">
            Active club running tabs across dining lounge, court rentals, and pro shop dispatches.
          </p>
        </div>

        <button
          onClick={fetchTabs}
          className="p-2 rounded border border-[#E5DFD5] dark:border-[#222D3E] bg-white dark:bg-[#131C2E] hover:border-[#C5A059] text-[#8C6D23] dark:text-[#DFCA9B] self-start md:self-auto"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="p-6 rounded-xl bg-white dark:bg-[#0E1726] border border-[#E5DFD5] dark:border-[#222D3E] shadow-sm space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#FAF8F5] dark:bg-[#131C2E] text-[#5A6578] dark:text-[#8E9CAE] font-bold border-b border-[#E5DFD5] dark:border-[#222D3E]">
              <tr>
                <th className="p-3">Tab Account & Member</th>
                <th className="p-3">Opened At</th>
                <th className="p-3">Location / Facility</th>
                <th className="p-3">Running Balance (₹)</th>
                <th className="p-3">Account Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5DFD5]/60 dark:divide-[#222D3E]">
              {tabs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-[#8E9CAE] italic">
                    No open member accounts or active running tabs.
                  </td>
                </tr>
              ) : (
                tabs.map((tab) => (
                  <tr key={tab.id} className="hover:bg-[#FAF8F5]/80 dark:hover:bg-[#131C2E]/50">
                    <td className="p-3">
                      <div className="font-serif font-bold text-sm text-[#0B1320] dark:text-white">{tab.tabName}</div>
                      <div className="text-[10px] text-[#8E9CAE] font-mono mt-0.5">
                        {tab.member ? `${tab.member.name} (${tab.member.memberId})` : "Guest Charge"}
                      </div>
                    </td>
                    <td className="p-3 text-[#5A6578] dark:text-[#8E9CAE]">{formatDateTime(tab.openedAt)}</td>
                    <td className="p-3 font-semibold text-[#0B1320] dark:text-white">{tab.table?.tableNumber || "Direct Counter"}</td>
                    <td className="p-3 font-mono font-bold text-[#921111] dark:text-[#DFCA9B] text-sm">
                      {formatINR(tab.totalAmountPaise)}
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded font-bold text-[9px] uppercase tracking-wider border ${
                          tab.status === "OPEN"
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300 dark:border-amber-800"
                            : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800"
                        }`}
                      >
                        {tab.status}
                      </span>
                    </td>
                    <td className="p-3 text-right space-x-2">
                      {tab.status === "OPEN" && (
                        <button
                          onClick={() => handleSettle(tab.id)}
                          className="px-3 py-1.5 rounded bg-[#921111] hover:bg-[#720C0C] text-white font-bold text-xs uppercase tracking-wider shadow-sm"
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
