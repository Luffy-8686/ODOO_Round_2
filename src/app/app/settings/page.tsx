"use client";

import React, { useState, useEffect } from "react";
import { formatDateTime, formatINR } from "@/lib/formatters";
import { useAuth } from "@/lib/auth-context";
import {
  Settings,
  Bell,
  History,
  Shield,
  Clock,
  Layers,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from "lucide-react";

export default function SettingsAdminPage() {
  const { currentUser } = useAuth();
  const [plans, setPlans] = useState<any[]>([]);
  const [sports, setSports] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"PLANS" | "AUDIT" | "NOTIFICATIONS">("PLANS");
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [setRes, audRes, notRes] = await Promise.all([
        fetch("/api/settings"),
        fetch("/api/audit"),
        fetch("/api/notifications"),
      ]);
      const setData = await setRes.json();
      const audData = await audRes.json();
      const notData = await notRes.json();

      if (setData.plans) setPlans(setData.plans);
      if (setData.sports) setSports(setData.sports);
      if (audData.auditLogs) setAuditLogs(audData.auditLogs);
      if (notData.notifications) setNotifications(notData.notifications);
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#E5DFD5] dark:border-[#223042]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-serif text-2xl font-bold text-[#0B1320] dark:text-[#FAF8F5] tracking-tight">
              Platform Administration & Governance
            </h1>
            <span className="text-[10px] font-mono tracking-widest uppercase px-2.5 py-1 rounded bg-[#C5A059]/15 text-[#8C6D2D] dark:text-[#C5A059] border border-[#C5A059]/30 font-bold">
              ROLE: {currentUser?.role || "ADMIN"}
            </span>
          </div>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 font-sans">
            Membership privilege tiers, court rates, multi-channel notification dispatcher, and immutable audit logs.
          </p>
        </div>

        <div className="flex bg-[#FAF8F5] dark:bg-[#162232] border border-[#E5DFD5] dark:border-[#223042] p-1 rounded-xl text-xs w-fit">
          <button
            onClick={() => setActiveTab("PLANS")}
            className={`px-3.5 py-1.5 rounded-lg font-serif uppercase tracking-wider text-[11px] transition-all ${
              activeTab === "PLANS"
                ? "bg-white dark:bg-[#0B1320] text-[#0B1320] dark:text-[#FAF8F5] shadow-xs font-bold border border-[#E5DFD5] dark:border-[#223042]"
                : "text-stone-500 hover:text-stone-800 dark:hover:text-stone-300"
            }`}
          >
            Tier Privileges
          </button>
          <button
            onClick={() => setActiveTab("AUDIT")}
            className={`px-3.5 py-1.5 rounded-lg font-serif uppercase tracking-wider text-[11px] transition-all ${
              activeTab === "AUDIT"
                ? "bg-white dark:bg-[#0B1320] text-[#0B1320] dark:text-[#FAF8F5] shadow-xs font-bold border border-[#E5DFD5] dark:border-[#223042]"
                : "text-stone-500 hover:text-stone-800 dark:hover:text-stone-300"
            }`}
          >
            Audit Trail ({auditLogs.length})
          </button>
          <button
            onClick={() => setActiveTab("NOTIFICATIONS")}
            className={`px-3.5 py-1.5 rounded-lg font-serif uppercase tracking-wider text-[11px] transition-all ${
              activeTab === "NOTIFICATIONS"
                ? "bg-white dark:bg-[#0B1320] text-[#0B1320] dark:text-[#FAF8F5] shadow-xs font-bold border border-[#E5DFD5] dark:border-[#223042]"
                : "text-stone-500 hover:text-stone-800 dark:hover:text-stone-300"
            }`}
          >
            Notification Logs ({notifications.length})
          </button>
        </div>
      </div>

      {/* 1. PLAN CONFIGURATION TAB */}
      {activeTab === "PLANS" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className="p-6 rounded-xl bg-white dark:bg-[#0F1923] border border-[#E5DFD5] dark:border-[#223042] shadow-xs space-y-4 text-xs hover:border-[#C5A059] transition-all"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#E5DFD5] dark:border-[#223042]">
                <span className="font-serif font-bold text-base text-[#0B1320] dark:text-[#FAF8F5]">{plan.name}</span>
                <span className="font-mono font-bold px-2.5 py-0.5 rounded bg-[#C5A059]/15 text-[#8C6D2D] dark:text-[#C5A059] border border-[#C5A059]/30 uppercase text-[10px] tracking-wider">
                  {plan.tier}
                </span>
              </div>

              <div className="space-y-2.5 pt-1">
                <div className="flex justify-between">
                  <span className="text-stone-400 font-serif uppercase tracking-wider text-[10px]">Monthly Subscription:</span>
                  <span className="font-mono font-bold text-[#0B1320] dark:text-[#FAF8F5]">{formatINR(plan.monthlyFeePaise)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-400 font-serif uppercase tracking-wider text-[10px]">Annual Subscription:</span>
                  <span className="font-mono font-bold text-[#0B1320] dark:text-[#FAF8F5]">{formatINR(plan.annualFeePaise)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-400 font-serif uppercase tracking-wider text-[10px]">Court Hourly Rate:</span>
                  <span className="font-mono font-bold text-[#921111] dark:text-[#C5A059]">
                    {plan.courtRatePerHourPaise === 0 ? "Complimentary (100% Off)" : formatINR(plan.courtRatePerHourPaise)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-400 font-serif uppercase tracking-wider text-[10px]">Pro Shop Privilege:</span>
                  <span className="font-mono font-bold text-[#0B1320] dark:text-[#FAF8F5]">{plan.shopDiscountPercent}% Off</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-400 font-serif uppercase tracking-wider text-[10px]">Dining & Bar Privilege:</span>
                  <span className="font-mono font-bold text-[#0B1320] dark:text-[#FAF8F5]">{plan.barDiscountPercent}% Off</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-400 font-serif uppercase tracking-wider text-[10px]">Max Bookings / Day:</span>
                  <span className="font-mono font-bold text-[#0B1320] dark:text-[#FAF8F5]">{plan.maxBookingsPerDay} Bookings</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-400 font-serif uppercase tracking-wider text-[10px]">Advance Window:</span>
                  <span className="font-mono font-bold text-[#0B1320] dark:text-[#FAF8F5]">{plan.advanceBookingDays} Days</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 2. AUDIT LOG VIEWER */}
      {activeTab === "AUDIT" && (
        <div className="p-6 rounded-xl bg-white dark:bg-[#0F1923] border border-[#E5DFD5] dark:border-[#223042] shadow-xs space-y-4">
          <h3 className="font-serif text-base font-bold text-[#0B1320] dark:text-[#FAF8F5]">
            Immutable System Mutation Audit Log
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#FAF8F5] dark:bg-[#162232] text-stone-500 font-mono text-[10px] uppercase tracking-wider border-b border-[#E5DFD5] dark:border-[#223042]">
                <tr>
                  <th className="p-3.5">Timestamp</th>
                  <th className="p-3.5">User & Role</th>
                  <th className="p-3.5">Action</th>
                  <th className="p-3.5">Entity</th>
                  <th className="p-3.5">Target ID</th>
                  <th className="p-3.5">Details (JSON)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5DFD5] dark:divide-[#223042] font-mono text-[11px]">
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-stone-400 italic">
                      No audit log entries recorded.
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
      )}

      {/* 3. NOTIFICATION DISPATCH LOGS */}
      {activeTab === "NOTIFICATIONS" && (
        <div className="p-6 rounded-xl bg-white dark:bg-[#0F1923] border border-[#E5DFD5] dark:border-[#223042] shadow-xs space-y-4">
          <h3 className="font-serif text-base font-bold text-[#0B1320] dark:text-[#FAF8F5]">
            Multi-Channel Notification Dispatcher
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#FAF8F5] dark:bg-[#162232] text-stone-500 font-mono text-[10px] uppercase tracking-wider border-b border-[#E5DFD5] dark:border-[#223042]">
                <tr>
                  <th className="p-3.5">Time</th>
                  <th className="p-3.5">Channel</th>
                  <th className="p-3.5">Event Type</th>
                  <th className="p-3.5">Title & Message</th>
                  <th className="p-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5DFD5] dark:divide-[#223042] text-xs">
                {notifications.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-stone-400 font-mono italic">
                      No notifications dispatched.
                    </td>
                  </tr>
                ) : (
                  notifications.map((n) => (
                    <tr key={n.id} className="hover:bg-[#FAF8F5] dark:hover:bg-[#162232]/50 transition-colors">
                      <td className="p-3.5 text-stone-500 font-mono text-[11px]">{formatDateTime(n.createdAt)}</td>
                      <td className="p-3.5">
                        <span className="px-2.5 py-1 rounded font-mono font-bold uppercase text-[10px] tracking-wider bg-[#C5A059]/15 text-[#8C6D2D] dark:text-[#C5A059] border border-[#C5A059]/30">
                          {n.channel}
                        </span>
                      </td>
                      <td className="p-3.5 font-bold font-serif text-[#0B1320] dark:text-[#FAF8F5]">{n.type}</td>
                      <td className="p-3.5">
                        <div className="font-semibold text-[#0B1320] dark:text-[#FAF8F5]">{n.title}</div>
                        <div className="text-stone-500 text-[11px] mt-0.5">{n.message}</div>
                      </td>
                      <td className="p-3.5 font-mono font-bold text-emerald-600">{n.status}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
