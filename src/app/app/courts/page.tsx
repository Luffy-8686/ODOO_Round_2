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
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* HEADER & CONTROLS */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Court Booking Engine
            </h1>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold">
              30-MIN ROLLING SLOTS
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time interactive calendar grid with transactional double-booking prevention & member quotas.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Date Picker */}
          <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-1 text-xs">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent font-bold px-2 py-1 outline-none text-slate-800 dark:text-slate-200"
            />
          </div>

          {/* Sport Filter Pills */}
          <div className="flex bg-slate-200 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
            {["ALL", "TENNIS", "PADEL", "BADMINTON", "CRICKET"].map((s) => (
              <button
                key={s}
                onClick={() => setSelectedSport(s)}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  selectedSport === s
                    ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm font-bold"
                    : "text-slate-600 dark:text-slate-400"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* LEGEND & QUICK STATS */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
        <div className="flex items-center gap-4">
          <span className="font-bold text-slate-500 uppercase text-[10px] tracking-wider">Slot Legend:</span>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-emerald-100 dark:bg-emerald-950 border border-emerald-400" />
            <span>Available</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-amber-500 text-white" />
            <span>Booked (Exclusive)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-blue-500 text-white" />
            <span>Friday Social Play (Shared)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-red-500 text-white" />
            <span>Maintenance</span>
          </div>
        </div>

        <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
          💡 Click any open slot to launch 1-click Quick-Book
        </span>
      </div>

      {/* INTERACTIVE CALENDAR GRID */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <table className="w-full text-xs text-left border-collapse">
          <thead>
            <tr className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800">
              <th className="p-3 sticky left-0 z-20 bg-slate-100 dark:bg-slate-800 w-28 border-r border-slate-200 dark:border-slate-700">
                Time Slot
              </th>
              {filteredCourts.map((court) => (
                <th key={court.id} className="p-3 min-w-[180px] border-r border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="font-bold truncate">{court.name}</span>
                    <span className="text-base">{court.sport?.icon || "🎾"}</span>
                  </div>
                  <span className="text-[10px] font-normal text-slate-500 block mt-0.5">
                    {formatINR(court.hourlyRatePaise)}/hr • {court.surfaceType}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
            {timeSlots.map((time) => {
              const [hStr, mStr] = time.split(":");
              const slotHour = parseInt(hStr);
              const isPeak = slotHour >= 18 && slotHour <= 21;

              return (
                <tr key={time} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                  {/* Time label */}
                  <td className="p-2.5 sticky left-0 z-10 bg-white dark:bg-slate-900 font-mono font-bold text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <span>{time}</span>
                    {isPeak && (
                      <span className="text-[9px] px-1 py-0.2 rounded bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-bold">
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
                          className="p-2 border-r border-slate-200 dark:border-slate-800 bg-amber-50 dark:bg-amber-950/40"
                        >
                          <div className="p-2 rounded-lg bg-amber-500 text-slate-950 font-semibold shadow-xs flex flex-col justify-between">
                            <div className="flex items-center justify-between">
                              <span className="font-bold truncate text-[11px]">{activeBooking.bookerName}</span>
                              <span className="text-[9px] font-mono px-1 rounded bg-amber-600 text-white">
                                {activeBooking.bookerType}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-[10px] mt-1 text-slate-900 font-medium">
                              <span>#{activeBooking.bookingNumber}</span>
                              <span>{formatINR(activeBooking.totalPricePaise)}</span>
                            </div>
                          </div>
                        </td>
                      );
                    }

                    if (activeSocial) {
                      return (
                        <td
                          key={court.id}
                          className="p-2 border-r border-slate-200 dark:border-slate-800 bg-blue-50 dark:bg-blue-950/40"
                        >
                          <div className="p-2 rounded-lg bg-blue-600 text-white font-semibold">
                            <div className="font-bold truncate text-[11px]">{activeSocial.name}</div>
                            <span className="text-[10px] opacity-90 block mt-0.5">
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
                          className="p-2 border-r border-slate-200 dark:border-slate-800 bg-red-50 dark:bg-red-950/40"
                        >
                          <div className="p-2 rounded-lg bg-red-600 text-white font-semibold text-[11px]">
                            Maintenance Block
                          </div>
                        </td>
                      );
                    }

                    return (
                      <td
                        key={court.id}
                        onClick={() => handleOpenBookModal(court, time)}
                        className="p-2 border-r border-slate-200 dark:border-slate-800 cursor-pointer group hover:bg-emerald-50/80 dark:hover:bg-emerald-950/30 transition-colors"
                      >
                        <div className="py-2 px-3 rounded-lg border border-dashed border-emerald-300 dark:border-emerald-800/60 group-hover:border-emerald-500 text-center text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold flex items-center justify-center gap-1 transition-all">
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Quick Court Reservation</h3>
                <p className="text-xs text-slate-500">
                  {selectedCourt.name} • {selectedDate} at {selectedTime} (60 Mins)
                </p>
              </div>
              <button
                onClick={() => setShowBookModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {bookingSuccess ? (
              <div className="my-6 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 text-emerald-900 dark:text-emerald-100 text-xs space-y-3">
                <div className="font-bold flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  Booking Confirmed: #{bookingSuccess.bookingNumber}
                </div>
                <div className="space-y-1 text-slate-700 dark:text-slate-300">
                  <p>Booker: <strong>{bookingSuccess.bookerName}</strong> ({bookingSuccess.bookerType})</p>
                  <p>Slot: <strong>{selectedCourt.name}</strong> ({selectedTime} - 60 min)</p>
                  <p>Total Charged: <strong>{formatINR(bookingSuccess.totalPricePaise)}</strong> ({bookingSuccess.paymentMethod})</p>
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => window.print()}
                    className="flex-1 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-semibold flex items-center justify-center gap-1.5"
                  >
                    <Printer className="w-4 h-4" />
                    Print Receipt
                  </button>
                  <button
                    onClick={() => setShowBookModal(false)}
                    className="flex-1 py-2 rounded-lg bg-emerald-600 text-white font-bold"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreateBooking} className="space-y-4 mt-4 text-xs">
                {bookingError && (
                  <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950 border border-red-200 text-red-700 dark:text-red-300 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{bookingError}</span>
                  </div>
                )}

                {/* Booker Type Switcher */}
                <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1">
                  <button
                    type="button"
                    onClick={() => setBookerType("MEMBER")}
                    className={`flex-1 py-1.5 rounded-lg font-bold transition-all ${
                      bookerType === "MEMBER" ? "bg-white dark:bg-slate-700 shadow-xs text-emerald-600" : "text-slate-500"
                    }`}
                  >
                    Registered Member (Tier Pricing)
                  </button>
                  <button
                    type="button"
                    onClick={() => setBookerType("WALK_IN")}
                    className={`flex-1 py-1.5 rounded-lg font-bold transition-all ${
                      bookerType === "WALK_IN" ? "bg-white dark:bg-slate-700 shadow-xs text-emerald-600" : "text-slate-500"
                    }`}
                  >
                    Walk-in / Guest (Full Rate)
                  </button>
                </div>

                {bookerType === "MEMBER" ? (
                  <div>
                    <label className="font-semibold block mb-1">Select Member</label>
                    <select
                      required
                      value={selectedMemberId}
                      onChange={(e) => setSelectedMemberId(e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 font-medium"
                    >
                      <option value="">-- Choose Member (ID / Name / Tier) --</option>
                      {members.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.memberId} - {m.name} ({m.memberships[0]?.tier || 'NO PLAN'})
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-semibold block mb-1">Guest Name</label>
                      <input
                        required
                        type="text"
                        value={guestName}
                        onChange={(e) => setGuestName(e.target.value)}
                        placeholder="e.g. Rahul Sen"
                        className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800"
                      />
                    </div>
                    <div>
                      <label className="font-semibold block mb-1">Phone</label>
                      <input
                        required
                        type="tel"
                        value={guestPhone}
                        onChange={(e) => setGuestPhone(e.target.value)}
                        placeholder="+91 98765 00000"
                        className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800"
                      />
                    </div>
                  </div>
                )}

                {/* Payment Method */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold block mb-1">Payment Method</label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800"
                    >
                      <option value="UPI">UPI (QR / App)</option>
                      <option value="CASH">Cash at Desk</option>
                      <option value="CARD">Credit / Debit Card</option>
                      <option value="FREE_TIER">Gold Free Pass</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-semibold block mb-1">Notes (Optional)</label>
                    <input
                      type="text"
                      value={bookingNotes}
                      onChange={(e) => setBookingNotes(e.target.value)}
                      placeholder="e.g. Needs racket rental"
                      className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowBookModal(false)}
                    className="flex-1 py-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
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
