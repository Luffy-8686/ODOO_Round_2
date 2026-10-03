"use client";

import React, { useState, useEffect } from "react";
import { formatINR } from "@/lib/formatters";
import { Award, CheckCircle2, ShieldCheck, Sparkles } from "lucide-react";

export default function OwnerPlansPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.plans) setPlans(data.plans);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Membership Plans & Pricing Rates
            </h1>
            <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-bold">
              👑 OWNER CONFIG
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Configure tier subscription fees, court privileges, pro shop discounts, and F&B discounts.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 text-xs"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-slate-900 dark:text-white">{plan.name}</span>
              <span className="font-mono font-bold px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 uppercase text-[10px]">
                {plan.tier}
              </span>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
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
    </div>
  );
}
