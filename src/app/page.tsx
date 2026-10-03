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
    <div className="min-h-screen bg-[#FAF8F5] dark:bg-[#080D14] text-[#111827] dark:text-[#F3F4F6] transition-colors">
      {/* HERO SECTION - NYAC Heritage Athletic Aesthetic */}
      <section className="relative overflow-hidden bg-[#0B1320] text-[#FAF8F5] py-24 px-4 sm:px-6 lg:px-8 border-b border-[#222D3E]">
        {/* Subtle Heritage Crest Texture */}
        <div className="absolute inset-0 bg-[radial-gradient(#C5A059_1px,transparent_1px)] [background-size:32px_32px] opacity-10 pointer-events-none" />

        <div className="max-w-6xl mx-auto relative z-10 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#162032] border border-[#C5A059]/40 text-[#DFCA9B] text-[10px] font-bold uppercase tracking-[0.25em]">
            <Sparkles className="w-3.5 h-3.5 text-[#C5A059]" />
            Bangalore's Premier Private Athletic Club
          </div>

          <h1 className="font-serif text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-white max-w-4xl mx-auto leading-[1.12]">
            Athletic Excellence & <br />
            <span className="text-[#DFCA9B] italic font-normal">
              Distinguished Camaraderie
            </span>
          </h1>

          <div className="w-16 h-0.5 bg-[#C5A059] mx-auto my-4" />

          <p className="text-sm sm:text-base text-[#D1D5DB] max-w-2xl mx-auto font-light leading-relaxed">
            Founded to inspire athletic discipline and social fellowship. Featuring championship clay tennis, panoramic padel, BWF indoor badminton, floodlit turf nets, an artisanal dining lounge, and pro gear counter.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-6">
            <Link
              href="/login?tab=signup"
              className="px-6 py-3.5 rounded-md bg-[#921111] hover:bg-[#720C0C] text-white font-bold text-xs tracking-widest uppercase shadow-md transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2"
            >
              <span>Join Free Community Tier</span>
              <ArrowRight className="w-4 h-4 text-[#C5A059]" />
            </Link>
            <button
              onClick={() => {
                setShowTrialModal(true);
                setTrialSuccess(false);
              }}
              className="px-6 py-3.5 rounded-md border border-[#C5A059] hover:bg-[#C5A059]/10 text-[#DFCA9B] font-bold text-xs tracking-widest uppercase transition-all"
            >
              Book Private Trial
            </button>
            <a
              href="#plans"
              className="px-6 py-3.5 rounded-md bg-[#162032] hover:bg-[#1F293D] border border-[#334155] text-[#E5E7EB] font-bold text-xs tracking-widest uppercase transition-all"
            >
              Membership Categories
            </a>
          </div>

          {/* Quick Stats Strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto pt-12 border-t border-[#1F293D] text-left">
            <div className="p-4 rounded-lg bg-[#0E1522] border border-[#1F293D]">
              <div className="font-serif text-2xl font-bold text-white">6 Championship Courts</div>
              <div className="text-[11px] text-[#9CA3AF] mt-0.5 tracking-wide">Tennis • Padel • Badminton • Cricket</div>
            </div>
            <div className="p-4 rounded-lg bg-[#0E1522] border border-[#1F293D]">
              <div className="font-serif text-2xl font-bold text-[#DFCA9B]">06:00 – 23:00</div>
              <div className="text-[11px] text-[#9CA3AF] mt-0.5 tracking-wide">Daily Floodlit Quarters</div>
            </div>
            <div className="p-4 rounded-lg bg-[#0E1522] border border-[#1F293D]">
              <div className="font-serif text-2xl font-bold text-[#C5A059]">Tier Privileges</div>
              <div className="text-[11px] text-[#9CA3AF] mt-0.5 tracking-wide">Gold All-Access & Standard Passes</div>
            </div>
            <div className="p-4 rounded-lg bg-[#0E1522] border border-[#1F293D]">
              <div className="font-serif text-2xl font-bold text-white">Lounge & Pro Shop</div>
              <div className="text-[11px] text-[#9CA3AF] mt-0.5 tracking-wide">Fine Dining, Member Tabs & Servicing</div>
            </div>
          </div>
        </div>
      </section>

      {/* FACILITIES & COURTS SECTION */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center space-y-2 mb-14">
          <span className="text-[10px] uppercase font-bold text-[#8C6D23] dark:text-[#DFCA9B] tracking-[0.24em] block">
            Championship Grounds
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#0B1320] dark:text-white">
            World-Class Athletic Infrastructure
          </h2>
          <div className="w-14 h-0.5 bg-[#C5A059] mx-auto my-3" />
          <p className="text-sm text-[#4B5563] dark:text-[#9CA3AF] max-w-xl mx-auto leading-relaxed">
            Maintained to international federation specifications with tournament clay surfaces, glass padel enclosures, and glare-free broadcast lighting.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {courts.map((court) => (
            <div
              key={court.id}
              className="p-6 rounded-lg bg-white dark:bg-[#0E1522] border border-[#E5DFD5] dark:border-[#222D3E] shadow-sm hover:border-[#C5A059] hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-2xl p-2 rounded bg-[#FAF8F5] dark:bg-[#162032] border border-[#E5DFD5] dark:border-[#263244]">
                    {court.sport?.icon || "🎾"}
                  </span>
                  <span
                    className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase font-mono tracking-wider border ${
                      court.status === "ACTIVE"
                        ? "bg-[#FAF7EE] text-[#8C6D23] border-[#DFCA9B] dark:bg-[#1C1608] dark:text-[#E3CEA4] dark:border-[#4B3C18]"
                        : "bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]"
                    }`}
                  >
                    {court.status}
                  </span>
                </div>
                <h3 className="font-serif text-xl font-bold text-[#0B1320] dark:text-white mt-4">{court.name}</h3>
                <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF] mt-1">
                  {court.surfaceType} Surface • {court.isIndoor ? "Indoor Climate Regulated" : "Outdoor Floodlit"}
                </p>
              </div>

              <div className="mt-8 pt-4 border-t border-[#E5DFD5] dark:border-[#222D3E] flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-[#9CA3AF] uppercase tracking-wider block font-semibold">Walk-in Tariff</span>
                  <span className="font-serif text-lg font-bold text-[#0B1320] dark:text-white">
                    {formatINR(court.hourlyRatePaise)}
                    <span className="text-xs font-normal text-[#6B7280]"> / hr</span>
                  </span>
                </div>
                <button
                  onClick={() => {
                    setTrialSport(court.sport?.name || "Tennis");
                    setShowTrialModal(true);
                  }}
                  className="px-3.5 py-1.5 rounded-md bg-[#FAF8F5] dark:bg-[#162032] hover:bg-[#921111] hover:text-white text-[#921111] dark:text-[#DFCA9B] border border-[#E5DFD5] dark:border-[#263244] hover:border-[#921111] text-xs font-bold tracking-wider uppercase transition-all"
                >
                  Reserve Slot
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* MEMBERSHIP PLANS - NYAC Tier Cards */}
      <section id="plans" className="py-20 px-4 sm:px-6 lg:px-8 bg-[#F4EFEA] dark:bg-[#0B1320] border-y border-[#E5DFD5] dark:border-[#1F293D]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-2 mb-14">
            <span className="text-[10px] uppercase font-bold text-[#8C6D23] dark:text-[#DFCA9B] tracking-[0.24em] block">
              Membership Categories
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#0B1320] dark:text-white">
              Privileges of Membership
            </h2>
            <div className="w-14 h-0.5 bg-[#C5A059] mx-auto my-3" />
            <p className="text-sm text-[#4B5563] dark:text-[#9CA3AF] max-w-xl mx-auto leading-relaxed">
              Transparent subscriptions with priority booking privileges, clubhouse hospitality allowances, and zero maintenance surcharges.
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
                  className={`p-8 rounded-lg flex flex-col justify-between transition-all relative ${
                    isGold
                      ? "bg-[#0E1522] text-[#FAF8F5] border-2 border-[#C5A059] shadow-xl md:-translate-y-2"
                      : "bg-white dark:bg-[#0E1522] text-[#111827] dark:text-white border border-[#E5DFD5] dark:border-[#222D3E] shadow-sm"
                  }`}
                >
                  {isGold && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#C5A059] text-[#0B1320] text-[9px] font-black uppercase px-3 py-0.5 rounded font-mono tracking-[0.2em] shadow-sm">
                      Distinguished All-Access
                    </div>
                  )}

                  <div>
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase font-mono tracking-wider border ${
                          isGold
                            ? "bg-[#FAF7EE]/10 text-[#DFCA9B] border-[#C5A059]/40"
                            : isJunior
                            ? "bg-[#EFF6FF] dark:bg-[#1E293B] text-[#1D4ED8] dark:text-[#93C5FD] border-[#BFDBFE] dark:border-[#3B82F6]/30"
                            : "bg-[#F3F4F6] dark:bg-[#162032] text-[#374151] dark:text-[#D1D5DB] border-[#E5E7EB] dark:border-[#263244]"
                        }`}
                      >
                        {plan.tier} TIER
                      </span>
                    </div>

                    <h3 className="font-serif text-2xl font-bold mt-4">{plan.name}</h3>
                    <p className={`text-xs mt-1 leading-relaxed ${isGold ? "text-[#9CA3AF]" : "text-[#6B7280] dark:text-[#9CA3AF]"}`}>
                      {plan.description}
                    </p>

                    <div className="mt-6 mb-6">
                      <div className="flex items-baseline gap-1">
                        <span className="font-serif text-3xl font-bold">{formatINR(plan.monthlyFeePaise)}</span>
                        <span className={`text-xs ${isGold ? "text-[#9CA3AF]" : "text-[#6B7280]"}`}> / month</span>
                      </div>
                      <span className={`text-[11px] block mt-0.5 ${isGold ? "text-[#DFCA9B]" : "text-[#8C6D23] dark:text-[#DFCA9B]"} font-medium`}>
                        or {formatINR(plan.annualFeePaise)} / annum (17% Privileged Savings)
                      </span>
                    </div>

                    <ul className="space-y-3 text-xs">
                      {features.map((f: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2.5">
                          <CheckCircle2
                            className={`w-4 h-4 shrink-0 mt-0.5 ${isGold ? "text-[#C5A059]" : "text-[#921111] dark:text-[#DFCA9B]"}`}
                          />
                          <span className="leading-snug">{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-8 pt-6 border-t border-[#E5DFD5] dark:border-[#222D3E]">
                    <Link
                      href="/login?tab=signup"
                      className={`w-full py-3 rounded-md font-bold text-xs tracking-widest uppercase flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        isGold
                          ? "bg-[#C5A059] hover:bg-[#B38E46] text-[#0B1320] shadow-sm"
                          : "bg-[#921111] hover:bg-[#720C0C] text-white shadow-sm"
                      }`}
                    >
                      <span>Apply for {plan.tier} Privilege</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* PRO SHOP & DINING LOUNGE PREVIEW */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-12">
          <div>
            <span className="text-[10px] uppercase font-bold text-[#8C6D23] dark:text-[#DFCA9B] tracking-[0.24em] block">
              Clubhouse Amenities
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#0B1320] dark:text-white">
              Official Pro Shop & Dining Quarters
            </h2>
          </div>
          <Link
            href="/portal"
            className="text-xs font-bold text-[#921111] dark:text-[#DFCA9B] hover:underline flex items-center gap-1.5 tracking-wider uppercase"
          >
            Access Member Catalog & Ordering <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((p) => (
            <div
              key={p.id}
              className="p-5 rounded-lg bg-white dark:bg-[#0E1522] border border-[#E5DFD5] dark:border-[#222D3E] shadow-sm hover:border-[#C5A059] transition-all flex flex-col justify-between"
            >
              <div>
                <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-[#FAF8F5] dark:bg-[#162032] border border-[#E5DFD5] dark:border-[#263244] text-[#8C6D23]">
                  {p.brand} • {p.category}
                </span>
                <h4 className="font-serif font-bold text-sm text-[#0B1320] dark:text-white mt-2.5 line-clamp-2">{p.name}</h4>
                <span className="text-[11px] text-[#6B7280] dark:text-[#9CA3AF] block mt-1 font-mono">SKU: {p.sku}</span>
              </div>

              <div className="mt-4 pt-3 border-t border-[#E5DFD5] dark:border-[#222D3E] flex items-center justify-between">
                <div>
                  <span className="font-serif text-sm font-bold text-[#0B1320] dark:text-white">{formatINR(p.pricePaise)}</span>
                  <span className="text-[10px] text-[#8C6D23] dark:text-[#DFCA9B] block font-medium">15% Member Allowance</span>
                </div>
                <Link
                  href="/portal"
                  className="p-2 rounded-md bg-[#FAF8F5] dark:bg-[#162032] border border-[#E5DFD5] dark:border-[#263244] text-[#4B5563] dark:text-[#D1D5DB] hover:bg-[#921111] hover:text-white transition-colors"
                >
                  <ShoppingBag className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER - Classic NYAC 4-Column Design */}
      <footer className="bg-[#0B1320] text-[#D1D5DB] text-xs py-14 px-4 sm:px-6 lg:px-8 border-t border-[#1F293D]">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10">
          <div>
            <div className="flex items-center gap-2.5 text-white font-serif font-bold text-lg mb-3">
              <div className="w-8 h-8 rounded bg-[#921111] text-[#C5A059] border border-[#C5A059]/40 flex items-center justify-center">
                <Trophy className="w-4 h-4" />
              </div>
              <span>The Champions Club</span>
            </div>
            <p className="text-[#9CA3AF] text-xs leading-relaxed font-light">
              Premier athletic club operations, high-performance racquet sports, private pro shop, and distinguished clubhouse social dining.
            </p>
            <div className="mt-4 text-[10px] uppercase tracking-[0.2em] text-[#C5A059] font-bold">
              EST. 1868 • BANGALORE
            </div>
          </div>
          <div>
            <h5 className="font-serif font-bold text-white uppercase text-xs tracking-wider mb-3.5">Operating Schedule</h5>
            <ul className="space-y-2 text-[#9CA3AF]">
              <li>Championship Courts: 06:00 – 23:00</li>
              <li>Official Pro Shop: 07:00 – 22:00</li>
              <li>Clubhouse Dining & Bar: 06:30 – 22:30</li>
              <li>Front Reception Desk: 06:00 – 22:00</li>
            </ul>
          </div>
          <div>
            <h5 className="font-serif font-bold text-white uppercase text-xs tracking-wider mb-3.5">Club Quarters</h5>
            <ul className="space-y-2 text-[#9CA3AF]">
              <li className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-[#C5A059]" />
                Plot 42, Sport City Boulevard, Bangalore
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-[#C5A059]" />
                +91 80 2345 6789
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-[#C5A059]" />
                secretary@championsclub.in
              </li>
            </ul>
          </div>
          <div>
            <h5 className="font-serif font-bold text-white uppercase text-xs tracking-wider mb-3.5">Member & Staff Access</h5>
            <div className="space-y-2.5">
              <Link
                href="/app/dashboard"
                className="block px-3.5 py-2.5 rounded-md bg-[#162032] hover:bg-[#1E293B] border border-[#263244] text-[#FAF8F5] text-xs font-semibold tracking-wide uppercase transition-colors"
              >
                Staff Operations Portal →
              </Link>
              <Link
                href="/portal"
                className="block px-3.5 py-2.5 rounded-md bg-[#921111]/80 hover:bg-[#921111] text-[#FAF8F5] text-xs font-semibold tracking-wide uppercase transition-colors"
              >
                Member Self-Service Portal →
              </Link>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto mt-12 pt-6 border-t border-[#1F293D] flex flex-col sm:flex-row items-center justify-between text-[#6B7280] text-[11px]">
          <p>© 2026 The Champions Club. All Rights Reserved. Private Athletic Club Operations.</p>
          <p className="mt-2 sm:mt-0 font-serif italic text-[#C5A059]/80">"Great things are expected of you when you wear the winged foot."</p>
        </div>
      </footer>

      {/* COMPLIMENTARY TRIAL MODAL - NYAC Design */}
      {showTrialModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0E1522] border border-[#E5DFD5] dark:border-[#222D3E] rounded-lg max-w-md w-full p-6 shadow-xl relative">
            <span className="text-[9px] font-bold uppercase tracking-[0.24em] text-[#8C6D23] dark:text-[#DFCA9B] block mb-1">
              Private Guest Invitation
            </span>
            <h3 className="font-serif text-xl font-bold text-[#0B1320] dark:text-white">Complimentary Trial Session</h3>
            <div className="w-10 h-0.5 bg-[#C5A059] my-2" />
            <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">
              Experience our championship courts and clubhouse hospitality for 60 minutes with full club host coordination.
            </p>

            {trialSuccess ? (
              <div className="my-6 p-4 rounded-md bg-[#FAF7EE] dark:bg-[#1C1608] border border-[#DFCA9B] dark:border-[#4B3C18] text-[#8C6D23] dark:text-[#E3CEA4] text-xs space-y-2">
                <div className="font-serif font-bold text-sm flex items-center gap-1.5 text-[#0B1320] dark:text-white">
                  <CheckCircle2 className="w-4 h-4 text-[#C5A059]" />
                  Trial Invitation Confirmed!
                </div>
                <p className="leading-relaxed">
                  Your provisional reservation has been logged. Our Front Desk concierge will contact you via WhatsApp with digital pass instructions.
                </p>
                <button
                  onClick={() => setShowTrialModal(false)}
                  className="w-full mt-3 py-2 rounded-md bg-[#921111] text-white font-bold tracking-widest uppercase text-xs"
                >
                  Close Confirmation
                </button>
              </div>
            ) : (
              <form onSubmit={handleBookTrial} className="space-y-3 mt-4 text-xs">
                <div>
                  <label className="font-semibold block mb-1 uppercase tracking-wider text-[10px] text-[#4B5563] dark:text-[#9CA3AF]">Your Full Name</label>
                  <input
                    required
                    type="text"
                    value={trialName}
                    onChange={(e) => setTrialName(e.target.value)}
                    placeholder="e.g. Siddharth Rao"
                    className="w-full p-2.5 rounded-md border border-[#E5DFD5] dark:border-[#222D3E] bg-[#FAF8F5] dark:bg-[#121A28] focus:border-[#C5A059] focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold block mb-1 uppercase tracking-wider text-[10px] text-[#4B5563] dark:text-[#9CA3AF]">WhatsApp / Phone</label>
                    <input
                      required
                      type="tel"
                      value={trialPhone}
                      onChange={(e) => setTrialPhone(e.target.value)}
                      placeholder="+91 98765 00000"
                      className="w-full p-2.5 rounded-md border border-[#E5DFD5] dark:border-[#222D3E] bg-[#FAF8F5] dark:bg-[#121A28] focus:border-[#C5A059] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="font-semibold block mb-1 uppercase tracking-wider text-[10px] text-[#4B5563] dark:text-[#9CA3AF]">Email Address</label>
                    <input
                      required
                      type="email"
                      value={trialEmail}
                      onChange={(e) => setTrialEmail(e.target.value)}
                      placeholder="siddharth@example.com"
                      className="w-full p-2.5 rounded-md border border-[#E5DFD5] dark:border-[#222D3E] bg-[#FAF8F5] dark:bg-[#121A28] focus:border-[#C5A059] focus:outline-none"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold block mb-1 uppercase tracking-wider text-[10px] text-[#4B5563] dark:text-[#9CA3AF]">Sport Discipline</label>
                    <select
                      value={trialSport}
                      onChange={(e) => setTrialSport(e.target.value)}
                      className="w-full p-2.5 rounded-md border border-[#E5DFD5] dark:border-[#222D3E] bg-[#FAF8F5] dark:bg-[#121A28] focus:border-[#C5A059] focus:outline-none"
                    >
                      <option value="Padel">Padel 🏸</option>
                      <option value="Tennis">Tennis 🎾</option>
                      <option value="Badminton">Badminton 🏸</option>
                      <option value="Cricket">Cricket Nets 🏏</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-semibold block mb-1 uppercase tracking-wider text-[10px] text-[#4B5563] dark:text-[#9CA3AF]">Preferred Date</label>
                    <input
                      type="date"
                      value={trialDate}
                      onChange={(e) => setTrialDate(e.target.value)}
                      className="w-full p-2.5 rounded-md border border-[#E5DFD5] dark:border-[#222D3E] bg-[#FAF8F5] dark:bg-[#121A28] focus:border-[#C5A059] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowTrialModal(false)}
                    className="flex-1 py-2.5 rounded-md border border-[#E5DFD5] dark:border-[#222D3E] bg-white dark:bg-[#162032] text-[#4B5563] dark:text-[#D1D5DB] font-semibold tracking-wider uppercase text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-md bg-[#921111] hover:bg-[#720C0C] text-white font-bold tracking-widest uppercase text-xs shadow-sm transition-all"
                  >
                    Confirm Invitation
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* CORPORATE QUOTE REQUEST MODAL - NYAC Design */}
      {showQuoteModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0E1522] border border-[#E5DFD5] dark:border-[#222D3E] rounded-lg max-w-md w-full p-6 shadow-xl relative">
            <span className="text-[9px] font-bold uppercase tracking-[0.24em] text-[#8C6D23] dark:text-[#DFCA9B] block mb-1">
              Private Corporate Quarters
            </span>
            <h3 className="font-serif text-xl font-bold text-[#0B1320] dark:text-white">Corporate Inquiries & Events</h3>
            <div className="w-10 h-0.5 bg-[#C5A059] my-2" />
            <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">
              Custom packages for executive tournament days, corporate team retreats, and privileged firm accounts.
            </p>

            {quoteSuccess ? (
              <div className="my-6 p-4 rounded-md bg-[#FAF7EE] dark:bg-[#1C1608] border border-[#DFCA9B] dark:border-[#4B3C18] text-[#8C6D23] dark:text-[#E3CEA4] text-xs space-y-2">
                <div className="font-serif font-bold text-sm flex items-center gap-1.5 text-[#0B1320] dark:text-white">
                  <CheckCircle2 className="w-4 h-4 text-[#C5A059]" />
                  Inquiry Dispatched Successfully!
                </div>
                <p className="leading-relaxed">
                  Our Corporate Secretary will prepare an official PDF proposal and contact your office within 4 business hours.
                </p>
                <button
                  onClick={() => setShowQuoteModal(false)}
                  className="w-full mt-3 py-2 rounded-md bg-[#921111] text-white font-bold tracking-widest uppercase text-xs"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleRequestQuote} className="space-y-3 mt-4 text-xs">
                <div>
                  <label className="font-semibold block mb-1 uppercase tracking-wider text-[10px] text-[#4B5563] dark:text-[#9CA3AF]">Company / Corporation</label>
                  <input
                    required
                    type="text"
                    value={quoteCompany}
                    onChange={(e) => setQuoteCompany(e.target.value)}
                    placeholder="e.g. Infosys Technologies Ltd."
                    className="w-full p-2.5 rounded-md border border-[#E5DFD5] dark:border-[#222D3E] bg-[#FAF8F5] dark:bg-[#121A28] focus:border-[#C5A059] focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold block mb-1 uppercase tracking-wider text-[10px] text-[#4B5563] dark:text-[#9CA3AF]">Contact Officer</label>
                    <input
                      required
                      type="text"
                      value={quoteName}
                      onChange={(e) => setQuoteName(e.target.value)}
                      placeholder="Name"
                      className="w-full p-2.5 rounded-md border border-[#E5DFD5] dark:border-[#222D3E] bg-[#FAF8F5] dark:bg-[#121A28] focus:border-[#C5A059] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="font-semibold block mb-1 uppercase tracking-wider text-[10px] text-[#4B5563] dark:text-[#9CA3AF]">Official Telephone</label>
                    <input
                      required
                      type="tel"
                      value={quotePhone}
                      onChange={(e) => setQuotePhone(e.target.value)}
                      placeholder="+91 98000 00000"
                      className="w-full p-2.5 rounded-md border border-[#E5DFD5] dark:border-[#222D3E] bg-[#FAF8F5] dark:bg-[#121A28] focus:border-[#C5A059] focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="font-semibold block mb-1 uppercase tracking-wider text-[10px] text-[#4B5563] dark:text-[#9CA3AF]">Estimated Roster & Requirements</label>
                  <textarea
                    rows={3}
                    value={quoteRequirements}
                    onChange={(e) => setQuoteRequirements(e.target.value)}
                    placeholder="e.g. 25 players, weekend padel & badminton tournament with lounge dining coordination"
                    className="w-full p-2.5 rounded-md border border-[#E5DFD5] dark:border-[#222D3E] bg-[#FAF8F5] dark:bg-[#121A28] focus:border-[#C5A059] focus:outline-none"
                  />
                </div>

                <div className="flex gap-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowQuoteModal(false)}
                    className="flex-1 py-2.5 rounded-md border border-[#E5DFD5] dark:border-[#222D3E] bg-white dark:bg-[#162032] text-[#4B5563] dark:text-[#D1D5DB] font-semibold tracking-wider uppercase text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-md bg-[#C5A059] hover:bg-[#B38E46] text-[#0B1320] font-bold tracking-widest uppercase text-xs shadow-sm transition-all"
                  >
                    Submit Proposal Request
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
