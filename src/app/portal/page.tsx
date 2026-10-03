"use client";

import React, { useState, useEffect } from "react";
import { formatINR, formatDate, formatDateTime } from "@/lib/formatters";
import { useAuth } from "@/lib/auth-context";
import {
  QrCode,
  Calendar,
  ShoppingBag,
  Coffee,
  FileText,
  CheckCircle2,
  Clock,
  Sparkles,
  AlertCircle,
  Plus,
  ArrowRight,
  ShieldCheck,
  X,
  XCircle,
  Check,
  Tag,
  Zap,
  MapPin,
  ExternalLink,
  Flame,
  Utensils,
  Minus,
  Trash2,
  Users,
  CreditCard,
  ChefHat,
  Send,
  Sun,
  Sunset,
  Moon,
  Filter,
} from "lucide-react";

const ALL_HOURLY_SLOTS = [
  "06:00",
  "07:00",
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "19:00",
  "20:00",
  "21:00",
  "22:00",
];

export default function MemberPortalPage(props: any) {
  const initialTab: "PASS" | "MY_BOOKINGS" | "BOOKINGS" | "CAFE" | "SHOP" | "TABS" | "INVOICES" = props?.initialTab || "PASS";
  const { currentUser } = useAuth();
  const [member, setMember] = useState<any>(null);
  const [courts, setCourts] = useState<any[]>([]);
  const [dayBookings, setDayBookings] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [tables, setTables] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"PASS" | "MY_BOOKINGS" | "BOOKINGS" | "CAFE" | "SHOP" | "TABS" | "INVOICES">(initialTab);
  const [bookingDate, setBookingDate] = useState(new Date().toISOString().split("T")[0]);
  const [bookingFilter, setBookingFilter] = useState<"ALL" | "UPCOMING" | "PAST" | "CANCELLED">("ALL");
  const [selectedSportFilter, setSelectedSportFilter] = useState<string>("ALL");
  const [selectedTimeOfDay, setSelectedTimeOfDay] = useState<string>("ALL");
  const [loading, setLoading] = useState(true);

  // Portal booking state
  const [bookingSuccess, setBookingSuccess] = useState<any>(null);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [selectedBookingModal, setSelectedBookingModal] = useState<any>(null);
  const [confirmSlotModal, setConfirmSlotModal] = useState<{ court: any; time: string } | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [isBookingSubmitting, setIsBookingSubmitting] = useState(false);

  // Bar & Cafe Ordering state
  const [cafeSubTab, setCafeSubTab] = useState<"MENU" | "TABLES" | "ORDERS">("MENU");
  const [selectedMenuCategory, setSelectedMenuCategory] = useState<string>("ALL");
  const [cart, setCart] = useState<Array<{ menuItem: any; quantity: number; notes?: string }>>([]);
  const [orderDestination, setOrderDestination] = useState<"TABLE" | "COUNTER">("COUNTER");
  const [selectedTableId, setSelectedTableId] = useState<string>("");
  const [orderSpecialNotes, setOrderSpecialNotes] = useState<string>("");
  const [orderPlacing, setOrderPlacing] = useState(false);
  const [orderPlacedSuccess, setOrderPlacedSuccess] = useState<any>(null);
  const [orderError, setOrderError] = useState<string | null>(null);

  // Table Reservation state
  const [reservingTableModal, setReservingTableModal] = useState<any>(null);
  const [reservationPartySize, setReservationPartySize] = useState<number>(2);
  const [reservationTime, setReservationTime] = useState<string>("19:00");
  const [reservationNotes, setReservationNotes] = useState<string>("");
  const [reservingTableLoading, setReservingTableLoading] = useState(false);
  const [reservationSuccess, setReservationSuccess] = useState<any>(null);

  const fetchMemberData = async () => {
    setLoading(true);
    try {
      const memId = currentUser?.memberCode || currentUser?.memberId || "me";
      const [memRes, crtRes, prdRes, menuRes, tblRes] = await Promise.all([
        fetch(`/api/members/${memId}`),
        fetch(`/api/courts?date=${bookingDate}`),
        fetch("/api/shop/products"),
        fetch("/api/bar/menu"),
        fetch("/api/bar/tables"),
      ]);
      const memData = await memRes.json();
      const crtData = await crtRes.json();
      const prdData = await prdRes.json();
      const menuData = await menuRes.json();
      const tblData = await tblRes.json();

      if (memData.member) setMember(memData.member);
      if (crtData.courts) setCourts(crtData.courts);
      if (crtData.bookings) setDayBookings(crtData.bookings);
      if (prdData.products) setProducts(prdData.products);
      if (menuData.items) setMenuItems(menuData.items);
      if (tblData.tables) {
        setTables(tblData.tables);
        if (tblData.tables.length > 0 && !selectedTableId) {
          setSelectedTableId(tblData.tables[0].id);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMemberData();
  }, [currentUser, bookingDate]);

  // Keep activeTab in sync with initialTab prop if it changes
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const handlePortalBooking = async (court: any, time: string) => {
    setBookingError(null);
    setBookingSuccess(null);
    setIsBookingSubmitting(true);

    const slotStart = new Date(`${bookingDate}T${time}:00`);

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courtId: court.id,
          memberId: member.id,
          bookerName: member.name,
          bookerPhone: member.phone,
          bookerEmail: member.email,
          startTime: slotStart.toISOString(),
          durationMinutes: 60,
          source: "MEMBER_PORTAL",
          userId: currentUser?.id,
          userName: currentUser?.name,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        setBookingError(data.error || "Booking failed");
      } else {
        setBookingSuccess(data.booking);
        setConfirmSlotModal(null);
        await fetchMemberData();
      }
    } catch (err: any) {
      setBookingError(err.message);
    } finally {
      setIsBookingSubmitting(false);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm("Are you sure you want to cancel this booked slot? Your slot will be released back to the club schedule.")) {
      return;
    }

    setCancellingId(bookingId);
    try {
      const res = await fetch(`/api/bookings?id=${bookingId}&reason=Cancelled+by+member&userId=${currentUser?.id || ""}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        if (selectedBookingModal?.id === bookingId) {
          setSelectedBookingModal(null);
        }
        await fetchMemberData();
      } else {
        alert("Could not cancel booking: " + (data.error || "Unknown error"));
      }
    } catch (e: any) {
      alert("Error cancelling booking: " + e.message);
    } finally {
      setCancellingId(null);
    }
  };

  // Helper to check if a specific time slot is already booked on a court
  const isSlotBooked = (courtId: string, timeStr: string) => {
    const slotStart = new Date(`${bookingDate}T${timeStr}:00`);
    return dayBookings.some((b: any) => {
      if (b.courtId !== courtId) return false;
      if (b.status === "CANCELLED") return false;
      const bStart = new Date(b.startTime);
      const bEnd = new Date(b.endTime);
      return slotStart >= bStart && slotStart < bEnd;
    });
  };

  const isSlotPast = (timeStr: string) => {
    const todayStr = new Date().toISOString().split("T")[0];
    if (bookingDate !== todayStr) return false;
    const [h, m] = timeStr.split(":").map(Number);
    const now = new Date();
    const slotDate = new Date();
    slotDate.setHours(h, m, 0, 0);
    return slotDate < now;
  };

  const getFilteredSlots = () => {
    return ALL_HOURLY_SLOTS.filter((t) => {
      const hour = parseInt(t.split(":")[0]);
      if (selectedTimeOfDay === "MORNING") return hour >= 6 && hour < 12;
      if (selectedTimeOfDay === "AFTERNOON") return hour >= 12 && hour < 17;
      if (selectedTimeOfDay === "EVENING") return hour >= 17 && hour <= 22;
      return true;
    });
  };

  // Cart operations
  const handleAddToCart = (item: any) => {
    setOrderPlacedSuccess(null);
    setOrderError(null);
    setCart((prev) => {
      const existing = prev.find((i) => i.menuItem.id === item.id);
      if (existing) {
        return prev.map((i) => (i.menuItem.id === item.id ? { ...i, quantity: i.quantity + 1 } : i));
      }
      return [...prev, { menuItem: item, quantity: 1 }];
    });
  };

  const handleUpdateCartQty = (itemId: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((i) => {
          if (i.menuItem.id === itemId) {
            const nextQty = i.quantity + delta;
            return nextQty > 0 ? { ...i, quantity: nextQty } : null;
          }
          return i;
        })
        .filter(Boolean) as any;
    });
  };

  const membership = member?.memberships?.[0];
  const plan = membership?.plan;
  const isGold = plan?.tier === "GOLD";
  const barDiscountPercent = plan?.barDiscountPercent || (isGold ? 20 : 10);

  // Calculate cart pricing
  const cartSubtotalPaise = cart.reduce((acc, item) => acc + item.quantity * item.menuItem.pricePaise, 0);
  const cartDiscountPaise = Math.round((cartSubtotalPaise * barDiscountPercent) / 100);
  const cartFinalPaise = cartSubtotalPaise - cartDiscountPaise;

  const handlePlaceBarOrder = async () => {
    if (cart.length === 0) return;
    setOrderPlacing(true);
    setOrderError(null);
    setOrderPlacedSuccess(null);

    try {
      const res = await fetch("/api/bar/tabs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId: member.id,
          tableId: orderDestination === "TABLE" ? selectedTableId : undefined,
          guestName: member.name,
          items: cart.map((i) => ({
            menuItemId: i.menuItem.id,
            quantity: i.quantity,
            unitPricePaise: i.menuItem.pricePaise,
            notes: i.notes || undefined,
          })),
          orderNotes: `${orderDestination === "TABLE" ? "Table Delivery" : "Counter Pick-up"}${orderSpecialNotes ? " — " + orderSpecialNotes : ""}`,
          staffUserId: currentUser?.id,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        setOrderError(data.error || "Failed to place order");
      } else {
        setOrderPlacedSuccess(data.barOrder || { orderNumber: "BO-" + Math.floor(1000 + Math.random() * 9000) });
        setCart([]);
        setOrderSpecialNotes("");
        await fetchMemberData();
      }
    } catch (e: any) {
      setOrderError(e.message);
    } finally {
      setOrderPlacing(false);
    }
  };

  const handleReserveTable = async () => {
    if (!reservingTableModal) return;
    setReservingTableLoading(true);
    try {
      const res = await fetch("/api/bar/tables", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "RESERVE_TABLE",
          tableId: reservingTableModal.id,
          memberId: member?.id,
          reservationName: member?.name || currentUser?.name || "Member",
          guestCount: reservationPartySize,
          reservationTime,
          notes: reservationNotes,
          userId: currentUser?.id,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setReservationSuccess({
          ...data,
          tableName: reservingTableModal.name,
          tableNumber: reservingTableModal.tableNumber,
          partySize: reservationPartySize,
          time: reservationTime,
        });
        setReservingTableModal(null);
        await fetchMemberData();
      } else {
        alert("Table reservation failed: " + (data.error || "Unknown error"));
      }
    } catch (e: any) {
      alert("Error reserving table: " + e.message);
    } finally {
      setReservingTableLoading(false);
    }
  };

  const memberBookings: any[] = member?.bookings || [];
  const now = new Date();

  const filteredBookings = memberBookings.filter((b) => {
    const start = new Date(b.startTime);
    if (bookingFilter === "UPCOMING") {
      return start >= now && b.status !== "CANCELLED";
    }
    if (bookingFilter === "PAST") {
      return start < now || b.status === "COMPLETED";
    }
    if (bookingFilter === "CANCELLED") {
      return b.status === "CANCELLED";
    }
    return true;
  });

  const upcomingCount = memberBookings.filter((b) => new Date(b.startTime) >= now && b.status !== "CANCELLED").length;

  const filteredMenuItems = menuItems.filter((item) => {
    if (selectedMenuCategory === "ALL") return true;
    return item.category === selectedMenuCategory;
  });

  const filteredCourts = courts.filter((court) => {
    if (selectedSportFilter === "ALL") return true;
    return court.sport?.name?.toLowerCase() === selectedSportFilter.toLowerCase();
  });

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
      {/* MEMBER PORTAL HEADER - NYAC Private Quarters Style */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-[#E5DFD5] dark:border-[#1F293D]">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-lg bg-[#921111] text-[#C5A059] border border-[#C5A059]/40 flex items-center justify-center font-serif font-bold text-lg shadow-sm">
            {member?.name ? member.name.slice(0, 2).toUpperCase() : "CC"}
          </div>
          <div>
            <h1 className="font-serif text-xl sm:text-2xl font-bold text-[#0B1320] dark:text-white flex items-center gap-2.5">
              <span>{member?.name || currentUser?.name || "Distinguished Member"}</span>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded font-bold uppercase tracking-wider border border-[#DFCA9B] bg-[#FAF7EE] text-[#8C6D23] dark:bg-[#1C1608] dark:text-[#E3CEA4] dark:border-[#4B3C18]">
                {plan?.tier || "GOLD"} PRIVILEGE
              </span>
            </h1>
            <span className="text-xs text-[#6B7280] dark:text-[#9CA3AF] font-mono">
              Club Member ID: {member?.memberId || currentUser?.memberCode || "CC-1868-001"}
            </span>
          </div>
        </div>

        {/* Tab Navigation - Tracked Uppercase NYAC Style */}
        <div className="flex bg-[#FAF8F5] dark:bg-[#121A28] border border-[#E5DFD5] dark:border-[#222D3E] p-1 rounded-md text-xs font-semibold overflow-x-auto w-full sm:w-auto tracking-wider uppercase">
          <button
            onClick={() => setActiveTab("PASS")}
            className={`px-3 py-1.5 rounded transition-all ${
              activeTab === "PASS"
                ? "bg-[#921111] text-white shadow-sm font-bold"
                : "text-[#4B5563] dark:text-[#9CA3AF] hover:text-[#921111] dark:hover:text-white"
            }`}
          >
            Digital Pass
          </button>
          <button
            onClick={() => setActiveTab("MY_BOOKINGS")}
            className={`px-3 py-1.5 rounded transition-all flex items-center gap-1.5 ${
              activeTab === "MY_BOOKINGS"
                ? "bg-[#921111] text-white shadow-sm font-bold"
                : "text-[#4B5563] dark:text-[#9CA3AF] hover:text-[#921111] dark:hover:text-white"
            }`}
          >
            <span>My Bookings</span>
            {upcomingCount > 0 && (
              <span className="text-[9px] px-1.5 py-0.2 rounded font-mono font-bold bg-[#FAF7EE] text-[#8C6D23] border border-[#DFCA9B]">
                {upcomingCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("BOOKINGS")}
            className={`px-3 py-1.5 rounded transition-all flex items-center gap-1.5 ${
              activeTab === "BOOKINGS"
                ? "bg-[#921111] text-white shadow-sm font-bold"
                : "text-[#4B5563] dark:text-[#9CA3AF] hover:text-[#921111] dark:hover:text-white"
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Book Court</span>
          </button>
          <button
            onClick={() => setActiveTab("CAFE")}
            className={`px-3 py-1.5 rounded transition-all flex items-center gap-1.5 ${
              activeTab === "CAFE"
                ? "bg-[#921111] text-white shadow-sm font-bold"
                : "text-[#4B5563] dark:text-[#9CA3AF] hover:text-[#921111] dark:hover:text-white"
            }`}
          >
            <Coffee className="w-3.5 h-3.5" />
            <span>Dining & Lounge</span>
            {cart.length > 0 && (
              <span className="text-[9px] px-1.5 py-0.2 rounded font-mono font-bold bg-[#C5A059] text-[#0B1320]">
                {cart.reduce((a, b) => a + b.quantity, 0)}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("SHOP")}
            className={`px-3 py-1.5 rounded transition-all ${
              activeTab === "SHOP"
                ? "bg-[#921111] text-white shadow-sm font-bold"
                : "text-[#4B5563] dark:text-[#9CA3AF] hover:text-[#921111] dark:hover:text-white"
            }`}
          >
            Pro Shop
          </button>
          <button
            onClick={() => setActiveTab("TABS")}
            className={`px-3 py-1.5 rounded transition-all ${
              activeTab === "TABS"
                ? "bg-[#921111] text-white shadow-sm font-bold"
                : "text-[#4B5563] dark:text-[#9CA3AF] hover:text-[#921111] dark:hover:text-white"
            }`}
          >
            Member Tabs
          </button>
          <button
            onClick={() => setActiveTab("INVOICES")}
            className={`px-3 py-1.5 rounded transition-all ${
              activeTab === "INVOICES"
                ? "bg-[#921111] text-white shadow-sm font-bold"
                : "text-[#4B5563] dark:text-[#9CA3AF] hover:text-[#921111] dark:hover:text-white"
            }`}
          >
            Statements
          </button>
        </div>
      </div>

      {/* 1. DIGITAL MEMBERSHIP CARD & DASHBOARD OVERVIEW */}
      {activeTab === "PASS" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            {/* DIGITAL CREDENTIAL CARD - NYAC Athletic Club Style */}
            <div
              className={`p-6 rounded-lg relative overflow-hidden shadow-lg flex flex-col justify-between h-80 text-white ${
                isGold
                  ? "bg-[#0B1320] border-2 border-[#C5A059]"
                  : "bg-[#162032] border border-[#334155]"
              }`}
            >
              {/* Gold foil corner emblem */}
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div>
                  <span className="text-[9px] tracking-[0.24em] uppercase font-bold text-[#DFCA9B] block">
                    The Champions Club • Est. 1868
                  </span>
                  <h3 className="font-serif text-lg font-bold tracking-tight text-white">{plan?.name || "Gold All-Access Tier"}</h3>
                </div>
                <div className="w-8 h-8 rounded bg-[#921111] text-[#C5A059] border border-[#C5A059]/40 flex items-center justify-center font-serif text-xs font-bold">
                  👑
                </div>
              </div>

              <div className="flex items-center justify-between my-auto py-2">
                <div>
                  <span className="text-[9px] text-[#9CA3AF] block uppercase tracking-[0.2em]">Member Credential</span>
                  <span className="font-serif font-bold text-lg tracking-wide text-white block mt-0.5">{member?.name || currentUser?.name || "Member"}</span>
                  <span className="font-mono text-xs block text-[#DFCA9B] mt-1">ID: {member?.memberId || currentUser?.memberCode}</span>
                </div>
                <div className="p-2 rounded bg-white text-slate-950 shadow-sm border-2 border-[#C5A059]/60">
                  <QrCode className="w-14 h-14" />
                </div>
              </div>

              <div className="pt-3 border-t border-white/10 flex items-center justify-between text-[11px]">
                <span className="text-[#9CA3AF]">Valid Through: <strong className="text-white font-mono">{membership?.endDate ? formatDate(membership.endDate) : "Indefinite"}</strong></span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-[#FAF7EE] text-[#8C6D23] border border-[#DFCA9B]">
                  {member?.status || "ACTIVE"}
                </span>
              </div>
            </div>

            {/* PLAN ENTITLEMENTS & PRIVILEGES */}
            <div className="md:col-span-2 p-6 rounded-lg bg-white dark:bg-[#0E1522] border border-[#E5DFD5] dark:border-[#222D3E] shadow-sm space-y-4 text-xs">
              <div className="flex items-center justify-between border-b border-[#E5DFD5] dark:border-[#222D3E] pb-3">
                <h3 className="font-serif text-base font-bold text-[#0B1320] dark:text-white">Tier Privileges & Daily Allowances</h3>
                <span className="text-[10px] font-bold text-[#8C6D23] uppercase tracking-wider">Active Entitlements</span>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="p-3.5 rounded-md bg-[#FAF8F5] dark:bg-[#121A28] border border-[#E5DFD5] dark:border-[#222D3E]">
                  <span className="text-[#8C6D23] dark:text-[#DFCA9B] font-bold text-[10px] uppercase tracking-wider block">Court Access Tariff</span>
                  <span className="font-serif font-bold text-base text-[#0B1320] dark:text-white mt-0.5 block">
                    {plan?.courtRatePerHourPaise === 0 ? "100% Complimentary" : `${formatINR(plan?.courtRatePerHourPaise || 0)} / hr`}
                  </span>
                  <span className="text-[10px] text-[#6B7280] dark:text-[#9CA3AF] block mt-0.5">Max {plan?.maxBookingsPerDay || 2} reservations per day</span>
                </div>

                <div className="p-3.5 rounded-md bg-[#FAF8F5] dark:bg-[#121A28] border border-[#E5DFD5] dark:border-[#222D3E]">
                  <span className="text-[#8C6D23] dark:text-[#DFCA9B] font-bold text-[10px] uppercase tracking-wider block">Official Pro Shop</span>
                  <span className="font-serif font-bold text-base text-[#0B1320] dark:text-white mt-0.5 block">
                    {plan?.shopDiscountPercent || 15}% Member Allowance
                  </span>
                  <span className="text-[10px] text-[#6B7280] dark:text-[#9CA3AF] block mt-0.5">Applied on apparel & racquets</span>
                </div>

                <div className="p-3.5 rounded-md bg-[#FAF8F5] dark:bg-[#121A28] border border-[#E5DFD5] dark:border-[#222D3E]">
                  <span className="text-[#8C6D23] dark:text-[#DFCA9B] font-bold text-[10px] uppercase tracking-wider block">Clubhouse Dining & Bar</span>
                  <span className="font-serif font-bold text-base text-[#0B1320] dark:text-white mt-0.5 block">
                    {plan?.barDiscountPercent || 20}% F&B Privilege
                  </span>
                  <span className="text-[10px] text-[#6B7280] dark:text-[#9CA3AF] block mt-0.5">Credited on personal running tab</span>
                </div>

                <div className="p-3.5 rounded-md bg-[#FAF8F5] dark:bg-[#121A28] border border-[#E5DFD5] dark:border-[#222D3E]">
                  <span className="text-[#8C6D23] dark:text-[#DFCA9B] font-bold text-[10px] uppercase tracking-wider block">Advance Booking Window</span>
                  <span className="font-serif font-bold text-base text-[#0B1320] dark:text-white mt-0.5 block">
                    {plan?.advanceBookingDays || 14} Days Priority
                  </span>
                  <span className="text-[10px] text-[#6B7280] dark:text-[#9CA3AF] block mt-0.5">Preferred floodlit slot reservation</span>
                </div>
              </div>
            </div>
          </div>

          {/* UPCOMING COURT BOOKINGS HIGHLIGHT WIDGET */}
          <div className="p-6 rounded-lg bg-white dark:bg-[#0E1522] border border-[#E5DFD5] dark:border-[#222D3E] shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5DFD5] dark:border-[#222D3E]">
              <div>
                <h3 className="font-serif text-base font-bold text-[#0B1320] dark:text-white flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#921111] dark:text-[#C5A059]" />
                  <span>Upcoming Court Bookings</span>
                </h3>
                <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">Your scheduled court times and active match reservations.</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab("MY_BOOKINGS")}
                  className="text-xs font-bold text-[#8C6D23] dark:text-[#DFCA9B] hover:underline flex items-center gap-1 uppercase tracking-wider"
                >
                  <span>All Bookings ({memberBookings.length})</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setActiveTab("BOOKINGS")}
                  className="px-3 py-1.5 rounded-md bg-[#921111] hover:bg-[#720C0C] text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1 shadow-sm transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Reserve Slot</span>
                </button>
              </div>
            </div>

            {memberBookings.filter((b) => new Date(b.startTime) >= now && b.status !== "CANCELLED").length === 0 ? (
              <div className="text-center py-8 rounded-lg bg-[#FAF8F5] dark:bg-[#121A28] border border-dashed border-[#E5DFD5] dark:border-[#222D3E]">
                <Calendar className="w-8 h-8 text-[#8C6D23]/50 dark:text-[#C5A059]/50 mx-auto mb-2" />
                <p className="font-serif text-sm font-bold text-[#0B1320] dark:text-white">No upcoming court slots scheduled</p>
                <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF] mt-0.5">Reserve championship tennis, squash, padel or badminton courts today.</p>
                <button
                  onClick={() => setActiveTab("BOOKINGS")}
                  className="mt-3 px-4 py-2 rounded-md bg-[#921111] hover:bg-[#720C0C] text-white font-bold text-xs uppercase tracking-wider inline-flex items-center gap-1.5 shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Reserve Court Slot</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                {memberBookings
                  .filter((b) => new Date(b.startTime) >= now && b.status !== "CANCELLED")
                  .slice(0, 3)
                  .map((b) => (
                    <div
                      key={b.id}
                      onClick={() => setSelectedBookingModal(b)}
                      className="p-4 rounded-md border border-[#E5DFD5] dark:border-[#222D3E] bg-[#FAF8F5] dark:bg-[#121A28] hover:border-[#C5A059] cursor-pointer transition-all space-y-2.5 group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-serif font-bold text-sm text-[#0B1320] dark:text-white flex items-center gap-1.5">
                          <span>{b.court?.sport?.icon || "🎾"}</span>
                          <span>{b.court?.name}</span>
                        </span>
                        <span className="text-[9px] font-mono px-2 py-0.5 rounded font-bold uppercase tracking-wider bg-[#C5A059]/15 text-[#8C6D23] dark:text-[#DFCA9B] border border-[#C5A059]/30">
                          {b.status}
                        </span>
                      </div>
                      <div className="text-xs text-[#4B5563] dark:text-[#9CA3AF] flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-[#8C6D23]" />
                        <span className="font-mono">{formatDateTime(b.startTime)}</span>
                      </div>
                      <div className="pt-2 border-t border-[#E5DFD5] dark:border-[#222D3E] flex items-center justify-between text-[11px]">
                        <span className="font-mono text-[#6B7280] text-[10px]">{b.bookingNumber}</span>
                        <span className="font-bold text-[#921111] dark:text-[#DFCA9B] group-hover:underline uppercase tracking-wider text-[10px]">
                          Match Pass →
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. DEDICATED MY SLOT BOOKINGS VIEW */}
      {activeTab === "MY_BOOKINGS" && (
        <div className="p-6 rounded-lg bg-white dark:bg-[#0E1522] border border-[#E5DFD5] dark:border-[#222D3E] shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#E5DFD5] dark:border-[#222D3E]">
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="font-serif text-lg font-bold text-[#0B1320] dark:text-white">My Court Reservations</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase tracking-wider bg-[#921111]/10 text-[#921111] dark:text-[#E89999] border border-[#921111]/20">
                  {filteredBookings.length} SLOTS
                </span>
              </div>
              <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF] mt-0.5">
                Review your active reservations, digital check-in passes, and match record history.
              </p>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
              <button
                onClick={() => setActiveTab("BOOKINGS")}
                className="px-4 py-2 rounded-md bg-[#921111] hover:bg-[#720C0C] text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Reserve Court Slot</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-md bg-[#FAF8F5] dark:bg-[#121A28] border border-[#E5DFD5] dark:border-[#222D3E]">
              <span className="text-[10px] text-[#8C6D23] dark:text-[#DFCA9B] font-bold uppercase tracking-wider block">Upcoming Matches</span>
              <span className="text-xl font-bold font-serif text-[#0B1320] dark:text-white mt-0.5 block">
                {upcomingCount}
              </span>
            </div>
            <div className="p-3.5 rounded-md bg-[#FAF8F5] dark:bg-[#121A28] border border-[#E5DFD5] dark:border-[#222D3E]">
              <span className="text-[10px] text-[#8C6D23] dark:text-[#DFCA9B] font-bold uppercase tracking-wider block">Season Total</span>
              <span className="text-xl font-bold font-serif text-[#0B1320] dark:text-white mt-0.5 block">
                {memberBookings.length}
              </span>
            </div>
            <div className="p-3.5 rounded-md bg-[#FAF8F5] dark:bg-[#121A28] border border-[#E5DFD5] dark:border-[#222D3E]">
              <span className="text-[10px] text-[#8C6D23] dark:text-[#DFCA9B] font-bold uppercase tracking-wider block">Tier Privilege</span>
              <span className="text-base font-bold font-serif text-[#921111] dark:text-[#DFCA9B] mt-0.5 block">
                {isGold ? "Complimentary (100%)" : "50% Tariff Subsidy"}
              </span>
            </div>
            <div className="p-3.5 rounded-md bg-[#FAF8F5] dark:bg-[#121A28] border border-[#E5DFD5] dark:border-[#222D3E]">
              <span className="text-[10px] text-[#8C6D23] dark:text-[#DFCA9B] font-bold uppercase tracking-wider block">Daily Allowance</span>
              <span className="text-base font-bold font-serif text-[#0B1320] dark:text-white mt-0.5 block">
                Max {plan?.maxBookingsPerDay || 2} Slots / Day
              </span>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2 border-b border-[#E5DFD5] dark:border-[#222D3E] pb-3 overflow-x-auto">
            {(["ALL", "UPCOMING", "PAST", "CANCELLED"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setBookingFilter(tab)}
                className={`px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all ${
                  bookingFilter === tab
                    ? "bg-[#921111] text-white shadow-xs"
                    : "text-[#6B7280] dark:text-[#9CA3AF] hover:text-[#0B1320] dark:hover:text-white hover:bg-[#FAF8F5] dark:hover:bg-[#121A28]"
                }`}
              >
                {tab === "ALL" && `All Slots (${memberBookings.length})`}
                {tab === "UPCOMING" && `Upcoming (${upcomingCount})`}
                {tab === "PAST" && `Past / Played (${memberBookings.filter((b) => new Date(b.startTime) < now).length})`}
                {tab === "CANCELLED" && `Cancelled (${memberBookings.filter((b) => b.status === "CANCELLED").length})`}
              </button>
            ))}
          </div>

          {/* Bookings List Cards */}
          {filteredBookings.length === 0 ? (
            <div className="text-center py-12 rounded-lg bg-[#FAF8F5] dark:bg-[#121A28] border border-dashed border-[#E5DFD5] dark:border-[#222D3E] space-y-3">
              <Calendar className="w-12 h-12 text-[#C5A059]/40 mx-auto" />
              <div className="space-y-1">
                <h4 className="font-serif font-bold text-[#0B1320] dark:text-white text-sm">No reservations found</h4>
                <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF] max-w-sm mx-auto">
                  {bookingFilter === "UPCOMING"
                    ? "You have no upcoming matches scheduled. Select an athletic court to reserve your slot."
                    : "No match records matched your selected filter."}
                </p>
              </div>
              <button
                onClick={() => setActiveTab("BOOKINGS")}
                className="px-4 py-2 rounded-md bg-[#921111] hover:bg-[#720C0C] text-white font-bold text-xs uppercase tracking-wider inline-flex items-center gap-1.5 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Reserve Court Slot</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredBookings.map((booking) => {
                const isUpcoming = new Date(booking.startTime) >= now && booking.status !== "CANCELLED";
                const isCancelled = booking.status === "CANCELLED";

                return (
                  <div
                    key={booking.id}
                    className={`p-5 rounded-lg border transition-all space-y-4 ${
                      isCancelled
                        ? "bg-[#FAF8F5]/50 dark:bg-[#121A28]/50 border-[#E5DFD5] dark:border-[#222D3E] opacity-70"
                        : isUpcoming
                        ? "bg-white dark:bg-[#0E1522] border-[#C5A059]/60 shadow-sm hover:border-[#C5A059]"
                        : "bg-white dark:bg-[#0E1522] border-[#E5DFD5] dark:border-[#222D3E]"
                    }`}
                  >
                    {/* Header: Court & Status */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-md bg-[#FAF8F5] dark:bg-[#121A28] border border-[#E5DFD5] dark:border-[#222D3E] flex items-center justify-center text-xl shrink-0">
                          {booking.court?.sport?.icon || "🎾"}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-serif font-bold text-[#0B1320] dark:text-white text-sm">
                              {booking.court?.name}
                            </h4>
                            {booking.isPeak && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#C5A059]/15 text-[#8C6D23] dark:text-[#DFCA9B] border border-[#C5A059]/30 font-bold uppercase tracking-wider flex items-center gap-0.5">
                                <Flame className="w-2.5 h-2.5" />
                                <span>Floodlights</span>
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-[#6B7280] dark:text-[#9CA3AF]">
                            {booking.court?.surfaceType} Surface • {booking.court?.sport?.name || "Court"}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`text-[9px] font-mono px-2.5 py-1 rounded font-bold uppercase tracking-wider ${
                          isCancelled
                            ? "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300 border border-red-200 dark:border-red-900"
                            : isUpcoming
                            ? "bg-[#C5A059]/15 text-[#8C6D23] dark:text-[#DFCA9B] border border-[#C5A059]/40"
                            : "bg-[#FAF8F5] text-[#4B5563] dark:bg-[#121A28] dark:text-[#9CA3AF] border border-[#E5DFD5] dark:border-[#222D3E]"
                        }`}
                      >
                        {booking.status}
                      </span>
                    </div>

                    {/* Match Slot Details */}
                    <div className="grid grid-cols-2 gap-2 p-3 rounded-md bg-[#FAF8F5] dark:bg-[#121A28] border border-[#E5DFD5]/60 dark:border-[#222D3E] text-xs">
                      <div>
                        <span className="text-[9px] text-[#8C6D23] dark:text-[#DFCA9B] uppercase font-bold tracking-wider block">Date & Time</span>
                        <span className="font-serif font-bold text-[#0B1320] dark:text-white mt-0.5 block">
                          {formatDateTime(booking.startTime)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] text-[#8C6D23] dark:text-[#DFCA9B] uppercase font-bold tracking-wider block">Duration</span>
                        <span className="font-serif font-bold text-[#0B1320] dark:text-white mt-0.5 block">
                          {booking.durationMinutes || 60} Minutes
                        </span>
                      </div>
                      <div className="pt-2 border-t border-[#E5DFD5] dark:border-[#222D3E]">
                        <span className="text-[9px] text-[#8C6D23] dark:text-[#DFCA9B] uppercase font-bold tracking-wider block">Pass Voucher</span>
                        <span className="font-mono font-bold text-[#0B1320] dark:text-white text-[11px]">
                          {booking.bookingNumber}
                        </span>
                      </div>
                      <div className="pt-2 border-t border-[#E5DFD5] dark:border-[#222D3E]">
                        <span className="text-[9px] text-[#8C6D23] dark:text-[#DFCA9B] uppercase font-bold tracking-wider block">Pricing Tariff</span>
                        <span className="font-bold text-[#921111] dark:text-[#DFCA9B]">
                          {booking.totalPricePaise === 0
                            ? "Complimentary (Perk)"
                            : formatINR(booking.totalPricePaise)}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between gap-2 pt-1">
                      <button
                        onClick={() => setSelectedBookingModal(booking)}
                        className="px-3 py-1.5 rounded-md border border-[#C5A059] hover:bg-[#C5A059]/10 text-[#0B1320] dark:text-[#DFCA9B] text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors"
                      >
                        <QrCode className="w-3.5 h-3.5 text-[#8C6D23]" />
                        <span>Match Pass & QR</span>
                      </button>

                      {isUpcoming && (
                        <button
                          disabled={cancellingId === booking.id}
                          onClick={() => handleCancelBooking(booking.id)}
                          className="px-3 py-1.5 rounded-md border border-red-200 dark:border-red-900/60 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors disabled:opacity-50"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>{cancellingId === booking.id ? "Cancelling..." : "Cancel Slot"}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 3. RESERVE A COURT VIEW (COMPREHENSIVE HOURLY SLOTS) */}
      {activeTab === "BOOKINGS" && (
        <div className="p-6 rounded-lg bg-white dark:bg-[#0E1522] border border-[#E5DFD5] dark:border-[#222D3E] shadow-sm space-y-6">
          {/* Header & Controls */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-4 border-b border-[#E5DFD5] dark:border-[#222D3E]">
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="font-serif text-lg font-bold text-[#0B1320] dark:text-white">Reserve Championship Court</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase tracking-wider bg-[#C5A059]/15 text-[#8C6D23] dark:text-[#DFCA9B] border border-[#C5A059]/40">
                  06:00 – 23:00 DAILY
                </span>
              </div>
              <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF] mt-0.5">
                Standard 60-minute bookable slots across Tennis, Badminton, Padel & Cricket facilities.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-between lg:justify-end">
              <button
                onClick={() => setActiveTab("MY_BOOKINGS")}
                className="text-xs font-bold text-[#8C6D23] dark:text-[#DFCA9B] hover:underline flex items-center gap-1 uppercase tracking-wider"
              >
                <span>My Booked Slots ({upcomingCount})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <div className="flex items-center gap-2 bg-[#FAF8F5] dark:bg-[#121A28] p-1 rounded-md border border-[#E5DFD5] dark:border-[#222D3E]">
                <span className="text-[10px] uppercase font-bold text-[#8C6D23] dark:text-[#DFCA9B] tracking-wider pl-2">Date:</span>
                <input
                  type="date"
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                  className="p-1.5 rounded border border-[#E5DFD5] dark:border-[#222D3E] bg-white dark:bg-[#0E1522] text-xs font-bold text-[#0B1320] dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Time & Sport Filter Bars */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-[#FAF8F5] dark:bg-[#121A28] p-3 rounded-lg border border-[#E5DFD5] dark:border-[#222D3E] text-xs">
            {/* Sport Filter */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
              <span className="text-[10px] font-bold text-[#8C6D23] dark:text-[#DFCA9B] uppercase tracking-wider shrink-0 mr-1">
                Sport:
              </span>
              {[
                { id: "ALL", label: "All Courts" },
                { id: "Tennis", label: "🎾 Tennis" },
                { id: "Badminton", label: "🏸 Badminton" },
                { id: "Padel", label: "🎾 Padel" },
                { id: "Cricket", label: "🏏 Cricket" },
              ].map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSelectedSportFilter(s.id)}
                  className={`px-3 py-1.5 rounded-md font-bold text-xs uppercase tracking-wider transition-all whitespace-nowrap ${
                    selectedSportFilter.toLowerCase() === s.id.toLowerCase()
                      ? "bg-[#921111] text-white shadow-xs"
                      : "bg-white dark:bg-[#0E1522] border border-[#E5DFD5] dark:border-[#222D3E] text-[#4B5563] dark:text-[#9CA3AF] hover:border-[#C5A059]"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {/* Time of Day Filter */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
              <span className="text-[10px] font-bold text-[#8C6D23] dark:text-[#DFCA9B] uppercase tracking-wider shrink-0 mr-1">
                Session:
              </span>
              {[
                { id: "ALL", label: "All Hours (06-23)", icon: Clock },
                { id: "MORNING", label: "Morning (06-12)", icon: Sun },
                { id: "AFTERNOON", label: "Afternoon (12-17)", icon: Sunset },
                { id: "EVENING", label: "Evening (17-23) 💡", icon: Moon },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTimeOfDay(t.id)}
                  className={`px-3 py-1.5 rounded-md font-bold text-xs uppercase tracking-wider transition-all whitespace-nowrap flex items-center gap-1 ${
                    selectedTimeOfDay === t.id
                      ? "bg-[#0B1320] text-white dark:bg-white dark:text-[#0B1320] shadow-xs"
                      : "bg-white dark:bg-[#0E1522] border border-[#E5DFD5] dark:border-[#222D3E] text-[#4B5563] dark:text-[#9CA3AF] hover:border-[#C5A059]"
                  }`}
                >
                  <span>{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Feedback alerts */}
          {bookingError && (
            <div className="p-3.5 rounded-md bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{bookingError}</span>
            </div>
          )}

          {bookingSuccess && (
            <div className="p-4 rounded-md bg-[#C5A059]/15 border border-[#C5A059]/40 text-[#0B1320] dark:text-white text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-[#8C6D23] dark:text-[#DFCA9B] shrink-0" />
                <div>
                  <p className="font-serif font-bold text-sm">Court Slot #{bookingSuccess.bookingNumber} Confirmed</p>
                  <p className="text-[11px] text-[#6B7280] dark:text-[#9CA3AF] mt-0.5">
                    Your match reservation has been locked into the club register. Check your digital match voucher anytime.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedBookingModal(bookingSuccess);
                  setActiveTab("MY_BOOKINGS");
                }}
                className="px-4 py-2 rounded-md bg-[#921111] hover:bg-[#720C0C] text-white font-bold text-xs uppercase tracking-wider shrink-0 transition-all shadow-sm"
              >
                View Match Pass
              </button>
            </div>
          )}

          {/* Courts Grid with Full Hourly Slots */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {filteredCourts.map((court) => {
              const courtHourlyRate = isGold ? 0 : Math.round(court.hourlyRatePaise / 2);
              const slotsToDisplay = getFilteredSlots();

              return (
                <div
                  key={court.id}
                  className="p-5 rounded-lg border border-[#E5DFD5] dark:border-[#222D3E] bg-[#FAF8F5]/60 dark:bg-[#121A28]/60 hover:border-[#C5A059] transition-all space-y-4"
                >
                  {/* Court Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-md bg-white dark:bg-[#0E1522] border border-[#E5DFD5] dark:border-[#222D3E] flex items-center justify-center text-2xl shrink-0">
                        {court.sport?.icon || "🎾"}
                      </div>
                      <div>
                        <h4 className="font-serif font-bold text-sm text-[#0B1320] dark:text-white">
                          {court.name}
                        </h4>
                        <p className="text-[11px] text-[#6B7280] dark:text-[#9CA3AF]">
                          {court.surfaceType} Surface • {court.isIndoor ? "Indoor" : "Outdoor"} • {court.sport?.name}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-serif font-bold text-[#921111] dark:text-[#DFCA9B] block">
                        {isGold ? "Complimentary (Gold)" : formatINR(courtHourlyRate) + " / hr"}
                      </span>
                      <span className="text-[10px] text-[#8C6D23] dark:text-[#DFCA9B] uppercase font-bold tracking-wider">60 Min Sessions</span>
                    </div>
                  </div>

                  {/* Hourly Slot Buttons (06:00 to 22:00) */}
                  <div>
                    <div className="flex items-center justify-between pb-2 text-[10px] font-bold text-[#8C6D23] dark:text-[#DFCA9B] uppercase tracking-wider">
                      <span>Available 60-Minute Slots:</span>
                      <span className="font-mono text-[#6B7280] dark:text-[#9CA3AF]">
                        {slotsToDisplay.filter((t) => !isSlotBooked(court.id, t) && !isSlotPast(t)).length} open slots
                      </span>
                    </div>

                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5">
                      {slotsToDisplay.map((t) => {
                        const booked = isSlotBooked(court.id, t);
                        const past = isSlotPast(t);
                        const isEvening = parseInt(t.split(":")[0]) >= 18;

                        if (booked) {
                          return (
                            <div
                              key={t}
                              className="py-1.5 px-1 rounded-md bg-[#FAF8F5] dark:bg-[#121A28] border border-[#E5DFD5] dark:border-[#222D3E] text-[#9CA3AF] text-center text-[10px] font-mono font-bold cursor-not-allowed select-none opacity-60"
                              title="Slot already booked"
                            >
                              <span>{t}</span>
                              <span className="block text-[8px] uppercase tracking-tighter opacity-80">Booked</span>
                            </div>
                          );
                        }

                        if (past) {
                          return (
                            <div
                              key={t}
                              className="py-1.5 px-1 rounded-md bg-[#FAF8F5]/40 dark:bg-[#121A28]/40 border border-[#E5DFD5]/40 dark:border-[#222D3E]/40 text-[#9CA3AF]/60 text-center text-[10px] font-mono cursor-not-allowed select-none opacity-40"
                              title="Slot time has passed"
                            >
                              <span>{t}</span>
                              <span className="block text-[8px] uppercase tracking-tighter">Past</span>
                            </div>
                          );
                        }

                        return (
                          <button
                            key={t}
                            onClick={() => setConfirmSlotModal({ court, time: t })}
                            className={`py-1.5 px-1 rounded-md font-bold text-[11px] font-mono transition-all text-center border relative group ${
                              isEvening
                                ? "bg-white dark:bg-[#0E1522] hover:bg-[#921111] hover:text-white border-[#C5A059]/60 text-[#0B1320] dark:text-white hover:border-[#921111]"
                                : "bg-white dark:bg-[#0E1522] hover:bg-[#921111] hover:text-white border-[#E5DFD5] dark:border-[#222D3E] text-[#0B1320] dark:text-white hover:border-[#921111]"
                            }`}
                          >
                            <span>{t}</span>
                            {isEvening && (
                              <span className="absolute -top-1.5 -right-1 text-[9px] group-hover:hidden">💡</span>
                            )}
                            <span className="block text-[8px] text-[#8C6D23] dark:text-[#DFCA9B] group-hover:text-white font-sans uppercase tracking-tight font-bold">
                              Book
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. BAR, LOUNGE & CAFETERIA (ORDER ITEMS & BOOK TABLES) */}
      {activeTab === "CAFE" && (
        <div className="p-6 rounded-lg bg-white dark:bg-[#0E1522] border border-[#E5DFD5] dark:border-[#222D3E] shadow-sm space-y-6">
          {/* Cafe Sub-Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#E5DFD5] dark:border-[#222D3E]">
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="font-serif text-lg font-bold text-[#0B1320] dark:text-white">Champions Clubhouse Dining & Lounge</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase tracking-wider bg-[#C5A059]/15 text-[#8C6D23] dark:text-[#DFCA9B] border border-[#C5A059]/40">
                  {barDiscountPercent}% TIER PRIVILEGE
                </span>
              </div>
              <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF] mt-0.5">
                Order post-match refreshments, artisanal nutrition & spirits charged directly to your club running tab.
              </p>
            </div>

            {/* Sub-Navigation */}
            <div className="flex bg-[#FAF8F5] dark:bg-[#121A28] p-1 rounded-md border border-[#E5DFD5] dark:border-[#222D3E] text-xs font-semibold">
              <button
                onClick={() => setCafeSubTab("MENU")}
                className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 uppercase tracking-wider text-[11px] ${
                  cafeSubTab === "MENU" ? "bg-[#921111] text-white shadow-xs font-bold" : "text-[#6B7280] dark:text-[#9CA3AF]"
                }`}
              >
                <Utensils className="w-3.5 h-3.5" />
                <span>Food & Drinks</span>
              </button>
              <button
                onClick={() => setCafeSubTab("TABLES")}
                className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 uppercase tracking-wider text-[11px] ${
                  cafeSubTab === "TABLES" ? "bg-[#921111] text-white shadow-xs font-bold" : "text-[#6B7280] dark:text-[#9CA3AF]"
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Reserve Table</span>
              </button>
              <button
                onClick={() => setCafeSubTab("ORDERS")}
                className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 uppercase tracking-wider text-[11px] ${
                  cafeSubTab === "ORDERS" ? "bg-[#921111] text-white shadow-xs font-bold" : "text-[#6B7280] dark:text-[#9CA3AF]"
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Running Tab</span>
              </button>
            </div>
          </div>

          {/* Feedback alerts */}
          {orderPlacedSuccess && (
            <div className="p-4 rounded-md bg-[#C5A059]/15 border border-[#C5A059]/40 text-[#0B1320] dark:text-white text-xs flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <ChefHat className="w-6 h-6 text-[#921111] shrink-0" />
                <div>
                  <p className="font-serif font-bold text-sm">Order #{orderPlacedSuccess.orderNumber} Dispatched to Kitchen & Bar</p>
                  <p className="text-[11px] text-[#6B7280] dark:text-[#9CA3AF] mt-0.5">
                    Your order has been routed to the Kitchen Display System (KDS). {barDiscountPercent}% member privilege automatically applied.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setCafeSubTab("ORDERS")}
                className="px-3.5 py-1.5 rounded-md bg-[#921111] hover:bg-[#720C0C] text-white font-bold text-xs uppercase tracking-wider shrink-0 shadow-xs"
              >
                View Tab
              </button>
            </div>
          )}

          {reservationSuccess && (
            <div className="p-4 rounded-md bg-[#FAF8F5] dark:bg-[#121A28] border border-[#C5A059]/40 text-[#0B1320] dark:text-white text-xs flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Users className="w-6 h-6 text-[#8C6D23] dark:text-[#DFCA9B] shrink-0" />
                <div>
                  <p className="font-serif font-bold text-sm">Table Reserved Successfully • Code: {reservationSuccess.reservationCode}</p>
                  <p className="text-[11px] text-[#6B7280] dark:text-[#9CA3AF] mt-0.5">
                    {reservationSuccess.tableName} has been reserved for {reservationSuccess.partySize} guests at {reservationSuccess.time}.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setReservationSuccess(null)}
                className="px-3.5 py-1.5 rounded-md bg-[#921111] hover:bg-[#720C0C] text-white font-bold text-xs uppercase tracking-wider shrink-0 shadow-xs"
              >
                Done
              </button>
            </div>
          )}

          {orderError && (
            <div className="p-3.5 rounded-md bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{orderError}</span>
            </div>
          )}

          {/* SUB-VIEW 1: MENU & ORDERING */}
          {cafeSubTab === "MENU" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              {/* Menu Catalog (Left 2 Cols) */}
              <div className="lg:col-span-2 space-y-4">
                {/* Category Filter Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-[#E5DFD5] dark:border-[#222D3E] text-xs">
                  {[
                    { id: "ALL", label: "All Offerings" },
                    { id: "HOT_BEVERAGES", label: "☕ Hot Beverages" },
                    { id: "COLD_BEVERAGES", label: "🥤 Cold Drinks" },
                    { id: "HEALTH_SHAKES", label: "🥑 Protein & Health" },
                    { id: "SNACKS", label: "🥪 Club Sandwiches & Snacks" },
                    { id: "MEALS", label: "🍛 Clubhouse Meals" },
                    { id: "DESSERTS", label: "🍰 Desserts" },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedMenuCategory(cat.id)}
                      className={`px-3 py-1.5 rounded-md whitespace-nowrap text-xs font-bold uppercase tracking-wider transition-all ${
                        selectedMenuCategory === cat.id
                          ? "bg-[#921111] text-white shadow-xs"
                          : "bg-white dark:bg-[#0E1522] border border-[#E5DFD5] dark:border-[#222D3E] text-[#4B5563] dark:text-[#9CA3AF] hover:border-[#C5A059]"
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                {/* Menu Items Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {filteredMenuItems.map((item) => {
                    const discountedPricePaise = item.pricePaise - Math.round((item.pricePaise * barDiscountPercent) / 100);
                    const itemInCart = cart.find((i) => i.menuItem.id === item.id);

                    return (
                      <div
                        key={item.id}
                        className="p-4 rounded-lg border border-[#E5DFD5] dark:border-[#222D3E] bg-[#FAF8F5]/60 dark:bg-[#121A28]/60 hover:border-[#C5A059] transition-all flex flex-col justify-between space-y-3"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span className="text-[9px] font-mono font-bold text-[#8C6D23] dark:text-[#DFCA9B] uppercase tracking-wider block">
                                {item.category.replace("_", " ")}
                              </span>
                              <h4 className="font-serif font-bold text-[#0B1320] dark:text-white text-sm mt-0.5">
                                {item.name}
                              </h4>
                            </div>
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#C5A059]/15 text-[#8C6D23] dark:text-[#DFCA9B] border border-[#C5A059]/30 font-bold uppercase tracking-wider shrink-0">
                              {barDiscountPercent}% Off
                            </span>
                          </div>
                          {item.description && (
                            <p className="text-[11px] text-[#6B7280] dark:text-[#9CA3AF] mt-1 line-clamp-2">
                              {item.description}
                            </p>
                          )}
                        </div>

                        <div className="pt-2 border-t border-[#E5DFD5] dark:border-[#222D3E] flex items-center justify-between">
                          <div>
                            <div className="flex items-baseline gap-1.5">
                              <span className="font-serif font-bold text-sm text-[#0B1320] dark:text-white">
                                {formatINR(discountedPricePaise)}
                              </span>
                              <span className="text-[10px] text-[#9CA3AF] line-through">
                                {formatINR(item.pricePaise)}
                              </span>
                            </div>
                            <span className="text-[9px] text-[#8C6D23] dark:text-[#DFCA9B] uppercase tracking-wider font-bold block">Member Tariff</span>
                          </div>

                          {itemInCart ? (
                            <div className="flex items-center gap-1.5 bg-[#921111] text-white rounded-md p-1 shadow-xs">
                              <button
                                onClick={() => handleUpdateCartQty(item.id, -1)}
                                className="w-6 h-6 rounded hover:bg-[#720C0C] flex items-center justify-center font-bold"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span className="font-mono font-bold text-xs px-1">{itemInCart.quantity}</span>
                              <button
                                onClick={() => handleUpdateCartQty(item.id, 1)}
                                className="w-6 h-6 rounded hover:bg-[#720C0C] flex items-center justify-center font-bold"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleAddToCart(item)}
                              className="px-3 py-1.5 rounded-md bg-[#921111] hover:bg-[#720C0C] text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1 shadow-xs transition-colors"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Add</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Order Cart & Destination (Right Col) */}
              <div className="p-5 rounded-lg bg-[#FAF8F5] dark:bg-[#121A28] border border-[#E5DFD5] dark:border-[#222D3E] space-y-5 sticky top-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#E5DFD5] dark:border-[#222D3E]">
                  <div className="flex items-center gap-2">
                    <Coffee className="w-4 h-4 text-[#921111] dark:text-[#C5A059]" />
                    <h4 className="font-serif font-bold text-[#0B1320] dark:text-white text-sm">Your Order</h4>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#C5A059]/15 text-[#8C6D23] dark:text-[#DFCA9B] border border-[#C5A059]/30 font-bold uppercase tracking-wider">
                    {cart.reduce((a, b) => a + b.quantity, 0)} Items
                  </span>
                </div>

                {cart.length === 0 ? (
                  <div className="text-center py-8 space-y-2">
                    <Utensils className="w-8 h-8 text-[#C5A059]/40 mx-auto" />
                    <p className="font-serif text-xs font-bold text-[#0B1320] dark:text-white">Your tray is empty</p>
                    <p className="text-[11px] text-[#6B7280] dark:text-[#9CA3AF]">Click &quot;+ Add&quot; on any food or drink to start your clubhouse order.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Item list */}
                    <div className="space-y-2 max-h-52 overflow-y-auto pr-1 divide-y divide-[#E5DFD5] dark:divide-[#222D3E]">
                      {cart.map((item) => (
                        <div key={item.menuItem.id} className="pt-2 first:pt-0 flex items-center justify-between text-xs">
                          <div>
                            <p className="font-serif font-bold text-[#0B1320] dark:text-white">{item.menuItem.name}</p>
                            <span className="text-[10px] text-[#6B7280] dark:text-[#9CA3AF]">
                              {formatINR(item.menuItem.pricePaise)} × {item.quantity}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold font-mono text-[#0B1320] dark:text-white">
                              {formatINR(item.quantity * item.menuItem.pricePaise)}
                            </span>
                            <div className="flex items-center gap-1 bg-white dark:bg-[#0E1522] border border-[#E5DFD5] dark:border-[#222D3E] rounded-md p-0.5">
                              <button
                                onClick={() => handleUpdateCartQty(item.menuItem.id, -1)}
                                className="w-5 h-5 rounded flex items-center justify-center hover:bg-[#FAF8F5] dark:hover:bg-[#121A28]"
                              >
                                <Minus className="w-3 h-3 text-[#0B1320] dark:text-white" />
                              </button>
                              <span className="font-mono text-[11px] px-1 text-[#0B1320] dark:text-white">{item.quantity}</span>
                              <button
                                onClick={() => handleUpdateCartQty(item.menuItem.id, 1)}
                                className="w-5 h-5 rounded flex items-center justify-center hover:bg-[#FAF8F5] dark:hover:bg-[#121A28]"
                              >
                                <Plus className="w-3.5 h-3.5 text-[#0B1320] dark:text-white" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Order Destination: Table vs Counter */}
                    <div className="space-y-2 pt-2 border-t border-[#E5DFD5] dark:border-[#222D3E] text-xs">
                      <label className="text-[10px] uppercase font-bold text-[#8C6D23] dark:text-[#DFCA9B] tracking-wider block">Service Destination:</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setOrderDestination("COUNTER")}
                          className={`p-2 rounded-md border text-xs font-bold uppercase tracking-wider transition-all ${
                            orderDestination === "COUNTER"
                              ? "bg-[#921111] text-white border-[#921111] shadow-xs"
                              : "bg-white dark:bg-[#0E1522] text-[#4B5563] dark:text-[#9CA3AF] border-[#E5DFD5] dark:border-[#222D3E]"
                          }`}
                        >
                          🏃 Counter Pick-up
                        </button>
                        <button
                          type="button"
                          onClick={() => setOrderDestination("TABLE")}
                          className={`p-2 rounded-md border text-xs font-bold uppercase tracking-wider transition-all ${
                            orderDestination === "TABLE"
                              ? "bg-[#921111] text-white border-[#921111] shadow-xs"
                              : "bg-white dark:bg-[#0E1522] text-[#4B5563] dark:text-[#9CA3AF] border-[#E5DFD5] dark:border-[#222D3E]"
                          }`}
                        >
                          🪑 Table Service
                        </button>
                      </div>

                      {orderDestination === "TABLE" && (
                        <div className="pt-1">
                          <label className="text-[10px] uppercase font-bold text-[#8C6D23] dark:text-[#DFCA9B] tracking-wider block mb-1">Select Lounge Table:</label>
                          <select
                            value={selectedTableId}
                            onChange={(e) => setSelectedTableId(e.target.value)}
                            className="w-full p-2 rounded-md border border-[#E5DFD5] dark:border-[#222D3E] bg-white dark:bg-[#0E1522] text-xs font-bold text-[#0B1320] dark:text-white"
                          >
                            {tables.map((t) => (
                              <option key={t.id} value={t.id}>
                                {t.name} (Cap: {t.capacity} guests) — {t.status}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>

                    {/* Special Instructions */}
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-[#8C6D23] dark:text-[#DFCA9B] tracking-wider block">Kitchen Instructions (optional):</label>
                      <input
                        type="text"
                        placeholder="e.g. Less ice, separate dressing, no sugar..."
                        value={orderSpecialNotes}
                        onChange={(e) => setOrderSpecialNotes(e.target.value)}
                        className="w-full p-2 rounded-md border border-[#E5DFD5] dark:border-[#222D3E] bg-white dark:bg-[#0E1522] text-xs text-[#0B1320] dark:text-white"
                      />
                    </div>

                    {/* Price Breakdown */}
                    <div className="space-y-1.5 pt-3 border-t border-[#E5DFD5] dark:border-[#222D3E] text-xs">
                      <div className="flex justify-between text-[#6B7280] dark:text-[#9CA3AF]">
                        <span>Items Subtotal:</span>
                        <span className="font-mono">{formatINR(cartSubtotalPaise)}</span>
                      </div>
                      <div className="flex justify-between text-[#8C6D23] dark:text-[#DFCA9B] font-semibold">
                        <span>{plan?.tier || "Gold"} Privilege ({barDiscountPercent}%):</span>
                        <span className="font-mono">-{formatINR(cartDiscountPaise)}</span>
                      </div>
                      <div className="flex justify-between text-sm font-bold pt-1 border-t border-[#E5DFD5] dark:border-[#222D3E]">
                        <span className="font-serif text-[#0B1320] dark:text-white">Charge to Member Tab:</span>
                        <span className="font-mono text-[#921111] dark:text-[#DFCA9B]">{formatINR(cartFinalPaise)}</span>
                      </div>
                    </div>

                    {/* Place Order Button */}
                    <button
                      disabled={orderPlacing}
                      onClick={handlePlaceBarOrder}
                      className="w-full py-3 rounded-md bg-[#921111] hover:bg-[#720C0C] text-white font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50"
                    >
                      {orderPlacing ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                      <span>{orderPlacing ? "Sending to Kitchen..." : "Confirm & Charge Tab"}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SUB-VIEW 2: TABLE RESERVATIONS */}
          {cafeSubTab === "TABLES" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-[#E5DFD5] dark:border-[#222D3E]">
                <div>
                  <h4 className="font-serif font-bold text-[#0B1320] dark:text-white text-sm">Lounge & Clubhouse Tables</h4>
                  <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">Reserve a lounge table or poolside booth for post-game camaraderie.</p>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#C5A059]/15 text-[#8C6D23] dark:text-[#DFCA9B] border border-[#C5A059]/30 font-bold uppercase tracking-wider">
                  {tables.length} CLUB TABLES
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {tables.map((table) => {
                  const isFree = table.status === "FREE";
                  const isReserved = table.status === "RESERVED";

                  return (
                    <div
                      key={table.id}
                      className={`p-5 rounded-lg border transition-all space-y-3 flex flex-col justify-between ${
                        isFree
                          ? "bg-[#FAF8F5]/70 dark:bg-[#121A28]/70 border-[#E5DFD5] dark:border-[#222D3E] hover:border-[#C5A059]"
                          : isReserved
                          ? "bg-[#FAF8F5]/40 dark:bg-[#121A28]/40 border-[#C5A059]/50"
                          : "bg-[#FAF8F5]/30 dark:bg-[#121A28]/30 border-[#E5DFD5] dark:border-[#222D3E] opacity-80"
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">🪑</span>
                            <div>
                              <h5 className="font-serif font-bold text-[#0B1320] dark:text-white text-sm">{table.name}</h5>
                              <span className="text-[10px] text-[#6B7280] dark:text-[#9CA3AF]">Table #{table.tableNumber}</span>
                            </div>
                          </div>
                          <span
                            className={`text-[9px] font-mono px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                              isFree
                                ? "bg-[#C5A059]/15 text-[#8C6D23] dark:text-[#DFCA9B] border border-[#C5A059]/30"
                                : isReserved
                                ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800"
                                : "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300 border border-red-200 dark:border-red-900"
                            }`}
                          >
                            {table.status}
                          </span>
                        </div>

                        <div className="p-2.5 rounded-md bg-white dark:bg-[#0E1522] border border-[#E5DFD5] dark:border-[#222D3E] text-xs text-[#6B7280] dark:text-[#9CA3AF] flex items-center justify-between">
                          <span>Seating Capacity:</span>
                          <strong className="font-bold text-[#0B1320] dark:text-white font-serif">Up to {table.capacity} Guests</strong>
                        </div>
                      </div>

                      <button
                        onClick={() => setReservingTableModal(table)}
                        className={`w-full py-2.5 rounded-md font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
                          isFree
                            ? "bg-[#921111] hover:bg-[#720C0C] text-white shadow-xs"
                            : "bg-white dark:bg-[#0E1522] border border-[#E5DFD5] dark:border-[#222D3E] text-[#4B5563] dark:text-[#9CA3AF] hover:border-[#C5A059]"
                        }`}
                      >
                        <Users className="w-3.5 h-3.5" />
                        <span>Reserve Table</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SUB-VIEW 3: RUNNING BAR TABS & HISTORY */}
          {cafeSubTab === "ORDERS" && (
            <div className="space-y-4">
              <h4 className="font-serif font-bold text-[#0B1320] dark:text-white text-sm">Your Running Bar Tabs & History</h4>
              <div className="overflow-x-auto border border-[#E5DFD5] dark:border-[#222D3E] rounded-lg">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[#FAF8F5] dark:bg-[#121A28] text-[#8C6D23] dark:text-[#DFCA9B] font-bold text-[10px] uppercase tracking-wider border-b border-[#E5DFD5] dark:border-[#222D3E]">
                    <tr>
                      <th className="p-3">Tab #</th>
                      <th className="p-3">Date & Time</th>
                      <th className="p-3">Orders Count</th>
                      <th className="p-3">Subtotal (₹)</th>
                      <th className="p-3">Privilege (₹)</th>
                      <th className="p-3">Final Amount (₹)</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5DFD5] dark:divide-[#222D3E]">
                    {member?.tabs?.map((t: any) => (
                      <tr key={t.id} className="hover:bg-[#FAF8F5]/50 dark:hover:bg-[#121A28]/50">
                        <td className="p-3 font-mono font-bold text-[#921111] dark:text-[#DFCA9B]">{t.tabNumber}</td>
                        <td className="p-3 text-[#6B7280] dark:text-[#9CA3AF]">{formatDateTime(t.openedAt)}</td>
                        <td className="p-3 font-bold text-[#0B1320] dark:text-white">{t.orders?.length || 1} orders</td>
                        <td className="p-3 font-mono">{formatINR(t.totalAmountPaise)}</td>
                        <td className="p-3 text-[#8C6D23] dark:text-[#DFCA9B] font-semibold font-mono">-{formatINR(t.discountAmountPaise)}</td>
                        <td className="p-3 font-bold font-mono text-[#0B1320] dark:text-white">{formatINR(t.finalAmountPaise)}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded font-mono font-bold uppercase text-[9px] tracking-wider bg-[#FAF8F5] dark:bg-[#121A28] border border-[#E5DFD5] dark:border-[#222D3E] text-[#0B1320] dark:text-white">
                            {t.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5. PRO SHOP CATALOG VIEW */}
      {activeTab === "SHOP" && (
        <div className="p-6 rounded-lg bg-white dark:bg-[#0E1522] border border-[#E5DFD5] dark:border-[#222D3E] shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E5DFD5] dark:border-[#222D3E]">
            <div>
              <h3 className="font-serif text-lg font-bold text-[#0B1320] dark:text-white">Pro Shop Official Athletic Equipment</h3>
              <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">Championship grade racquets, balls, footwear & performance apparel.</p>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#C5A059]/15 text-[#8C6D23] dark:text-[#DFCA9B] border border-[#C5A059]/30 font-bold uppercase tracking-wider">
              {products.length} CATALOG ITEMS
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {products.map((p) => (
              <div
                key={p.id}
                className="p-4 rounded-lg border border-[#E5DFD5] dark:border-[#222D3E] bg-[#FAF8F5]/60 dark:bg-[#121A28]/60 hover:border-[#C5A059] flex flex-col justify-between text-xs space-y-3 transition-all"
              >
                <div>
                  <span className="text-[9px] font-mono font-bold text-[#8C6D23] dark:text-[#DFCA9B] uppercase tracking-wider block">{p.brand}</span>
                  <h4 className="font-serif font-bold text-[#0B1320] dark:text-white text-sm mt-1">{p.name}</h4>
                </div>
                <div className="pt-2 border-t border-[#E5DFD5] dark:border-[#222D3E] flex items-center justify-between">
                  <div>
                    <span className="font-serif font-bold text-sm text-[#0B1320] dark:text-white block">{formatINR(p.pricePaise)}</span>
                    <span className="text-[9px] text-[#8C6D23] dark:text-[#DFCA9B] uppercase font-bold tracking-wider">Tier Allowance Applies</span>
                  </div>
                  <button
                    onClick={() => alert("Click & Collect order submitted to Pro Shop counter!")}
                    className="px-3 py-1.5 rounded-md bg-[#921111] hover:bg-[#720C0C] text-white font-bold text-xs uppercase tracking-wider shadow-xs"
                  >
                    Acquire
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. BAR TABS VIEW */}
      {activeTab === "TABS" && (
        <div className="p-6 rounded-lg bg-white dark:bg-[#0E1522] border border-[#E5DFD5] dark:border-[#222D3E] shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E5DFD5] dark:border-[#222D3E]">
            <div>
              <h3 className="font-serif text-lg font-bold text-[#0B1320] dark:text-white">Clubhouse Dining & Bar Running Tabs</h3>
              <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">Complete itemized statements of food, spirits & lounge charges.</p>
            </div>
            <button
              onClick={() => {
                setActiveTab("CAFE");
                setCafeSubTab("MENU");
              }}
              className="px-4 py-2 rounded-md bg-[#921111] hover:bg-[#720C0C] text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Order Food & Drinks</span>
            </button>
          </div>
          <div className="overflow-x-auto border border-[#E5DFD5] dark:border-[#222D3E] rounded-lg">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#FAF8F5] dark:bg-[#121A28] text-[#8C6D23] dark:text-[#DFCA9B] font-bold text-[10px] uppercase tracking-wider border-b border-[#E5DFD5] dark:border-[#222D3E]">
                <tr>
                  <th className="p-3">Tab #</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Subtotal (₹)</th>
                  <th className="p-3">Privilege (₹)</th>
                  <th className="p-3">Final Amount (₹)</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5DFD5] dark:divide-[#222D3E]">
                {member?.tabs?.map((t: any) => (
                  <tr key={t.id} className="hover:bg-[#FAF8F5]/50 dark:hover:bg-[#121A28]/50">
                    <td className="p-3 font-mono font-bold text-[#921111] dark:text-[#DFCA9B]">{t.tabNumber}</td>
                    <td className="p-3 text-[#6B7280] dark:text-[#9CA3AF]">{formatDateTime(t.openedAt)}</td>
                    <td className="p-3 font-mono">{formatINR(t.totalAmountPaise)}</td>
                    <td className="p-3 text-[#8C6D23] dark:text-[#DFCA9B] font-semibold font-mono">-{formatINR(t.discountAmountPaise)}</td>
                    <td className="p-3 font-bold font-mono text-[#0B1320] dark:text-white">{formatINR(t.finalAmountPaise)}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded font-mono font-bold uppercase text-[9px] tracking-wider bg-[#FAF8F5] dark:bg-[#121A28] border border-[#E5DFD5] dark:border-[#222D3E] text-[#0B1320] dark:text-white">
                        {t.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 7. INVOICES VIEW */}
      {activeTab === "INVOICES" && (
        <div className="p-6 rounded-lg bg-white dark:bg-[#0E1522] border border-[#E5DFD5] dark:border-[#222D3E] shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E5DFD5] dark:border-[#222D3E]">
            <div>
              <h3 className="font-serif text-lg font-bold text-[#0B1320] dark:text-white">Official Membership Invoices & Receipts</h3>
              <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">Audited GST receipts, subscription dues, and ledger archives.</p>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#C5A059]/15 text-[#8C6D23] dark:text-[#DFCA9B] border border-[#C5A059]/30 font-bold uppercase tracking-wider">
              {member?.invoices?.length || 0} INVOICES
            </span>
          </div>

          <div className="overflow-x-auto border border-[#E5DFD5] dark:border-[#222D3E] rounded-lg">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#FAF8F5] dark:bg-[#121A28] text-[#8C6D23] dark:text-[#DFCA9B] font-bold text-[10px] uppercase tracking-wider border-b border-[#E5DFD5] dark:border-[#222D3E]">
                <tr>
                  <th className="p-3">Invoice #</th>
                  <th className="p-3">Issue Date</th>
                  <th className="p-3">Total Amount (₹)</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5DFD5] dark:divide-[#222D3E]">
                {member?.invoices?.map((inv: any) => (
                  <tr key={inv.id} className="hover:bg-[#FAF8F5]/50 dark:hover:bg-[#121A28]/50">
                    <td className="p-3 font-mono font-bold text-[#921111] dark:text-[#DFCA9B]">{inv.invoiceNumber}</td>
                    <td className="p-3 text-[#6B7280] dark:text-[#9CA3AF]">{formatDate(inv.issueDate)}</td>
                    <td className="p-3 font-bold font-mono text-[#0B1320] dark:text-white">{formatINR(inv.totalPaise)}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded font-mono font-bold uppercase text-[9px] tracking-wider bg-[#C5A059]/15 text-[#8C6D23] dark:text-[#DFCA9B] border border-[#C5A059]/30">
                        {inv.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => window.print()}
                        className="px-2.5 py-1 rounded-md border border-[#C5A059] text-[#0B1320] dark:text-[#DFCA9B] hover:bg-[#C5A059]/10 text-xs font-bold uppercase tracking-wider transition-colors"
                      >
                        Print PDF
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CONFIRM COURT SLOT BOOKING MODAL */}
      {confirmSlotModal && (
        <div className="fixed inset-0 z-50 bg-[#0B1320]/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0E1522] rounded-xl max-w-md w-full border border-[#C5A059]/40 p-6 shadow-2xl relative space-y-5 animate-in fade-in zoom-in-95">
            <button
              onClick={() => setConfirmSlotModal(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-[#FAF8F5] dark:hover:bg-[#121A28] text-[#6B7280] hover:text-[#0B1320] dark:hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-[#FAF8F5] dark:bg-[#121A28] border border-[#E5DFD5] dark:border-[#222D3E] text-[#921111] dark:text-[#C5A059] flex items-center justify-center text-2xl shrink-0 font-bold">
                {confirmSlotModal.court.sport?.icon || "🎾"}
              </div>
              <div>
                <h3 className="font-serif font-bold text-lg text-[#0B1320] dark:text-white">
                  Confirm Court Reservation
                </h3>
                <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">
                  {confirmSlotModal.court.name} • {confirmSlotModal.court.surfaceType} Surface
                </p>
              </div>
            </div>

            <div className="p-4 rounded-md bg-[#FAF8F5] dark:bg-[#121A28] border border-[#E5DFD5] dark:border-[#222D3E] space-y-2.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-[#6B7280] dark:text-[#9CA3AF]">Selected Date:</span>
                <strong className="font-serif font-bold text-[#0B1320] dark:text-white">{formatDate(bookingDate)}</strong>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#6B7280] dark:text-[#9CA3AF]">Slot Time:</span>
                <strong className="font-mono font-bold text-[#921111] dark:text-[#DFCA9B] text-sm">
                  {confirmSlotModal.time} (60 Mins)
                </strong>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#6B7280] dark:text-[#9CA3AF]">Member Name:</span>
                <span className="font-serif font-bold text-[#0B1320] dark:text-white">{member?.name || currentUser?.name}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-[#E5DFD5] dark:border-[#222D3E]">
                <span className="text-[#6B7280] dark:text-[#9CA3AF]">Pricing Tariff:</span>
                <span className="font-serif font-bold text-sm text-[#921111] dark:text-[#DFCA9B]">
                  {isGold ? "Complimentary (Gold Privilege)" : formatINR(Math.round(confirmSlotModal.court.hourlyRatePaise / 2))}
                </span>
              </div>
            </div>

            {parseInt(confirmSlotModal.time.split(":")[0]) >= 18 && (
              <div className="p-3 rounded-md bg-[#C5A059]/15 border border-[#C5A059]/30 text-[11px] text-[#8C6D23] dark:text-[#DFCA9B] flex items-center gap-2">
                <Flame className="w-4 h-4 shrink-0 text-[#921111]" />
                <span>Evening peak slot: Court floodlights will be automatically activated.</span>
              </div>
            )}

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmSlotModal(null)}
                className="flex-1 py-2.5 rounded-md bg-[#FAF8F5] dark:bg-[#121A28] border border-[#E5DFD5] dark:border-[#222D3E] hover:bg-[#FAF8F5]/80 text-[#4B5563] dark:text-[#9CA3AF] font-bold text-xs uppercase tracking-wider transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isBookingSubmitting}
                onClick={() => handlePortalBooking(confirmSlotModal.court, confirmSlotModal.time)}
                className="flex-1 py-2.5 rounded-md bg-[#921111] hover:bg-[#720C0C] text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-sm transition-all disabled:opacity-50"
              >
                {isBookingSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                <span>{isBookingSubmitting ? "Locking Slot..." : "Confirm & Book"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MATCH PASS / CHECK-IN QR MODAL */}
      {selectedBookingModal && (
        <div className="fixed inset-0 z-50 bg-[#0B1320]/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0E1522] rounded-xl max-w-sm w-full border border-[#C5A059]/40 p-6 shadow-2xl relative space-y-5 animate-in fade-in zoom-in-95">
            <button
              onClick={() => setSelectedBookingModal(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-[#FAF8F5] dark:hover:bg-[#121A28] text-[#6B7280] hover:text-[#0B1320] dark:hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Match Pass Card Header */}
            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-lg bg-[#FAF8F5] dark:bg-[#121A28] border border-[#E5DFD5] dark:border-[#222D3E] text-[#921111] dark:text-[#C5A059] mx-auto flex items-center justify-center text-2xl font-bold">
                {selectedBookingModal.court?.sport?.icon || "🎾"}
              </div>
              <h3 className="font-serif font-bold text-lg text-[#0B1320] dark:text-white">
                Court Check-In Voucher
              </h3>
              <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">
                Present this credential pass at the reception or court access gate scanner.
              </p>
            </div>

            {/* QR Code Center */}
            <div className="p-4 rounded-md bg-[#FAF8F5] dark:bg-[#121A28] border border-[#E5DFD5] dark:border-[#222D3E] flex flex-col items-center justify-center space-y-2">
              <QrCode className="w-32 h-32 text-[#0B1320] dark:text-white" />
              <span className="font-mono text-xs font-bold tracking-widest text-[#921111] dark:text-[#DFCA9B]">
                {selectedBookingModal.bookingNumber}
              </span>
            </div>

            {/* Booking Details */}
            <div className="space-y-2 text-xs border-t border-[#E5DFD5] dark:border-[#222D3E] pt-3">
              <div className="flex items-center justify-between">
                <span className="text-[#6B7280] dark:text-[#9CA3AF]">Court / Venue:</span>
                <span className="font-serif font-bold text-[#0B1320] dark:text-white">{selectedBookingModal.court?.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#6B7280] dark:text-[#9CA3AF]">Scheduled Time:</span>
                <span className="font-serif font-bold text-[#0B1320] dark:text-white">{formatDateTime(selectedBookingModal.startTime)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#6B7280] dark:text-[#9CA3AF]">Booker Name:</span>
                <span className="font-serif font-bold text-[#0B1320] dark:text-white">{selectedBookingModal.bookerName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#6B7280] dark:text-[#9CA3AF]">Booking Status:</span>
                <span className="px-2 py-0.5 rounded font-mono text-[9px] font-bold uppercase tracking-wider bg-[#C5A059]/15 text-[#8C6D23] dark:text-[#DFCA9B] border border-[#C5A059]/30">
                  {selectedBookingModal.status}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2 rounded-md bg-[#FAF8F5] dark:bg-[#121A28] border border-[#E5DFD5] dark:border-[#222D3E] hover:bg-[#FAF8F5]/80 text-[#4B5563] dark:text-[#9CA3AF] font-bold text-xs uppercase tracking-wider transition-colors"
              >
                Print Voucher
              </button>
              <button
                onClick={() => setSelectedBookingModal(null)}
                className="flex-1 py-2 rounded-md bg-[#921111] hover:bg-[#720C0C] text-white font-bold text-xs uppercase tracking-wider transition-colors shadow-xs"
              >
                Close Pass
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TABLE RESERVATION MODAL */}
      {reservingTableModal && (
        <div className="fixed inset-0 z-50 bg-[#0B1320]/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0E1522] rounded-xl max-w-md w-full border border-[#C5A059]/40 p-6 shadow-2xl relative space-y-4 animate-in fade-in zoom-in-95">
            <button
              onClick={() => setReservingTableModal(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-[#FAF8F5] dark:hover:bg-[#121A28] text-[#6B7280] hover:text-[#0B1320] dark:hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-md bg-[#FAF8F5] dark:bg-[#121A28] border border-[#E5DFD5] dark:border-[#222D3E] text-[#8C6D23] dark:text-[#DFCA9B] flex items-center justify-center text-xl shrink-0">
                🪑
              </div>
              <div>
                <h3 className="font-serif font-bold text-base text-[#0B1320] dark:text-white">
                  Reserve {reservingTableModal.name}
                </h3>
                <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">
                  Capacity: Up to {reservingTableModal.capacity} guests • Lounge Table #{reservingTableModal.tableNumber}
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs pt-2">
              <div>
                <label className="text-[10px] uppercase font-bold text-[#8C6D23] dark:text-[#DFCA9B] tracking-wider block mb-1">Party Size (Guests):</label>
                <input
                  type="number"
                  min={1}
                  max={reservingTableModal.capacity}
                  value={reservationPartySize}
                  onChange={(e) => setReservationPartySize(parseInt(e.target.value) || 2)}
                  className="w-full p-2 rounded-md border border-[#E5DFD5] dark:border-[#222D3E] bg-[#FAF8F5] dark:bg-[#121A28] font-bold text-[#0B1320] dark:text-white"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-[#8C6D23] dark:text-[#DFCA9B] tracking-wider block mb-1">Arrival Time Slot:</label>
                <select
                  value={reservationTime}
                  onChange={(e) => setReservationTime(e.target.value)}
                  className="w-full p-2 rounded-md border border-[#E5DFD5] dark:border-[#222D3E] bg-[#FAF8F5] dark:bg-[#121A28] font-bold text-[#0B1320] dark:text-white"
                >
                  {["12:00 PM", "01:30 PM", "06:00 PM", "07:00 PM", "08:00 PM", "09:30 PM"].map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-[#8C6D23] dark:text-[#DFCA9B] tracking-wider block mb-1">Special Occasion / Notes:</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Post-match celebration, poolside seating requested..."
                  value={reservationNotes}
                  onChange={(e) => setReservationNotes(e.target.value)}
                  className="w-full p-2 rounded-md border border-[#E5DFD5] dark:border-[#222D3E] bg-[#FAF8F5] dark:bg-[#121A28] text-[#0B1320] dark:text-white"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-3 border-t border-[#E5DFD5] dark:border-[#222D3E]">
              <button
                type="button"
                onClick={() => setReservingTableModal(null)}
                className="flex-1 py-2.5 rounded-md bg-[#FAF8F5] dark:bg-[#121A28] border border-[#E5DFD5] dark:border-[#222D3E] hover:bg-[#FAF8F5]/80 text-[#4B5563] dark:text-[#9CA3AF] font-bold text-xs uppercase tracking-wider transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={reservingTableLoading}
                onClick={handleReserveTable}
                className="flex-1 py-2.5 rounded-md bg-[#921111] hover:bg-[#720C0C] text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-sm transition-all disabled:opacity-50"
              >
                {reservingTableLoading ? "Reserving..." : "Confirm Table"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
