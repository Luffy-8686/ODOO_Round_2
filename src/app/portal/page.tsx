"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { formatINR, formatDate, formatDateTime } from "@/lib/formatters";
import { useAuth } from "@/lib/auth-context";
import { calculateCourtPrice, isPeakHour, calculateShopDiscount } from "@/lib/pricing";
import { SECURITY_DEPOSIT_PAISE } from "@/lib/billing";
import { RazorpayGatewayModal } from "@/components/razorpay-gateway-modal";
import { downloadPdfInvoice } from "@/lib/download-pdf";
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
  Lock,
  Key,
  Receipt,
  Download,
  RefreshCw,
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
  const [dayHolds, setDayHolds] = useState<any[]>([]);
  const [activeHold, setActiveHold] = useState<any>(null);
  const [holdSecondsRemaining, setHoldSecondsRemaining] = useState<number>(300);
  const [modalError, setModalError] = useState<string | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState<any>(null);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [selectedBookingModal, setSelectedBookingModal] = useState<any>(null);
  const [confirmSlotModal, setConfirmSlotModal] = useState<{ court: any; time: string } | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [isBookingSubmitting, setIsBookingSubmitting] = useState(false);
  const [socialSessions, setSocialSessions] = useState<any[]>([]);
  const [joiningSocialId, setJoiningSocialId] = useState<string | null>(null);
  const [socialJoinSuccess, setSocialJoinSuccess] = useState<string | null>(null);

  // Razorpay Gateway state for Trial mode & Gold deposit escrow
  const [razorpayOrder, setRazorpayOrder] = useState<any>(null);
  const [isRazorpayModalOpen, setIsRazorpayModalOpen] = useState(false);
  const [refundingBookingId, setRefundingBookingId] = useState<string | null>(null);
  const [refundAlert, setRefundAlert] = useState<{ success: boolean; message: string } | null>(null);

  // TTL Slot Locking state
  // sessionId: unique per browser tab, stable across re-renders
  const sessionId = useMemo(() => {
    if (typeof window === "undefined") return "";
    let sid = sessionStorage.getItem("cc_slot_session");
    if (!sid) {
      sid = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
      sessionStorage.setItem("cc_slot_session", sid);
    }
    return sid;
  }, []);
  const [slotLocks, setSlotLocks] = useState<
    Array<{ courtId: string; slotTime: string; expiresAt: string; sessionId: string }>
  >([]);
  // lockCountdowns: { "courtId|slotTimeISO" -> secondsRemaining }
  const [lockCountdowns, setLockCountdowns] = useState<Record<string, number>>({});
  const [lockAcquireError, setLockAcquireError] = useState<string | null>(null);
  // Track which lock we currently own so we can release it on modal close
  const myLockRef = useRef<{ courtId: string; slotTime: string } | null>(null);

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

  // Membership Upgrade state
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeTier, setUpgradeTier] = useState<"GOLD" | "SILVER" | "JUNIOR">("GOLD");
  const [billingCycle, setBillingCycle] = useState<"MONTHLY" | "ANNUAL">("ANNUAL");
  const [paymentMethod, setPaymentMethod] = useState<"UPI" | "CARD" | "NET_BANKING">("UPI");
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [upgradeSuccess, setUpgradeSuccess] = useState<any>(null);
  const [upgradeError, setUpgradeError] = useState<string | null>(null);
  const [showExpiryPopup, setShowExpiryPopup] = useState(false);
  const [hasDismissedExpiry, setHasDismissedExpiry] = useState(false);

  // Pro Shop Cart & Itemized Billing State
  const [shopCart, setShopCart] = useState<Array<{ product: any; variant: any; quantity: number }>>([]);
  const [shopCheckoutModalOpen, setShopCheckoutModalOpen] = useState(false);
  const [shopApiKey, setShopApiKey] = useState(process.env.NEXT_PUBLIC_BILLING_API_KEY || "");
  const [shopFulfillmentType, setShopFulfillmentType] = useState<"CLICK_AND_COLLECT" | "HOME_DELIVERY">("CLICK_AND_COLLECT");
  const [shopPaymentMethod, setShopPaymentMethod] = useState<"UPI" | "CARD" | "MEMBER_TAB">("UPI");
  const [shopDeliveryAddress, setShopDeliveryAddress] = useState("");
  const [shopCheckoutSubmitting, setShopCheckoutSubmitting] = useState(false);
  const [shopReceipt, setShopReceipt] = useState<any | null>(null);
  const [shopCheckoutError, setShopCheckoutError] = useState<string | null>(null);

  // Shop Cart item operations
  const addToShopCart = (product: any, variant?: any) => {
    const selectedVariant = variant || product.variants?.[0] || {
      id: product.id,
      size: "Standard",
      color: "Standard",
      stockQuantity: 99,
    };
    setShopCart((prev) => {
      const idx = prev.findIndex((i) => i.variant.id === selectedVariant.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + 1 };
        return next;
      }
      return [...prev, { product, variant: selectedVariant, quantity: 1 }];
    });
  };

  const updateShopCartQty = (variantId: string, delta: number) => {
    setShopCart((prev) =>
      prev
        .map((item) => (item.variant.id === variantId ? { ...item, quantity: item.quantity + delta } : item))
        .filter((item) => item.quantity > 0)
    );
  };

  const removeShopCartItem = (variantId: string) => {
    setShopCart((prev) => prev.filter((item) => item.variant.id !== variantId));
  };

  // Membership Tier Discount Rule calculation
  const currentMemberTier = member?.memberships?.[0]?.tier || "WALK_IN";
  const customPlanShopDiscount = member?.memberships?.[0]?.plan?.shopDiscountPercent;
  const shopDiscountPercent =
    customPlanShopDiscount !== undefined && customPlanShopDiscount !== null
      ? customPlanShopDiscount
      : calculateShopDiscount(currentMemberTier);

  // Real-time Itemized Billing Details: Full Prices, Tier Discount, 100 INR Security Deposit
  const shopBillingDetails = useMemo(() => {
    const items = shopCart.map((item) => {
      const fullUnitPricePaise = item.product.pricePaise || 0;
      const fullTotalPricePaise = fullUnitPricePaise * item.quantity;
      const discountAmountPaise = Math.round((fullTotalPricePaise * shopDiscountPercent) / 100);
      const netPricePaise = fullTotalPricePaise - discountAmountPaise;
      return {
        ...item,
        fullUnitPricePaise,
        fullTotalPricePaise,
        discountPercent: shopDiscountPercent,
        discountAmountPaise,
        netPricePaise,
      };
    });

    const totalFullPricePaise = items.reduce((sum, i) => sum + i.fullTotalPricePaise, 0);
    const totalDiscountPaise = items.reduce((sum, i) => sum + i.discountAmountPaise, 0);
    const netSubtotalPaise = totalFullPricePaise - totalDiscountPaise;
    // Exactly 100 INR Security Deposit (10,000 paise)
    const securityDepositPaise = items.length > 0 ? SECURITY_DEPOSIT_PAISE : 0;
    const finalPayablePaise = netSubtotalPaise + securityDepositPaise;

    return {
      items,
      totalFullPricePaise,
      totalDiscountPaise,
      netSubtotalPaise,
      securityDepositPaise,
      finalPayablePaise,
      discountPercent: shopDiscountPercent,
    };
  }, [shopCart, shopDiscountPercent]);

  // Execute Billing Checkout via /api/billing/checkout
  const handleExecuteShopCheckout = async () => {
    if (shopCart.length === 0) return;
    setShopCheckoutSubmitting(true);
    setShopCheckoutError(null);

    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(shopApiKey.trim() ? { "x-billing-api-key": shopApiKey.trim() } : {}),
        },
        body: JSON.stringify({
          memberId: member?.id || null,
          customerName: member?.name || currentUser?.name || "Club Member",
          customerPhone: member?.phone || "+91 99999 99999",
          customerEmail: member?.email || currentUser?.email,
          fulfillmentType: shopFulfillmentType,
          deliveryAddress: shopFulfillmentType === "HOME_DELIVERY" ? shopDeliveryAddress : undefined,
          paymentMethod: shopPaymentMethod,
          apiKey: shopApiKey.trim() || undefined,
          items: shopCart.map((i) => ({
            variantId: i.variant.id,
            quantity: i.quantity,
            unitPricePaise: i.product.pricePaise,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Checkout failed");
      }

      setShopReceipt({
        order: data.order,
        billing: data.billing,
      });
      setShopCart([]);
      setShopCheckoutModalOpen(false);
      await fetchMemberData();
    } catch (err: any) {
      setShopCheckoutError(err.message || "Failed to complete checkout");
    } finally {
      setShopCheckoutSubmitting(false);
    }
  };

  const handleUpgradeMembership = async () => {
    if (!member) return;
    setIsUpgrading(true);
    setUpgradeError(null);
    try {
      const res = await fetch("/api/members/upgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId: member.id,
          targetTier: upgradeTier,
          billingCycle,
          paymentMethod,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to process membership upgrade.");
      }
      setUpgradeSuccess(data);
      await fetchMemberData();
    } catch (err: any) {
      setUpgradeError(err.message || "An error occurred during upgrade.");
    } finally {
      setIsUpgrading(false);
    }
  };

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
      if (crtData.holds) setDayHolds(crtData.holds);
      if (crtData.socialSessions) setSocialSessions(crtData.socialSessions);
      if (crtData.slotLocks) setSlotLocks(crtData.slotLocks);
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

  // ── Real-time countdown ticker for locked slots ────────────────────────────
  useEffect(() => {
    if (slotLocks.length === 0) {
      setLockCountdowns({});
      return;
    }

    const tick = () => {
      const now = Date.now();
      const next: Record<string, number> = {};
      for (const lock of slotLocks) {
        const key = `${lock.courtId}|${lock.slotTime}`;
        const secs = Math.max(0, Math.ceil((new Date(lock.expiresAt).getTime() - now) / 1000));
        if (secs > 0) next[key] = secs;
      }
      setLockCountdowns(next);
      // If all locks have expired, refresh court data to clear them
      if (Object.keys(next).length === 0 && slotLocks.length > 0) {
        setSlotLocks([]);
        fetchMemberData();
      }
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slotLocks]);

  // Keep activeTab in sync with initialTab prop if it changes
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // 300s TTL Countdown Timer for Hold
  useEffect(() => {
    if (!confirmSlotModal || !activeHold) return;

    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((activeHold.expiresAt - Date.now()) / 1000));
      setHoldSecondsRemaining(remaining);
      if (remaining <= 0) {
        setModalError(" Checkout Hold Expired: The 300-second exclusive slot lock has expired. Please close this popup and select the slot again.");
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [confirmSlotModal, activeHold]);

  const handleOpenSlotModal = async (court: any, time: string) => {
    setModalError(null);
    setBookingError(null);
    const slotStart = new Date(`${bookingDate}T${time}:00`);

    try {
      // 1. Acquire 300-second exclusive TTL hold
      const res = await fetch("/api/bookings/hold", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courtId: court.id,
          startTime: slotStart.toISOString(),
          durationMinutes: 60,
          userId: currentUser?.id,
          memberId: member?.id,
          holderName: member?.name || currentUser?.name || "Member",
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setBookingError(data.error || "Slot is currently locked by another customer in checkout.");
        await fetchMemberData();
        return;
      }

      setActiveHold(data.hold);
      setHoldSecondsRemaining(300);
      setConfirmSlotModal({ court, time });
    } catch (err: any) {
      setBookingError(err.message || "Failed to reserve slot hold.");
    }
  };

  const handleCloseConfirmModal = async () => {
    if (activeHold?.id) {
      try {
        await fetch(`/api/bookings/hold?holdId=${activeHold.id}`, { method: "DELETE" });
      } catch (e) {
        // silent
      }
    }
    if (myLockRef.current) {
      const { courtId, slotTime } = myLockRef.current;
      fetch("/api/slot-lock", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courtId, slotTime, sessionId }),
      }).catch(() => {});
      setSlotLocks((prev) =>
        prev.filter((l) => !(l.courtId === courtId && l.slotTime === slotTime && l.sessionId === sessionId))
      );
      myLockRef.current = null;
    }
    setActiveHold(null);
    setConfirmSlotModal(null);
    setModalError(null);
    setBookingError(null);
    await fetchMemberData();
  };

  const handleJoinSocialSession = async (session: any) => {
    setJoiningSocialId(session.id);
    setBookingError(null);
    setSocialJoinSuccess(null);
    try {
      const res = await fetch("/api/courts/social", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          socialSessionId: session.id,
          memberId: member?.id,
          guestName: member?.name || currentUser?.name || "Member",
          guestPhone: member?.phone || (currentUser as any)?.phone || "+91 99999 99999",
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setBookingError(data.error || "Failed to join Social Session.");
      } else {
        setSocialJoinSuccess(`Confirmed! You are registered for "${session.name}". See you on the court!`);
        await fetchMemberData();
      }
    } catch (err: any) {
      setBookingError(err.message || "Failed to join Social Session.");
    } finally {
      setJoiningSocialId(null);
    }
  };

  const handlePortalBooking = async (court: any, time: string) => {
    setModalError(null);
    setBookingError(null);
    setBookingSuccess(null);
    setIsBookingSubmitting(true);

    if (holdSecondsRemaining <= 0) {
      setModalError("Hold has expired. Please close and re-select slot.");
      setIsBookingSubmitting(false);
      return;
    }

    const slotStart = new Date(`${bookingDate}T${time}:00`);
    const activeTier = member?.memberships?.[0]?.tier || (isGold ? "GOLD" : "WALK_IN");

    try {
      // 1. Create Razorpay order (₹100 refundable deposit for Gold, tiered discount price for others)
      const orderRes = await fetch("/api/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courtId: court.id,
          memberId: member?.id,
          bookerType: activeTier,
          startTime: slotStart.toISOString(),
          durationMinutes: 60,
          type: "COURT_BOOKING",
        }),
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok || orderData.error) {
        throw new Error(orderData.error || "Failed to initialize Razorpay checkout order");
      }

      setRazorpayOrder(orderData);
      setIsRazorpayModalOpen(true);
    } catch (err: any) {
      setModalError(err.message || "Failed to initialize checkout.");
      setBookingError(err.message || "Failed to initialize checkout.");
    } finally {
      setIsBookingSubmitting(false);
    }
  };

  const handleRazorpayPaymentSuccess = async (paymentResult: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) => {
    if (!confirmSlotModal) return;
    setIsBookingSubmitting(true);
    setBookingError(null);
    setModalError(null);

    const { court, time } = confirmSlotModal;
    const slotStart = new Date(`${bookingDate}T${time}:00`);
    const activeTier = member?.memberships?.[0]?.tier || (isGold ? "GOLD" : "WALK_IN");

    try {
      const res = await fetch("/api/razorpay/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          razorpay_order_id: paymentResult.razorpay_order_id,
          razorpay_payment_id: paymentResult.razorpay_payment_id,
          razorpay_signature: paymentResult.razorpay_signature,
          bookingData: {
            courtId: court.id,
            memberId: member.id,
            bookerName: member.name,
            bookerPhone: member.phone,
            bookerEmail: member.email,
            bookerType: activeTier,
            startTime: slotStart.toISOString(),
            durationMinutes: 60,
            source: "MEMBER_PORTAL",
            userId: currentUser?.id,
            userName: currentUser?.name,
            holdId: activeHold?.id,
            sessionId,
            notes: isGold
              ? "Gold Member Booking (₹100 Security Deposit held via Razorpay Trial Gateway)"
              : `Member Court Booking (${activeTier} via Razorpay)`,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        setModalError(data.error || "Booking verification failed");
        setBookingError(data.error || "Booking verification failed");
      } else {
        setBookingSuccess(data.booking);
        setIsRazorpayModalOpen(false);
        setConfirmSlotModal(null);
        setActiveHold(null);
        myLockRef.current = null;
        // Release lock proactively
        fetch("/api/slot-lock", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ courtId: court.id, slotTime: slotStart.toISOString(), sessionId }),
        }).catch(() => {});
        await fetchMemberData();
      }
    } catch (err: any) {
      setModalError(err.message || "Network error occurred.");
      setBookingError(err.message || "Network error occurred.");
    } finally {
      setIsBookingSubmitting(false);
    }
  };

  const handleClaimRefund = async (bookingId: string) => {
    setRefundingBookingId(bookingId);
    setRefundAlert(null);
    try {
      const res = await fetch("/api/razorpay/refund", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setRefundAlert({ success: false, message: data.error || "Failed to process refund" });
      } else {
        setRefundAlert({
          success: true,
          message: data.message || "₹100 INR Security deposit has been refunded to your original payment method.",
        });
        await fetchMemberData();
      }
    } catch (err: any) {
      setRefundAlert({ success: false, message: err.message });
    } finally {
      setRefundingBookingId(null);
    }
  };

  /** Called when user clicks a free slot — tries to acquire the 300s lock first */
  const handleSlotClick = useCallback(
    async (court: any, time: string) => {
      setLockAcquireError(null);
      setBookingError(null);
      setBookingSuccess(null);

      const slotStart = new Date(`${bookingDate}T${time}:00`);
      const slotTimeISO = slotStart.toISOString();

      const res = await fetch("/api/slot-lock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courtId: court.id,
          slotTime: slotTimeISO,
          sessionId,
          memberId: member?.id,
        }),
      });

      const data = await res.json();

      if (res.ok && data.acquired) {
        // We own the lock — open confirmation modal
        myLockRef.current = { courtId: court.id, slotTime: slotTimeISO };
        setSlotLocks((prev) => [
          ...prev.filter((l) => !(l.courtId === court.id && l.slotTime === slotTimeISO)),
          { courtId: court.id, slotTime: slotTimeISO, expiresAt: data.expiresAt, sessionId: data.sessionId },
        ]);
        setBookingError(null);
        setConfirmSlotModal({ court, time });
      } else {
        // Slot locked by another user
        const secs = data.secondsRemaining ?? 0;
        setLockAcquireError(
          `⏳ This slot is temporarily held by another member. Try again in ${secs} second${secs !== 1 ? "s" : ""}.`
        );
        await fetchMemberData();
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [bookingDate, sessionId, member]
  );

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

  // Helper to check if a slot is currently held by another customer (300s TTL)
  const isSlotHeld = (courtId: string, timeStr: string) => {
    const slotStart = new Date(`${bookingDate}T${timeStr}:00`);
    const slotEnd = new Date(slotStart.getTime() + 60 * 60000);
    const now = Date.now();
    return dayHolds.some((h: any) => {
      if (h.courtId !== courtId) return false;
      const hStart = new Date(h.startTime).getTime();
      const hEnd = new Date(h.endTime).getTime();
      const isHeld = hStart < slotEnd.getTime() && hEnd > slotStart.getTime() && h.expiresAt > now;
      const isMine =
        (currentUser?.id && h.userId === currentUser.id) ||
        (member?.id && h.memberId === member.id) ||
        (activeHold?.id && h.id === activeHold.id);
      return isHeld && !isMine;
    });
  };

  const isSlotPast = (timeStr: string) => {
    const todayStr = new Date().toISOString().split("T")[0];
    if (bookingDate < todayStr) return true;
    if (bookingDate > todayStr) return false;
    const [h, m] = timeStr.split(":").map(Number);
    const now = new Date();
    const slotDate = new Date();
    slotDate.setHours(h, m, 0, 0);
    return slotDate < now;
  };

  /** Returns the lock entry if the slot is locked by someone OTHER than me */
  const getSlotLockForOther = (courtId: string, timeStr: string) => {
    const slotStart = new Date(`${bookingDate}T${timeStr}:00`);
    const slotTimeISO = slotStart.toISOString();
    const lock = slotLocks.find(
      (l) => l.courtId === courtId && l.slotTime === slotTimeISO && l.sessionId !== sessionId
    );
    if (!lock) return null;
    const secs = lockCountdowns[`${courtId}|${slotTimeISO}`] ?? 0;
    return secs > 0 ? { ...lock, secondsRemaining: secs } : null;
  };

  /** Returns true if WE hold the lock on this slot (showing confirm modal or just acquired) */
  const isSlotLockedByMe = (courtId: string, timeStr: string) => {
    const slotStart = new Date(`${bookingDate}T${timeStr}:00`);
    const slotTimeISO = slotStart.toISOString();
    return slotLocks.some(
      (l) => l.courtId === courtId && l.slotTime === slotTimeISO && l.sessionId === sessionId
    );
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
  const isSilver = plan?.tier === "SILVER";
  const isJunior = plan?.tier === "JUNIOR";
  const isFree = !plan || plan?.tier === "FREE";
  const barDiscountPercent = plan?.barDiscountPercent || (isGold ? 20 : isSilver ? 10 : isJunior ? 15 : 0);

  // Expiry calculation
  const expiryDate = membership?.endDate ? new Date(membership.endDate) : null;
  const daysUntilExpiry = expiryDate
    ? Math.ceil((expiryDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null;
  const isExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry <= 5 && daysUntilExpiry >= 0;
  const isExpired = daysUntilExpiry !== null && daysUntilExpiry < 0;

  useEffect(() => {
    if ((isExpiringSoon || isExpired) && !hasDismissedExpiry) {
      setShowExpiryPopup(true);
    }
  }, [isExpiringSoon, isExpired, hasDismissedExpiry]);

  // Advance booking window clamp
  const advanceDays = plan?.advanceBookingDays || (isFree ? 3 : 14);
  const maxAllowedDate = new Date();
  maxAllowedDate.setDate(maxAllowedDate.getDate() + advanceDays);
  const maxAllowedDateStr = maxAllowedDate.toISOString().split("T")[0];
  const todayStr = new Date().toISOString().split("T")[0];

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
            <div className="flex items-center gap-2.5">
              <h1 className="font-serif text-xl sm:text-2xl font-bold text-[#0B1320] dark:text-white">
                {member?.name || currentUser?.name || "Distinguished Member"}
              </h1>
              <span className={`text-[9px] font-mono px-2 py-0.5 rounded font-bold uppercase tracking-wider border ${
                isGold
                  ? "border-[#DFCA9B] bg-[#FAF7EE] text-[#8C6D23] dark:bg-[#1C1608] dark:text-[#E3CEA4] dark:border-[#4B3C18]"
                  : isSilver
                  ? "border-slate-300 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600"
                  : isJunior
                  ? "border-teal-300 bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300 dark:border-teal-800"
                  : "border-amber-200 bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800"
              }`}>
                {plan?.tier || "FREE"} PRIVILEGE
              </span>
            </div>
            <div className="flex items-center gap-3 mt-0.5">
              <span className="text-xs text-[#6B7280] dark:text-[#9CA3AF] font-mono">
                Club ID: {member?.memberId || currentUser?.memberCode || "CC-1868-001"}
              </span>
              {(!isGold || isExpired) && (
                <button
                  onClick={() => setShowUpgradeModal(true)}
                  className="text-[10px] font-bold text-[#921111] dark:text-[#DFCA9B] hover:underline uppercase tracking-wider flex items-center gap-0.5"
                >
                  <span> {isFree ? "Upgrade Tier" : "Change / Renew Plan"}</span>
                </button>
              )}
            </div>
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
            className={`px-3 py-1.5 rounded transition-all flex items-center gap-1.5 ${
              activeTab === "SHOP"
                ? "bg-[#921111] text-white shadow-sm font-bold"
                : "text-[#4B5563] dark:text-[#9CA3AF] hover:text-[#921111] dark:hover:text-white"
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Pro Shop</span>
            {shopCart.length > 0 && (
              <span className="text-[9px] px-1.5 py-0.2 rounded font-mono font-bold bg-[#C5A059] text-[#0B1320]">
                {shopCart.reduce((a, b) => a + b.quantity, 0)}
              </span>
            )}
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

      {/* 5-DAY EXPIRY ALERT NOTIFICATION BANNER */}
      {isExpiringSoon && (
        <div className="p-4 rounded-lg bg-[#FFFBEB] dark:bg-[#1E1608] border border-[#FDE68A] dark:border-[#78350F] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-sm">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-[#D97706] dark:text-[#FBBF24] shrink-0 mt-0.5" />
            <div>
              <p className="font-serif font-bold text-sm text-[#92400E] dark:text-[#FDE68A]">
                ⚠️ Membership Expiring in {daysUntilExpiry} Day{daysUntilExpiry === 1 ? "" : "s"} ({formatDate(membership.endDate)})
              </p>
              <p className="text-[#B45309] dark:text-[#D97706] mt-0.5 leading-relaxed">
                Your <strong>{plan?.name}</strong> privilege is nearing completion. Renew or upgrade your tier today to preserve your court privileges and member tab rates.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowUpgradeModal(true)}
            className="px-4 py-2 rounded-md bg-[#921111] hover:bg-[#720C0C] text-white font-bold text-xs uppercase tracking-wider shrink-0 transition-all shadow-sm cursor-pointer"
          >
            Renew / Upgrade Now
          </button>
        </div>
      )}

      {isExpired && (
        <div className="p-4 rounded-lg bg-[#FEF2F2] dark:bg-[#1E0E10] border border-[#FECACA] dark:border-[#581A1D] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-sm">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-[#DC2626] dark:text-[#F87171] shrink-0 mt-0.5" />
            <div>
              <p className="font-serif font-bold text-sm text-[#991B1B] dark:text-[#FCA5A5]">
                🚨 Membership Expired on {formatDate(membership.endDate)}
              </p>
              <p className="text-[#B91C1C] dark:text-[#F87171] mt-0.5 leading-relaxed">
                Your club subscription has expired. Standard member discounts and booking windows are inactive until renewed.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowUpgradeModal(true)}
            className="px-4 py-2 rounded-md bg-[#921111] hover:bg-[#720C0C] text-white font-bold text-xs uppercase tracking-wider shrink-0 transition-all shadow-sm cursor-pointer"
          >
            Renew Tier
          </button>
        </div>
      )}

      {/* 1. DIGITAL MEMBERSHIP CARD & DASHBOARD OVERVIEW */}
      {activeTab === "PASS" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            {/* DIGITAL CREDENTIAL CARD - NYAC Athletic Club Style */}
            <div
              className={`p-6 rounded-lg relative overflow-hidden shadow-lg flex flex-col justify-between h-80 text-white ${
                isGold
                  ? "bg-[#0B1320] border-2 border-[#C5A059]"
                  : isSilver
                  ? "bg-[#1E293B] border-2 border-slate-400"
                  : isJunior
                  ? "bg-[#042F2E] border-2 border-teal-500"
                  : "bg-[#162032] border border-[#334155]"
              }`}
            >
              {/* Gold foil corner emblem */}
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div>
                  <span className="text-[9px] tracking-[0.24em] uppercase font-bold text-[#DFCA9B] block">
                    The Champions Club • Est. 1868
                  </span>
                  <h3 className="font-serif text-lg font-bold tracking-tight text-white">
                    {plan?.name || "Free Community Tier"}
                  </h3>
                </div>
                <div className="w-8 h-8 rounded bg-[#921111] text-[#C5A059] border border-[#C5A059]/40 flex items-center justify-center font-serif text-xs font-bold">
                  {isGold ? "👑" : isSilver ? "🥈" : isJunior ? "🧒" : "🎟️"}
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
                <span className="text-[#9CA3AF]">Valid Through: <strong className="text-white font-mono">{membership?.endDate ? formatDate(membership.endDate) : "Active Account"}</strong></span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-[#FAF7EE] text-[#8C6D23] border border-[#DFCA9B]">
                  {member?.status || "ACTIVE"}
                </span>
              </div>
            </div>

            {/* PLAN ENTITLEMENTS & PRIVILEGES */}
            <div className="md:col-span-2 p-6 rounded-lg bg-white dark:bg-[#0E1522] border border-[#E5DFD5] dark:border-[#222D3E] shadow-sm space-y-4 text-xs">
              <div className="flex items-center justify-between border-b border-[#E5DFD5] dark:border-[#222D3E] pb-3">
                <div>
                  <h3 className="font-serif text-base font-bold text-[#0B1320] dark:text-white">Tier Privileges & Daily Allowances</h3>
                  <span className="text-[10px] text-[#8C6D23] dark:text-[#DFCA9B] uppercase font-bold tracking-wider">
                    {plan?.name || "Free Community Tier"} Entitlements
                  </span>
                </div>
                {(!isGold || isExpired) && (
                  <button
                    onClick={() => setShowUpgradeModal(true)}
                    className="px-3 py-1.5 rounded-md bg-[#921111] hover:bg-[#720C0C] text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1 shadow-sm transition-all"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#C5A059]" />
                    <span>{isFree ? "Upgrade Tier" : "Upgrade Plan"}</span>
                  </button>
                )}
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

          {/* Refund Alert Message */}
          {refundAlert && (
            <div
              className={`p-3.5 rounded-lg border text-xs flex items-center justify-between gap-2 shadow-xs ${
                refundAlert.success
                  ? "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300"
                  : "bg-red-50 dark:bg-red-950/60 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300"
              }`}
            >
              <div className="flex items-center gap-2">
                {refundAlert.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                )}
                <span>{refundAlert.message}</span>
              </div>
              <button
                onClick={() => setRefundAlert(null)}
                className="text-xs font-bold uppercase opacity-80 hover:opacity-100"
              >
                Dismiss
              </button>
            </div>
          )}

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
                const isSlotEnded = new Date(booking.endTime) <= now || booking.status === "COMPLETED";
                const hasDeposit = (booking.securityDepositPaise || 0) > 0 || booking.bookerType === "GOLD";
                const isDepositRefunded = booking.depositRefundStatus === "REFUNDED";

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

                    {/* Gold Member 100 INR Security Deposit Status */}
                    {hasDeposit && (
                      <div className="text-xs">
                        {isDepositRefunded ? (
                          <div className="p-2.5 rounded bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
                            <div className="flex items-center gap-1.5 font-bold">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span>₹100 Security Deposit Refunded</span>
                            </div>
                            <span className="font-mono text-[10px] text-emerald-700 dark:text-emerald-400">
                              {booking.depositRefundedAt ? formatDate(booking.depositRefundedAt) : "Refund Completed"}
                            </span>
                          </div>
                        ) : isSlotEnded ? (
                          <div className="p-2.5 rounded bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 font-bold">
                              <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                              <span>Slot Ended: ₹100 Deposit Ready for Refund</span>
                            </div>
                            <button
                              type="button"
                              disabled={refundingBookingId === booking.id}
                              onClick={() => handleClaimRefund(booking.id)}
                              className="px-3 py-1.5 rounded bg-[#0C2340] hover:bg-[#08172b] text-white font-bold text-[10px] uppercase tracking-wider flex items-center justify-center gap-1 transition-all disabled:opacity-50 cursor-pointer"
                            >
                              {refundingBookingId === booking.id ? (
                                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <RefreshCw className="w-3 h-3 text-[#DFCA9B]" />
                              )}
                              <span>{refundingBookingId === booking.id ? "Refunding..." : "Claim ₹100 Refund"}</span>
                            </button>
                          </div>
                        ) : (
                          <div className="p-2.5 rounded bg-[#C5A059]/15 border border-[#C5A059]/30 text-[#8C6D23] dark:text-[#DFCA9B] flex items-center justify-between">
                            <div className="flex items-center gap-1.5 font-bold">
                              <ShieldCheck className="w-3.5 h-3.5 text-[#C5A059] shrink-0" />
                              <span>₹100 Security Deposit in Escrow</span>
                            </div>
                            <span className="text-[10px] opacity-90">Auto-refunds when slot ends</span>
                          </div>
                        )}
                      </div>
                    )}

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
                  min={todayStr}
                  max={maxAllowedDateStr}
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
          {lockAcquireError && (
            <div className="p-3.5 rounded-md bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs flex items-center justify-between gap-2 shadow-xs">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-500" />
                <span>{lockAcquireError}</span>
              </div>
              <button
                onClick={() => setLockAcquireError(null)}
                className="text-amber-600 dark:text-amber-400 hover:text-amber-900 text-xs font-bold"
              >
                Dismiss
              </button>
            </div>
          )}

          {bookingError && (
            <div className="p-3.5 rounded-md bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{bookingError}</span>
            </div>
          )}

          {/* FRIDAY NIGHT SOCIAL PLAY FEATURE CARD */}
          {socialSessions && socialSessions.length > 0 && (
            <div className="space-y-3">
              {socialSessions.map((session) => {
                const isMemberEnrolled = session.participants?.some(
                  (p: any) => (p.memberId && p.memberId === member?.id) || (p.guestName && p.guestName === (member?.name || currentUser?.name))
                );
                const isFull = (session.participants?.length || 0) >= session.capacity;
                const courtObj = courts.find((c) => c.id === session.courtId);

                return (
                  <div
                    key={session.id}
                    className="p-5 rounded-lg bg-gradient-to-r from-[#0B1320] via-[#162032] to-[#0B1320] text-white border-2 border-[#C5A059] shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 max-w-xl">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded bg-[#C5A059] text-slate-950 text-[10px] font-mono font-bold uppercase tracking-wider">
                          🏆 FRIDAY NIGHT SOCIAL PLAY
                        </span>
                        <span className="text-xs text-[#DFCA9B] font-mono">
                          {formatDateTime(session.startTime)} – {new Date(session.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className="text-[10px] text-slate-300 bg-white/10 px-2 py-0.5 rounded font-medium">
                          {courtObj?.name || "Padel Court 1"}
                        </span>
                      </div>

                      <h4 className="font-serif text-lg font-bold text-white tracking-wide">
                        {session.name}
                      </h4>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {session.description || "Multi-player court sharing session. Rotate partners in King-of-the-Court doubles matches with music and refreshments."}
                      </p>

                      <div className="flex items-center gap-4 text-xs pt-1 text-[#DFCA9B]">
                        <span>👥 <strong>{session.participants?.length || 0}/{session.capacity}</strong> Players Enrolled</span>
                        <span>💳 Tariff: <strong>{formatINR(session.pricePerPersonPaise || 35000)} / player</strong></span>
                      </div>

                      {/* Participant tags */}
                      {session.participants && session.participants.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-2">
                          {session.participants.map((p: any) => (
                            <span
                              key={p.id}
                              className={`text-[10px] px-2 py-0.5 rounded border font-medium ${
                                p.memberId === member?.id || p.guestName === (member?.name || currentUser?.name)
                                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-400 font-bold"
                                  : "bg-white/10 text-slate-200 border-white/20"
                              }`}
                            >
                              🎾 {p.guestName} {p.memberId === member?.id ? "(You)" : ""}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="shrink-0 w-full md:w-auto">
                      {isMemberEnrolled ? (
                        <div className="px-4 py-2.5 rounded-md bg-emerald-500/20 border border-emerald-400 text-emerald-300 text-xs font-bold uppercase tracking-wider text-center flex items-center justify-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Pass Confirmed (Enrolled)</span>
                        </div>
                      ) : isFull ? (
                        <div className="px-4 py-2.5 rounded-md bg-slate-800 border border-slate-700 text-slate-400 text-xs font-bold uppercase tracking-wider text-center">
                          Session Full (12/12)
                        </div>
                      ) : (
                        <button
                          disabled={joiningSocialId === session.id}
                          onClick={() => handleJoinSocialSession(session)}
                          className="w-full md:w-auto px-5 py-3 rounded-md bg-[#C5A059] hover:bg-[#B38F46] text-[#0B1320] font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-50"
                        >
                          <span>{joiningSocialId === session.id ? "Enrolling..." : `Join Social Play (${formatINR(session.pricePerPersonPaise || 35000)})`}</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Slot Legend */}
          <div className="flex flex-wrap items-center gap-4 text-[10px] font-mono uppercase tracking-wider text-[#6B7280] dark:text-[#9CA3AF] bg-[#FAF8F5] dark:bg-[#121A28] p-2.5 rounded-md border border-[#E5DFD5] dark:border-[#222D3E]">
            <span className="font-bold text-[#8C6D23] dark:text-[#DFCA9B]">Legend:</span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-white dark:bg-[#0E1522] border border-[#E5DFD5] dark:border-[#222D3E]" />
              <span>Available</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-amber-400/80 border border-amber-500" />
              <span>Locked (300s TTL)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-blue-500/80 border border-blue-600" />
              <span>Held by You</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-[#FAF8F5] dark:bg-[#121A28] border border-[#E5DFD5] dark:border-[#222D3E] opacity-60" />
              <span>Booked / Past</span>
            </span>
          </div>

          {/* Courts Grid with Full Hourly Slots */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {filteredCourts.map((court) => {
              const effectiveTier = plan?.tier || "WALK_IN";
              const samplePricing = calculateCourtPrice({
                tier: effectiveTier,
                isPeak: false,
                baseHourlyRatePaise: court.hourlyRatePaise,
              });
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
                        {isGold
                          ? "Complimentary (Gold)"
                          : samplePricing.discountPercent > 0
                          ? `${formatINR(samplePricing.finalPricePaise)} / hr (${samplePricing.discountPercent}% Off)`
                          : `${formatINR(court.hourlyRatePaise)} / hr`}
                      </span>
                      <span className="text-[10px] text-[#8C6D23] dark:text-[#DFCA9B] uppercase font-bold tracking-wider">60 Min Sessions</span>
                    </div>
                  </div>

                  {/* Hourly Slot Buttons (06:00 to 22:00) */}
                  <div>
                    <div className="flex items-center justify-between pb-2 text-[10px] font-bold text-[#8C6D23] dark:text-[#DFCA9B] uppercase tracking-wider">
                      <span>Available 60-Minute Slots:</span>
                      <span className="font-mono text-[#6B7280] dark:text-[#9CA3AF]">
                        {slotsToDisplay.filter((t) => !isSlotBooked(court.id, t) && !isSlotHeld(court.id, t) && !isSlotPast(t) && !getSlotLockForOther(court.id, t)).length} open slots
                      </span>
                    </div>

                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5">
                      {slotsToDisplay.map((t) => {
                        const booked = isSlotBooked(court.id, t);
                        const held = isSlotHeld(court.id, t);
                        const past = isSlotPast(t);
                        const lockedOther = getSlotLockForOther(court.id, t);
                        const lockedByMe = isSlotLockedByMe(court.id, t);
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

                        if (held) {
                          return (
                            <div
                              key={t}
                              className="py-1.5 px-1 rounded-md bg-amber-50/80 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/60 text-amber-700 dark:text-amber-300 text-center text-[10px] font-mono font-bold cursor-not-allowed select-none"
                              title="Slot is temporarily held in another user's checkout (300s lock)"
                            >
                              <span>{t}</span>
                              <span className="block text-[8px] uppercase tracking-tighter text-amber-600 dark:text-amber-400 font-sans font-bold">Held ⏳</span>
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

                        if (lockedOther) {
                          return (
                            <div
                              key={t}
                              className="py-1.5 px-1 rounded-md bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300 text-center text-[10px] font-mono font-bold cursor-not-allowed select-none animate-pulse"
                              title={`Slot held by another member (${lockedOther.secondsRemaining}s remaining)`}
                            >
                              <div className="flex items-center justify-center gap-0.5">
                                <Lock className="w-2.5 h-2.5 shrink-0" />
                                <span>{t}</span>
                              </div>
                              <span className="block text-[8px] text-amber-600 dark:text-amber-400 uppercase tracking-tighter font-sans">
                                {lockedOther.secondsRemaining}s
                              </span>
                            </div>
                          );
                        }

                        if (lockedByMe) {
                          return (
                            <button
                              key={t}
                              onClick={() => setConfirmSlotModal({ court, time: t })}
                              className="py-1.5 px-1 rounded-md bg-blue-50 dark:bg-blue-950/50 border-2 border-blue-500 text-blue-800 dark:text-blue-200 text-center text-[10px] font-mono font-bold hover:bg-blue-100 transition-all shadow-xs relative"
                              title="Held by your session — click to confirm"
                            >
                              <div className="flex items-center justify-center gap-0.5">
                                <Lock className="w-2.5 h-2.5 text-blue-600 shrink-0" />
                                <span>{t}</span>
                              </div>
                              <span className="block text-[8px] text-blue-600 dark:text-blue-400 uppercase tracking-tighter font-sans font-extrabold">
                                Yours
                              </span>
                            </button>
                          );
                        }

                        return (
                          <button
                            key={t}
                            onClick={() => handleOpenSlotModal(court, t)}
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
            <div className="p-4 rounded-md bg-[#C5A059]/15 border border-[#C5A059]/40 text-[#0B1320] dark:text-white text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <ChefHat className="w-6 h-6 text-[#921111] shrink-0" />
                <div>
                  <p className="font-serif font-bold text-sm">Order #{orderPlacedSuccess.orderNumber} Dispatched to Kitchen & Bar</p>
                  <p className="text-[11px] text-[#6B7280] dark:text-[#9CA3AF] mt-0.5">
                    Your order has been routed to the Kitchen Display System (KDS). {barDiscountPercent}% member privilege automatically applied.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={`/api/billing/invoice/${orderPlacedSuccess.id || orderPlacedSuccess.orderNumber}/pdf`}
                  target="_blank"
                  rel="noreferrer"
                  download={`Invoice-${orderPlacedSuccess.orderNumber || "Cafe"}.pdf`}
                  onClick={(e) => {
                    e.preventDefault();
                    downloadPdfInvoice(
                      `/api/billing/invoice/${orderPlacedSuccess.id || orderPlacedSuccess.orderNumber}/pdf`,
                      `Invoice-${orderPlacedSuccess.orderNumber || "Cafe"}.pdf`
                    );
                  }}
                  className="px-3.5 py-1.5 rounded-md bg-[#921111] hover:bg-[#720C0C] text-white font-bold text-xs uppercase tracking-wider shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>PDF Invoice</span>
                </a>
                <button
                  onClick={() => setCafeSubTab("ORDERS")}
                  className="px-3.5 py-1.5 rounded-md bg-white dark:bg-[#121A28] border border-[#E5DFD5] dark:border-[#222D3E] text-[#0B1320] dark:text-white hover:border-[#C5A059] font-bold text-xs uppercase tracking-wider shadow-xs"
                >
                  View Tab
                </button>
              </div>
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
                      <th className="p-3 text-right">Tax Invoice</th>
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
                        <td className="p-3 text-right">
                          <a
                            href={`/api/billing/invoice/${t.id}/pdf`}
                            download={`Invoice-${t.tabNumber}.pdf`}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => {
                              e.preventDefault();
                              downloadPdfInvoice(`/api/billing/invoice/${t.id}/pdf`, `Invoice-${t.tabNumber}.pdf`);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#921111] hover:bg-[#720C0C] text-white font-bold text-[10px] uppercase tracking-wider shadow-2xs transition-colors cursor-pointer"
                          >
                            <Download className="w-3 h-3" />
                            <span>PDF Invoice</span>
                          </a>
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

      {/* 5. PRO SHOP CATALOG VIEW WITH BILLING SERVICE */}
      {activeTab === "SHOP" && (
        <div className="space-y-6">
          <div className="p-6 rounded-lg bg-white dark:bg-[#0E1522] border border-[#E5DFD5] dark:border-[#222D3E] shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#E5DFD5] dark:border-[#222D3E]">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-serif text-lg font-bold text-[#0B1320] dark:text-white">
                    Pro Shop Official Athletic Equipment
                  </h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#C5A059]/15 text-[#8C6D23] dark:text-[#DFCA9B] border border-[#C5A059]/30 font-bold uppercase tracking-wider">
                    {products.length} CATALOG ITEMS
                  </span>
                </div>
                <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF] mt-0.5">
                  Championship grade racquets, balls, footwear & apparel with member tier privilege discounts.
                </p>
              </div>

              {/* Membership privilege badge & Cart checkout action */}
              <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                <div className="px-3 py-1.5 rounded-lg bg-[#FAF8F5] dark:bg-[#121A28] border border-[#E5DFD5] dark:border-[#222D3E] text-right">
                  <span className="text-[9px] uppercase tracking-wider font-bold text-[#5A6578] dark:text-[#8E9CAE] block">
                    Tier Privilege
                  </span>
                  <span className="font-bold text-xs text-[#8C6D23] dark:text-[#DFCA9B]">
                    {currentMemberTier} ({shopDiscountPercent}% Off)
                  </span>
                </div>

                {shopCart.length > 0 && (
                  <button
                    onClick={() => setShopCheckoutModalOpen(true)}
                    className="px-4 py-2 rounded-lg bg-[#921111] hover:bg-[#720C0C] text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-md transition-all cursor-pointer animate-pulse"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>Checkout Cart ({shopCart.reduce((a, b) => a + b.quantity, 0)})</span>
                  </button>
                )}
              </div>
            </div>

            {/* Active Cart Banner / Floating drawer summary */}
            {shopCart.length > 0 && (
              <div className="p-4 rounded-lg bg-[#FAF8F5] dark:bg-[#121A28] border border-[#C5A059]/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#921111]/10 text-[#921111] dark:text-[#DFCA9B] flex items-center justify-center shrink-0">
                    <Receipt className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-serif font-bold text-xs text-[#0B1320] dark:text-white">
                      Selected Items: {shopCart.length} product{shopCart.length > 1 ? "s" : ""} ({shopCart.reduce((a, b) => a + b.quantity, 0)} units)
                    </h4>
                    <p className="text-[11px] text-[#6B7280] dark:text-[#9CA3AF]">
                      Full Price: <strong className="font-mono">{formatINR(shopBillingDetails.totalFullPricePaise)}</strong> • Tier Discount: <strong className="font-mono text-[#8C6D23] dark:text-[#DFCA9B]">-{formatINR(shopBillingDetails.totalDiscountPaise)}</strong> • Security Deposit: <strong className="font-mono text-[#0B1320] dark:text-white">+₹100 INR</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
                  <div className="text-right">
                    <span className="text-[9px] uppercase tracking-wider font-bold text-[#6B7280] dark:text-[#9CA3AF] block">
                      Payable Total (incl. ₹100 deposit)
                    </span>
                    <span className="font-serif font-bold text-base text-[#921111] dark:text-[#DFCA9B]">
                      {formatINR(shopBillingDetails.finalPayablePaise)}
                    </span>
                  </div>
                  <button
                    onClick={() => setShopCheckoutModalOpen(true)}
                    className="px-4 py-2.5 rounded-lg bg-[#921111] hover:bg-[#720C0C] text-white font-bold text-xs uppercase tracking-wider shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Proceed to Billing Checkout</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Product Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {products.map((p) => {
                const inCartItem = shopCart.find((i) => i.product.id === p.id);
                const fullPrice = p.pricePaise;
                const discountPaise = Math.round((fullPrice * shopDiscountPercent) / 100);
                const memberPricePaise = Math.max(0, fullPrice - discountPaise);

                return (
                  <div
                    key={p.id}
                    className="p-4 rounded-lg border border-[#E5DFD5] dark:border-[#222D3E] bg-[#FAF8F5]/60 dark:bg-[#121A28]/60 hover:border-[#C5A059] flex flex-col justify-between text-xs space-y-3 transition-all"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-mono font-bold text-[#8C6D23] dark:text-[#DFCA9B] uppercase tracking-wider">
                          {p.brand || "CHAMPIONS"}
                        </span>
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                          {p.category}
                        </span>
                      </div>
                      <h4 className="font-serif font-bold text-[#0B1320] dark:text-white text-sm mt-1">
                        {p.name}
                      </h4>
                      {p.sku && (
                        <span className="text-[10px] font-mono text-[#8E9CAE]">SKU: {p.sku}</span>
                      )}
                    </div>

                    <div className="pt-2 border-t border-[#E5DFD5] dark:border-[#222D3E] space-y-2">
                      <div className="flex items-baseline justify-between">
                        <div>
                          <span className="text-[10px] text-[#6B7280] dark:text-[#9CA3AF] block">Full Price:</span>
                          <span className={`font-mono text-xs ${shopDiscountPercent > 0 ? "line-through text-gray-400" : "font-bold text-[#0B1320] dark:text-white"}`}>
                            {formatINR(fullPrice)}
                          </span>
                        </div>
                        {shopDiscountPercent > 0 && (
                          <div className="text-right">
                            <span className="text-[10px] text-[#8C6D23] dark:text-[#DFCA9B] font-bold block">
                              Member Rate:
                            </span>
                            <span className="font-serif font-bold text-sm text-[#921111] dark:text-[#DFCA9B]">
                              {formatINR(memberPricePaise)}
                            </span>
                          </div>
                        )}
                      </div>

                      {shopDiscountPercent > 0 && (
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-[#8C6D23] dark:text-[#DFCA9B] font-bold">
                            Save {shopDiscountPercent}% (-{formatINR(discountPaise)})
                          </span>
                          <span className="text-[9px] text-[#6B7280] dark:text-[#9CA3AF] font-mono">
                            + ₹100 deposit
                          </span>
                        </div>
                      )}

                      {inCartItem ? (
                        <div className="flex items-center justify-between pt-1">
                          <div className="flex items-center gap-1.5 border border-[#E5DFD5] dark:border-[#222D3E] rounded p-0.5 bg-white dark:bg-[#0E1522]">
                            <button
                              type="button"
                              onClick={() => updateShopCartQty(inCartItem.variant.id, -1)}
                              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded text-[#0B1320] dark:text-white"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="font-mono font-bold px-1.5 text-xs text-[#0B1320] dark:text-white">
                              {inCartItem.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateShopCartQty(inCartItem.variant.id, 1)}
                              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded text-[#0B1320] dark:text-white"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => setShopCheckoutModalOpen(true)}
                            className="px-2.5 py-1.5 rounded bg-[#921111] text-white font-bold text-[11px] uppercase tracking-wider"
                          >
                            Checkout
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            addToShopCart(p);
                            setShopCheckoutModalOpen(true);
                          }}
                          className="w-full py-2 rounded-md bg-[#921111] hover:bg-[#720C0C] text-white font-bold text-xs uppercase tracking-wider shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                        >
                          <ShoppingBag className="w-3 h-3" />
                          <span>Buy / Acquire</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
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
              onClick={handleCloseConfirmModal}
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

            {/* Live 300-Second TTL Slot Lock Banner */}
            <div className="p-3 rounded-lg bg-[#FAF8F5] dark:bg-[#121A28] border border-[#C5A059]/40 flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-[#921111] dark:text-[#DFCA9B] animate-pulse shrink-0" />
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C6D23] dark:text-[#DFCA9B] block">
                    Exclusive Slot Hold (TTL)
                  </span>
                  <span className="text-[10px] text-[#6B7280] dark:text-[#9CA3AF]">
                    Temporary 5-min checkout lock reserved for you
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span
                  className={`font-mono font-bold text-sm px-2.5 py-1 rounded border shadow-inner ${
                    holdSecondsRemaining <= 30
                      ? "bg-red-50 dark:bg-red-950/60 text-red-600 border-red-300 dark:border-red-800 animate-bounce"
                      : "bg-white dark:bg-[#0E1522] text-[#921111] dark:text-[#DFCA9B] border-[#C5A059]/40"
                  }`}
                >
                  {String(Math.floor(holdSecondsRemaining / 60)).padStart(2, "0")}:
                  {String(holdSecondsRemaining % 60).padStart(2, "0")}
                </span>
              </div>
            </div>
            {modalError && (
              <div className="p-3.5 rounded-lg bg-red-50 dark:bg-red-950/80 border border-red-300 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-start gap-2.5 shadow-sm animate-in fade-in slide-in-from-top-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600 dark:text-red-400 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-bold block text-red-800 dark:text-red-200 uppercase tracking-wide text-[10px]">
                    Booking Error / Notice
                  </span>
                  <span className="text-[11px] leading-relaxed block">{modalError}</span>
                </div>
              </div>
            )}

            {(() => {
              const modalSlotStart = new Date(`${bookingDate}T${confirmSlotModal.time}:00`);
              const modalIsPeak = isPeakHour(modalSlotStart);
              const modalPricing = calculateCourtPrice({
                tier: plan?.tier || "WALK_IN",
                isPeak: modalIsPeak,
                baseHourlyRatePaise: confirmSlotModal.court.hourlyRatePaise,
              });

              return (
                <div className="p-4 rounded-md bg-[#FAF8F5] dark:bg-[#121A28] border border-[#E5DFD5] dark:border-[#222D3E] space-y-2.5 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-[#6B7280] dark:text-[#9CA3AF]">Selected Date:</span>
                    <strong className="font-serif font-bold text-[#0B1320] dark:text-white">{formatDate(bookingDate)}</strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#6B7280] dark:text-[#9CA3AF]">Slot Time:</span>
                    <strong className="font-mono font-bold text-[#921111] dark:text-[#DFCA9B] text-sm">
                      {confirmSlotModal.time} (60 Mins) {modalIsPeak ? "🔥 Peak" : "🌿 Off-Peak"}
                    </strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#6B7280] dark:text-[#9CA3AF]">Member Name:</span>
                    <span className="font-serif font-bold text-[#0B1320] dark:text-white">{member?.name || currentUser?.name} ({plan?.name || "Community Plan"})</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#6B7280] dark:text-[#9CA3AF]">Standard Rate:</span>
                    <span className="font-mono text-[#4B5563] dark:text-[#9CA3AF]">{formatINR(confirmSlotModal.court.hourlyRatePaise)}/hr</span>
                  </div>
                  {modalPricing.discountPercent > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-[#8C6D23] dark:text-[#DFCA9B] font-bold">Tier Privilege ({plan?.tier}):</span>
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        -{modalPricing.discountPercent}% Off (-{formatINR(modalPricing.discountPaise)})
                      </span>
                    </div>
                  )}
                  {modalPricing.peakSurchargePaise > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-[#8C6D23] dark:text-[#DFCA9B]">Peak Surcharge:</span>
                      <span className="font-mono font-bold text-amber-600 dark:text-amber-400">+{formatINR(modalPricing.peakSurchargePaise)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-2 border-t border-[#E5DFD5] dark:border-[#222D3E]">
                    <span className="text-[#6B7280] dark:text-[#9CA3AF] font-bold">Pricing Tariff:</span>
                    <span className="font-serif font-bold text-sm text-[#921111] dark:text-[#DFCA9B]">
                      {modalPricing.finalPricePaise === 0 ? "Complimentary (Gold Privilege)" : formatINR(modalPricing.finalPricePaise)}
                    </span>
                  </div>

                  {isGold ? (
                    <>
                      <div className="flex justify-between items-center text-[#8C6D23] dark:text-[#DFCA9B] font-bold bg-[#C5A059]/10 p-2 rounded border border-[#C5A059]/30">
                        <div className="flex items-center gap-1.5">
                          <ShieldCheck className="w-4 h-4 text-[#C5A059]" />
                          <span>Security Deposit (Gold Member):</span>
                        </div>
                        <span className="font-mono text-sm">+₹100.00</span>
                      </div>
                      <div className="flex justify-between items-center pt-1 font-serif font-bold text-sm text-[#921111] dark:text-[#DFCA9B]">
                        <span>Total Due (Refundable Escrow):</span>
                        <span className="font-mono text-base">₹100.00</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex justify-between items-center pt-1 font-serif font-bold text-sm text-[#921111] dark:text-[#DFCA9B]">
                      <span>Total Payable:</span>
                      <span className="font-mono text-base">{formatINR(modalPricing.finalPricePaise)}</span>
                    </div>
                  )}
                </div>
              );
            })()}

            {parseInt(confirmSlotModal.time.split(":")[0]) >= 18 && (
              <div className="p-3 rounded-md bg-[#C5A059]/15 border border-[#C5A059]/30 text-[11px] text-[#8C6D23] dark:text-[#DFCA9B] flex items-center gap-2">
                <Flame className="w-4 h-4 shrink-0 text-[#921111]" />
                <span>Evening peak slot: Court floodlights will be automatically activated.</span>
              </div>
            )}

            {bookingError && (
              <div className="p-3 rounded-md bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 text-xs flex items-start gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
                <div className="text-[11px] leading-relaxed">
                  <strong className="block font-bold">Booking Notice</strong>
                  <span>{bookingError}</span>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={handleCloseConfirmModal}
                className="flex-1 py-2.5 rounded-md bg-[#FAF8F5] dark:bg-[#121A28] border border-[#E5DFD5] dark:border-[#222D3E] hover:bg-[#FAF8F5]/80 text-[#4B5563] dark:text-[#9CA3AF] font-bold text-xs uppercase tracking-wider transition-colors"
              >
                Cancel & Release
              </button>
              <button
                type="button"
                disabled={isBookingSubmitting || holdSecondsRemaining <= 0}
                onClick={() => handlePortalBooking(confirmSlotModal.court, confirmSlotModal.time)}
                className="flex-1 py-2.5 rounded-md bg-[#0C2340] hover:bg-[#08172b] text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-sm transition-all disabled:opacity-50 cursor-pointer"
              >
                {isBookingSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <ShieldCheck className="w-4 h-4 text-[#DFCA9B]" />
                )}
                <span>
                  {isBookingSubmitting
                    ? "Opening Razorpay..."
                    : holdSecondsRemaining <= 0
                    ? "Hold Expired"
                    : isGold
                    ? "Pay ₹100 Deposit (Razorpay)"
                    : "Pay via Razorpay"}
                </span>
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
              {((selectedBookingModal.securityDepositPaise ?? (selectedBookingModal.bookerType === "GOLD" ? 10000 : 0)) > 0) && (
                <div className="flex items-center justify-between text-[#8C6D23] dark:text-[#DFCA9B] font-bold bg-[#C5A059]/10 p-2 rounded border border-[#C5A059]/30">
                  <span>Security Deposit (Refundable):</span>
                  <span className="font-mono">+{formatINR(selectedBookingModal.securityDepositPaise || 10000)}</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-2">
              <a
                href={`/api/billing/invoice/${selectedBookingModal.id}/pdf`}
                download={`${selectedBookingModal.bookingNumber || "Court-Invoice"}.pdf`}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => {
                  e.preventDefault();
                  downloadPdfInvoice(
                    `/api/billing/invoice/${selectedBookingModal.id}/pdf`,
                    `${selectedBookingModal.bookingNumber || "Court-Invoice"}.pdf`
                  );
                }}
                className="flex-1 py-2 rounded-md bg-[#FAF8F5] dark:bg-[#121A28] border border-[#E5DFD5] dark:border-[#222D3E] hover:bg-[#FAF8F5]/80 text-[#8C6D23] dark:text-[#DFCA9B] font-bold text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>PDF Bill</span>
              </a>
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

      {/* UPGRADE MEMBERSHIP MODAL - NYAC Aesthetic */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 bg-[#0B1320]/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0E1522] rounded-xl max-w-xl w-full border border-[#C5A059]/40 p-6 sm:p-7 shadow-2xl relative space-y-5 animate-in fade-in zoom-in-95 max-h-[92vh] overflow-y-auto">
            <button
              onClick={() => {
                setShowUpgradeModal(false);
                setUpgradeSuccess(null);
                setUpgradeError(null);
              }}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-[#FAF8F5] dark:hover:bg-[#121A28] text-[#6B7280] hover:text-[#0B1320] dark:hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {upgradeSuccess ? (
              <div className="text-center space-y-4 py-4">
                <div className="w-14 h-14 rounded-full bg-[#FAF7EE] dark:bg-[#1C1608] border border-[#DFCA9B] text-[#8C6D23] dark:text-[#DFCA9B] flex items-center justify-center mx-auto text-2xl shadow-sm">
                  👑
                </div>
                <div>
                  <h3 className="font-serif font-bold text-xl text-[#0B1320] dark:text-white">
                    Membership Successfully Upgraded!
                  </h3>
                  <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF] mt-1">
                    Your account has been elevated to <strong>{upgradeSuccess.tier} Tier</strong> privileges.
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-[#FAF8F5] dark:bg-[#121A28] border border-[#E5DFD5] dark:border-[#222D3E] text-left text-xs space-y-2 font-mono">
                  <div className="flex justify-between">
                    <span className="text-[#6B7280]">Member:</span>
                    <span className="font-bold text-[#0B1320] dark:text-white font-serif">{member?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6B7280]">New Tier:</span>
                    <span className="font-bold text-[#8C6D23] dark:text-[#DFCA9B]">{upgradeSuccess.tier} ALL-ACCESS</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6B7280]">Receipt Reference:</span>
                    <span className="font-bold text-[#0B1320] dark:text-white">{upgradeSuccess.invoiceNumber || "INV-" + Date.now().toString().slice(-6)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-[#E5DFD5] dark:border-[#222D3E]">
                    <span className="text-[#6B7280]">Amount Settled:</span>
                    <span className="font-bold text-[#921111] dark:text-[#DFCA9B]">{formatINR(upgradeSuccess.amountPaise || 0)}</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setShowUpgradeModal(false);
                    setUpgradeSuccess(null);
                  }}
                  className="w-full py-3 rounded-md bg-[#921111] hover:bg-[#720C0C] text-white font-bold text-xs uppercase tracking-widest shadow-sm transition-all"
                >
                  Return to Member Portal
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 pb-3 border-b border-[#E5DFD5] dark:border-[#222D3E]">
                  <div className="w-10 h-10 rounded-md bg-[#921111] text-[#C5A059] border border-[#C5A059]/40 flex items-center justify-center font-serif text-lg font-bold shadow-sm">
                    👑
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-lg text-[#0B1320] dark:text-white">
                      Elevate Your Club Membership
                    </h3>
                    <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">
                      Unlock complimentary courts, priority reservations, and clubhouse privileges.
                    </p>
                  </div>
                </div>

                {upgradeError && (
                  <div className="p-3 rounded-md bg-[#FDF4F4] dark:bg-[#1E0E10] border border-[#F8CCCC] dark:border-[#581A1D] text-[#921111] dark:text-[#F87171] text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{upgradeError}</span>
                  </div>
                )}

                {/* Billing Cycle Switcher */}
                <div className="flex bg-[#FAF8F5] dark:bg-[#121A28] border border-[#E5DFD5] dark:border-[#222D3E] p-1 rounded-md text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setBillingCycle("ANNUAL")}
                    className={`flex-1 py-1.5 rounded transition-all uppercase tracking-wider ${
                      billingCycle === "ANNUAL"
                        ? "bg-[#921111] text-white shadow-sm font-bold"
                        : "text-[#6B7280] dark:text-[#9CA3AF] hover:text-[#0B1320] dark:hover:text-white"
                    }`}
                  >
                    Annual Billing (Save 17%)
                  </button>
                  <button
                    type="button"
                    onClick={() => setBillingCycle("MONTHLY")}
                    className={`flex-1 py-1.5 rounded transition-all uppercase tracking-wider ${
                      billingCycle === "MONTHLY"
                        ? "bg-[#921111] text-white shadow-sm font-bold"
                        : "text-[#6B7280] dark:text-[#9CA3AF] hover:text-[#0B1320] dark:hover:text-white"
                    }`}
                  >
                    Monthly Billing
                  </button>
                </div>

                {/* Tier Selection Cards */}
                <div className="space-y-2.5">
                  {[
                    {
                      tier: "GOLD" as const,
                      name: "Gold All-Access Tier",
                      monthlyPaise: 500000,
                      annualPaise: 5000000,
                      perks: "100% Free Courts • 14-Day Advance Booking • 20% Dining Discount",
                      badge: "Most Popular",
                    },
                    {
                      tier: "SILVER" as const,
                      name: "Silver Standard Tier",
                      monthlyPaise: 250000,
                      annualPaise: 2500000,
                      perks: "50% Off Courts • 7-Day Advance Booking • 10% Dining Discount",
                      badge: "Standard",
                    },
                    {
                      tier: "JUNIOR" as const,
                      name: "Junior Academy Tier (Under 18)",
                      monthlyPaise: 150000,
                      annualPaise: 1500000,
                      perks: "60% Off Off-Peak Courts • Dedicated Contact to Coaches • 15% Dining Discount",
                      badge: "Youth",
                    },
                  ].map((t) => {
                    const isSelected = upgradeTier === t.tier;
                    const pricePaise = billingCycle === "ANNUAL" ? t.annualPaise : t.monthlyPaise;

                    return (
                      <div
                        key={t.tier}
                        onClick={() => setUpgradeTier(t.tier)}
                        className={`p-3.5 rounded-lg border cursor-pointer transition-all ${
                          isSelected
                            ? "border-[#C5A059] bg-[#FAF7EE]/60 dark:bg-[#1C1608]/60 shadow-sm"
                            : "border-[#E5DFD5] dark:border-[#222D3E] hover:border-[#C5A059]/50 bg-white dark:bg-[#0E1522]"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-serif font-bold text-sm text-[#0B1320] dark:text-white">
                              {t.name}
                            </span>
                            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded font-bold uppercase bg-[#FAF8F5] dark:bg-[#121A28] border border-[#E5DFD5] dark:border-[#222D3E] text-[#8C6D23]">
                              {t.badge}
                            </span>
                          </div>
                          <div className="text-right font-mono">
                            <span className="font-bold text-sm text-[#921111] dark:text-[#DFCA9B]">
                              {formatINR(pricePaise)}
                            </span>
                            <span className="text-[10px] text-[#6B7280]">
                              /{billingCycle === "ANNUAL" ? "yr" : "mo"}
                            </span>
                          </div>
                        </div>
                        <p className="text-[11px] text-[#4B5563] dark:text-[#9CA3AF] mt-1 leading-snug">
                          {t.perks}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {/* Payment Method */}
                <div>
                  <label className="text-[10px] uppercase font-bold text-[#8C6D23] dark:text-[#DFCA9B] tracking-wider block mb-1.5">
                    Select Payment Method:
                  </label>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    {[
                      { id: "UPI" as const, label: "UPI Instant QR", icon: Zap },
                      { id: "CARD" as const, label: "Credit/Debit Card", icon: CreditCard },
                      { id: "NET_BANKING" as const, label: "Net Banking", icon: ShieldCheck },
                    ].map((pm) => (
                      <button
                        key={pm.id}
                        type="button"
                        onClick={() => setPaymentMethod(pm.id)}
                        className={`p-2.5 rounded-md border text-center transition-all flex flex-col items-center justify-center gap-1 ${
                          paymentMethod === pm.id
                            ? "border-[#C5A059] bg-[#FAF7EE] dark:bg-[#1C1608] text-[#8C6D23] dark:text-[#DFCA9B] font-bold shadow-xs"
                            : "border-[#E5DFD5] dark:border-[#222D3E] bg-[#FAF8F5] dark:bg-[#121A28] text-[#4B5563] dark:text-[#9CA3AF]"
                        }`}
                      >
                        <pm.icon className="w-3.5 h-3.5" />
                        <span className="text-[10px] uppercase tracking-wider">{pm.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Confirm Action */}
                <div className="flex items-center gap-2 pt-3 border-t border-[#E5DFD5] dark:border-[#222D3E]">
                  <button
                    type="button"
                    onClick={() => setShowUpgradeModal(false)}
                    className="flex-1 py-2.5 rounded-md bg-[#FAF8F5] dark:bg-[#121A28] border border-[#E5DFD5] dark:border-[#222D3E] hover:bg-[#FAF8F5]/80 text-[#4B5563] dark:text-[#9CA3AF] font-bold text-xs uppercase tracking-wider transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isUpgrading}
                    onClick={handleUpgradeMembership}
                    className="flex-1 py-2.5 rounded-md bg-[#921111] hover:bg-[#720C0C] text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-sm transition-all disabled:opacity-50"
                  >
                    {isUpgrading ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Activate {upgradeTier} Plan</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* 5-DAY EXPIRY INTERACTIVE POPUP DIALOG */}
      {showExpiryPopup && (
        <div className="fixed inset-0 z-50 bg-[#0B1320]/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0E1522] rounded-xl max-w-lg w-full border-2 border-[#C5A059] p-6 sm:p-7 shadow-2xl relative space-y-5 animate-in fade-in zoom-in-95">
            <button
              onClick={() => {
                setShowExpiryPopup(false);
                setHasDismissedExpiry(true);
              }}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-[#FAF8F5] dark:hover:bg-[#121A28] text-[#6B7280] hover:text-[#0B1320] dark:hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3.5 pb-3 border-b border-[#E5DFD5] dark:border-[#222D3E]">
              <div className="w-12 h-12 rounded-lg bg-[#FAF7EE] dark:bg-[#1C1608] border border-[#DFCA9B] text-[#8C6D23] dark:text-[#DFCA9B] flex items-center justify-center text-2xl shadow-sm shrink-0">
                {isExpired ? "🚨" : "⚠️"}
              </div>
              <div>
                <span className="text-[9px] font-mono font-bold uppercase tracking-[0.2em] text-[#8C6D23] dark:text-[#DFCA9B] block">
                  Clubhouse Dispatch
                </span>
                <h3 className="font-serif font-bold text-lg text-[#0B1320] dark:text-white">
                  {isExpired
                    ? "Membership Subscription Expired"
                    : `Membership Expiring in ${daysUntilExpiry} Day${daysUntilExpiry === 1 ? "" : "s"}!`}
                </h3>
              </div>
            </div>

            <div className="text-xs text-[#4B5563] dark:text-[#9CA3AF] space-y-3 leading-relaxed">
              <p>
                Esteemed <strong className="font-serif text-[#0B1320] dark:text-white">{member?.name || "Member"}</strong>,
              </p>
              <p>
                Your <strong className="font-serif text-[#921111] dark:text-[#DFCA9B]">{plan?.name || "Club Membership"}</strong> privilege is valid through <strong className="font-mono text-[#0B1320] dark:text-white">{membership?.endDate ? formatDate(membership.endDate) : "soon"}</strong>.
              </p>
              <div className="p-3.5 rounded-md bg-[#FAF8F5] dark:bg-[#121A28] border border-[#E5DFD5] dark:border-[#222D3E] space-y-1.5 text-[11px]">
                <div className="font-bold text-[#8C6D23] dark:text-[#DFCA9B] uppercase tracking-wider">
                  Impact of Expiration:
                </div>
                <ul className="list-disc list-inside space-y-1 text-[#6B7280] dark:text-[#9CA3AF]">
                  <li>Complimentary court access reverts to standard walk-in rates</li>
                  <li>Advance booking window drops to community 3-day window</li>
                  <li>Clubhouse dining & Pro Shop discounts are temporarily suspended</li>
                </ul>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-[#E5DFD5] dark:border-[#222D3E]">
              <button
                type="button"
                onClick={() => {
                  setShowExpiryPopup(false);
                  setHasDismissedExpiry(true);
                }}
                className="flex-1 py-2.5 rounded-md bg-[#FAF8F5] dark:bg-[#121A28] border border-[#E5DFD5] dark:border-[#222D3E] hover:bg-[#FAF8F5]/80 text-[#4B5563] dark:text-[#9CA3AF] font-bold text-xs uppercase tracking-wider transition-colors"
              >
                Remind Me Later
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowExpiryPopup(false);
                  setShowUpgradeModal(true);
                }}
                className="flex-1 py-2.5 rounded-md bg-[#921111] hover:bg-[#720C0C] text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-sm transition-all"
              >
                <span>Renew / Upgrade Plan</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── PRO SHOP ITEMIZED BILLING & CHECKOUT MODAL ── */}
      {shopCheckoutModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#0B1320]/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#0E1522] rounded-xl max-w-2xl w-full border border-[#C5A059]/40 p-6 shadow-2xl relative space-y-5 my-8 animate-in fade-in zoom-in-95">
            <button
              onClick={() => setShopCheckoutModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-[#FAF8F5] dark:hover:bg-[#121A28] text-[#6B7280] hover:text-[#0B1320] dark:hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-3 pb-3 border-b border-[#E5DFD5] dark:border-[#222D3E]">
              <div className="w-10 h-10 rounded-lg bg-[#921111] text-[#C5A059] flex items-center justify-center font-bold shrink-0">
                <Receipt className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-lg text-[#0B1320] dark:text-white">
                  Official Pro Shop Billing & Checkout
                </h3>
                <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">
                  Full catalog price, membership discount deduction, and ₹100 INR security deposit.
                </p>
              </div>
            </div>

            {shopCheckoutError && (
              <div className="p-3 rounded-md bg-[#FDF4F4] dark:bg-[#1E0E10] border border-[#F8CCCC] dark:border-[#581A1D] text-[#921111] dark:text-[#F87171] text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{shopCheckoutError}</span>
              </div>
            )}

            {/* Itemized Table of Every Product Bought (Full Price & Discount) */}
            <div className="space-y-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#8C6D23] dark:text-[#DFCA9B] block">
                Itemized Product Register ({shopBillingDetails.items.length} items)
              </span>
              <div className="border border-[#E5DFD5] dark:border-[#222D3E] rounded-lg overflow-x-auto max-h-56 overflow-y-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[#FAF8F5] dark:bg-[#121A28] text-[#5A6578] dark:text-[#8E9CAE] font-bold border-b border-[#E5DFD5] dark:border-[#222D3E]">
                    <tr>
                      <th className="p-2.5">Item Description</th>
                      <th className="p-2.5 text-right">Full Unit Price</th>
                      <th className="p-2.5 text-center">Qty</th>
                      <th className="p-2.5 text-right">Full Subtotal</th>
                      <th className="p-2.5 text-right">Tier Disc.</th>
                      <th className="p-2.5 text-right">Net Price</th>
                      <th className="p-2.5 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5DFD5]/60 dark:divide-[#222D3E]">
                    {shopBillingDetails.items.map((item) => (
                      <tr key={item.variant.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-900/30">
                        <td className="p-2.5">
                          <strong className="text-[#0B1320] dark:text-white block">{item.product.name}</strong>
                          <span className="text-[10px] text-[#8E9CAE]">
                            {item.product.brand} • {item.variant.size || "Standard"}
                          </span>
                        </td>
                        <td className="p-2.5 text-right font-mono">{formatINR(item.fullUnitPricePaise)}</td>
                        <td className="p-2.5 text-center font-mono font-bold">{item.quantity}</td>
                        <td className="p-2.5 text-right font-mono">{formatINR(item.fullTotalPricePaise)}</td>
                        <td className="p-2.5 text-right text-[#8C6D23] dark:text-[#DFCA9B] font-mono font-bold">
                          {item.discountAmountPaise > 0 ? `-${formatINR(item.discountAmountPaise)}` : "₹0.00"}
                        </td>
                        <td className="p-2.5 text-right font-mono font-bold text-[#0B1320] dark:text-white">
                          {formatINR(item.netPricePaise)}
                        </td>
                        <td className="p-2.5 text-center">
                          <button
                            type="button"
                            onClick={() => removeShopCartItem(item.variant.id)}
                            className="text-red-500 hover:text-red-700 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Detailed Billing Summary Breakdown Card */}
            <div className="p-4 rounded-lg bg-[#FAF8F5] dark:bg-[#121A28] border border-[#E5DFD5] dark:border-[#222D3E] space-y-2 text-xs">
              <div className="flex justify-between text-[#5A6578] dark:text-[#8E9CAE]">
                <span>Full Equipment Subtotal:</span>
                <span className="font-mono font-bold text-[#0B1320] dark:text-white">
                  {formatINR(shopBillingDetails.totalFullPricePaise)}
                </span>
              </div>
              <div className="flex justify-between text-[#8C6D23] dark:text-[#DFCA9B] font-bold">
                <span>
                  Membership Privilege ({currentMemberTier} Tier — {shopDiscountPercent}% Off):
                </span>
                <span className="font-mono">-{formatINR(shopBillingDetails.totalDiscountPaise)}</span>
              </div>
              <div className="flex justify-between text-[#5A6578] dark:text-[#8E9CAE] pt-1 border-t border-[#E5DFD5]/60 dark:border-[#222D3E]">
                <span>Net Equipment Amount:</span>
                <span className="font-mono font-bold">{formatINR(shopBillingDetails.netSubtotalPaise)}</span>
              </div>
              {shopBillingDetails.securityDepositPaise > 0 && (
                <div className="flex justify-between items-center bg-[#C5A059]/10 dark:bg-[#C5A059]/15 p-2 rounded border border-[#C5A059]/30 text-[#8C6D23] dark:text-[#DFCA9B] font-bold">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-[#C5A059]" />
                    <span>Security Deposit:</span>
                    <span className="text-[10px] font-normal text-[#5A6578] dark:text-[#8E9CAE]">
                      (Refundable)
                    </span>
                  </div>
                  <span className="font-mono text-sm font-bold text-[#0B1320] dark:text-white">
                    +{formatINR(shopBillingDetails.securityDepositPaise)}
                  </span>
                </div>
              )}

              {/* Final Payable Settlement */}
              <div className="flex justify-between items-center text-sm font-serif font-bold text-[#0B1320] dark:text-white pt-2 border-t border-[#E5DFD5] dark:border-[#222D3E]">
                <span>Total Payable Amount:</span>
                <span className="font-mono text-lg text-[#921111] dark:text-[#DFCA9B]">
                  {formatINR(shopBillingDetails.finalPayablePaise)}
                </span>
              </div>
            </div>

            {/* API KEY INPUT FIELD - Configured for Billing Authorization */}
            <div className="p-3.5 rounded-lg border border-[#C5A059]/40 bg-[#FAF7EE] dark:bg-[#1C1608] space-y-1.5">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-[#8C6D23] dark:text-[#DFCA9B]" />
                <label className="font-serif font-bold text-xs text-[#0B1320] dark:text-white uppercase tracking-wider">
                  Billing Gateway API Key
                </label>
                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-[#C5A059]/20 text-[#8C6D23] dark:text-[#DFCA9B] font-bold">
                  {shopApiKey ? "KEY ATTACHED" : "OPTIONAL / SERVER DEFAULT"}
                </span>
              </div>
              <input
                type="text"
                value={shopApiKey}
                onChange={(e) => setShopApiKey(e.target.value)}
                placeholder="Enter your API Key (e.g. sk_live_... or test key)"
                className="w-full p-2.5 rounded border border-[#E5DFD5] dark:border-[#222D3E] bg-white dark:bg-[#121A28] font-mono text-xs text-[#0B1320] dark:text-white focus:outline-none focus:border-[#C5A059]"
              />
              <p className="text-[10px] text-[#6B7280] dark:text-[#9CA3AF]">
                Provide your API key to authorize and link this transaction, or leave blank to utilize server environment key (BILLING_API_KEY).
              </p>
            </div>

            {/* Fulfillment & Payment Options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="font-bold text-[10px] uppercase tracking-wider text-[#5A6578] dark:text-[#8E9CAE] block mb-1">
                  Fulfillment Type
                </label>
                <select
                  value={shopFulfillmentType}
                  onChange={(e: any) => setShopFulfillmentType(e.target.value)}
                  className="w-full p-2.5 rounded-md border border-[#E5DFD5] dark:border-[#222D3E] bg-[#FAF8F5] dark:bg-[#121A28] text-xs text-[#0B1320] dark:text-white"
                >
                  <option value="CLICK_AND_COLLECT">Click & Collect at Pro Shop Counter</option>
                  <option value="HOME_DELIVERY">Express Club Delivery</option>
                </select>
                {shopFulfillmentType === "HOME_DELIVERY" && (
                  <input
                    type="text"
                    placeholder="Enter delivery address..."
                    value={shopDeliveryAddress}
                    onChange={(e) => setShopDeliveryAddress(e.target.value)}
                    className="w-full mt-2 p-2 rounded border border-[#E5DFD5] dark:border-[#222D3E] bg-white dark:bg-[#121A28] text-xs"
                  />
                )}
              </div>

              <div>
                <label className="font-bold text-[10px] uppercase tracking-wider text-[#5A6578] dark:text-[#8E9CAE] block mb-1">
                  Settlement Method
                </label>
                <select
                  value={shopPaymentMethod}
                  onChange={(e: any) => setShopPaymentMethod(e.target.value)}
                  className="w-full p-2.5 rounded-md border border-[#E5DFD5] dark:border-[#222D3E] bg-[#FAF8F5] dark:bg-[#121A28] text-xs text-[#0B1320] dark:text-white"
                >
                  <option value="UPI">UPI Digital Payment (Immediate)</option>
                  <option value="CARD">Credit / Debit Card</option>
                  <option value="MEMBER_TAB">Post to Member Tab Ledger</option>
                </select>
              </div>
            </div>

            {/* Submit Action */}
            <div className="flex items-center gap-2 pt-3 border-t border-[#E5DFD5] dark:border-[#222D3E]">
              <button
                type="button"
                onClick={() => setShopCheckoutModalOpen(false)}
                className="flex-1 py-2.5 rounded-md bg-[#FAF8F5] dark:bg-[#121A28] border border-[#E5DFD5] dark:border-[#222D3E] hover:bg-[#FAF8F5]/80 text-[#4B5563] dark:text-[#9CA3AF] font-bold text-xs uppercase tracking-wider transition-colors"
              >
                Back to Shop
              </button>
              <button
                type="button"
                disabled={shopCheckoutSubmitting || shopBillingDetails.items.length === 0}
                onClick={handleExecuteShopCheckout}
                className="flex-1 py-2.5 rounded-md bg-[#921111] hover:bg-[#720C0C] text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition-all disabled:opacity-50 cursor-pointer"
              >
                {shopCheckoutSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5" />
                    <span>Authorize & Pay {formatINR(shopBillingDetails.finalPayablePaise)}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── OFFICIAL PRO SHOP BILLING RECEIPT & TAX INVOICE MODAL ── */}
      {shopReceipt && (
        <div className="fixed inset-0 z-50 bg-[#0B1320]/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#0E1522] rounded-xl max-w-lg w-full border border-[#C5A059]/40 p-6 shadow-2xl relative space-y-4 my-8 animate-in fade-in zoom-in-95">
            <button
              onClick={() => setShopReceipt(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-[#FAF8F5] dark:hover:bg-[#121A28] text-[#6B7280] hover:text-[#0B1320] dark:hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center space-y-1 pb-3 border-b border-[#E5DFD5] dark:border-[#222D3E]">
              <div className="w-12 h-12 rounded-full bg-[#921111]/10 text-[#921111] dark:text-[#DFCA9B] mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="font-serif font-bold text-lg text-[#0B1320] dark:text-white">
                Pro Shop Settlement Complete
              </h3>
              <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">
                Order {shopReceipt.order?.orderNumber} • Invoice {shopReceipt.billing?.invoiceNumber}
              </p>
            </div>

            {/* Receipt Itemized Details */}
            <div className="p-4 rounded-lg bg-[#FAF8F5] dark:bg-[#121A28] border border-[#E5DFD5] dark:border-[#222D3E] space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-[#6B7280] dark:text-[#9CA3AF]">Member / Customer:</span>
                <strong className="text-[#0B1320] dark:text-white">{shopReceipt.order?.customerName}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B7280] dark:text-[#9CA3AF]">Membership Tier:</span>
                <strong className="text-[#8C6D23] dark:text-[#DFCA9B]">
                  {shopReceipt.billing?.memberTier} ({shopReceipt.billing?.discountPercent}% Privilege)
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B7280] dark:text-[#9CA3AF]">Fulfillment:</span>
                <span>{shopReceipt.order?.fulfillmentType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B7280] dark:text-[#9CA3AF]">Full Equipment Subtotal:</span>
                <span className="font-mono">{formatINR(shopReceipt.billing?.totalFullPricePaise || 0)}</span>
              </div>
              <div className="flex justify-between text-[#8C6D23] dark:text-[#DFCA9B] font-bold">
                <span>Tier Privilege Discount:</span>
                <span className="font-mono">-{formatINR(shopReceipt.billing?.totalDiscountPaise || 0)}</span>
              </div>
              {(shopReceipt.billing?.securityDepositPaise || 0) > 0 && (
                <div className="flex justify-between items-center text-[#0B1320] dark:text-white font-bold bg-[#C5A059]/10 p-1.5 rounded">
                  <span>Security Deposit:</span>
                  <span className="font-mono">+{formatINR(shopReceipt.billing?.securityDepositPaise || 0)}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-2 border-t border-[#E5DFD5] dark:border-[#222D3E] font-serif font-bold text-sm text-[#0B1320] dark:text-white">
                <span>Final Payable Total:</span>
                <span className="text-[#921111] dark:text-[#DFCA9B] font-mono text-base">
                  {formatINR(shopReceipt.order?.finalPricePaise || shopReceipt.billing?.finalPayablePaise)}
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <a
                href={`/api/billing/invoice/${shopReceipt.order?.id}/pdf`}
                download={`${shopReceipt.billing?.invoiceNumber || "Tax-Invoice"}.pdf`}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => {
                  e.preventDefault();
                  downloadPdfInvoice(
                    `/api/billing/invoice/${shopReceipt.order?.id}/pdf`,
                    `${shopReceipt.billing?.invoiceNumber || "Tax-Invoice"}.pdf`
                  );
                }}
                className="flex-1 py-2.5 rounded-md bg-[#921111] hover:bg-[#720C0C] text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-sm transition-all text-center cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download PDF Invoice</span>
              </a>
              <button
                type="button"
                onClick={() => window.print()}
                className="py-2.5 px-3.5 rounded-md border border-[#E5DFD5] dark:border-[#222D3E] bg-white dark:bg-[#121A28] text-[#0B1320] dark:text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5"
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>Print</span>
              </button>
              <button
                type="button"
                onClick={() => setShopReceipt(null)}
                className="py-2.5 px-4 rounded-md bg-[#FAF8F5] dark:bg-[#1C2433] border border-[#E5DFD5] dark:border-[#222D3E] text-[#0B1320] dark:text-white font-bold text-xs uppercase tracking-wider"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. CONFLICT & BOOKING ERROR INTERACTIVE POPUP DIALOG */}
      {bookingError && (
        <div className="fixed inset-0 z-50 bg-[#0B1320]/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0E1522] rounded-xl max-w-md w-full border-2 border-red-500/80 p-6 shadow-2xl relative space-y-5 animate-in fade-in zoom-in-95">
            <button
              onClick={() => setBookingError(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-[#FAF8F5] dark:hover:bg-[#121A28] text-[#6B7280] hover:text-[#0B1320] dark:hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3.5 pb-3 border-b border-[#E5DFD5] dark:border-[#222D3E]">
              <div className="w-12 h-12 rounded-lg bg-red-100 dark:bg-red-950/60 border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 flex items-center justify-center text-2xl shadow-sm shrink-0">
                <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <span className="text-[9px] font-mono font-bold uppercase tracking-[0.2em] text-red-600 dark:text-red-400 block">
                  Reservation Conflict Notice
                </span>
                <h3 className="font-serif font-bold text-lg text-[#0B1320] dark:text-white">
                  Booking Unable to Proceed
                </h3>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-red-50/70 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-xs text-red-800 dark:text-red-200 leading-relaxed font-medium">
              {bookingError}
            </div>

            <div className="text-xs text-[#6B7280] dark:text-[#9CA3AF] leading-relaxed">
              {bookingError.includes("Social Play")
                ? "On Friday evenings, this court is open for shared group play. You can join the Friday Night Social session directly to play with the community."
                : bookingError.includes("quota")
                ? "Club rules limit reservations to 2 bookings per member per day. Please select another date or cancel an existing reservation."
                : "Please select an alternate court facility or open time slot."}
            </div>

            <div className="pt-2 border-t border-[#E5DFD5] dark:border-[#222D3E]">
              <button
                type="button"
                onClick={() => setBookingError(null)}
                className="w-full py-2.5 rounded-md bg-[#921111] hover:bg-[#720C0C] text-white font-bold text-xs uppercase tracking-wider transition-colors shadow-sm cursor-pointer"
              >
                Dismiss / Choose Another Slot
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. COURT BOOKING CONFIRMATION INTERACTIVE POPUP DIALOG */}
      {bookingSuccess && (
        <div className="fixed inset-0 z-50 bg-[#0B1320]/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0E1522] rounded-xl max-w-md w-full border-2 border-[#C5A059] p-6 shadow-2xl relative space-y-5 animate-in fade-in zoom-in-95">
            <button
              onClick={() => setBookingSuccess(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-[#FAF8F5] dark:hover:bg-[#121A28] text-[#6B7280] hover:text-[#0B1320] dark:hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3.5 pb-3 border-b border-[#E5DFD5] dark:border-[#222D3E]">
              <div className="w-12 h-12 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-sm shrink-0">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <span className="text-[9px] font-mono font-bold uppercase tracking-[0.2em] text-[#8C6D23] dark:text-[#DFCA9B] block">
                  Championship Register Locked
                </span>
                <h3 className="font-serif font-bold text-lg text-[#0B1320] dark:text-white">
                  Court Slot Reserved!
                </h3>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-[#FAF8F5] dark:bg-[#121A28] border border-[#E5DFD5] dark:border-[#222D3E] space-y-3 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-[#E5DFD5] dark:border-[#222D3E]">
                <span className="text-[#8C6D23] dark:text-[#DFCA9B] font-bold uppercase tracking-wider text-[10px]">Pass Voucher</span>
                <span className="font-mono font-bold text-sm text-[#0B1320] dark:text-white">
                  {bookingSuccess.bookingNumber}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[9px] text-[#6B7280] dark:text-[#9CA3AF] uppercase font-bold block">Facility</span>
                  <span className="font-serif font-bold text-[#0B1320] dark:text-white mt-0.5 block">
                    {bookingSuccess.court?.name || "Championship Court"}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] text-[#6B7280] dark:text-[#9CA3AF] uppercase font-bold block">Match Time</span>
                  <span className="font-serif font-bold text-[#0B1320] dark:text-white mt-0.5 block">
                    {bookingSuccess.startTime ? formatDateTime(bookingSuccess.startTime) : "Scheduled"}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] text-[#6B7280] dark:text-[#9CA3AF] uppercase font-bold block">Duration</span>
                  <span className="font-serif font-bold text-[#0B1320] dark:text-white mt-0.5 block">
                    {bookingSuccess.durationMinutes || 60} Minutes
                  </span>
                </div>
                <div>
                  <span className="text-[9px] text-[#6B7280] dark:text-[#9CA3AF] uppercase font-bold block">Tariff</span>
                  <span className="font-bold text-[#921111] dark:text-[#DFCA9B] mt-0.5 block">
                    {bookingSuccess.totalPricePaise === 0 ? "Complimentary (Perk)" : formatINR(bookingSuccess.totalPricePaise)}
                  </span>
                </div>
              </div>
            </div>

            <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF] leading-relaxed">
              Your booking voucher is recorded in the club system. Present your digital QR code at the front desk when arriving.
            </p>

            <div className="flex items-center gap-2 pt-2 border-t border-[#E5DFD5] dark:border-[#222D3E]">
              <button
                type="button"
                onClick={() => setBookingSuccess(null)}
                className="flex-1 py-2.5 rounded-md bg-[#FAF8F5] dark:bg-[#121A28] border border-[#E5DFD5] dark:border-[#222D3E] hover:bg-[#FAF8F5]/80 text-[#4B5563] dark:text-[#9CA3AF] font-bold text-xs uppercase tracking-wider transition-colors"
              >
                Done
              </button>
              <button
                type="button"
                onClick={() => {
                  const b = bookingSuccess;
                  setBookingSuccess(null);
                  setSelectedBookingModal(b);
                  setActiveTab("MY_BOOKINGS");
                }}
                className="flex-1 py-2.5 rounded-md bg-[#921111] hover:bg-[#720C0C] text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-sm transition-all"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>View Match Pass</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. SOCIAL PLAY REGISTRATION CONFIRMATION POPUP DIALOG */}
      {socialJoinSuccess && (
        <div className="fixed inset-0 z-50 bg-[#0B1320]/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0E1522] rounded-xl max-w-md w-full border-2 border-[#C5A059] p-6 shadow-2xl relative space-y-5 animate-in fade-in zoom-in-95">
            <button
              onClick={() => setSocialJoinSuccess(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-[#FAF8F5] dark:hover:bg-[#121A28] text-[#6B7280] hover:text-[#0B1320] dark:hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3.5 pb-3 border-b border-[#E5DFD5] dark:border-[#222D3E]">
              <div className="w-12 h-12 rounded-lg bg-[#FAF7EE] dark:bg-[#1C1608] border border-[#DFCA9B] text-[#8C6D23] dark:text-[#DFCA9B] flex items-center justify-center text-2xl shadow-sm shrink-0">
                🏆
              </div>
              <div>
                <span className="text-[9px] font-mono font-bold uppercase tracking-[0.2em] text-[#8C6D23] dark:text-[#DFCA9B] block">
                  Court Sharing Confirmed
                </span>
                <h3 className="font-serif font-bold text-lg text-[#0B1320] dark:text-white">
                  You're On The Roster!
                </h3>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-200 leading-relaxed font-medium">
              {socialJoinSuccess}
            </div>

            <div className="p-3.5 rounded-md bg-[#FAF8F5] dark:bg-[#121A28] border border-[#E5DFD5] dark:border-[#222D3E] text-xs text-[#6B7280] dark:text-[#9CA3AF] space-y-1">
              <p className="font-bold text-[#0B1320] dark:text-white">Session Highlights:</p>
              <p>• Arrive at Padel Court 1 at 7:00 PM on Friday.</p>
              <p>• King-of-the-court doubles partner rotations.</p>
              <p>• Music, refreshments & clubhouse privileges included.</p>
            </div>

            <div className="pt-2 border-t border-[#E5DFD5] dark:border-[#222D3E]">
              <button
                type="button"
                onClick={() => setSocialJoinSuccess(null)}
                className="w-full py-2.5 rounded-md bg-[#C5A059] hover:bg-[#B38F46] text-[#0B1320] font-bold text-xs uppercase tracking-wider transition-colors shadow-sm cursor-pointer"
              >
                Awesome, See You There!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── RAZORPAY TRIAL GATEWAY MODAL (TEST MODE) ── */}
      <RazorpayGatewayModal
        isOpen={isRazorpayModalOpen}
        onClose={() => {
          setIsRazorpayModalOpen(false);
          setBookingError(null);
        }}
        orderData={razorpayOrder}
        customerDetails={{
          name: member?.name || currentUser?.name || "Club Member",
          phone: member?.phone || "+91 99999 99999",
          email: member?.email || currentUser?.email || "guest@championsclub.in",
        }}
        onSuccess={handleRazorpayPaymentSuccess}
        onError={(err) => setBookingError(err)}
        errorMessage={bookingError}
        isExternalProcessing={isBookingSubmitting}
      />
    </div>
  );
}
