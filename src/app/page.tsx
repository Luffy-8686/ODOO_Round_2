"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { formatINR } from "@/lib/formatters";
import {
  Trophy,
  Calendar,
  Users,
  ShoppingBag,
  Coffee,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  MapPin,
  Phone,
  Mail,
  Clock,
  ChevronRight,
  ShieldCheck,
  Star,
} from "lucide-react";

const DEFAULT_PLANS = [
  {
    id: "plan-gold",
    tier: "GOLD",
    name: "Gold All-Access Tier",
    monthlyFeePaise: 500000,
    annualFeePaise: 5000000,
    courtRatePerHourPaise: 0,
    shopDiscountPercent: 15,
    barDiscountPercent: 20,
    maxBookingsPerDay: 2,
    advanceBookingDays: 14,
    description: "Unlimited complimentary court access, premium lounge privileges, priority booking.",
    featuresJson: JSON.stringify([
      "100% Free Court Access (All Sports)",
      "14-Day Advance Booking Window",
      "20% Discount on Bar & Cafeteria",
      "15% Discount at Pro Shop",
      "Complimentary Guest Passes (2/month)",
      "Dedicated Locker & Towel Service",
    ]),
  },
  {
    id: "plan-silver",
    tier: "SILVER",
    name: "Silver Standard Tier",
    monthlyFeePaise: 250000,
    annualFeePaise: 2500000,
    courtRatePerHourPaise: 40000,
    shopDiscountPercent: 10,
    barDiscountPercent: 10,
    maxBookingsPerDay: 2,
    advanceBookingDays: 7,
    description: "Discounted court rates, full facility access, 7-day advance booking window.",
    featuresJson: JSON.stringify([
      "50% Off Court Bookings",
      "7-Day Advance Booking Window",
      "10% Discount on Bar & Cafeteria",
      "10% Discount at Pro Shop",
      "Club Tournaments Entry Access",
    ]),
  },
  {
    id: "plan-junior",
    tier: "JUNIOR",
    name: "Junior Academy Tier (Under 18)",
    monthlyFeePaise: 150000,
    annualFeePaise: 1500000,
    courtRatePerHourPaise: 30000,
    shopDiscountPercent: 10,
    barDiscountPercent: 15,
    maxBookingsPerDay: 2,
    advanceBookingDays: 7,
    description: "Exclusive subsidized tier for budding athletes under 18 years.",
    featuresJson: JSON.stringify([
      "60% Off Off-Peak Court Bookings",
      "Academy Coaching Discounts",
      "15% Discount on Healthy Juices & Snacks",
      "Junior League Entry",
    ]),
  },
];

export default function PublicHomePage() {
  const [courts, setCourts] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>(DEFAULT_PLANS);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Trial Modal State
  const [showTrialModal, setShowTrialModal] = useState(false);
  const [trialName, setTrialName] = useState("");
  const [trialPhone, setTrialPhone] = useState("");
  const [trialEmail, setTrialEmail] = useState("");
  const [trialSport, setTrialSport] = useState("Padel");
  const [trialDate, setTrialDate] = useState(new Date().toISOString().split("T")[0]);
  const [trialSuccess, setTrialSuccess] = useState(false);

  // Quote Modal State
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [quoteName, setQuoteName] = useState("");
  const [quotePhone, setQuotePhone] = useState("");
  const [quoteCompany, setQuoteCompany] = useState("");
  const [quoteRequirements, setQuoteRequirements] = useState("");
  const [quoteSuccess, setQuoteSuccess] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [courtsRes, settingsRes, shopRes] = await Promise.all([
          fetch("/api/courts?date=" + new Date().toISOString().split("T")[0]),
          fetch("/api/settings"),
          fetch("/api/shop/products"),
        ]);
        const courtsData = await courtsRes.json();
        const settingsData = await settingsRes.json();
        const shopData = await shopRes.json();

        if (courtsData.courts) setCourts(courtsData.courts);
        if (settingsData.plans) setPlans(settingsData.plans);
        if (shopData.products) setProducts(shopData.products.slice(0, 4));
      } catch (e) {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleBookTrial = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/crm/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trialName,
          phone: trialPhone,
          email: trialEmail,
          source: "WEBSITE",
          sportInterest: trialSport,
          status: "TRIAL_BOOKED",
          notes: `Trial Session requested for ${trialDate} (${trialSport})`,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setTrialSuccess(true);
      }
    } catch (e: any) {
      alert("Error: " + e.message);
    }
  };

  const handleRequestQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/crm/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: quoteName,
          phone: quotePhone,
          email: quoteCompany ? `${quoteCompany.toLowerCase().replace(/\s+/g, "")}@corp.in` : "",
          source: "WEBSITE",
          sportInterest: "Corporate Event / Group",
          status: "NEW",
          notes: `Corporate Quote Request: ${quoteCompany}. Requirements: ${quoteRequirements}`,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setQuoteSuccess(true);
      }
    } catch (e: any) {
      alert("Error: " + e.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-b from-emerald-950 via-slate-900 to-slate-950 text-white py-20 px-4 sm:px-6 lg:px-8 border-b border-slate-800">
        <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:24px_24px] opacity-15" />
        <div className="max-w-7xl mx-auto relative z-10 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            Bangalore's Premier Racquet & Sports Club
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-tight">
            Elevate Your Game at <br />
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-300 bg-clip-text text-transparent">
              The Champions Club
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto font-normal">
            International clay tennis courts, panoramic padel, BWF indoor badminton, cricket turf nets, premium pro gear shop, and an artisanal recovery bar.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Link
              href="/login?tab=signup"
              className="px-6 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Create Free Account / Sign Up</span>
            </Link>
            <button
              onClick={() => {
                setShowTrialModal(true);
                setTrialSuccess(false);
              }}
              className="px-6 py-3.5 rounded-xl bg-slate-800/90 hover:bg-slate-800 border border-slate-700 text-white font-semibold text-sm transition-all"
            >
              Book a Complimentary Trial
            </button>
            <a
              href="#plans"
              className="px-6 py-3.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/40 text-amber-300 font-semibold text-sm transition-all"
            >
              Explore Membership Tiers
            </a>
          </div>

          {/* Quick stats banner */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto pt-10 border-t border-slate-800/80 text-left">
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="text-2xl font-bold text-white">6 Pro Courts</div>
              <div className="text-xs text-slate-400 mt-0.5">Tennis, Padel, Badminton, Cricket</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="text-2xl font-bold text-emerald-400">6 AM – 11 PM</div>
              <div className="text-xs text-slate-400 mt-0.5">Daily Floodlit Sessions</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="text-2xl font-bold text-amber-400">Gold & Silver</div>
              <div className="text-xs text-slate-400 mt-0.5">Free & 50% Off Court Access</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="text-2xl font-bold text-purple-400">Pro Shop & Bar</div>
              <div className="text-xs text-slate-400 mt-0.5">Member Discounts & Tabs</div>
            </div>
          </div>
        </div>
      </section>

      {/* FACILITIES & COURTS */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center space-y-2 mb-12">
          <h2 className="text-xs uppercase font-bold text-emerald-600 dark:text-emerald-400 tracking-wider">
            World-Class Infrastructure
          </h2>
          <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white">Our Bookable Courts</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-lg mx-auto">
            Maintained to professional championship standards with cushioned surfaces and low-glare LED floodlights.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {courts.map((court) => (
            <div
              key={court.id}
              className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-2xl">{court.sport?.icon || "🎾"}</span>
                  <span
                    className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                      court.status === "ACTIVE"
                        ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300"
                        : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    {court.status}
                  </span>
                </div>
                <h4 className="text-lg font-bold text-slate-900 dark:text-white mt-4">{court.name}</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {court.surfaceType} Surface • {court.isIndoor ? "Indoor Air-Cooled" : "Outdoor Floodlit"}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 block">Walk-in Rate</span>
                  <span className="text-base font-extrabold text-slate-900 dark:text-white">
                    {formatINR(court.hourlyRatePaise)}
                    <span className="text-xs font-normal text-slate-500"> / hr</span>
                  </span>
                </div>
                <button
                  onClick={() => {
                    setTrialSport(court.sport?.name || "Tennis");
                    setShowTrialModal(true);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs font-bold transition-colors"
                >
                  Book Slot
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* MEMBERSHIP PLANS (LIVE PRICING TABLE) */}
      <section id="plans" className="py-16 px-4 sm:px-6 lg:px-8 bg-slate-100 dark:bg-slate-900/60 border-y border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-2 mb-12">
            <h2 className="text-xs uppercase font-bold text-amber-600 dark:text-amber-400 tracking-wider">
              Membership Tiers
            </h2>
            <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white">Choose Your Level of Access</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-lg mx-auto">
              Transparent INR pricing with zero hidden maintenance surcharges. Upgrade or pause anytime.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
            {plans.map((plan) => {
              const features = JSON.parse(plan.featuresJson || "[]");
              const isGold = plan.tier === "GOLD";
              const isJunior = plan.tier === "JUNIOR";

              return (
                <div
                  key={plan.id}
                  className={`p-8 rounded-2xl flex flex-col justify-between transition-all relative ${
                    isGold
                      ? "bg-slate-900 text-white border-2 border-amber-400 shadow-xl shadow-amber-500/10 md:-translate-y-2"
                      : "bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 shadow-sm"
                  }`}
                >
                  {isGold && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 text-[10px] font-black uppercase px-3 py-1 rounded-full tracking-wider shadow-md">
                      Most Popular • All-Access
                    </div>
                  )}

                  <div>
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase font-mono ${
                          isGold
                            ? "bg-amber-400/20 text-amber-300"
                            : isJunior
                            ? "bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        {plan.tier} TIER
                      </span>
                    </div>

                    <h4 className="text-2xl font-bold mt-4">{plan.name}</h4>
                    <p className={`text-xs mt-1 ${isGold ? "text-slate-300" : "text-slate-500 dark:text-slate-400"}`}>
                      {plan.description}
                    </p>

                    <div className="mt-6 mb-6">
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-extrabold">{formatINR(plan.monthlyFeePaise)}</span>
                        <span className={`text-xs ${isGold ? "text-slate-400" : "text-slate-500"}`}> / month</span>
                      </div>
                      <span className={`text-[11px] block mt-0.5 ${isGold ? "text-amber-300" : "text-emerald-600 dark:text-emerald-400"} font-medium`}>
                        or {formatINR(plan.annualFeePaise)} / year (Save 17%)
                      </span>
                    </div>

                    <ul className="space-y-3 text-xs">
                      {features.map((f: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2">
                          <CheckCircle2
                            className={`w-4 h-4 shrink-0 mt-0.5 ${isGold ? "text-amber-400" : "text-emerald-500"}`}
                          />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800">
                    <Link
                      href={`/login?tab=signup&tier=${plan.tier}`}
                      className={`w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        isGold
                          ? "bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-md shadow-amber-400/20"
                          : "bg-emerald-600 hover:bg-emerald-500 text-white"
                      }`}
                    >
                      <span>Join as {plan.tier} Member</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* PRO SHOP & GEAR PREVIEW */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-10">
          <div>
            <h2 className="text-xs uppercase font-bold text-purple-600 dark:text-purple-400 tracking-wider">
              Champions Pro Gear Shop
            </h2>
            <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white">Authorised Equipment & Apparel</h3>
          </div>
          <Link
            href="/portal"
            className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
          >
            Browse Full Catalog & Click & Collect <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((p) => (
            <div
              key={p.id}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between"
            >
              <div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                  {p.brand} • {p.category}
                </span>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white mt-2 line-clamp-2">{p.name}</h4>
                <span className="text-xs text-slate-500 dark:text-slate-400 block mt-1">SKU: {p.sku}</span>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white">{formatINR(p.pricePaise)}</span>
                  <span className="text-[10px] text-emerald-600 block">Up to 15% Member Discount</span>
                </div>
                <Link
                  href="/portal"
                  className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-purple-600 hover:text-white transition-colors"
                >
                  <ShoppingBag className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-900 text-slate-400 text-xs py-12 px-4 sm:px-6 lg:px-8 border-t border-slate-800">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 text-white font-bold text-base mb-3">
              <Trophy className="w-5 h-5 text-emerald-500" />
              The Champions Club
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              Unified Sports Operations, High-Performance Racquet Sports, Gear Shop & Lounge.
            </p>
          </div>
          <div>
            <h5 className="font-bold text-white uppercase text-[11px] mb-3">Operating Hours</h5>
            <ul className="space-y-1.5">
              <li>Monday – Sunday: 6:00 AM – 11:00 PM</li>
              <li>Pro Shop: 7:00 AM – 10:00 PM</li>
              <li>Bar & Cafeteria: 6:30 AM – 10:30 PM</li>
            </ul>
          </div>
          <div>
            <h5 className="font-bold text-white uppercase text-[11px] mb-3">Contact Desk</h5>
            <ul className="space-y-1.5">
              <li className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                Plot 42, Sport City Blvd, Bangalore
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-emerald-500" />
                +91 80 2345 6789
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-emerald-500" />
                info@championsclub.in
              </li>
            </ul>
          </div>
          <div>
            <h5 className="font-bold text-white uppercase text-[11px] mb-3">Member & Staff Portals</h5>
            <div className="space-y-2">
              <Link
                href="/app/dashboard"
                className="block px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium transition-colors"
              >
                Staff Operations Portal →
              </Link>
              <Link
                href="/portal"
                className="block px-3 py-2 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 font-medium transition-colors"
              >
                Member Self-Service Portal →
              </Link>
            </div>
          </div>
        </div>
      </footer>

      {/* COMPLIMENTARY TRIAL MODAL */}
      {showTrialModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Book a Complimentary Trial Session</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Experience the courts and club amenities for 60 minutes free of charge.
            </p>

            {trialSuccess ? (
              <div className="my-6 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 text-xs space-y-2">
                <div className="font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Trial Booking Confirmed!
                </div>
                <p>
                  We have reserved your slot and assigned a club host. Our front desk will WhatsApp your access pass.
                </p>
                <button
                  onClick={() => setShowTrialModal(false)}
                  className="w-full mt-3 py-2 rounded-lg bg-emerald-600 text-white font-bold"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleBookTrial} className="space-y-3 mt-4 text-xs">
                <div>
                  <label className="font-semibold block mb-1">Your Full Name</label>
                  <input
                    required
                    type="text"
                    value={trialName}
                    onChange={(e) => setTrialName(e.target.value)}
                    placeholder="e.g. Siddharth Rao"
                    className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold block mb-1">WhatsApp / Phone</label>
                    <input
                      required
                      type="tel"
                      value={trialPhone}
                      onChange={(e) => setTrialPhone(e.target.value)}
                      placeholder="+91 98765 00000"
                      className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800"
                    />
                  </div>
                  <div>
                    <label className="font-semibold block mb-1">Email</label>
                    <input
                      required
                      type="email"
                      value={trialEmail}
                      onChange={(e) => setTrialEmail(e.target.value)}
                      placeholder="siddharth@example.com"
                      className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold block mb-1">Sport Interest</label>
                    <select
                      value={trialSport}
                      onChange={(e) => setTrialSport(e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800"
                    >
                      <option value="Padel">Padel 🏸</option>
                      <option value="Tennis">Tennis 🎾</option>
                      <option value="Badminton">Badminton 🏸</option>
                      <option value="Cricket">Cricket Nets 🏏</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-semibold block mb-1">Preferred Date</label>
                    <input
                      type="date"
                      value={trialDate}
                      onChange={(e) => setTrialDate(e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowTrialModal(false)}
                    className="flex-1 py-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                  >
                    Confirm Trial
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* CORPORATE QUOTE REQUEST MODAL */}
      {showQuoteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Corporate & Event Quote Request</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Custom packages for corporate tournaments, team offsites, and group memberships.
            </p>

            {quoteSuccess ? (
              <div className="my-6 p-4 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-200 text-xs space-y-2">
                <div className="font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-amber-600" />
                  Quote Request Received!
                </div>
                <p>Our Corporate Sales Manager will generate a customized PDF proposal and contact you within 4 hours.</p>
                <button
                  onClick={() => setShowQuoteModal(false)}
                  className="w-full mt-3 py-2 rounded-lg bg-amber-600 text-white font-bold"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleRequestQuote} className="space-y-3 mt-4 text-xs">
                <div>
                  <label className="font-semibold block mb-1">Company / Organization</label>
                  <input
                    required
                    type="text"
                    value={quoteCompany}
                    onChange={(e) => setQuoteCompany(e.target.value)}
                    placeholder="e.g. Infosys Technologies"
                    className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold block mb-1">Contact Person</label>
                    <input
                      required
                      type="text"
                      value={quoteName}
                      onChange={(e) => setQuoteName(e.target.value)}
                      placeholder="Name"
                      className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800"
                    />
                  </div>
                  <div>
                    <label className="font-semibold block mb-1">Phone</label>
                    <input
                      required
                      type="tel"
                      value={quotePhone}
                      onChange={(e) => setQuotePhone(e.target.value)}
                      placeholder="+91 98000 00000"
                      className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800"
                    />
                  </div>
                </div>
                <div>
                  <label className="font-semibold block mb-1">Estimated Players & Requirements</label>
                  <textarea
                    rows={3}
                    value={quoteRequirements}
                    onChange={(e) => setQuoteRequirements(e.target.value)}
                    placeholder="e.g. 25 players, weekend tournament with catering & coach coordination"
                    className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800"
                  />
                </div>

                <div className="flex gap-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowQuoteModal(false)}
                    className="flex-1 py-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold"
                  >
                    Submit Request
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
