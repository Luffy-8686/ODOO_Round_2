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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#E5DFD5] dark:border-[#223042]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-serif text-2xl font-bold text-[#0B1320] dark:text-[#FAF8F5] tracking-tight">
              Membership Plans & Tier Privileges
            </h1>
            <span className="text-[10px] font-mono tracking-widest uppercase px-2.5 py-1 rounded bg-[#921111]/10 text-[#921111] dark:text-[#e05252] border border-[#921111]/25 font-bold">
              GOVERNANCE CONFIG
            </span>
          </div>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 font-sans">
            Configure tier subscription fees, court privileges, pro shop discounts, and dining & bar privileges.
          </p>
        </div>
      </div>

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
    </div>
  );
}
