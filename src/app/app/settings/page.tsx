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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Platform Administration & Audit
            </h1>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold">
              ROLE: {currentUser?.role || "AUTHENTICATED"}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Plan pricing rules, sports registry, multi-channel notification log, and immutable audit logs.
          </p>
        </div>

        <div className="flex bg-slate-200 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setActiveTab("PLANS")}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === "PLANS" ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold" : "text-slate-600"
            }`}
          >
            Plan Configuration
          </button>
          <button
            onClick={() => setActiveTab("AUDIT")}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === "AUDIT" ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold" : "text-slate-600"
            }`}
          >
            Audit Log ({auditLogs.length})
          </button>
          <button
            onClick={() => setActiveTab("NOTIFICATIONS")}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === "NOTIFICATIONS" ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold" : "text-slate-600"
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
              className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 text-xs"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-slate-900 dark:text-white">{plan.name}</span>
                <span className="font-mono font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 uppercase text-[10px]">
                  {plan.tier}
                </span>
              </div>

              <div className="space-y-2 pt-2 border-t">
                <div className="flex justify-between">
                  <span className="text-slate-400">Monthly Fee:</span>
                  <span className="font-bold">{formatINR(plan.monthlyFeePaise)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Annual Fee:</span>
                  <span className="font-bold">{formatINR(plan.annualFeePaise)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Court Hourly Rate:</span>
                  <span className="font-bold text-emerald-600">
                    {plan.courtRatePerHourPaise === 0 ? "FREE (100% Off)" : formatINR(plan.courtRatePerHourPaise)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Shop Discount:</span>
                  <span className="font-bold">{plan.shopDiscountPercent}% Off</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Bar & Food Discount:</span>
                  <span className="font-bold">{plan.barDiscountPercent}% Off</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Max Bookings / Day:</span>
                  <span className="font-bold">{plan.maxBookingsPerDay} Bookings</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Advance Booking Window:</span>
                  <span className="font-bold">{plan.advanceBookingDays} Days</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 2. AUDIT LOG VIEWER */}
      {activeTab === "AUDIT" && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Immutable System Mutation Audit Log</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 font-semibold border-b">
                <tr>
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">User & Role</th>
                  <th className="p-3">Action</th>
                  <th className="p-3">Entity</th>
                  <th className="p-3">Target ID</th>
                  <th className="p-3">Details (JSON)</th>
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
                      <span className="px-2 py-0.5 rounded font-bold uppercase text-[9px] bg-emerald-50 text-emerald-700">
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
      )}

      {/* 3. NOTIFICATION DISPATCH LOGS */}
      {activeTab === "NOTIFICATIONS" && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Pluggable Multi-Channel Notification Dispatcher</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 font-semibold border-b">
                <tr>
                  <th className="p-3">Time</th>
                  <th className="p-3">Channel</th>
                  <th className="p-3">Event Type</th>
                  <th className="p-3">Title & Message</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {notifications.map((n) => (
                  <tr key={n.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="p-3 text-slate-500">{formatDateTime(n.createdAt)}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded font-mono font-bold uppercase text-[10px] bg-purple-100 text-purple-800">
                        {n.channel}
                      </span>
                    </td>
                    <td className="p-3 font-bold text-slate-800 dark:text-slate-200">{n.type}</td>
                    <td className="p-3">
                      <div className="font-semibold text-slate-900 dark:text-white">{n.title}</div>
                      <div className="text-slate-500 text-[11px]">{n.message}</div>
                    </td>
                    <td className="p-3 font-bold text-emerald-600">{n.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
