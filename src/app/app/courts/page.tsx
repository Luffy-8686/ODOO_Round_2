"use client";

import React, { useState, useEffect } from "react";
import { formatINR, formatTime } from "@/lib/formatters";
import { useAuth } from "@/lib/auth-context";
import {
  Calendar as CalendarIcon,
  Clock,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  X,
  User,
  Users,
  ShieldAlert,
  Printer,
  Sparkles,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export default function CourtsManagementPage() {
  const { currentUser } = useAuth();
  const [courts, setCourts] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [maintenance, setMaintenance] = useState<any[]>([]);
  const [socialSessions, setSocialSessions] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [selectedSport, setSelectedSport] = useState<string>("ALL");
  const [loading, setLoading] = useState(true);

  // Quick Book Modal State
  const [showBookModal, setShowBookModal] = useState(false);
  const [selectedCourt, setSelectedCourt] = useState<any>(null);
  const [selectedTime, setSelectedTime] = useState<string>("18:00");
  const [bookerType, setBookerType] = useState<string>("MEMBER");
  const [members, setMembers] = useState<any[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState<string>("");
  const [guestName, setGuestName] = useState<string>("");
  const [guestPhone, setGuestPhone] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("UPI");
  const [bookingNotes, setBookingNotes] = useState<string>("");
  const [bookingSuccess, setBookingSuccess] = useState<any>(null);
  const [bookingError, setBookingError] = useState<string | null>(null);

  // Maintenance Modal State
  const [showMaintModal, setShowMaintModal] = useState(false);
  const [maintReason, setMaintReason] = useState("");
  const [refundingId, setRefundingId] = useState<string | null>(null);

  const handleRefundBooking = async (bookingId: string) => {
    setRefundingId(bookingId);
    try {
      const res = await fetch("/api/razorpay/refund", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, reason: "Front desk staff processed Gold security deposit refund" }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        alert(data.error || "Failed to process refund");
      } else {
        alert(data.message || "₹100 Security deposit successfully refunded!");
        fetchCourtData();
      }
    } catch (e: any) {
      alert("Refund error: " + e.message);
    } finally {
      setRefundingId(null);
    }
  };

  const fetchCourtData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/courts?date=${selectedDate}`);
      const data = await res.json();
      if (data.courts) setCourts(data.courts);
      if (data.bookings) setBookings(data.bookings);
      if (data.maintenance) setMaintenance(data.maintenance);
      if (data.socialSessions) setSocialSessions(data.socialSessions);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async () => {
    try {
      const res = await fetch("/api/members");
      const data = await res.json();
      if (data.members) setMembers(data.members);
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    fetchCourtData();
    fetchMembers();

    const handleRefresh = () => fetchCourtData();
    window.addEventListener("refresh-data", handleRefresh);
    return () => window.removeEventListener("refresh-data", handleRefresh);
  }, [selectedDate]);

  // Generate 30-minute time slots from 06:00 to 22:30
  const timeSlots: string[] = [];
  for (let h = 6; h <= 22; h++) {
    timeSlots.push(`${String(h).padStart(2, "0")}:00`);
    timeSlots.push(`${String(h).padStart(2, "0")}:30`);
  }

  const handleOpenBookModal = (court: any, time: string) => {
    setSelectedCourt(court);
    setSelectedTime(time);
    setBookingSuccess(null);
    setBookingError(null);
    setShowBookModal(true);
  };

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setBookingError(null);

    const slotStart = new Date(`${selectedDate}T${selectedTime}:00`);
    const selectedMember = members.find((m) => m.id === selectedMemberId);

    const payload = {
      courtId: selectedCourt.id,
      memberId: bookerType === "MEMBER" ? selectedMemberId : null,
      bookerName: bookerType === "MEMBER" ? selectedMember?.name : guestName,
      bookerPhone: bookerType === "MEMBER" ? selectedMember?.phone : guestPhone,
      bookerEmail: bookerType === "MEMBER" ? selectedMember?.email : "guest@championsclub.in",
      bookerType: bookerType === "MEMBER" ? selectedMember?.memberships[0]?.tier : "WALK_IN",
      startTime: slotStart.toISOString(),
      durationMinutes: 60,
      paymentMethod,
      notes: bookingNotes,
      source: "FRONT_DESK",
      userId: currentUser?.id,
      userName: currentUser?.name,
    };

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok || data.error) {
        setBookingError(data.error || "Failed to create booking.");
      } else {
        setBookingSuccess(data.booking);
        fetchCourtData();
      }
    } catch (err: any) {
      setBookingError(err.message);
    }
  };

  const filteredCourts = courts.filter((c) => {
    if (selectedSport === "ALL") return true;
    return c.sport?.name.toUpperCase() === selectedSport;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans">
      {/* HEADER & CONTROLS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-[#E5DFD5] dark:border-[#222D3E]">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="text-[10px] uppercase tracking-[0.25em] font-bold text-[#8C6D23] dark:text-[#DFCA9B]">
              Athletic Facilities & Play
            </span>
            <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-[#C5A059]/15 text-[#8C6D23] dark:text-[#DFCA9B] border border-[#C5A059]/30 font-bold uppercase tracking-wider">
              30-Min Rolling Slots
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-[#0B1320] dark:text-white tracking-tight mt-1">
            Court Booking & Master Schedule
          </h1>
          <p className="text-xs text-[#5A6578] dark:text-[#8E9CAE] mt-1">
            Real-time interactive timetable with concurrency double-booking prevention, peak tariffs, and member privilege rates.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Date Picker */}
          <div className="flex items-center gap-1.5 bg-white dark:bg-[#0E1726] border border-[#E5DFD5] dark:border-[#222D3E] rounded-lg px-2.5 py-1.5 text-xs">
            <CalendarIcon className="w-3.5 h-3.5 text-[#8C6D23] dark:text-[#DFCA9B]" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent font-medium text-xs outline-none text-[#0B1320] dark:text-white cursor-pointer"
            />
          </div>

          {/* Sport Filter Pills */}
          <div className="flex bg-[#E5DFD5]/40 dark:bg-[#131C2E] p-1 rounded-lg border border-[#E5DFD5] dark:border-[#222D3E] text-xs">
            {["ALL", "TENNIS", "PADEL", "BADMINTON", "CRICKET"].map((s) => (
              <button
                key={s}
                onClick={() => setSelectedSport(s)}
                className={`px-3 py-1.5 rounded font-bold text-[10px] uppercase tracking-wider transition-all ${
                  selectedSport === s
                    ? "bg-[#921111] text-white shadow-xs font-bold"
                    : "text-[#5A6578] dark:text-[#8E9CAE] hover:text-[#0B1320] dark:hover:text-white"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* LEGEND & QUICK STATS */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-white dark:bg-[#0E1726] border border-[#E5DFD5] dark:border-[#222D3E] text-xs shadow-xs">
        <div className="flex flex-wrap items-center gap-4">
          <span className="font-bold text-[#8C6D23] dark:text-[#DFCA9B] uppercase text-[9px] tracking-[0.15em]">
            Schedule Legend:
          </span>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-[#FAF8F5] dark:bg-[#131C2E] border border-dashed border-[#C5A059]" />
            <span className="text-[#5A6578] dark:text-[#8E9CAE]">Available</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-amber-500" />
            <span className="text-[#5A6578] dark:text-[#8E9CAE]">Booked (Exclusive)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-[#0B1320] dark:bg-[#C5A059]" />
            <span className="text-[#5A6578] dark:text-[#8E9CAE]">Social Play (Shared)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-[#921111]" />
            <span className="text-[#5A6578] dark:text-[#8E9CAE]">Maintenance Block</span>
          </div>
        </div>

        <span className="text-[11px] font-mono text-[#8C6D23] dark:text-[#DFCA9B] font-semibold">
          💡 Click any available slot to launch 1-click Quick-Book
        </span>
      </div>

      {/* INTERACTIVE CALENDAR GRID */}
      <div className="overflow-x-auto rounded-xl border border-[#E5DFD5] dark:border-[#222D3E] bg-white dark:bg-[#0E1726] shadow-sm">
        <table className="w-full text-xs text-left border-collapse">
          <thead>
            <tr className="bg-[#FAF8F5] dark:bg-[#131C2E] text-[#0B1320] dark:text-white font-bold border-b border-[#E5DFD5] dark:border-[#222D3E]">
              <th className="p-3 sticky left-0 z-20 bg-[#FAF8F5] dark:bg-[#131C2E] w-28 border-r border-[#E5DFD5] dark:border-[#222D3E] uppercase tracking-wider text-[10px] text-[#5A6578] dark:text-[#8E9CAE]">
                Time Slot
              </th>
              {filteredCourts.map((court) => (
                <th key={court.id} className="p-3 min-w-[190px] border-r border-[#E5DFD5] dark:border-[#222D3E]">
                  <div className="flex items-center justify-between">
                    <span className="font-serif font-bold text-sm truncate">{court.name}</span>
                    <span className="text-base">{court.sport?.icon || "🎾"}</span>
                  </div>
                  <span className="text-[10px] font-normal text-[#5A6578] dark:text-[#8E9CAE] block mt-0.5 font-sans">
                    {formatINR(court.hourlyRatePaise)}/hr • {court.surfaceType}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5DFD5]/60 dark:divide-[#222D3E] font-medium">
            {timeSlots.map((time) => {
              const [hStr] = time.split(":");
              const slotHour = parseInt(hStr);
              const isPeak = slotHour >= 18 && slotHour <= 21;

              return (
                <tr key={time} className="hover:bg-[#FAF8F5]/50 dark:hover:bg-[#131C2E]/30">
                  {/* Time label */}
                  <td className="p-2.5 sticky left-0 z-10 bg-white dark:bg-[#0E1726] font-mono font-bold text-[#0B1320] dark:text-white border-r border-[#E5DFD5] dark:border-[#222D3E] flex items-center justify-between">
                    <span>{time}</span>
                    {isPeak && (
                      <span className="text-[9px] px-1 py-0.2 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-bold border border-amber-300 dark:border-amber-800">
                        PEAK
                      </span>
                    )}
                  </td>

                  {/* Court slots */}
                  {filteredCourts.map((court) => {
                    const slotDateTime = new Date(`${selectedDate}T${time}:00`);

                    // Check if this court is booked in this time window
                    const activeBooking = bookings.find((b) => {
                      if (b.courtId !== court.id) return false;
                      const bStart = new Date(b.startTime);
                      const bEnd = new Date(b.endTime);
                      return slotDateTime >= bStart && slotDateTime < bEnd;
                    });

                    // Check maintenance
                    const isMaint = maintenance.some((m) => {
                      if (m.courtId !== court.id) return false;
                      const mStart = new Date(m.startTime);
                      const mEnd = new Date(m.endTime);
                      return slotDateTime >= mStart && slotDateTime < mEnd;
                    });

                    // Check social session
                    const activeSocial = socialSessions.find((s) => {
                      if (s.courtId !== court.id) return false;
                      const sStart = new Date(s.startTime);
                      const sEnd = new Date(s.endTime);
                      return slotDateTime >= sStart && slotDateTime < sEnd;
                    });

                    if (activeBooking) {
                      return (
                        <td
                          key={court.id}
                          className="p-2 border-r border-[#E5DFD5] dark:border-[#222D3E] bg-amber-50/60 dark:bg-amber-950/20"
                        >
                          <div className="p-2 rounded-lg bg-amber-500 text-slate-950 font-semibold shadow-xs flex flex-col justify-between">
                            <div className="flex items-center justify-between">
                              <span className="font-bold truncate text-[11px]">{activeBooking.bookerName}</span>
                              <span className="text-[9px] font-mono px-1 rounded bg-amber-600 text-white font-bold">
                                {activeBooking.bookerType}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-[10px] mt-1 text-slate-900 font-medium">
                              <span>#{activeBooking.bookingNumber}</span>
                              <span className="font-mono">{formatINR(activeBooking.totalPricePaise)}</span>
                            </div>
                            {(activeBooking.bookerType === "GOLD" || (activeBooking.securityDepositPaise || 0) > 0) && (
                              <div className="mt-1 pt-1 border-t border-amber-600/30 flex items-center justify-between text-[9px]">
                                <span className="font-bold">
                                  {activeBooking.depositRefundStatus === "REFUNDED"
                                    ? "₹100 Refunded"
                                    : "₹100 Deposit Held"}
                                </span>
                                {activeBooking.depositRefundStatus !== "REFUNDED" && (
                                  <button
                                    type="button"
                                    disabled={refundingId === activeBooking.id}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRefundBooking(activeBooking.id);
                                    }}
                                    className="px-1.5 py-0.5 rounded bg-slate-950 text-white font-mono hover:bg-slate-800 disabled:opacity-50 cursor-pointer"
                                  >
                                    {refundingId === activeBooking.id ? "..." : "Refund ₹100"}
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                      );
                    }

                    if (activeSocial) {
                      return (
                        <td
                          key={court.id}
                          className="p-2 border-r border-[#E5DFD5] dark:border-[#222D3E] bg-[#0B1320]/10 dark:bg-[#131C2E]"
                        >
                          <div className="p-2 rounded-lg bg-[#0B1320] text-white dark:bg-[#1A253A] dark:text-[#DFCA9B] font-semibold">
                            <div className="font-serif font-bold truncate text-[11px]">{activeSocial.name}</div>
                            <span className="text-[10px] text-[#C5A059] block mt-0.5">
                              {activeSocial.participants?.length || 0}/{activeSocial.capacity} Players
                            </span>
                          </div>
                        </td>
                      );
                    }

                    if (isMaint) {
                      return (
                        <td
                          key={court.id}
                          className="p-2 border-r border-[#E5DFD5] dark:border-[#222D3E] bg-red-50/60 dark:bg-red-950/20"
                        >
                          <div className="p-2 rounded-lg bg-[#921111] text-white font-bold text-[11px] text-center">
                            Maintenance Block
                          </div>
                        </td>
                      );
                    }

                    return (
                      <td
                        key={court.id}
                        onClick={() => handleOpenBookModal(court, time)}
                        className="p-2 border-r border-[#E5DFD5] dark:border-[#222D3E] cursor-pointer group hover:bg-[#C5A059]/10 transition-colors"
                      >
                        <div className="py-2 px-3 rounded-lg border border-dashed border-[#C5A059]/50 group-hover:border-[#C5A059] text-center text-[11px] text-[#8C6D23] dark:text-[#DFCA9B] font-semibold flex items-center justify-center gap-1 transition-all">
                          <Plus className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100" />
                          <span>Quick Book</span>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* QUICK BOOK MODAL */}
      {showBookModal && selectedCourt && (
        <div className="fixed inset-0 bg-[#0B1320]/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0E1726] border border-[#C5A059]/50 rounded-xl max-w-lg w-full p-6 shadow-2xl relative font-sans">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5DFD5] dark:border-[#222D3E]">
              <div>
                <span className="text-[9px] uppercase tracking-[0.2em] font-bold text-[#8C6D23] dark:text-[#DFCA9B] block">
                  Reservation Desk
                </span>
                <h3 className="text-lg font-serif font-bold text-[#0B1320] dark:text-white">
                  Quick Court Reservation
                </h3>
                <p className="text-xs text-[#5A6578] dark:text-[#8E9CAE]">
                  {selectedCourt.name} • {selectedDate} at {selectedTime} (60 Mins)
                </p>
              </div>
              <button
                onClick={() => setShowBookModal(false)}
                className="p-1 rounded-lg hover:bg-[#FAF8F5] dark:hover:bg-[#131C2E] text-[#8E9CAE]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {bookingSuccess ? (
              <div className="my-6 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100 text-xs space-y-3">
                <div className="font-bold flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  Booking Confirmed: #{bookingSuccess.bookingNumber}
                </div>
                <div className="space-y-1 text-[#0B1320] dark:text-white">
                  <p>Booker: <strong>{bookingSuccess.bookerName}</strong> ({bookingSuccess.bookerType})</p>
                  <p>Slot: <strong>{selectedCourt.name}</strong> ({selectedTime} - 60 min)</p>
                  <p>Total Charged: <strong>{formatINR(bookingSuccess.totalPricePaise)}</strong> ({bookingSuccess.paymentMethod})</p>
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => window.print()}
                    className="flex-1 py-2 rounded border border-[#E5DFD5] dark:border-[#222D3E] bg-white dark:bg-[#131C2E] text-[#0B1320] dark:text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Print Receipt
                  </button>
                  <button
                    onClick={() => setShowBookModal(false)}
                    className="flex-1 py-2 rounded bg-[#921111] hover:bg-[#720C0C] text-white font-bold text-xs uppercase tracking-wider"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreateBooking} className="space-y-4 mt-4 text-xs">
                {bookingError && (
                  <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-800 text-red-700 dark:text-red-300 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{bookingError}</span>
                  </div>
                )}

                {/* Booker Type Switcher */}
                <div className="flex rounded-lg bg-[#FAF8F5] dark:bg-[#131C2E] p-1 border border-[#E5DFD5] dark:border-[#222D3E]">
                  <button
                    type="button"
                    onClick={() => setBookerType("MEMBER")}
                    className={`flex-1 py-1.5 rounded font-bold text-xs uppercase tracking-wider transition-all ${
                      bookerType === "MEMBER"
                        ? "bg-[#0B1320] text-[#C5A059] dark:bg-[#C5A059] dark:text-[#0B1320] shadow-xs"
                        : "text-[#5A6578] dark:text-[#8E9CAE]"
                    }`}
                  >
                    Club Member (Tier Pricing)
                  </button>
                  <button
                    type="button"
                    onClick={() => setBookerType("WALK_IN")}
                    className={`flex-1 py-1.5 rounded font-bold text-xs uppercase tracking-wider transition-all ${
                      bookerType === "WALK_IN"
                        ? "bg-[#0B1320] text-[#C5A059] dark:bg-[#C5A059] dark:text-[#0B1320] shadow-xs"
                        : "text-[#5A6578] dark:text-[#8E9CAE]"
                    }`}
                  >
                    Walk-in / Guest (Full Rate)
                  </button>
                </div>

                {bookerType === "MEMBER" ? (
                  <div>
                    <label className="font-bold uppercase tracking-wider text-[10px] text-[#5A6578] dark:text-[#8E9CAE] block mb-1">
                      Select Member Credential
                    </label>
                    <select
                      required
                      value={selectedMemberId}
                      onChange={(e) => setSelectedMemberId(e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-[#E5DFD5] dark:border-[#222D3E] bg-[#FAF8F5] dark:bg-[#131C2E] font-medium text-xs text-[#0B1320] dark:text-white focus:outline-none focus:border-[#C5A059]"
                    >
                      <option value="">-- Choose Member (ID / Name / Tier) --</option>
                      {members.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.memberId} - {m.name} ({m.memberships[0]?.tier || 'NO PLAN'})
                        </option>
                      ))}
                    </select>
                    {members.find((m) => m.id === selectedMemberId)?.memberships?.[0]?.tier === "GOLD" && (
                      <div className="mt-2 p-2 rounded bg-[#C5A059]/15 border border-[#C5A059]/30 text-[#8C6D23] dark:text-[#DFCA9B] text-[11px] font-bold flex items-center justify-between">
                        <span>👑 Gold Tier: Free Court Access</span>
                        <span className="font-mono text-[#921111] dark:text-[#DFCA9B]">₹100 Security Deposit (Refundable)</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold uppercase tracking-wider text-[10px] text-[#5A6578] dark:text-[#8E9CAE] block mb-1">
                        Guest Name
                      </label>
                      <input
                        required
                        type="text"
                        value={guestName}
                        onChange={(e) => setGuestName(e.target.value)}
                        placeholder="e.g. Rahul Sen"
                        className="w-full p-2.5 rounded-lg border border-[#E5DFD5] dark:border-[#222D3E] bg-[#FAF8F5] dark:bg-[#131C2E] text-xs text-[#0B1320] dark:text-white focus:outline-none focus:border-[#C5A059]"
                      />
                    </div>
                    <div>
                      <label className="font-bold uppercase tracking-wider text-[10px] text-[#5A6578] dark:text-[#8E9CAE] block mb-1">
                        Phone
                      </label>
                      <input
                        required
                        type="tel"
                        value={guestPhone}
                        onChange={(e) => setGuestPhone(e.target.value)}
                        placeholder="+91 98765 00000"
                        className="w-full p-2.5 rounded-lg border border-[#E5DFD5] dark:border-[#222D3E] bg-[#FAF8F5] dark:bg-[#131C2E] text-xs text-[#0B1320] dark:text-white focus:outline-none focus:border-[#C5A059]"
                      />
                    </div>
                  </div>
                )}

                {/* Payment Method */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold uppercase tracking-wider text-[10px] text-[#5A6578] dark:text-[#8E9CAE] block mb-1">
                      Settlement Method
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-[#E5DFD5] dark:border-[#222D3E] bg-[#FAF8F5] dark:bg-[#131C2E] text-xs text-[#0B1320] dark:text-white focus:outline-none focus:border-[#C5A059]"
                    >
                      <option value="RAZORPAY">Razorpay Trial Gateway</option>
                      <option value="UPI">UPI Digital Payment</option>
                      <option value="CASH">Counter Cash</option>
                      <option value="CARD">Credit / Debit Card</option>
                      <option value="FREE_TIER">Gold / Platinum Free Pass</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-bold uppercase tracking-wider text-[10px] text-[#5A6578] dark:text-[#8E9CAE] block mb-1">
                      Notes (Optional)
                    </label>
                    <input
                      type="text"
                      value={bookingNotes}
                      onChange={(e) => setBookingNotes(e.target.value)}
                      placeholder="e.g. Needs racket rental"
                      className="w-full p-2.5 rounded-lg border border-[#E5DFD5] dark:border-[#222D3E] bg-[#FAF8F5] dark:bg-[#131C2E] text-xs text-[#0B1320] dark:text-white focus:outline-none focus:border-[#C5A059]"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowBookModal(false)}
                    className="flex-1 py-2.5 rounded border border-[#E5DFD5] dark:border-[#222D3E] bg-white dark:bg-[#131C2E] text-[#0B1320] dark:text-white font-bold text-xs uppercase tracking-wider"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded bg-[#921111] hover:bg-[#720C0C] text-white font-bold text-xs uppercase tracking-wider shadow-sm"
                  >
                    Confirm & Reserve Slot
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
