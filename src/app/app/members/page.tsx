"use client";

import React, { useState, useEffect } from "react";
import { formatINR, formatDate, formatDateTime, calculateAge } from "@/lib/formatters";
import { useAuth } from "@/lib/auth-context";
import {
  Users,
  Search,
  Plus,
  QrCode,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Printer,
  Calendar,
  ShoppingBag,
  Coffee,
  X,
  CreditCard,
  Phone,
  Mail,
  Clock,
  UserCheck,
} from "lucide-react";

export default function MembersManagementPage() {
  const { currentUser } = useAuth();
  const [members, setMembers] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [tierFilter, setTierFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);

  // Sign-up Modal State
  const [showSignUpModal, setShowSignUpModal] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [dob, setDob] = useState("");
  const [planId, setPlanId] = useState("");
  const [emergencyName, setEmergencyName] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");
  const [billingCycle, setBillingCycle] = useState("MONTHLY");
  const [paymentMethod, setPaymentMethod] = useState("UPI");
  const [signUpError, setSignUpError] = useState<string | null>(null);
  const [newMemberCreated, setNewMemberCreated] = useState<any>(null);

  // Member 360 Drawer State
  const [selectedMember360, setSelectedMember360] = useState<any>(null);
  const [member360Data, setMember360Data] = useState<any>(null);
  const [loading360, setLoading360] = useState(false);

  // CSV Import Modal State
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [csvRawText, setCsvRawText] = useState("");
  const [csvPreviewData, setCsvPreviewData] = useState<any>(null);
  const [csvImportResult, setCsvImportResult] = useState<any>(null);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/members");
      const data = await res.json();
      if (data.members) setMembers(data.members);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchPlans = async () => {
    try {
      const res = await fetch("/api/settings");
      const data = await res.json();
      if (data.plans) {
        setPlans(data.plans);
        if (data.plans.length > 0) setPlanId(data.plans[0].id);
      }
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    fetchMembers();
    fetchPlans();
  }, []);

  const handleOpen360 = async (member: any) => {
    setSelectedMember360(member);
    setLoading360(true);
    try {
      const res = await fetch(`/api/members/${member.id}`);
      const data = await res.json();
      if (data.member) setMember360Data(data.member);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading360(false);
    }
  };

  const handleDeskCheckIn = async (memberId: string) => {
    try {
      const res = await fetch(`/api/members/${memberId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CHECK_IN",
          checkInMethod: "DESK",
          userId: currentUser?.id,
          userName: currentUser?.name,
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert("Member checked in successfully at front desk!");
        handleOpen360(selectedMember360);
      }
    } catch (e: any) {
      alert("Check-in error: " + e.message);
    }
  };

  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignUpError(null);

    const selectedPlan = plans.find((p) => p.id === planId);
    if (selectedPlan?.tier === "JUNIOR") {
      if (!dob) {
        setSignUpError("Date of Birth is mandatory for Junior Academy Tier.");
        return;
      }
      const age = calculateAge(dob);
      if (age >= 18) {
        setSignUpError(
          `Age validation failed: Applicant is ${age} years old. Junior Tier is strictly for individuals under 18.`
        );
        return;
      }
    }

    try {
      const res = await fetch("/api/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone,
          dateOfBirth: dob || null,
          planId,
          emergencyContactName: emergencyName,
          emergencyContactPhone: emergencyPhone,
          billingCycle,
          paymentMethod,
          staffUserId: currentUser?.id,
          staffUserName: currentUser?.name,
        }),
      });
      const data = await res.json();

      if (!res.ok || data.error) {
        setSignUpError(data.error || "Failed to register member");
      } else {
        setNewMemberCreated(data);
        fetchMembers();
      }
    } catch (err: any) {
      setSignUpError(err.message);
    }
  };

  // CSV Dry-Run & Import
  const handleCsvPreview = async () => {
    try {
      const lines = csvRawText.trim().split("\n");
      const rows = lines.map((line) => {
        const parts = line.split(",").map((s) => s.trim());
        return {
          name: parts[0] || "",
          email: parts[1] || "",
          phone: parts[2] || "",
          tier: parts[3] || "SILVER",
          dateOfBirth: parts[4] || undefined,
        };
      });

      const res = await fetch("/api/members/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows, dryRun: true }),
      });
      const data = await res.json();
      setCsvPreviewData(data);
    } catch (e: any) {
      alert("CSV parse error: " + e.message);
    }
  };

  const handleCsvExecute = async () => {
    try {
      const lines = csvRawText.trim().split("\n");
      const rows = lines.map((line) => {
        const parts = line.split(",").map((s) => s.trim());
        return {
          name: parts[0] || "",
          email: parts[1] || "",
          phone: parts[2] || "",
          tier: parts[3] || "SILVER",
          dateOfBirth: parts[4] || undefined,
        };
      });

      const res = await fetch("/api/members/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows, dryRun: false }),
      });
      const data = await res.json();
      setCsvImportResult(data);
      fetchMembers();
    } catch (e: any) {
      alert("Import execution error: " + e.message);
    }
  };

  const filteredMembers = members.filter((m) => {
    const matchesQuery =
      searchQuery === "" ||
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.phone.includes(searchQuery) ||
      m.memberId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.email.toLowerCase().includes(searchQuery.toLowerCase());

    const activeTier = m.memberships?.[0]?.tier || "NONE";
    const matchesTier = tierFilter === "ALL" || activeTier === tierFilter;
    const matchesStatus = statusFilter === "ALL" || m.status === statusFilter;

    return matchesQuery && matchesTier && matchesStatus;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans">
      {/* HEADER & ACTIONS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-[#E5DFD5] dark:border-[#222D3E]">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="text-[10px] uppercase tracking-[0.25em] font-bold text-[#8C6D23] dark:text-[#DFCA9B]">
              Club Governance & Registry
            </span>
            <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-[#C5A059]/15 text-[#8C6D23] dark:text-[#DFCA9B] border border-[#C5A059]/30 font-bold uppercase tracking-wider">
              {members.length} Members Enrolled
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-[#0B1320] dark:text-white tracking-tight mt-1">
            Distinguished Membership Roster
          </h1>
          <p className="text-xs text-[#5A6578] dark:text-[#8E9CAE] mt-1">
            Concierge walk-in enrollment, Junior compliance validation, digital credential passes, and Member 360 dossiers.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* CSV Import Button */}
          <button
            onClick={() => {
              setShowCsvModal(true);
              setCsvPreviewData(null);
              setCsvImportResult(null);
            }}
            className="flex items-center gap-2 px-3.5 py-2 rounded border border-[#E5DFD5] dark:border-[#222D3E] bg-white dark:bg-[#131C2E] hover:border-[#C5A059] text-[#0B1320] dark:text-white text-xs font-bold uppercase tracking-wider transition-all"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-[#8C6D23] dark:text-[#DFCA9B]" />
            <span>Import Excel / CSV</span>
          </button>

          {/* New Member Sign-up Button */}
          <button
            onClick={() => {
              setShowSignUpModal(true);
              setNewMemberCreated(null);
              setSignUpError(null);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded bg-[#921111] hover:bg-[#720C0C] text-white text-xs font-bold uppercase tracking-wider shadow-sm transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Member Enrollment</span>
          </button>
        </div>
      </div>

      {/* SEARCH & FILTERS */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-white dark:bg-[#0E1726] border border-[#E5DFD5] dark:border-[#222D3E] text-xs shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8E9CAE]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, phone, member ID, QR..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-[#E5DFD5] dark:border-[#222D3E] bg-[#FAF8F5] dark:bg-[#131C2E] text-xs text-[#0B1320] dark:text-white placeholder-[#8E9CAE] focus:outline-none focus:border-[#C5A059]"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Tier filter */}
          <div className="flex bg-[#E5DFD5]/40 dark:bg-[#131C2E] p-1 rounded-lg border border-[#E5DFD5] dark:border-[#222D3E]">
            {["ALL", "GOLD", "SILVER", "JUNIOR"].map((t) => (
              <button
                key={t}
                onClick={() => setTierFilter(t)}
                className={`px-3 py-1.5 rounded font-bold text-[10px] uppercase tracking-wider transition-all ${
                  tierFilter === t
                    ? "bg-[#0B1320] text-[#C5A059] dark:bg-[#C5A059] dark:text-[#0B1320] shadow-xs"
                    : "text-[#5A6578] dark:text-[#8E9CAE] hover:text-[#0B1320] dark:hover:text-white"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-[#E5DFD5] dark:border-[#222D3E] bg-[#FAF8F5] dark:bg-[#131C2E] text-xs font-bold uppercase tracking-wider text-[#0B1320] dark:text-white focus:outline-none focus:border-[#C5A059]"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="EXPIRING_SOON">EXPIRING SOON</option>
            <option value="EXPIRED">EXPIRED</option>
          </select>
        </div>
      </div>

      {/* MEMBERS DIRECTORY TABLE */}
      <div className="overflow-x-auto rounded-xl border border-[#E5DFD5] dark:border-[#222D3E] bg-white dark:bg-[#0E1726] shadow-sm">
        <table className="w-full text-xs text-left">
          <thead className="bg-[#FAF8F5] dark:bg-[#131C2E] text-[#5A6578] dark:text-[#8E9CAE] font-bold border-b border-[#E5DFD5] dark:border-[#222D3E]">
            <tr>
              <th className="p-3">Member ID</th>
              <th className="p-3">Name & Contact</th>
              <th className="p-3">Plan Tier</th>
              <th className="p-3">Standing Status</th>
              <th className="p-3">Valid Until</th>
              <th className="p-3 text-center">Activity Stats</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5DFD5]/60 dark:divide-[#222D3E] font-medium">
            {filteredMembers.map((m) => {
              const membership = m.memberships?.[0];
              const tier = membership?.tier || "NONE";
              const isGold = tier === "GOLD";
              const isJunior = tier === "JUNIOR";

              return (
                <tr
                  key={m.id}
                  onClick={() => handleOpen360(m)}
                  className="hover:bg-[#FAF8F5]/80 dark:hover:bg-[#131C2E]/50 cursor-pointer transition-colors"
                >
                  <td className="p-3 font-mono font-bold text-[#8C6D23] dark:text-[#DFCA9B]">{m.memberId}</td>
                  <td className="p-3">
                    <div className="font-serif font-bold text-sm text-[#0B1320] dark:text-white">{m.name}</div>
                    <div className="text-[11px] text-[#5A6578] dark:text-[#8E9CAE]">
                      {m.phone} • {m.email}
                    </div>
                  </td>
                  <td className="p-3">
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded font-mono uppercase tracking-wider border ${
                        isGold
                          ? "bg-[#C5A059]/15 text-[#8C6D23] dark:text-[#DFCA9B] border-[#C5A059]/40"
                          : isJunior
                          ? "bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-800"
                          : "bg-[#E5DFD5]/50 dark:bg-[#1A253A] text-[#5A6578] dark:text-[#8E9CAE] border-[#E5DFD5] dark:border-[#222D3E]"
                      }`}
                    >
                      {tier}
                    </span>
                  </td>
                  <td className="p-3">
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider border ${
                        m.status === "ACTIVE"
                          ? "bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800"
                          : m.status === "EXPIRING_SOON"
                          ? "bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800"
                          : "bg-red-50 dark:bg-red-950 text-red-800 dark:text-red-300 border-red-300 dark:border-red-800"
                      }`}
                    >
                      {m.status}
                    </span>
                  </td>
                  <td className="p-3 text-[#5A6578] dark:text-[#8E9CAE] font-mono">
                    {membership?.endDate ? formatDate(membership.endDate) : "—"}
                  </td>
                  <td className="p-3 text-center text-[#5A6578] dark:text-[#8E9CAE]">
                    <div className="flex items-center justify-center gap-3 text-[11px]">
                      <span title="Bookings count">🎾 {m._count?.bookings || 0}</span>
                      <span title="Shop orders">🛍️ {m._count?.shopOrders || 0}</span>
                      <span title="Bar tabs">☕ {m._count?.tabs || 0}</span>
                    </div>
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpen360(m);
                      }}
                      className="px-2.5 py-1 rounded border border-[#E5DFD5] dark:border-[#222D3E] hover:border-[#C5A059] bg-[#FAF8F5] dark:bg-[#131C2E] text-[#0B1320] dark:text-[#DFCA9B] text-xs font-bold uppercase tracking-wider"
                    >
                      Dossier 360 →
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* NEW MEMBER SIGN-UP MODAL */}
      {showSignUpModal && (
        <div className="fixed inset-0 bg-[#0B1320]/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0E1726] border border-[#C5A059]/50 rounded-xl max-w-lg w-full p-6 shadow-2xl relative font-sans">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5DFD5] dark:border-[#222D3E]">
              <div>
                <span className="text-[9px] uppercase tracking-[0.2em] font-bold text-[#8C6D23] dark:text-[#DFCA9B] block">
                  Concierge Registry
                </span>
                <h3 className="text-lg font-serif font-bold text-[#0B1320] dark:text-white">
                  Member Walk-In Onboarding
                </h3>
              </div>
              <button
                onClick={() => setShowSignUpModal(false)}
                className="p-1 rounded-lg hover:bg-[#FAF8F5] dark:hover:bg-[#131C2E] text-[#8E9CAE]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {newMemberCreated ? (
              <div className="my-6 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100 text-xs space-y-3">
                <div className="font-bold flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  Membership Pass Issued: #{newMemberCreated.member.memberId}
                </div>
                <p>
                  <strong>{newMemberCreated.member.name}</strong> admitted under <strong>{newMemberCreated.membership.tier} Tier</strong>.
                </p>
                <div className="p-3 rounded-lg bg-white dark:bg-[#131C2E] border border-[#E5DFD5] dark:border-[#222D3E] flex items-center justify-between">
                  <div>
                    <span className="text-[9px] uppercase tracking-wider text-[#8E9CAE] block font-bold">Digital Credential Key</span>
                    <span className="font-mono font-bold text-sm text-[#8C6D23] dark:text-[#DFCA9B]">
                      {newMemberCreated.member.memberId}
                    </span>
                  </div>
                  <QrCode className="w-8 h-8 text-[#0B1320] dark:text-[#DFCA9B]" />
                </div>
                <button
                  onClick={() => setShowSignUpModal(false)}
                  className="w-full py-2.5 rounded bg-[#921111] hover:bg-[#720C0C] text-white font-bold text-xs uppercase tracking-wider"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleSignUpSubmit} className="space-y-3 mt-4 text-xs">
                {signUpError && (
                  <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-800 text-red-700 dark:text-red-300 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{signUpError}</span>
                  </div>
                )}

                <div>
                  <label className="font-bold uppercase tracking-wider text-[10px] text-[#5A6578] dark:text-[#8E9CAE] block mb-1">
                    Candidate Full Name
                  </label>
                  <input
                    required
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Deepika Padukone"
                    className="w-full p-2.5 rounded-lg border border-[#E5DFD5] dark:border-[#222D3E] bg-[#FAF8F5] dark:bg-[#131C2E] text-xs text-[#0B1320] dark:text-white focus:outline-none focus:border-[#C5A059]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold uppercase tracking-wider text-[10px] text-[#5A6578] dark:text-[#8E9CAE] block mb-1">
                      Phone (Mandatory)
                    </label>
                    <input
                      required
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 00000"
                      className="w-full p-2.5 rounded-lg border border-[#E5DFD5] dark:border-[#222D3E] bg-[#FAF8F5] dark:bg-[#131C2E] text-xs text-[#0B1320] dark:text-white focus:outline-none focus:border-[#C5A059]"
                    />
                  </div>
                  <div>
                    <label className="font-bold uppercase tracking-wider text-[10px] text-[#5A6578] dark:text-[#8E9CAE] block mb-1">
                      Email Address
                    </label>
                    <input
                      required
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="deepika@example.com"
                      className="w-full p-2.5 rounded-lg border border-[#E5DFD5] dark:border-[#222D3E] bg-[#FAF8F5] dark:bg-[#131C2E] text-xs text-[#0B1320] dark:text-white focus:outline-none focus:border-[#C5A059]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold uppercase tracking-wider text-[10px] text-[#5A6578] dark:text-[#8E9CAE] block mb-1">
                      Date of Birth <span className="text-amber-600 font-normal">(&lt;18 for Junior)</span>
                    </label>
                    <input
                      type="date"
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-[#E5DFD5] dark:border-[#222D3E] bg-[#FAF8F5] dark:bg-[#131C2E] text-xs text-[#0B1320] dark:text-white focus:outline-none focus:border-[#C5A059]"
                    />
                  </div>
                  <div>
                    <label className="font-bold uppercase tracking-wider text-[10px] text-[#5A6578] dark:text-[#8E9CAE] block mb-1">
                      Membership Plan
                    </label>
                    <select
                      value={planId}
                      onChange={(e) => setPlanId(e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-[#E5DFD5] dark:border-[#222D3E] bg-[#FAF8F5] dark:bg-[#131C2E] text-xs text-[#0B1320] dark:text-white font-medium focus:outline-none focus:border-[#C5A059]"
                    >
                      {plans.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({formatINR(p.monthlyFeePaise)}/mo)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold uppercase tracking-wider text-[10px] text-[#5A6578] dark:text-[#8E9CAE] block mb-1">
                      Emergency Contact Name
                    </label>
                    <input
                      type="text"
                      value={emergencyName}
                      onChange={(e) => setEmergencyName(e.target.value)}
                      placeholder="Contact Name"
                      className="w-full p-2.5 rounded-lg border border-[#E5DFD5] dark:border-[#222D3E] bg-[#FAF8F5] dark:bg-[#131C2E] text-xs text-[#0B1320] dark:text-white focus:outline-none focus:border-[#C5A059]"
                    />
                  </div>
                  <div>
                    <label className="font-bold uppercase tracking-wider text-[10px] text-[#5A6578] dark:text-[#8E9CAE] block mb-1">
                      Emergency Phone
                    </label>
                    <input
                      type="tel"
                      value={emergencyPhone}
                      onChange={(e) => setEmergencyPhone(e.target.value)}
                      placeholder="+91 98000 00000"
                      className="w-full p-2.5 rounded-lg border border-[#E5DFD5] dark:border-[#222D3E] bg-[#FAF8F5] dark:bg-[#131C2E] text-xs text-[#0B1320] dark:text-white focus:outline-none focus:border-[#C5A059]"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowSignUpModal(false)}
                    className="flex-1 py-2.5 rounded border border-[#E5DFD5] dark:border-[#222D3E] bg-white dark:bg-[#131C2E] text-[#0B1320] dark:text-white font-bold text-xs uppercase tracking-wider"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded bg-[#921111] hover:bg-[#720C0C] text-white font-bold text-xs uppercase tracking-wider shadow-sm"
                  >
                    Enroll & Issue Pass
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MEMBER 360 DRAWER */}
      {selectedMember360 && (
        <div className="fixed inset-0 bg-[#0B1320]/70 backdrop-blur-sm z-50 flex justify-end">
          <div className="bg-white dark:bg-[#0E1726] border-l border-[#C5A059]/40 w-full max-w-xl h-full shadow-2xl p-6 overflow-y-auto space-y-6 font-sans">
            <div className="flex items-center justify-between pb-4 border-b border-[#E5DFD5] dark:border-[#222D3E]">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-[#0B1320] text-[#C5A059] border border-[#C5A059] flex items-center justify-center font-serif font-bold text-lg">
                  {selectedMember360.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-serif font-bold text-[#0B1320] dark:text-white">{selectedMember360.name}</h3>
                  <span className="text-xs font-mono text-[#8C6D23] dark:text-[#DFCA9B] font-bold">
                    {selectedMember360.memberId} • {selectedMember360.status}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedMember360(null)}
                className="p-1.5 rounded-lg hover:bg-[#FAF8F5] dark:hover:bg-[#131C2E] text-[#8E9CAE]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Action: Front Desk Check-in */}
            <div className="p-4 rounded-xl bg-[#FAF8F5] dark:bg-[#131C2E] border border-[#C5A059]/40 flex items-center justify-between">
              <div>
                <span className="font-bold text-xs text-[#0B1320] dark:text-white block">
                  Club Entrance Check-in
                </span>
                <span className="text-[11px] text-[#5A6578] dark:text-[#8E9CAE]">
                  Log physical turnstile access & verify active standing
                </span>
              </div>
              <button
                onClick={() => handleDeskCheckIn(selectedMember360.id)}
                className="px-3.5 py-1.5 rounded bg-[#921111] hover:bg-[#720C0C] text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-sm"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Check In Now</span>
              </button>
            </div>

            {/* Profile & Plan Details */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-lg bg-[#FAF8F5] dark:bg-[#131C2E] border border-[#E5DFD5] dark:border-[#222D3E]">
                <span className="text-[#8E9CAE] block text-[9px] uppercase tracking-wider font-bold">Plan Tier</span>
                <span className="font-bold text-sm text-[#0B1320] dark:text-white font-serif mt-0.5 block">
                  {member360Data?.memberships?.[0]?.plan?.name || "Standard Member"}
                </span>
              </div>
              <div className="p-3.5 rounded-lg bg-[#FAF8F5] dark:bg-[#131C2E] border border-[#E5DFD5] dark:border-[#222D3E]">
                <span className="text-[#8E9CAE] block text-[9px] uppercase tracking-wider font-bold">Valid Until</span>
                <span className="font-bold text-xs text-[#0B1320] dark:text-white font-mono mt-0.5 block">
                  {member360Data?.memberships?.[0]?.endDate ? formatDate(member360Data.memberships[0].endDate) : "Permanent"}
                </span>
              </div>
              <div className="p-3.5 rounded-lg bg-[#FAF8F5] dark:bg-[#131C2E] border border-[#E5DFD5] dark:border-[#222D3E]">
                <span className="text-[#8E9CAE] block text-[9px] uppercase tracking-wider font-bold">Registered Phone</span>
                <span className="font-bold text-xs text-[#0B1320] dark:text-white mt-0.5 block">{selectedMember360.phone}</span>
              </div>
              <div className="p-3.5 rounded-lg bg-[#FAF8F5] dark:bg-[#131C2E] border border-[#E5DFD5] dark:border-[#222D3E]">
                <span className="text-[#8E9CAE] block text-[9px] uppercase tracking-wider font-bold">Email Address</span>
                <span className="font-bold text-xs text-[#0B1320] dark:text-white truncate mt-0.5 block">{selectedMember360.email}</span>
              </div>
            </div>

            {/* Recent Booking History */}
            <div className="space-y-2">
              <h4 className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#8C6D23] dark:text-[#DFCA9B]">
                Court Reservation History
              </h4>
              <div className="max-h-40 overflow-y-auto space-y-1.5 text-xs">
                {member360Data?.bookings?.length === 0 ? (
                  <p className="text-[#8E9CAE] py-2 text-center italic">No court reservations recorded yet</p>
                ) : (
                  member360Data?.bookings?.map((b: any) => (
                    <div key={b.id} className="p-2.5 rounded-lg bg-[#FAF8F5] dark:bg-[#131C2E] border border-[#E5DFD5] dark:border-[#222D3E] flex items-center justify-between">
                      <div>
                        <span className="font-bold text-[#0B1320] dark:text-white">{b.court?.name}</span>
                        <span className="text-[11px] text-[#5A6578] dark:text-[#8E9CAE] block">{formatDateTime(b.startTime)}</span>
                      </div>
                      <span className="font-mono font-bold text-[#921111] dark:text-[#DFCA9B]">{formatINR(b.totalPricePaise)}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Recent Bar Tabs & Shop Spend */}
            <div className="space-y-2">
              <h4 className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#8C6D23] dark:text-[#DFCA9B]">
                Clubhouse Tabs & Pro Shop Orders
              </h4>
              <div className="max-h-40 overflow-y-auto space-y-1.5 text-xs">
                {member360Data?.tabs?.map((t: any) => (
                  <div key={t.id} className="p-2.5 rounded-lg bg-[#FAF8F5] dark:bg-[#131C2E] border border-[#E5DFD5] dark:border-[#222D3E] flex items-center justify-between">
                    <div>
                      <span className="font-bold text-[#0B1320] dark:text-white">Dining / Bar Tab #{t.tabNumber}</span>
                      <span className="text-[11px] text-[#5A6578] dark:text-[#8E9CAE] block">{formatDateTime(t.openedAt)}</span>
                    </div>
                    <span className="font-mono font-bold text-[#8C6D23] dark:text-[#DFCA9B]">{formatINR(t.finalAmountPaise)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CSV IMPORT MODAL */}
      {showCsvModal && (
        <div className="fixed inset-0 bg-[#0B1320]/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0E1726] border border-[#C5A059]/50 rounded-xl max-w-xl w-full p-6 shadow-2xl relative font-sans">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5DFD5] dark:border-[#222D3E]">
              <div>
                <span className="text-[9px] uppercase tracking-[0.2em] font-bold text-[#8C6D23] dark:text-[#DFCA9B] block">
                  Batch Migration
                </span>
                <h3 className="text-lg font-serif font-bold text-[#0B1320] dark:text-white">
                  Excel / CSV Member List Import
                </h3>
                <p className="text-xs text-[#5A6578] dark:text-[#8E9CAE]">
                  Bulk upload spreadsheet data with pre-import validation and duplicate protection.
                </p>
              </div>
              <button
                onClick={() => setShowCsvModal(false)}
                className="p-1 rounded-lg hover:bg-[#FAF8F5] dark:hover:bg-[#131C2E] text-[#8E9CAE]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {csvImportResult ? (
              <div className="my-6 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100 text-xs space-y-2">
                <div className="font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  Import Completed!
                </div>
                <p>
                  Successfully imported <strong>{csvImportResult.imported} members</strong>. Skipped {csvImportResult.skipped} duplicate/invalid rows.
                </p>
                <button
                  onClick={() => setShowCsvModal(false)}
                  className="w-full mt-3 py-2.5 rounded bg-[#921111] hover:bg-[#720C0C] text-white font-bold text-xs uppercase tracking-wider"
                >
                  Done
                </button>
              </div>
            ) : (
              <div className="space-y-4 mt-4 text-xs">
                <div>
                  <label className="font-bold uppercase tracking-wider text-[10px] text-[#5A6578] dark:text-[#8E9CAE] block mb-1">
                    Paste CSV Data (Format: Name, Email, Phone, Tier [GOLD/SILVER/JUNIOR], DOB [YYYY-MM-DD])
                  </label>
                  <textarea
                    rows={5}
                    value={csvRawText}
                    onChange={(e) => setCsvRawText(e.target.value)}
                    placeholder="Manoj Bajpayee, manoj@example.com, +91 98111 99901, GOLD&#10;Kavita Krishnamurthy, kavita@example.com, +91 98111 99902, SILVER&#10;Aarav Kumar, aarav@example.com, +91 98111 99903, JUNIOR, 2010-06-15"
                    className="w-full p-2.5 rounded-lg border border-[#E5DFD5] dark:border-[#222D3E] bg-[#FAF8F5] dark:bg-[#131C2E] font-mono text-[11px] text-[#0B1320] dark:text-white focus:outline-none focus:border-[#C5A059]"
                  />
                </div>

                {csvPreviewData && (
                  <div className="p-3 rounded-lg bg-[#FAF8F5] dark:bg-[#131C2E] border border-[#E5DFD5] dark:border-[#222D3E] space-y-2">
                    <div className="flex items-center justify-between font-bold">
                      <span className="text-[#0B1320] dark:text-white">Validation Preview:</span>
                      <span className="text-[#8C6D23] dark:text-[#DFCA9B] font-mono">
                        {csvPreviewData.validCount} Valid • {csvPreviewData.duplicateCount} Duplicates • {csvPreviewData.errorCount} Errors
                      </span>
                    </div>
                    <div className="max-h-32 overflow-y-auto space-y-1 text-[11px]">
                      {csvPreviewData.rows?.map((r: any) => (
                        <div
                          key={r.rowIndex}
                          className={`p-1.5 rounded flex items-center justify-between ${
                            r.isValid ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200" : "bg-red-50 dark:bg-red-950/60 text-red-800 dark:text-red-200"
                          }`}
                        >
                          <span>
                            #{r.rowIndex} {r.data.name} ({r.data.email})
                          </span>
                          <span>{r.isValid ? "Valid" : r.errors.join(", ")}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleCsvPreview}
                    className="flex-1 py-2.5 rounded border border-[#E5DFD5] dark:border-[#222D3E] bg-white dark:bg-[#131C2E] text-[#0B1320] dark:text-white font-bold text-xs uppercase tracking-wider"
                  >
                    1. Preview & Validate
                  </button>
                  <button
                    type="button"
                    onClick={handleCsvExecute}
                    disabled={!csvPreviewData || csvPreviewData.validCount === 0}
                    className="flex-1 py-2.5 rounded bg-[#921111] hover:bg-[#720C0C] text-white font-bold text-xs uppercase tracking-wider disabled:opacity-40"
                  >
                    2. Import Valid Rows
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
