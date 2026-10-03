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

export default function MemberPortalPage({
  initialTab = "PASS",
}: {
  initialTab?: "PASS" | "MY_BOOKINGS" | "BOOKINGS" | "CAFE" | "SHOP" | "TABS" | "INVOICES";
}) {
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

  const membership = member?.memberships?.[0];
  const plan = membership?.plan;
  const isGold = plan?.tier === "GOLD";
  const advanceDays = plan?.advanceBookingDays ?? (isGold ? 14 : plan?.tier === "SILVER" ? 7 : plan?.tier === "JUNIOR" ? 7 : 3);

  const todayStr = new Date().toISOString().split("T")[0];
  const maxAllowedDate = new Date();
  maxAllowedDate.setDate(maxAllowedDate.getDate() + advanceDays);
  const maxAllowedDateStr = maxAllowedDate.toISOString().split("T")[0];

  // Expiry Tracking & Calculations
  const daysUntilExpiry = membership?.endDate
    ? Math.ceil((new Date(membership.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 999;
  const isExpiringSoon = daysUntilExpiry <= 5 && daysUntilExpiry >= 0 && plan?.tier !== "FREE";
  const isExpired = daysUntilExpiry < 0 && plan?.tier !== "FREE";
  const isFreeTier = plan?.tier === "FREE" || !plan?.tier || plan?.tier === "WALK_IN";

  // Tier Upgrade State
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedUpgradeTier, setSelectedUpgradeTier] = useState<"GOLD" | "SILVER" | "JUNIOR">("GOLD");
  const [upgradeBillingCycle, setUpgradeBillingCycle] = useState<"MONTHLY" | "ANNUAL">("ANNUAL");
  const [upgradePaymentMethod, setUpgradePaymentMethod] = useState<string>("UPI");
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [upgradeSuccessMsg, setUpgradeSuccessMsg] = useState<string | null>(null);
  const [upgradeErrorMsg, setUpgradeErrorMsg] = useState<string | null>(null);

  const handleUpgradeTier = async () => {
    if (!member) return;
    setIsUpgrading(true);
    setUpgradeErrorMsg(null);
    setUpgradeSuccessMsg(null);

    try {
      const res = await fetch("/api/members/upgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId: member.id,
          targetTier: selectedUpgradeTier,
          billingCycle: upgradeBillingCycle,
          paymentMethod: upgradePaymentMethod,
          userId: currentUser?.id,
          userName: currentUser?.name,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        setUpgradeErrorMsg(data.error || "Failed to upgrade membership.");
      } else {
        setUpgradeSuccessMsg(`🎉 Successfully upgraded to ${selectedUpgradeTier} Tier!`);
        setTimeout(() => {
          setShowUpgradeModal(false);
          setUpgradeSuccessMsg(null);
        }, 2000);
        await fetchMemberData();
      }
    } catch (err: any) {
      setUpgradeErrorMsg(err.message || "Failed to complete membership upgrade.");
    } finally {
      setIsUpgrading(false);
    }
  };

  const handlePortalBooking = async (court: any, time: string) => {
    setBookingError(null);
    setBookingSuccess(null);

    const now = new Date();
    const slotStart = new Date(`${bookingDate}T${time}:00`);

    if (slotStart.getTime() < now.getTime() - 5 * 60 * 1000) {
      setBookingError("Cannot book court slots in the past.");
      return;
    }

    if (bookingDate > maxAllowedDateStr) {
      setBookingError(`Your ${plan?.tier || "current"} membership plan allows booking up to ${advanceDays} days in advance (${maxAllowedDateStr}).`);
      return;
    }

    setIsBookingSubmitting(true);

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
    const today = new Date().toISOString().split("T")[0];
    if (bookingDate < today) return true;
    if (bookingDate > today) return false;
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
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
      {/* 5-DAY MEMBERSHIP EXPIRY WARNING ALERT */}
      {isExpiringSoon && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border-2 border-amber-500/40 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md shadow-amber-500/5">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black text-xl shrink-0 shadow-md shadow-amber-500/20">
              ⚠️
            </div>
            <div>
              <p className="font-bold text-sm">
                Membership Expiring in {daysUntilExpiry === 0 ? "Today" : `${daysUntilExpiry} Days`}!
              </p>
              <p className="text-xs text-amber-800 dark:text-amber-300 mt-0.5">
                Your <strong>{plan?.name || "Tier Membership"}</strong> is valid until <strong>{formatDate(membership.endDate)}</strong>. Renew or upgrade now to retain 100% free court access and discounts.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setSelectedUpgradeTier("GOLD");
              setShowUpgradeModal(true);
            }}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shrink-0 shadow-sm transition-all"
          >
            Renew / Upgrade Plan &rarr;
          </button>
        </div>
      )}

      {/* EXPIRED MEMBERSHIP BANNER */}
      {isExpired && (
        <div className="p-4 rounded-2xl bg-red-500/10 border-2 border-red-500/40 dark:bg-red-950/40 text-red-900 dark:text-red-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md shadow-red-500/5">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-500 text-white flex items-center justify-center font-black text-xl shrink-0">
              ⛔
            </div>
            <div>
              <p className="font-bold text-sm">Membership Expired on {formatDate(membership.endDate)}</p>
              <p className="text-xs text-red-800 dark:text-red-300 mt-0.5">
                Your tier privileges have expired. Court bookings are currently charged at standard walk-in rates.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setSelectedUpgradeTier("GOLD");
              setShowUpgradeModal(true);
            }}
            className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shrink-0 shadow-sm transition-all"
          >
            Renew Membership &rarr;
          </button>
        </div>
      )}

      {/* MEMBER PORTAL HEADER */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg shadow-md ${
            isGold ? "bg-amber-500 text-slate-950 shadow-amber-500/20" : isFreeTier ? "bg-slate-700 text-white" : "bg-emerald-600 text-white"
          }`}>
            {member?.name ? member.name.slice(0, 2).toUpperCase() : "CC"}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                {member?.name || currentUser?.name || "Member"}
              </h1>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase ${
                isGold
                  ? "bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300"
                  : isFreeTier
                  ? "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                  : "bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300"
              }`}>
                {plan?.tier || "FREE"} TIER
              </span>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              Member ID: {member?.memberId || currentUser?.memberCode || "CC-2024-001"}
            </span>
          </div>
        </div>

        {/* Upgrade Tier Button in Header */}
        <button
          onClick={() => setShowUpgradeModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 transition-all cursor-pointer"
        >
          <Sparkles className="w-4 h-4" />
          <span>{isFreeTier ? "Upgrade to Gold / Silver" : "Change / Upgrade Tier"}</span>
        </button>

        {/* Tab Navigation */}
        <div className="flex bg-slate-200 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold overflow-x-auto w-full sm:w-auto">
          <button
            onClick={() => setActiveTab("PASS")}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === "PASS" ? "bg-white dark:bg-slate-700 text-amber-600 shadow-xs font-bold" : "text-slate-600"
            }`}
          >
            Digital Pass
          </button>
          <button
            onClick={() => setActiveTab("MY_BOOKINGS")}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === "MY_BOOKINGS" ? "bg-white dark:bg-slate-700 text-amber-600 shadow-xs font-bold" : "text-slate-600"
            }`}
          >
            <span>My Bookings</span>
            {upcomingCount > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-600 text-white font-mono font-bold">
                {upcomingCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("BOOKINGS")}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === "BOOKINGS" ? "bg-white dark:bg-slate-700 text-amber-600 shadow-xs font-bold" : "text-slate-600"
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Book Court</span>
          </button>
          <button
            onClick={() => setActiveTab("CAFE")}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === "CAFE" ? "bg-white dark:bg-slate-700 text-amber-600 shadow-xs font-bold" : "text-slate-600"
            }`}
          >
            <Coffee className="w-3.5 h-3.5" />
            <span>Bar & Cafe</span>
            {cart.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-orange-600 text-white font-mono font-bold">
                {cart.reduce((a, b) => a + b.quantity, 0)}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("SHOP")}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === "SHOP" ? "bg-white dark:bg-slate-700 text-amber-600 shadow-xs font-bold" : "text-slate-600"
            }`}
          >
            Pro Shop
          </button>
          <button
            onClick={() => setActiveTab("TABS")}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === "TABS" ? "bg-white dark:bg-slate-700 text-amber-600 shadow-xs font-bold" : "text-slate-600"
            }`}
          >
            Bar Tabs
          </button>
          <button
            onClick={() => setActiveTab("INVOICES")}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === "INVOICES" ? "bg-white dark:bg-slate-700 text-amber-600 shadow-xs font-bold" : "text-slate-600"
            }`}
          >
            Invoices
          </button>
        </div>
      </div>

      {/* 1. DIGITAL MEMBERSHIP CARD & DASHBOARD OVERVIEW */}
      {activeTab === "PASS" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            {/* DIGITAL CARD */}
            <div
              className={`p-6 rounded-3xl relative overflow-hidden shadow-2xl flex flex-col justify-between h-80 text-white ${
                isGold
                  ? "bg-gradient-to-br from-amber-600 via-amber-700 to-slate-900 border border-amber-400/40"
                  : plan?.tier === "SILVER"
                  ? "bg-gradient-to-br from-slate-600 via-slate-700 to-slate-950 border border-slate-400/40"
                  : plan?.tier === "JUNIOR"
                  ? "bg-gradient-to-br from-teal-700 via-emerald-800 to-slate-950 border border-teal-400/40"
                  : "bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 border border-emerald-500/30"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] tracking-widest uppercase font-bold text-amber-200">
                    The Champions Club
                  </span>
                  <h3 className="text-xl font-extrabold tracking-tight">
                    {plan?.name || (isFreeTier ? "Free Community Guest" : "Gold All-Access")}
                  </h3>
                </div>
                <span className="text-2xl">{isGold ? "👑" : isFreeTier ? "🎟️" : "⭐"}</span>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-amber-200/80 block uppercase tracking-wider">Member Name</span>
                  <span className="font-bold text-base tracking-wide">{member?.name || currentUser?.name || "Member"}</span>
                  <span className="font-mono text-xs block opacity-90 mt-0.5">{member?.memberId || currentUser?.memberCode}</span>
                </div>
                <div className="p-2 rounded-xl bg-white text-slate-950 shadow-md">
                  <QrCode className="w-16 h-16" />
                </div>
              </div>

              <div className="pt-3 border-t border-white/20 flex items-center justify-between text-[11px]">
                <span>Valid Until: <strong>{membership?.endDate ? formatDate(membership.endDate) : "—"}</strong></span>
                <span className={`px-2 py-0.5 rounded font-bold uppercase ${
                  isFreeTier ? "bg-slate-500/30 text-slate-200" : "bg-emerald-500/30 text-emerald-200"
                }`}>
                  {member?.status || "ACTIVE"}
                </span>
              </div>
            </div>

            {/* PLAN ENTITLEMENTS & PRIVILEGES */}
            <div className="md:col-span-2 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 text-xs">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Your Tier Privileges & Daily Quotas</h3>
                {isFreeTier && (
                  <button
                    onClick={() => setShowUpgradeModal(true)}
                    className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
                  >
                    <span>Upgrade for 100% Free Courts</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                  <span className="text-emerald-700 dark:text-emerald-300 font-bold block">Court Access</span>
                  <span className="font-extrabold text-sm text-emerald-950 dark:text-emerald-100">
                    {plan?.courtRatePerHourPaise === 0 ? "100% Complimentary" : `${formatINR(plan?.courtRatePerHourPaise || 80000)}/hr`}
                  </span>
                  <span className="text-[10px] text-emerald-600 block mt-0.5">Max {plan?.maxBookingsPerDay || 1} booking/day</span>
                </div>

                <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800">
                  <span className="text-purple-700 dark:text-purple-300 font-bold block">Pro Shop Discount</span>
                  <span className="font-extrabold text-sm text-purple-950 dark:text-purple-100">
                    {plan?.shopDiscountPercent || 0}% Off All Gear
                  </span>
                  <span className="text-[10px] text-purple-600 block mt-0.5">Auto-applied at checkout</span>
                </div>

                <div className="p-3 rounded-xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800">
                  <span className="text-orange-700 dark:text-orange-300 font-bold block">Lounge & Bar Discount</span>
                  <span className="font-extrabold text-sm text-orange-950 dark:text-orange-100">
                    {plan?.barDiscountPercent || 0}% Off F&B
                  </span>
                  <span className="text-[10px] text-orange-600 block mt-0.5">Applied on running tab</span>
                </div>

                <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800">
                  <span className="text-blue-700 dark:text-blue-300 font-bold block">Advance Booking</span>
                  <span className="font-extrabold text-sm text-blue-950 dark:text-blue-100">
                    {advanceDays} Days in Advance
                  </span>
                  <span className="text-[10px] text-blue-600 block mt-0.5">Priority slot selection</span>
                </div>
              </div>

              {/* Free Tier Upgrade Promo Banner */}
              {isFreeTier && (
                <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-500/10 via-amber-600/10 to-transparent border border-amber-500/30 flex items-center justify-between gap-3">
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block">Unlock All-Access Gold Perks</span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Get 100% free courts, 14-day booking window, 20% Bar discount & locker access.
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedUpgradeTier("GOLD");
                      setShowUpgradeModal(true);
                    }}
                    className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shrink-0 shadow-xs cursor-pointer"
                  >
                    Upgrade Now
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* UPCOMING COURT BOOKINGS HIGHLIGHT WIDGET */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-600" />
                  <span>Upcoming Court Bookings</span>
                </h3>
                <p className="text-xs text-slate-500">Your scheduled court times and reservations.</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab("MY_BOOKINGS")}
                  className="text-xs font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 flex items-center gap-1"
                >
                  <span>View All Bookings ({memberBookings.length})</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setActiveTab("BOOKINGS")}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-bold text-xs flex items-center gap-1 hover:bg-emerald-700 shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Book Slot</span>
                </button>
              </div>
            </div>

            {memberBookings.filter((b) => new Date(b.startTime) >= now && b.status !== "CANCELLED").length === 0 ? (
              <div className="text-center py-8 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-800">
                <Calendar className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-60" />
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">No upcoming court slots booked</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Reserve a tennis, badminton, padel or cricket court slot today!</p>
                <button
                  onClick={() => setActiveTab("BOOKINGS")}
                  className="mt-3 px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white font-bold text-xs inline-flex items-center gap-1 hover:bg-emerald-700"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Reserve a Court Slot</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {memberBookings
                  .filter((b) => new Date(b.startTime) >= now && b.status !== "CANCELLED")
                  .slice(0, 3)
                  .map((b) => (
                    <div
                      key={b.id}
                      onClick={() => setSelectedBookingModal(b)}
                      className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 hover:border-emerald-500 dark:hover:border-emerald-500 cursor-pointer transition-all space-y-2.5 group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                          <span>{b.court?.sport?.icon || "🎾"}</span>
                          <span>{b.court?.name}</span>
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold uppercase">
                          {b.status}
                        </span>
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{formatDateTime(b.startTime)}</span>
                      </div>
                      <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60 flex items-center justify-between text-[11px]">
                        <span className="font-mono text-slate-400 text-[10px]">{b.bookingNumber}</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400 group-hover:underline">
                          View Match Pass →
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
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">My Slot Bookings</h3>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold">
                  {filteredBookings.length} SLOTS
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Review your active reservations, match check-in vouchers, and booking history.
              </p>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
              <button
                onClick={() => setActiveTab("BOOKINGS")}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs flex items-center gap-1.5 hover:bg-emerald-700 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Book New Slot</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60">
              <span className="text-[11px] text-emerald-700 dark:text-emerald-300 font-bold block">Upcoming Slots</span>
              <span className="text-xl font-extrabold text-emerald-950 dark:text-emerald-100 mt-0.5 block font-mono">
                {upcomingCount}
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/60">
              <span className="text-[11px] text-blue-700 dark:text-blue-300 font-bold block">Total Bookings</span>
              <span className="text-xl font-extrabold text-blue-950 dark:text-blue-100 mt-0.5 block font-mono">
                {memberBookings.length}
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/60">
              <span className="text-[11px] text-purple-700 dark:text-purple-300 font-bold block">Tier Perk Rate</span>
              <span className="text-base font-extrabold text-purple-950 dark:text-purple-100 mt-0.5 block">
                {isGold ? "100% Free" : "50% Discount"}
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60">
              <span className="text-[11px] text-amber-700 dark:text-amber-300 font-bold block">Daily Quota</span>
              <span className="text-base font-extrabold text-amber-950 dark:text-amber-100 mt-0.5 block">
                Max {plan?.maxBookingsPerDay || 2}/day
              </span>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3 overflow-x-auto">
            {(["ALL", "UPCOMING", "PAST", "CANCELLED"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setBookingFilter(tab)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  bookingFilter === tab
                    ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs"
                    : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
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
            <div className="text-center py-12 rounded-2xl bg-slate-50 dark:bg-slate-800/30 border border-dashed border-slate-200 dark:border-slate-800 space-y-3">
              <Calendar className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
              <div className="space-y-1">
                <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">No slot bookings found</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {bookingFilter === "UPCOMING"
                    ? "You have no upcoming matches scheduled. Choose a court and reserve a slot in seconds!"
                    : "No slot bookings matched your selected filter."}
                </p>
              </div>
              <button
                onClick={() => setActiveTab("BOOKINGS")}
                className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs inline-flex items-center gap-1.5 hover:bg-emerald-700 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Reserve a Court Slot Now</span>
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
                    className={`p-5 rounded-2xl border transition-all space-y-4 ${
                      isCancelled
                        ? "bg-slate-50/50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-70"
                        : isUpcoming
                        ? "bg-white dark:bg-slate-900 border-emerald-300/80 dark:border-emerald-700/60 shadow-md shadow-emerald-500/5 hover:border-emerald-500"
                        : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                    }`}
                  >
                    {/* Header: Court & Status */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xl shrink-0">
                          {booking.court?.sport?.icon || "🎾"}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                              {booking.court?.name}
                            </h4>
                            {booking.isPeak && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-bold flex items-center gap-0.5">
                                <Flame className="w-2.5 h-2.5" />
                                <span>Floodlights</span>
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            {booking.court?.surfaceType} Surface • {booking.court?.sport?.name || "Court"}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`text-[10px] font-mono px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${
                          isCancelled
                            ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
                            : isUpcoming
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                            : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                        }`}
                      >
                        {booking.status}
                      </span>
                    </div>

                    {/* Match Slot Details */}
                    <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Date & Time</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200 mt-0.5 block">
                          {formatDateTime(booking.startTime)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Duration</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200 mt-0.5 block">
                          {booking.durationMinutes || 60} Minutes
                        </span>
                      </div>
                      <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Booking ID</span>
                        <span className="font-mono font-bold text-slate-700 dark:text-slate-300 text-[11px]">
                          {booking.bookingNumber}
                        </span>
                      </div>
                      <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Pricing / Perk</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                          {booking.totalPricePaise === 0
                            ? "Free (Member Perk)"
                            : formatINR(booking.totalPricePaise)}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between gap-2 pt-1">
                      <button
                        onClick={() => setSelectedBookingModal(booking)}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors"
                      >
                        <QrCode className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Match Pass & QR</span>
                      </button>

                      {isUpcoming && (
                        <button
                          disabled={cancellingId === booking.id}
                          onClick={() => handleCancelBooking(booking.id)}
                          className="px-3 py-1.5 rounded-xl border border-red-200 dark:border-red-900/60 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50"
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
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          {/* Header & Controls */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Reserve a Court Slot</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold uppercase">
                  6:00 AM – 11:00 PM
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Full 60-minute bookable slots across all Tennis, Badminton, Padel & Cricket courts.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-between lg:justify-end">
              <button
                onClick={() => setActiveTab("MY_BOOKINGS")}
                className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
              >
                <span>My Booked Slots ({upcomingCount})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl">
                <span className="text-[11px] font-bold text-slate-500 pl-1">Date:</span>
                <input
                  type="date"
                  min={todayStr}
                  max={maxAllowedDateStr}
                  value={bookingDate}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val < todayStr) {
                      setBookingDate(todayStr);
                    } else if (val > maxAllowedDateStr) {
                      setBookingDate(maxAllowedDateStr);
                    } else {
                      setBookingDate(val);
                    }
                  }}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Booking Window Info Badge */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/60 text-xs text-blue-900 dark:text-blue-200">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
              <span>
                <strong>{plan?.tier || "Gold"} Booking Window:</strong> Valid for bookings from <strong>Today ({formatDate(new Date())})</strong> up to <strong>{formatDate(maxAllowedDate)}</strong> ({advanceDays} days advance window).
              </span>
            </div>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-blue-200/60 dark:bg-blue-900/60 text-blue-950 dark:text-blue-100">
              {advanceDays}-DAY LIMIT
            </span>
          </div>

          {/* Time & Sport Filter Bars */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs">
            {/* Sport Filter */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
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
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all whitespace-nowrap ${
                    selectedSportFilter.toLowerCase() === s.id.toLowerCase()
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {/* Time of Day Filter */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
                Time:
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
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all whitespace-nowrap flex items-center gap-1 ${
                    selectedTimeOfDay === t.id
                      ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs"
                      : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  <span>{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Feedback alerts */}
          {bookingError && (
            <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{bookingError}</span>
            </div>
          )}

          {bookingSuccess && (
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <p className="font-bold">Court Slot #{bookingSuccess.bookingNumber} Confirmed!</p>
                  <p className="text-[11px] opacity-90 mt-0.5">
                    Your reservation has been locked into the schedule. Check your digital match voucher anytime.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedBookingModal(bookingSuccess);
                  setActiveTab("MY_BOOKINGS");
                }}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-bold text-xs shrink-0 hover:bg-emerald-700"
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
                  className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 hover:border-emerald-400 dark:hover:border-emerald-600 transition-all space-y-4"
                >
                  {/* Court Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-2xl shrink-0">
                        {court.sport?.icon || "🎾"}
                      </div>
                      <div>
                        <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                          {court.name}
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          {court.surfaceType} Surface • {court.isIndoor ? "Indoor" : "Outdoor"} • {court.sport?.name}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 block">
                        {isGold ? "100% Free (Gold)" : formatINR(courtHourlyRate) + "/hr"}
                      </span>
                      <span className="text-[10px] text-slate-400">60 Min Sessions</span>
                    </div>
                  </div>

                  {/* Hourly Slot Buttons (06:00 to 22:00) */}
                  <div>
                    <div className="flex items-center justify-between pb-2 text-[11px] font-bold text-slate-500">
                      <span>Available 60-Minute Slots:</span>
                      <span className="text-[10px] text-slate-400 font-mono">
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
                              className="py-1.5 px-1 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 text-center text-[10px] font-mono font-bold cursor-not-allowed select-none opacity-80"
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
                              className="py-1.5 px-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 text-center text-[10px] font-mono cursor-not-allowed select-none opacity-50"
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
                            className={`py-1.5 px-1 rounded-lg font-bold text-[11px] font-mono transition-all text-center border relative group ${
                              isEvening
                                ? "bg-white dark:bg-slate-800 hover:bg-emerald-600 hover:text-white border-amber-300/80 dark:border-amber-700/60 text-slate-800 dark:text-slate-200 hover:border-emerald-600"
                                : "bg-white dark:bg-slate-800 hover:bg-emerald-600 hover:text-white border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-emerald-600"
                            }`}
                          >
                            <span>{t}</span>
                            {isEvening && (
                              <span className="absolute -top-1.5 -right-1 text-[9px] group-hover:hidden">💡</span>
                            )}
                            <span className="block text-[8px] text-emerald-600 dark:text-emerald-400 group-hover:text-white font-sans uppercase tracking-tight">
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
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          {/* Cafe Sub-Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Champions Bar, Lounge & Cafeteria</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950 text-orange-800 dark:text-orange-300 font-bold">
                  {barDiscountPercent}% TIER DISCOUNT
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Order food, healthy protein shakes & drinks directly to your table or counter, or reserve lounge seating.
              </p>
            </div>

            {/* Sub-Navigation */}
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setCafeSubTab("MENU")}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  cafeSubTab === "MENU" ? "bg-white dark:bg-slate-700 text-orange-600 shadow-xs font-bold" : "text-slate-600"
                }`}
              >
                <Utensils className="w-3.5 h-3.5" />
                <span>Order Food & Drinks</span>
              </button>
              <button
                onClick={() => setCafeSubTab("TABLES")}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  cafeSubTab === "TABLES" ? "bg-white dark:bg-slate-700 text-orange-600 shadow-xs font-bold" : "text-slate-600"
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Reserve a Table</span>
              </button>
              <button
                onClick={() => setCafeSubTab("ORDERS")}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  cafeSubTab === "ORDERS" ? "bg-white dark:bg-slate-700 text-orange-600 shadow-xs font-bold" : "text-slate-600"
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>My Orders & Tab</span>
              </button>
            </div>
          </div>

          {/* Feedback alerts */}
          {orderPlacedSuccess && (
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <ChefHat className="w-6 h-6 text-emerald-600 shrink-0 animate-bounce" />
                <div>
                  <p className="font-extrabold text-sm">Order #{orderPlacedSuccess.orderNumber} Sent to Kitchen / Bar!</p>
                  <p className="text-[11px] opacity-90 mt-0.5">
                    Your order has been routed to the Kitchen Display System (KDS). {barDiscountPercent}% member discount was auto-applied!
                  </p>
                </div>
              </div>
              <button
                onClick={() => setCafeSubTab("ORDERS")}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-bold text-xs shrink-0 hover:bg-emerald-700 shadow-xs"
              >
                View Tab
              </button>
            </div>
          )}

          {reservationSuccess && (
            <div className="p-4 rounded-2xl bg-orange-50 dark:bg-orange-950/60 border border-orange-200 dark:border-orange-800 text-orange-900 dark:text-orange-200 text-xs flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Users className="w-6 h-6 text-orange-600 shrink-0" />
                <div>
                  <p className="font-extrabold text-sm">Table Reserved Successfully! Code: {reservationSuccess.reservationCode}</p>
                  <p className="text-[11px] opacity-90 mt-0.5">
                    {reservationSuccess.tableName} has been reserved for {reservationSuccess.partySize} guests at {reservationSuccess.time}.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setReservationSuccess(null)}
                className="px-3 py-1.5 rounded-xl bg-orange-600 text-white font-bold text-xs shrink-0 hover:bg-orange-700 shadow-xs"
              >
                Done
              </button>
            </div>
          )}

          {orderError && (
            <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
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
                <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-100 dark:border-slate-800 text-xs">
                  {[
                    { id: "ALL", label: "All Items" },
                    { id: "HOT_BEVERAGES", label: "☕ Hot Drinks" },
                    { id: "COLD_BEVERAGES", label: "🥤 Cold Drinks" },
                    { id: "HEALTH_SHAKES", label: "🥑 Protein & Health" },
                    { id: "SNACKS", label: "🥪 Snacks" },
                    { id: "MEALS", label: "🍛 Meals" },
                    { id: "DESSERTS", label: "🍰 Desserts" },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedMenuCategory(cat.id)}
                      className={`px-3 py-1.5 rounded-lg whitespace-nowrap text-xs font-bold transition-all ${
                        selectedMenuCategory === cat.id
                          ? "bg-orange-600 text-white shadow-xs"
                          : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
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
                        className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:border-orange-400 dark:hover:border-orange-500 transition-all flex flex-col justify-between space-y-3"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span className="text-[9px] font-mono font-bold text-orange-600 uppercase tracking-wider block">
                                {item.category.replace("_", " ")}
                              </span>
                              <h4 className="font-bold text-slate-900 dark:text-white text-sm mt-0.5">
                                {item.name}
                              </h4>
                            </div>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold shrink-0">
                              {barDiscountPercent}% Off
                            </span>
                          </div>
                          {item.description && (
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                              {item.description}
                            </p>
                          )}
                        </div>

                        <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
                          <div>
                            <div className="flex items-baseline gap-1.5">
                              <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                                {formatINR(discountedPricePaise)}
                              </span>
                              <span className="text-[10px] text-slate-400 line-through">
                                {formatINR(item.pricePaise)}
                              </span>
                            </div>
                            <span className="text-[9px] text-emerald-600 block">Member Price</span>
                          </div>

                          {itemInCart ? (
                            <div className="flex items-center gap-2 bg-orange-600 text-white rounded-xl p-1 shadow-xs">
                              <button
                                onClick={() => handleUpdateCartQty(item.id, -1)}
                                className="w-6 h-6 rounded-lg hover:bg-orange-700 flex items-center justify-center font-bold"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span className="font-mono font-bold text-xs px-1">{itemInCart.quantity}</span>
                              <button
                                onClick={() => handleUpdateCartQty(item.id, 1)}
                                className="w-6 h-6 rounded-lg hover:bg-orange-700 flex items-center justify-center font-bold"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleAddToCart(item)}
                              className="px-3 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs flex items-center gap-1 shadow-xs transition-colors"
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
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-5 sticky top-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-2">
                    <Coffee className="w-4 h-4 text-orange-600" />
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm">Your Order</h4>
                  </div>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-orange-100 dark:bg-orange-950 text-orange-800 dark:text-orange-300 font-bold">
                    {cart.reduce((a, b) => a + b.quantity, 0)} Items
                  </span>
                </div>

                {cart.length === 0 ? (
                  <div className="text-center py-8 space-y-2">
                    <Utensils className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
                    <p className="text-xs font-bold text-slate-600 dark:text-slate-400">Your tray is empty</p>
                    <p className="text-[11px] text-slate-400">Click &quot;+ Add&quot; on any food or drink to start your order.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Item list */}
                    <div className="space-y-2 max-h-52 overflow-y-auto pr-1 divide-y divide-slate-200 dark:divide-slate-700">
                      {cart.map((item) => (
                        <div key={item.menuItem.id} className="pt-2 first:pt-0 flex items-center justify-between text-xs">
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white">{item.menuItem.name}</p>
                            <span className="text-[10px] text-slate-500">
                              {formatINR(item.menuItem.pricePaise)} × {item.quantity}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold font-mono">
                              {formatINR(item.quantity * item.menuItem.pricePaise)}
                            </span>
                            <div className="flex items-center gap-1 bg-slate-200 dark:bg-slate-700 rounded-lg p-0.5">
                              <button
                                onClick={() => handleUpdateCartQty(item.menuItem.id, -1)}
                                className="w-5 h-5 rounded flex items-center justify-center hover:bg-slate-300 dark:hover:bg-slate-600"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="font-mono text-[11px] px-1">{item.quantity}</span>
                              <button
                                onClick={() => handleUpdateCartQty(item.menuItem.id, 1)}
                                className="w-5 h-5 rounded flex items-center justify-center hover:bg-slate-300 dark:hover:bg-slate-600"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Order Destination: Table vs Counter */}
                    <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-700 text-xs">
                      <label className="font-bold text-slate-700 dark:text-slate-300 block">Delivery Location:</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setOrderDestination("COUNTER")}
                          className={`p-2 rounded-xl border text-xs font-bold transition-all ${
                            orderDestination === "COUNTER"
                              ? "bg-orange-600 text-white border-orange-600 shadow-xs"
                              : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                          }`}
                        >
                          🏃 Counter Pick-up
                        </button>
                        <button
                          type="button"
                          onClick={() => setOrderDestination("TABLE")}
                          className={`p-2 rounded-xl border text-xs font-bold transition-all ${
                            orderDestination === "TABLE"
                              ? "bg-orange-600 text-white border-orange-600 shadow-xs"
                              : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                          }`}
                        >
                          🪑 Table Service
                        </button>
                      </div>

                      {orderDestination === "TABLE" && (
                        <div className="pt-1">
                          <label className="text-[11px] text-slate-500 block mb-1">Select Table:</label>
                          <select
                            value={selectedTableId}
                            onChange={(e) => setSelectedTableId(e.target.value)}
                            className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
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
                      <label className="text-[11px] text-slate-500 block">Chef Instructions (optional):</label>
                      <input
                        type="text"
                        placeholder="e.g. Less spicy, extra ice, no sugar..."
                        value={orderSpecialNotes}
                        onChange={(e) => setOrderSpecialNotes(e.target.value)}
                        className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                      />
                    </div>

                    {/* Price Breakdown */}
                    <div className="space-y-1.5 pt-3 border-t border-slate-200 dark:border-slate-700 text-xs">
                      <div className="flex justify-between text-slate-500">
                        <span>Items Subtotal:</span>
                        <span className="font-mono">{formatINR(cartSubtotalPaise)}</span>
                      </div>
                      <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
                        <span>{plan?.tier || "Gold"} Tier Discount ({barDiscountPercent}%):</span>
                        <span className="font-mono">-{formatINR(cartDiscountPaise)}</span>
                      </div>
                      <div className="flex justify-between text-sm font-extrabold text-slate-900 dark:text-white pt-1 border-t border-slate-200 dark:border-slate-700">
                        <span>Charge to Member Tab:</span>
                        <span className="font-mono text-orange-600 dark:text-orange-400">{formatINR(cartFinalPaise)}</span>
                      </div>
                    </div>

                    {/* Place Order Button */}
                    <button
                      disabled={orderPlacing}
                      onClick={handlePlaceBarOrder}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-md shadow-orange-500/20 transition-all disabled:opacity-50"
                    >
                      {orderPlacing ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                      <span>{orderPlacing ? "Sending to Kitchen..." : "Place Order & Charge Tab"}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SUB-VIEW 2: TABLE RESERVATIONS */}
          {cafeSubTab === "TABLES" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">Lounge & Bar Tables</h4>
                  <p className="text-xs text-slate-500">Reserve a lounge table or poolside booth for after-game drinks.</p>
                </div>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-orange-100 dark:bg-orange-950 text-orange-800 dark:text-orange-300 font-bold">
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
                      className={`p-5 rounded-2xl border transition-all space-y-3 flex flex-col justify-between ${
                        isFree
                          ? "bg-slate-50/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-orange-500"
                          : isReserved
                          ? "bg-amber-50/40 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800"
                          : "bg-slate-100/60 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 opacity-80"
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">🪑</span>
                            <div>
                              <h5 className="font-bold text-slate-900 dark:text-white text-sm">{table.name}</h5>
                              <span className="text-[10px] text-slate-500">Table #{table.tableNumber}</span>
                            </div>
                          </div>
                          <span
                            className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase ${
                              isFree
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                : isReserved
                                ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                                : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                            }`}
                          >
                            {table.status}
                          </span>
                        </div>

                        <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 text-xs text-slate-600 dark:text-slate-300 flex items-center justify-between">
                          <span>Seating Capacity:</span>
                          <strong className="font-bold text-slate-900 dark:text-white">Up to {table.capacity} Guests</strong>
                        </div>
                      </div>

                      <button
                        onClick={() => setReservingTableModal(table)}
                        className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                          isFree
                            ? "bg-orange-600 hover:bg-orange-700 text-white shadow-xs"
                            : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-orange-600 hover:text-white"
                        }`}
                      >
                        <Users className="w-3.5 h-3.5" />
                        <span>Reserve This Table</span>
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
              <h4 className="font-bold text-slate-900 dark:text-white text-sm">Your Running Bar Tabs & History</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="p-3">Tab #</th>
                      <th className="p-3">Date & Time</th>
                      <th className="p-3">Orders Count</th>
                      <th className="p-3">Subtotal (₹)</th>
                      <th className="p-3">Discount (₹)</th>
                      <th className="p-3">Final Amount (₹)</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {member?.tabs?.map((t: any) => (
                      <tr key={t.id}>
                        <td className="p-3 font-mono font-bold text-orange-600">{t.tabNumber}</td>
                        <td className="p-3 text-slate-500">{formatDateTime(t.openedAt)}</td>
                        <td className="p-3 font-bold">{t.orders?.length || 1} orders</td>
                        <td className="p-3">{formatINR(t.totalAmountPaise)}</td>
                        <td className="p-3 text-emerald-600 font-semibold">-{formatINR(t.discountAmountPaise)}</td>
                        <td className="p-3 font-bold">{formatINR(t.finalAmountPaise)}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded font-bold uppercase text-[10px] bg-slate-100 dark:bg-slate-800">
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
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Pro Shop Member Catalogue</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {products.map((p) => (
              <div
                key={p.id}
                className="p-4 rounded-xl border bg-slate-50 dark:bg-slate-800/40 flex flex-col justify-between text-xs space-y-3"
              >
                <div>
                  <span className="text-[10px] font-mono font-bold text-purple-600 uppercase">{p.brand}</span>
                  <h4 className="font-bold text-slate-900 dark:text-white mt-1">{p.name}</h4>
                </div>
                <div className="pt-2 border-t flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block">{formatINR(p.pricePaise)}</span>
                    <span className="text-[10px] text-emerald-600">Your tier discount applies</span>
                  </div>
                  <button
                    onClick={() => alert("Click & Collect order submitted to Pro Shop counter!")}
                    className="px-2.5 py-1 rounded-lg bg-purple-600 text-white font-bold text-xs"
                  >
                    Order
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. BAR TABS VIEW */}
      {activeTab === "TABS" && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Your Bar & Lounge Running Tabs</h3>
            <button
              onClick={() => {
                setActiveTab("CAFE");
                setCafeSubTab("MENU");
              }}
              className="px-3 py-1.5 rounded-xl bg-orange-600 text-white font-bold text-xs flex items-center gap-1 hover:bg-orange-700"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Order Food & Drinks</span>
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 font-semibold border-b">
                <tr>
                  <th className="p-3">Tab #</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Subtotal (₹)</th>
                  <th className="p-3">Discount Applied (₹)</th>
                  <th className="p-3">Final Amount (₹)</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {member?.tabs?.map((t: any) => (
                  <tr key={t.id}>
                    <td className="p-3 font-mono font-bold text-orange-600">{t.tabNumber}</td>
                    <td className="p-3 text-slate-500">{formatDateTime(t.openedAt)}</td>
                    <td className="p-3">{formatINR(t.totalAmountPaise)}</td>
                    <td className="p-3 text-emerald-600">-{formatINR(t.discountAmountPaise)}</td>
                    <td className="p-3 font-bold">{formatINR(t.finalAmountPaise)}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded font-bold uppercase text-[10px] bg-slate-100 dark:bg-slate-800">
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
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Membership Invoices & Receipts</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 font-semibold border-b">
                <tr>
                  <th className="p-3">Invoice #</th>
                  <th className="p-3">Issue Date</th>
                  <th className="p-3">Total Amount (₹)</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {member?.invoices?.map((inv: any) => (
                  <tr key={inv.id}>
                    <td className="p-3 font-mono font-bold text-purple-600">{inv.invoiceNumber}</td>
                    <td className="p-3 text-slate-500">{formatDate(inv.issueDate)}</td>
                    <td className="p-3 font-bold">{formatINR(inv.totalPaise)}</td>
                    <td className="p-3 font-bold text-emerald-600">{inv.status}</td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => window.print()}
                        className="px-2 py-1 rounded border text-xs font-semibold"
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
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full border border-slate-200 dark:border-slate-800 p-6 shadow-2xl relative space-y-5 animate-in fade-in zoom-in-95">
            <button
              onClick={() => setConfirmSlotModal(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-300 flex items-center justify-center text-2xl shrink-0 font-bold">
                {confirmSlotModal.court.sport?.icon || "🎾"}
              </div>
              <div>
                <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">
                  Confirm Court Reservation
                </h3>
                <p className="text-xs text-slate-500">
                  {confirmSlotModal.court.name} • {confirmSlotModal.court.surfaceType} Surface
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Selected Date:</span>
                <strong className="font-bold text-slate-900 dark:text-white">{formatDate(bookingDate)}</strong>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Slot Time:</span>
                <strong className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                  {confirmSlotModal.time} (60 Mins)
                </strong>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Member Name:</span>
                <span className="font-bold text-slate-900 dark:text-white">{member?.name || currentUser?.name}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-700">
                <span className="text-slate-500">Pricing / Tier Entitlement:</span>
                <span className="font-extrabold text-sm text-emerald-600 dark:text-emerald-400">
                  {isGold ? "100% Free (Gold Perk)" : formatINR(Math.round(confirmSlotModal.court.hourlyRatePaise / 2))}
                </span>
              </div>
            </div>

            {parseInt(confirmSlotModal.time.split(":")[0]) >= 18 && (
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-800 dark:text-amber-300 flex items-center gap-2">
                <Flame className="w-4 h-4 shrink-0 text-amber-500" />
                <span>Evening peak slot: Court floodlights will be automatically scheduled!</span>
              </div>
            )}

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmSlotModal(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isBookingSubmitting}
                onClick={() => handlePortalBooking(confirmSlotModal.court, confirmSlotModal.time)}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 disabled:opacity-50"
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
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full border border-slate-200 dark:border-slate-800 p-6 shadow-2xl relative space-y-5 animate-in fade-in zoom-in-95">
            <button
              onClick={() => setSelectedBookingModal(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Match Pass Card Header */}
            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 mx-auto flex items-center justify-center text-2xl font-bold">
                {selectedBookingModal.court?.sport?.icon || "🎾"}
              </div>
              <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">
                Court Check-In Voucher
              </h3>
              <p className="text-xs text-slate-500">
                Present this digital pass at the reception or court gate scanner.
              </p>
            </div>

            {/* QR Code Center */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center space-y-2">
              <QrCode className="w-32 h-32 text-slate-900 dark:text-white" />
              <span className="font-mono text-xs font-extrabold tracking-widest text-emerald-600 dark:text-emerald-400">
                {selectedBookingModal.bookingNumber}
              </span>
            </div>

            {/* Booking Details */}
            <div className="space-y-2 text-xs border-t border-slate-100 dark:border-slate-800 pt-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Court / Venue:</span>
                <span className="font-bold text-slate-900 dark:text-white">{selectedBookingModal.court?.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Scheduled Time:</span>
                <span className="font-bold text-slate-900 dark:text-white">{formatDateTime(selectedBookingModal.startTime)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Booker Name:</span>
                <span className="font-bold text-slate-900 dark:text-white">{selectedBookingModal.bookerName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Booking Status:</span>
                <span className="px-2 py-0.5 rounded-full font-mono text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  {selectedBookingModal.status}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 font-bold text-xs"
              >
                Print Voucher
              </button>
              <button
                onClick={() => setSelectedBookingModal(null)}
                className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
              >
                Close Pass
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TABLE RESERVATION MODAL */}
      {reservingTableModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full border border-slate-200 dark:border-slate-800 p-6 shadow-2xl relative space-y-4 animate-in fade-in zoom-in-95">
            <button
              onClick={() => setReservingTableModal(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-950 text-orange-600 dark:text-orange-300 flex items-center justify-center text-xl shrink-0">
                🪑
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  Reserve {reservingTableModal.name}
                </h3>
                <p className="text-xs text-slate-500">
                  Capacity: Up to {reservingTableModal.capacity} guests • Lounge Table #{reservingTableModal.tableNumber}
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs pt-2">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Party Size (Guests):</label>
                <input
                  type="number"
                  min={1}
                  max={reservingTableModal.capacity}
                  value={reservationPartySize}
                  onChange={(e) => setReservationPartySize(parseInt(e.target.value) || 2)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Arrival Time Slot:</label>
                <select
                  value={reservationTime}
                  onChange={(e) => setReservationTime(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
                >
                  {["12:00 PM", "01:30 PM", "06:00 PM", "07:00 PM", "08:00 PM", "09:30 PM"].map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Special Occasion / Notes:</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Post-match celebration, poolside seating requested..."
                  value={reservationNotes}
                  onChange={(e) => setReservationNotes(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setReservingTableModal(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={reservingTableLoading}
                onClick={handleReserveTable}
                className="flex-1 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-orange-600/20 disabled:opacity-50"
              >
                {reservingTableLoading ? "Reserving..." : "Confirm Table"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MEMBERSHIP TIER UPGRADE MODAL */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full border border-slate-200 dark:border-slate-800 p-6 shadow-2xl relative space-y-5 animate-in fade-in zoom-in-95 my-8">
            <button
              onClick={() => {
                setShowUpgradeModal(false);
                setUpgradeErrorMsg(null);
                setUpgradeSuccessMsg(null);
              }}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-600 text-slate-950 flex items-center justify-center text-xl font-bold shrink-0 shadow-md shadow-amber-500/20">
                👑
              </div>
              <div>
                <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">
                  Upgrade Membership Tier
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Select your desired tier to unlock free court access, discounts & priority booking.
                </p>
              </div>
            </div>

            {upgradeErrorMsg && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                <span>{upgradeErrorMsg}</span>
              </div>
            )}

            {upgradeSuccessMsg && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{upgradeSuccessMsg}</span>
              </div>
            )}

            {/* Tier Selection Cards */}
            <div className="space-y-3">
              {[
                {
                  tier: "GOLD" as const,
                  name: "Gold All-Access Tier",
                  icon: "👑",
                  badge: "Most Popular",
                  monthlyPaise: 500000,
                  annualPaise: 5000000,
                  benefits: ["100% Free Courts (All Sports)", "14-Day Advance Booking Window", "20% Bar & Cafe Discount", "15% Pro Shop Discount"],
                },
                {
                  tier: "SILVER" as const,
                  name: "Silver Standard Tier",
                  icon: "🥈",
                  monthlyPaise: 250000,
                  annualPaise: 2500000,
                  benefits: ["50% Off Court Rates", "7-Day Advance Booking Window", "10% Bar & Cafe Discount", "10% Pro Shop Discount"],
                },
                {
                  tier: "JUNIOR" as const,
                  name: "Junior Academy (<18)",
                  icon: "🧒",
                  monthlyPaise: 150000,
                  annualPaise: 1500000,
                  benefits: ["60% Off Off-Peak Courts", "7-Day Advance Booking Window", "15% Cafe Discount", "Academy Coaching Perks"],
                },
              ].map((t) => {
                const isSelected = selectedUpgradeTier === t.tier;
                return (
                  <div
                    key={t.tier}
                    onClick={() => setSelectedUpgradeTier(t.tier)}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                      isSelected
                        ? "border-amber-500 bg-amber-50/50 dark:bg-amber-950/20 shadow-md shadow-amber-500/5"
                        : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{t.icon}</span>
                        <div>
                          <span className="font-extrabold text-sm text-slate-900 dark:text-white block">
                            {t.name}
                          </span>
                          {t.badge && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                              {t.badge}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-extrabold text-sm text-slate-900 dark:text-white block">
                          {formatINR(upgradeBillingCycle === "ANNUAL" ? t.annualPaise : t.monthlyPaise)}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {upgradeBillingCycle === "ANNUAL" ? "/ year" : "/ month"}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-1 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-[11px] text-slate-600 dark:text-slate-300">
                      {t.benefits.map((b, idx) => (
                        <div key={idx} className="flex items-center gap-1">
                          <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                          <span className="truncate">{b}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Billing Cycle Toggle */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs">
              <span className="font-bold text-slate-700 dark:text-slate-300">Billing Cycle:</span>
              <div className="flex bg-white dark:bg-slate-900 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setUpgradeBillingCycle("MONTHLY")}
                  className={`px-3 py-1 rounded font-bold text-xs transition-all ${
                    upgradeBillingCycle === "MONTHLY"
                      ? "bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-xs"
                      : "text-slate-500"
                  }`}
                >
                  Monthly
                </button>
                <button
                  type="button"
                  onClick={() => setUpgradeBillingCycle("ANNUAL")}
                  className={`px-3 py-1 rounded font-bold text-xs transition-all flex items-center gap-1 ${
                    upgradeBillingCycle === "ANNUAL"
                      ? "bg-amber-500 text-slate-950 font-black shadow-xs"
                      : "text-slate-500"
                  }`}
                >
                  <span>Annual (Save 17%)</span>
                  <span className="text-[9px]">🎁</span>
                </button>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                Payment Method:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "UPI", label: "📱 UPI / QR" },
                  { id: "CARD", label: "💳 Card" },
                  { id: "NETBANKING", label: "🏦 NetBanking" },
                ].map((pm) => (
                  <button
                    key={pm.id}
                    type="button"
                    onClick={() => setUpgradePaymentMethod(pm.id)}
                    className={`p-2.5 rounded-xl border text-xs font-bold text-center transition-all ${
                      upgradePaymentMethod === pm.id
                        ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300"
                        : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    {pm.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowUpgradeModal(false)}
                className="flex-1 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isUpgrading}
                onClick={handleUpgradeTier}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/25 disabled:opacity-50 cursor-pointer"
              >
                {isUpgrading ? (
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                <span>{isUpgrading ? "Processing Upgrade..." : `Pay & Activate ${selectedUpgradeTier}`}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
